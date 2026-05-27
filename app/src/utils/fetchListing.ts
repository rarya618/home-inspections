import { Entry } from '../components/AddEntry'

// URL of the deployed Cloud Function
// Swap this for the emulator URL during local development:
// http://127.0.0.1:5001/russ-home-search/australia-southeast1/fetchListing
const FUNCTION_URL =
  'https://fetchlisting-rcthqf4c7q-uc.a.run.app'

export type ListingPrefill = Pick<Entry,
  'address' | 'rent' | 'bedrooms' | 'bathrooms' | 'carParks' |
  'isFurnished' | 'isPetsAllowed' | 'hasAirCon' | 'hasGarage'
> & { listing?: string }

export async function fetchListingData(url: string): Promise<ListingPrefill> {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  const json = await res.json() as ListingPrefill & { error?: string }

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Server error ${res.status}`)
  }

  return json
}
