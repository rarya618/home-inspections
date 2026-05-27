import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "us-central1" });

interface ListingData {
  address?: string;
  rent?: string;
  bedrooms?: string;
  bathrooms?: string;
  carParks?: string;
  isFurnished?: boolean;
  isPetsAllowed?: boolean;
  hasAirCon?: boolean;
  hasGarage?: boolean;
}

// Walks an object and returns the value at the first path that exists and is non-null
function pick(obj: unknown, ...paths: string[][]): unknown {
  for (const path of paths) {
    let cur: unknown = obj;
    for (const key of path) {
      if (cur == null || typeof cur !== "object") { cur = undefined; break; }
      cur = (cur as Record<string, unknown>)[key];
    }
    if (cur != null) return cur;
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  return v != null ? String(v) : undefined;
}

function featureMatch(features: string[], ...keywords: string[]): boolean {
  const lower = features.map(f => f.toLowerCase());
  return keywords.some(kw => lower.some(f => f.includes(kw)));
}

function parseREA(data: unknown): ListingData {
  const result: ListingData = {};

  const listing = pick(data,
    ["props", "pageProps", "listing"],
    ["props", "pageProps", "listingData", "listing"],
  );
  if (!listing) return result;

  // Address
  const displayAddress = pick(listing, ["address", "displayAddress"]);
  const street  = pick(listing, ["address", "streetAddress"]);
  const suburb  = pick(listing, ["address", "suburb"]);
  const state   = pick(listing, ["address", "state"]);
  const postcode = pick(listing, ["address", "postcode"]);

  if (displayAddress) {
    result.address = str(displayAddress);
  } else if (street) {
    result.address = [street, suburb, state, postcode].filter(Boolean).join(", ");
  }

  // Rent — e.g. "$500 per week" or "$500/week"
  const priceDisplay = str(pick(listing,
    ["price", "display"],
    ["priceDetails", "display"],
    ["pricing", "label"],
  ));
  if (priceDisplay) {
    const m = priceDisplay.replace(/,/g, "").match(/\$?([\d]+)/);
    if (m) result.rent = m[1];
  }

  // Beds / baths / parking
  result.bedrooms  = str(pick(listing, ["generalFeatures", "bedrooms", "value"]));
  result.bathrooms = str(pick(listing, ["generalFeatures", "bathrooms", "value"]));
  result.carParks  = str(pick(listing, ["generalFeatures", "parkingSpaces", "value"]));

  // Features — flatten all feature arrays into strings
  const featureArrays: string[] = [];
  const rawFeatures = pick(listing, ["features"]);
  if (rawFeatures && typeof rawFeatures === "object") {
    for (const val of Object.values(rawFeatures as object)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === "string") featureArrays.push(item);
          else if (item?.name) featureArrays.push(String(item.name));
          else if (item?.label) featureArrays.push(String(item.label));
        }
      }
    }
  }

  if (featureArrays.length) {
    result.hasAirCon    = featureMatch(featureArrays, "air conditioning", "air-conditioning", "ducted air", "split system");
    result.isFurnished  = featureMatch(featureArrays, "furnished");
    result.hasGarage    = featureMatch(featureArrays, "garage");
    result.isPetsAllowed = featureMatch(featureArrays, "pets allowed", "pet friendly", "pets considered");
  }

  return result;
}

function parseDomain(data: unknown): ListingData {
  const result: ListingData = {};

  const listing = pick(data,
    ["props", "pageProps", "listingDetails"],
    ["props", "pageProps", "listing"],
  );
  if (!listing) return result;

  // Address
  const displayAddress = pick(listing, ["address", "displayAddress"]);
  const street  = pick(listing, ["address", "street"]);
  const suburb  = pick(listing, ["address", "suburb"]);
  const state   = pick(listing, ["address", "state"]);
  const postcode = pick(listing, ["address", "postcode"]);

  if (displayAddress) {
    result.address = str(displayAddress);
  } else if (street) {
    result.address = [street, suburb, state, postcode].filter(Boolean).join(", ");
  }

  // Rent
  const priceDisplay = str(pick(listing,
    ["priceDetails", "displayPrice"],
    ["price", "displayPrice"],
    ["price"],
  ));
  if (priceDisplay) {
    const m = priceDisplay.replace(/,/g, "").match(/\$?([\d]+)/);
    if (m) result.rent = m[1];
  }

  // Beds / baths / parking
  result.bedrooms  = str(pick(listing, ["features", "bedrooms"]));
  result.bathrooms = str(pick(listing, ["features", "bathrooms"]));
  result.carParks  = str(pick(listing, ["features", "carparks"]));

  // Features
  const featureArrays: string[] = [];
  const rawFeatures = pick(listing, ["features", "features"]);
  if (Array.isArray(rawFeatures)) {
    for (const f of rawFeatures) {
      if (typeof f === "string") featureArrays.push(f);
      else if (f?.name) featureArrays.push(String(f.name));
    }
  }

  if (featureArrays.length) {
    result.hasAirCon     = featureMatch(featureArrays, "air conditioning", "split system", "ducted");
    result.isFurnished   = featureMatch(featureArrays, "furnished");
    result.hasGarage     = featureMatch(featureArrays, "garage");
    result.isPetsAllowed = featureMatch(featureArrays, "pets allowed", "pet friendly", "pets considered");
  }

  return result;
}

export const fetchListing = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { url } = req.body as { url?: string };

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "url is required" });
      return;
    }

    const isREA    = url.includes("realestate.com.au");
    const isDomain = url.includes("domain.com.au");

    if (!isREA && !isDomain) {
      res.status(400).json({ error: "Only realestate.com.au and domain.com.au URLs are supported" });
      return;
    }

    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-AU,en;q=0.9",
        },
      });

      if (!response.ok) {
        res.status(502).json({ error: `Listing site returned ${response.status}` });
        return;
      }

      html = await response.text();
    } catch (err) {
      res.status(502).json({ error: `Failed to fetch listing: ${String(err)}` });
      return;
    }

    // Extract __NEXT_DATA__
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) {
      res.status(422).json({ error: "Could not find listing data — the page may require a browser to render" });
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(match[1]);
    } catch {
      res.status(422).json({ error: "Failed to parse listing data" });
      return;
    }

    const result = isREA ? parseREA(data) : parseDomain(data);

    if (!result.address && !result.rent) {
      res.status(422).json({ error: "Could not extract listing details — the page structure may have changed" });
      return;
    }

    res.json(result);
  }
);
