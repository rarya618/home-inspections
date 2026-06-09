import { useEffect, useRef, useState } from 'react'
import { Entry } from './AddEntry'
import { calculateScore } from './Score'
import { getHouseEntries } from '../firebase/database'
import { importLibrary } from '@googlemaps/js-api-loader'
import { initMaps } from '../utils/maps'
import { DESTINATIONS } from '../config/destinations'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare, faExpand, faXmark } from '@fortawesome/free-solid-svg-icons'

type Props = {
  onCardClick: (entry: Entry) => void
}

const getScoreColor = (score: number): string => {
  if (score >= 800) return '#10b981'
  if (score >= 650) return '#14b8a6'
  if (score >= 450) return '#0ea5e9'
  if (score >= 300) return '#f59e0b'
  if (score >= 0)   return '#f97316'
  return '#ef4444'
}

const getScoreMeta = (score: number) => {
  if (score >= 800) return { scoreText: 'text-emerald-600 dark:text-emerald-400', label: 'Excellent' }
  if (score >= 650) return { scoreText: 'text-teal-600 dark:text-teal-400',       label: 'Great' }
  if (score >= 450) return { scoreText: 'text-sky-600 dark:text-sky-400',         label: 'Good' }
  if (score >= 300) return { scoreText: 'text-amber-600 dark:text-amber-400',     label: 'Fair' }
  if (score >= 0)   return { scoreText: 'text-orange-600 dark:text-orange-400',   label: 'Poor' }
  return                   { scoreText: 'text-red-600 dark:text-red-400',         label: 'Bad' }
}

export default function MapView({ onCardClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [selected, setSelected] = useState<{ entry: Entry; x: number; y: number } | null>(null)

  // Fetch entries from Firebase
  useEffect(() => {
    getHouseEntries().then(data => {
      setEntries(data.filter(e => !e.isRented && (e.score ?? calculateScore(e)) >= 0))
      setIsLoadingData(false)
    })
  }, [])

  // Init Google Maps
  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false

    const init = async () => {
      await initMaps()
      await importLibrary('maps')

      if (cancelled || !mapRef.current) return

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: -33.8688, lng: 151.2093 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
      })

      // Close card when clicking the map background
      mapInstanceRef.current.addListener('click', () => setSelected(null))

      setIsLoadingMap(false)
    }

    init().catch(console.error)
    return () => { cancelled = true }
  }, [])

  // Place markers once map and data are both ready
  useEffect(() => {
    if (isLoadingMap || isLoadingData || !mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const placeMarkers = async () => {
      const geocoder = new google.maps.Geocoder()

      const [results, uniResult, utsResult, workResult] = await Promise.all([
        Promise.allSettled(
          entries.map(async entry => {
            if (!entry.address) return null
            const result = await geocoder.geocode({ address: entry.address })
            const loc = result.results?.[0]?.geometry?.location
            return loc ? { entry, loc } : null
          })
        ),
        geocoder.geocode({ address: DESTINATIONS.uni }).then(r => r.results?.[0]?.geometry?.location ?? null).catch(() => null),
        geocoder.geocode({ address: DESTINATIONS.uts }).then(r => r.results?.[0]?.geometry?.location ?? null).catch(() => null),
        geocoder.geocode({ address: DESTINATIONS.work }).then(r => r.results?.[0]?.geometry?.location ?? null).catch(() => null),
      ])

      const bounds = new google.maps.LatLngBounds()
      let hasMarkers = false

      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value) continue
        const { entry, loc } = r.value
        const score = entry.score ?? calculateScore(entry)
        const color = entry.isUnavailable ? '#9ca3af' : getScoreColor(score)

        const marker = new google.maps.Marker({
          position: loc,
          map,
          title: entry.address,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: entry.isUnavailable ? 0.5 : 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 8,
          },
        })

        marker.addListener('click', (e: google.maps.MapMouseEvent) => {
          const dom = e.domEvent as MouseEvent
          setSelected({ entry, x: dom.clientX, y: dom.clientY })
          map.panTo(loc)
        })

        bounds.extend(loc)
        hasMarkers = true
        markersRef.current.push(marker)
      }

      const destinationMarkerIcon = (color: string) => ({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 3,
        scale: 11,
      })

      if (uniResult) {
        new google.maps.Marker({
          position: uniResult,
          map,
          title: 'PNR Building, USYD',
          label: { text: 'R', color: 'white', fontSize: '11px', fontWeight: 'bold' },
          icon: destinationMarkerIcon('#6366f1'),
          zIndex: 10,
        })
      }

      if (utsResult) {
        new google.maps.Marker({
          position: utsResult,
          map,
          title: 'Building 2, UTS',
          label: { text: 'D', color: 'white', fontSize: '11px', fontWeight: 'bold' },
          icon: destinationMarkerIcon('#8b5cf6'),
          zIndex: 10,
        })
      }

      if (workResult) {
        new google.maps.Marker({
          position: workResult,
          map,
          title: 'Work',
          label: { text: 'W', color: 'white', fontSize: '11px', fontWeight: 'bold' },
          icon: destinationMarkerIcon('#0ea5e9'),
          zIndex: 10,
        })
      }

      if (hasMarkers) {
        map.fitBounds(bounds, { top: 100, right: 60, bottom: 80, left: 60 })
      }
    }

    placeMarkers().catch(console.error)
  }, [isLoadingMap, isLoadingData, entries])

  const isLoading = isLoadingData || isLoadingMap

  return (
    <div className="relative" style={{ height: '100vh', marginTop: '-68px' }}>
      {/* Map canvas */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur z-10">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      )}

      {/* Floating property card near clicked marker */}
      {selected && (() => {
        const { entry, x, y } = selected
        const score = entry.score ?? calculateScore(entry)
        const meta = getScoreMeta(score)
        const beds = entry.bedrooms ? parseInt(entry.bedrooms) : null
        const ppRent = beds && beds > 1 ? Math.round(parseInt(entry.rent) / beds) : null
        const parts = entry.address?.split(',') ?? []
        const street = parts[0]?.trim() ?? '—'
        const suburb = parts[1]?.trim() ?? ''

        const cardW = 288
        const cardH = 190

        // Try above the marker; fall through below if it clips the header
        let posX = x - cardW / 2
        let posY = y - cardH - 20
        if (posY < 68 + 8) posY = y + 20

        // Clamp to viewport edges
        posX = Math.max(8, Math.min(posX, window.innerWidth - cardW - 8))
        posY = Math.min(posY, window.innerHeight - cardH - 8)

        return (
          <div
            className={`fixed w-72 rounded-2xl shadow-2xl border z-20 overflow-hidden ${entry.isUnavailable ? 'bg-gray-50 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 opacity-80' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}
            style={{ top: posY, left: posX }}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3.5 right-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5" />
              </button>
              <p className="text-[17px] font-bold text-gray-900 dark:text-white leading-snug pr-7 truncate">{street}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {suburb && <span className="text-[14px] font-medium text-gray-500 dark:text-gray-400 truncate">{suburb}</span>}
                {entry.isUnavailable && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-tight shrink-0">Unavailable</span>
                )}
              </div>
            </div>

            {/* Rent + score */}
            <div className="px-4 pb-4 flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">${entry.rent}</span>
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">/wk</span>
                </div>
                {ppRent && <p className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">${ppRent}/pp</p>}
              </div>
              <div className="text-right">
                <span className={`text-3xl font-black tabular-nums leading-none ${meta.scoreText}`}>{score}</span>
                <p className={`text-[11px] font-bold tracking-tight leading-none mt-0.5 ${meta.scoreText} opacity-70`}>{meta.label}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { setSelected(null); onCardClick(entry) }}
                className="flex-1 flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-sm font-semibold py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FontAwesomeIcon icon={faExpand} className="w-3.5" />
                Details
              </button>
              {entry.listing && (
                <>
                  <div className="w-px bg-gray-100 dark:bg-gray-800" />
                  <a
                    href={entry.listing}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
