import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { DESTINATIONS } from '../config/destinations'

export interface TransitTimes {
  // Commute
  uniPT?: string
  uniWalk?: string
  uniDrive?: string
  workPT?: string
  workWalk?: string
  workDrive?: string
  // Train station
  trainWalk?: string
  trainPT?: string
  trainDrive?: string
  // Nearby (walking minutes)
  coles?: string
  woolies?: string
  aldi?: string
  gyg?: string
  shoppingCenter?: string
}

let initialized = false

const initMaps = async () => {
  if (!initialized) {
    setOptions({ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string })
    initialized = true
  }
  await Promise.all([
    importLibrary('routes'),
    importLibrary('places'),
    importLibrary('geocoding'),
  ])
}

// Returns the next Tuesday at 8:30am (always at least 1hr in future) for peak commute estimates
const getNextTuesdayMorning = (): Date => {
  const now = new Date()
  const result = new Date(now)
  const daysUntilTuesday = (2 - now.getDay() + 7) % 7
  result.setDate(now.getDate() + daysUntilTuesday)
  result.setHours(8, 30, 0, 0)
  if (result.getTime() - now.getTime() < 3_600_000) {
    result.setDate(result.getDate() + 7)
  }
  return result
}

const geocodeAddress = async (address: string): Promise<google.maps.LatLng | null> => {
  try {
    const geocoder = new google.maps.Geocoder()
    const result = await geocoder.geocode({ address })
    return result.results?.[0]?.geometry?.location ?? null
  } catch {
    return null
  }
}

const findNearbyPlace = async (
  center: google.maps.LatLng,
  includedTypes: string[],
  nameFilter?: string,
): Promise<google.maps.LatLng | null> => {
  try {
    const { places } = await (google.maps.places.Place as any).searchNearby({
      fields: ['location', 'displayName'],
      locationRestriction: { center, radius: 4000 },
      includedTypes,
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
    })
    if (!places?.length) return null
    const match = nameFilter
      ? places.find((p: any) => p.displayName?.toLowerCase().includes(nameFilter.toLowerCase()))
      : places[0]
    return match?.location ?? null
  } catch {
    return null
  }
}

const getDistanceMatrix = (
  service: google.maps.DistanceMatrixService,
  origin: string,
  destinations: string[],
  mode: google.maps.TravelMode,
  departureTime?: Date,
): Promise<(number | null)[]> => {
  return new Promise((resolve) => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations,
        travelMode: mode,
        unitSystem: google.maps.UnitSystem.METRIC,
        ...(departureTime && mode === google.maps.TravelMode.TRANSIT
          ? { transitOptions: { departureTime } }
          : {}),
        ...(departureTime && mode === google.maps.TravelMode.DRIVING
          ? { drivingOptions: { departureTime, trafficModel: google.maps.TrafficModel.BEST_GUESS } }
          : {}),
      },
      (response, status) => {
        if (status !== google.maps.DistanceMatrixStatus.OK || !response) {
          resolve(destinations.map(() => null))
          return
        }
        resolve(
          response.rows[0].elements.map(el =>
            el.status === google.maps.DistanceMatrixElementStatus.OK
              ? Math.round(el.duration.value / 60)
              : null,
          ),
        )
      },
    )
  })
}

const latLngToString = (loc: google.maps.LatLng): string => `${loc.lat()},${loc.lng()}`

export const fetchTransitTimes = async (propertyAddress: string): Promise<TransitTimes> => {
  try {
    await initMaps()
  } catch {
    console.error('Google Maps failed to load')
    return {}
  }

  try {
    const departureTime = getNextTuesdayMorning()
    const matrixService = new google.maps.DistanceMatrixService()

    // Geocode the property once, reuse for all nearby searches
    const propertyLocation = await geocodeAddress(propertyAddress)

    // Find all places in parallel
    const [
      stationLocation,
      colesLocation,
      wooliesLocation,
      aldiLocation,
      gygLocation,
      mallLocation,
    ] = await Promise.all([
      propertyLocation
        ? findNearbyPlace(propertyLocation, ['train_station'])
        : Promise.resolve(null),
      propertyLocation
        ? findNearbyPlace(propertyLocation, ['supermarket', 'grocery_store'], 'coles')
        : Promise.resolve(null),
      propertyLocation
        ? findNearbyPlace(propertyLocation, ['supermarket', 'grocery_store'], 'woolworths')
        : Promise.resolve(null),
      propertyLocation
        ? findNearbyPlace(propertyLocation, ['supermarket', 'grocery_store'], 'aldi')
        : Promise.resolve(null),
      propertyLocation
        ? findNearbyPlace(propertyLocation, ['restaurant', 'fast_food_restaurant'], 'guzman')
        : Promise.resolve(null),
      propertyLocation
        ? findNearbyPlace(propertyLocation, ['shopping_mall'])
        : Promise.resolve(null),
    ])

    // Transit destinations: uni, work, and optionally station
    const transitDests = [DESTINATIONS.uni, DESTINATIONS.work]
    if (stationLocation) transitDests.push(latLngToString(stationLocation))

    // Nearby destinations: only include ones that were found
    const nearbyKeys = ['coles', 'woolies', 'aldi', 'gyg', 'shoppingCenter'] as const
    const nearbyLocations = [colesLocation, wooliesLocation, aldiLocation, gygLocation, mallLocation]
    const validNearby = nearbyLocations.map((loc, i) => ({ key: nearbyKeys[i], loc })).filter(x => x.loc !== null)
    const nearbyDests = validNearby.map(x => latLngToString(x.loc!))

    // All Distance Matrix calls in parallel
    const [ptTimes, walkTimes, driveTimes, nearbyWalkTimes] = await Promise.all([
      getDistanceMatrix(matrixService, propertyAddress, transitDests, google.maps.TravelMode.TRANSIT, departureTime),
      getDistanceMatrix(matrixService, propertyAddress, transitDests, google.maps.TravelMode.WALKING),
      getDistanceMatrix(matrixService, propertyAddress, transitDests, google.maps.TravelMode.DRIVING, departureTime),
      nearbyDests.length > 0
        ? getDistanceMatrix(matrixService, propertyAddress, nearbyDests, google.maps.TravelMode.WALKING)
        : Promise.resolve([] as (number | null)[]),
    ])

    const result: TransitTimes = {}

    // Uni
    if (ptTimes[0]    != null) result.uniPT    = String(ptTimes[0])
    if (driveTimes[0] != null) result.uniDrive  = String(driveTimes[0])
    // Work
    if (ptTimes[1]    != null) result.workPT    = String(ptTimes[1])
    if (driveTimes[1] != null) result.workDrive  = String(driveTimes[1])
    // Train station (index 2 if present)
    if (stationLocation) {
      if (walkTimes[2]  != null) result.trainWalk  = String(walkTimes[2])
      if (ptTimes[2]    != null) result.trainPT    = String(ptTimes[2])
      if (driveTimes[2] != null) result.trainDrive = String(driveTimes[2])
    }

    // Nearby walking times
    validNearby.forEach(({ key }, i) => {
      const t = nearbyWalkTimes[i]
      if (t != null) result[key] = String(t)
    })

    return result
  } catch (err) {
    console.error('Error fetching transit times:', err)
    return {}
  }
}
