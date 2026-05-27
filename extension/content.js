// HouseX Importer — content script
// Runs on realestate.com.au and domain.com.au listing pages

const HOUSEX_URL = 'https://housex.russal.dev';

// ─── Helpers ───────────────────────────────────────────────────────────────

function pick(obj, ...paths) {
  for (const path of paths) {
    let cur = obj;
    for (const key of path) {
      if (cur == null || typeof cur !== 'object') { cur = undefined; break; }
      cur = cur[key];
    }
    if (cur != null) return cur;
  }
  return undefined;
}

function featureMatch(features, ...keywords) {
  const lower = features.map(f => String(f).toLowerCase());
  return keywords.some(kw => lower.some(f => f.includes(kw)));
}

// ─── Parsers ───────────────────────────────────────────────────────────────

function parseREA(data) {
  const result = {};
  const listing = pick(data,
    ['props', 'pageProps', 'listing'],
    ['props', 'pageProps', 'listingData', 'listing'],
  );
  if (!listing) return result;

  const displayAddress = pick(listing, ['address', 'displayAddress']);
  const street   = pick(listing, ['address', 'streetAddress']);
  const suburb   = pick(listing, ['address', 'suburb']);
  const state    = pick(listing, ['address', 'state']);
  const postcode = pick(listing, ['address', 'postcode']);

  if (displayAddress) result.address = String(displayAddress);
  else if (street) result.address = [street, suburb, state, postcode].filter(Boolean).join(', ');

  const priceDisplay = String(pick(listing,
    ['price', 'display'],
    ['priceDetails', 'display'],
    ['pricing', 'label'],
  ) ?? '');
  const pm = priceDisplay.replace(/,/g, '').match(/\$?([\d]+)/);
  if (pm) result.rent = pm[1];

  result.bedrooms  = String(pick(listing, ['generalFeatures', 'bedrooms',      'value']) ?? '');
  result.bathrooms = String(pick(listing, ['generalFeatures', 'bathrooms',     'value']) ?? '');
  result.carParks  = String(pick(listing, ['generalFeatures', 'parkingSpaces', 'value']) ?? '');

  // Flatten feature lists
  const featureStrs = [];
  const rawFeatures = pick(listing, ['features']);
  if (rawFeatures && typeof rawFeatures === 'object') {
    for (const val of Object.values(rawFeatures)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string') featureStrs.push(item);
          else if (item?.name)  featureStrs.push(String(item.name));
          else if (item?.label) featureStrs.push(String(item.label));
        }
      }
    }
  }
  if (featureStrs.length) {
    result.hasAirCon     = featureMatch(featureStrs, 'air conditioning', 'ducted air', 'split system');
    result.isFurnished   = featureMatch(featureStrs, 'furnished');
    result.hasGarage     = featureMatch(featureStrs, 'garage');
    result.isPetsAllowed = featureMatch(featureStrs, 'pets allowed', 'pet friendly', 'pets considered');
  }

  return result;
}

function parseDomain(data) {
  const result = {};
  const listing = pick(data,
    ['props', 'pageProps', 'listingDetails'],
    ['props', 'pageProps', 'listing'],
  );
  if (!listing) return result;

  const displayAddress = pick(listing, ['address', 'displayAddress']);
  const street   = pick(listing, ['address', 'street']);
  const suburb   = pick(listing, ['address', 'suburb']);
  const state    = pick(listing, ['address', 'state']);
  const postcode = pick(listing, ['address', 'postcode']);

  if (displayAddress) result.address = String(displayAddress);
  else if (street) result.address = [street, suburb, state, postcode].filter(Boolean).join(', ');

  const priceDisplay = String(pick(listing,
    ['priceDetails', 'displayPrice'],
    ['price', 'displayPrice'],
    ['price'],
  ) ?? '');
  const pm = priceDisplay.replace(/,/g, '').match(/\$?([\d]+)/);
  if (pm) result.rent = pm[1];

  result.bedrooms  = String(pick(listing, ['features', 'bedrooms'])  ?? '');
  result.bathrooms = String(pick(listing, ['features', 'bathrooms']) ?? '');
  result.carParks  = String(pick(listing, ['features', 'carparks'])  ?? '');

  const featureStrs = [];
  const rawFeatures = pick(listing, ['features', 'features']);
  if (Array.isArray(rawFeatures)) {
    for (const f of rawFeatures) {
      if (typeof f === 'string') featureStrs.push(f);
      else if (f?.name) featureStrs.push(String(f.name));
    }
  }
  if (featureStrs.length) {
    result.hasAirCon     = featureMatch(featureStrs, 'air conditioning', 'split system', 'ducted');
    result.isFurnished   = featureMatch(featureStrs, 'furnished');
    result.hasGarage     = featureMatch(featureStrs, 'garage');
    result.isPetsAllowed = featureMatch(featureStrs, 'pets allowed', 'pet friendly', 'pets considered');
  }

  return result;
}

// ─── Method 1: __NEXT_DATA__ ───────────────────────────────────────────────

function tryNextData() {
  const el = document.getElementById('__NEXT_DATA__');
  if (!el) return null;
  try {
    const data = JSON.parse(el.textContent);
    const isREA = location.hostname.includes('realestate.com.au');
    console.log('[HouseX] __NEXT_DATA__ pageProps keys:', Object.keys(data?.props?.pageProps ?? {}));
    return isREA ? parseREA(data) : parseDomain(data);
  } catch { return null; }
}

// ─── Method 2: JSON-LD structured data ────────────────────────────────────

function tryJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const result = {};

  for (const script of scripts) {
    let ld;
    try { ld = JSON.parse(script.textContent); } catch { continue; }

    // Handle arrays at the top level
    const items = Array.isArray(ld) ? ld : [ld];
    for (const item of items) {
      // Address from PostalAddress or direct name
      if (item.address) {
        const a = item.address;
        const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean);
        if (parts.length) result.address = parts.join(', ');
      }
      if (!result.address && item.name && /\d/.test(item.name)) {
        result.address = item.name;
      }

      // Price
      if (item.price && !result.rent) {
        const m = String(item.price).replace(/,/g, '').match(/[\d]+/);
        if (m) result.rent = m[0];
      }

      // Rooms
      if (item.numberOfBedrooms || item.numberOfRooms) {
        result.bedrooms = String(item.numberOfBedrooms ?? item.numberOfRooms);
      }
      if (item.numberOfBathroomsTotal) {
        result.bathrooms = String(item.numberOfBathroomsTotal);
      }

      // Amenity features
      const amenities = item.amenityFeature ?? [];
      const featureNames = amenities.map(f => String(f.name ?? f).toLowerCase());
      if (featureNames.length) {
        if (!result.hasAirCon)     result.hasAirCon     = featureMatch(featureNames, 'air conditioning', 'ducted', 'split system');
        if (!result.isFurnished)   result.isFurnished   = featureMatch(featureNames, 'furnished');
        if (!result.hasGarage)     result.hasGarage     = featureMatch(featureNames, 'garage');
        if (!result.isPetsAllowed) result.isPetsAllowed = featureMatch(featureNames, 'pets allowed', 'pet friendly');
      }
    }
  }

  console.log('[HouseX] JSON-LD result:', result);
  return (result.address || result.rent) ? result : null;
}

// ─── Method 3: DOM scraping ────────────────────────────────────────────────

function tryDom() {
  const result = {};

  // ── Address ──────────────────────────────────────────────────────────────
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  if (ogTitle) {
    result.address = ogTitle.replace(/\s*[-–|]\s*(property|house|apartment|unit|flat|studio|townhouse|villa|rent|sale|buy).*$/i, '').trim();
  }
  if (!result.address) {
    const h1 = document.querySelector('h1');
    if (h1) result.address = h1.textContent.trim();
  }

  // ── Meta description — primary source for price + features on REA ─────────
  const metaDesc = document.querySelector('meta[name="description"]')?.content
                ?? document.querySelector('meta[property="og:description"]')?.content
                ?? '';
  console.log('[HouseX] meta description:', metaDesc);

  if (metaDesc) {
    const rentM = metaDesc.replace(/,/g, '').match(/\$\s*([\d]+)\s*(?:per\s*week|\/\s*w(?:eek)?|p\.?w\.?)/i);
    if (rentM) result.rent = rentM[1];

    const bedM  = metaDesc.match(/(\d+)\s*bed(?:room)?s?/i);
    const bathM = metaDesc.match(/(\d+)\s*bath(?:room)?s?/i);
    const carM  = metaDesc.match(/(\d+)\s*(?:car\s*(?:space|park|garage)?s?|parking\s*space)/i);
    if (bedM)  result.bedrooms  = bedM[1];
    if (bathM) result.bathrooms = bathM[1];
    if (carM)  result.carParks  = carM[1];
  }

  // ── Price fallbacks ───────────────────────────────────────────────────────
  if (!result.rent) {
    const priceEl =
      document.querySelector('[data-testid="listing-details__summary-title"]') ??
      document.querySelector('[data-testid="price"]') ??
      document.querySelector('[class*="price__"]') ??
      document.querySelector('[class*="Price"]');
    if (priceEl) {
      const m = priceEl.textContent.replace(/,/g, '').match(/\$?\s*([\d]+)/);
      if (m) result.rent = m[1];
    }
  }
  if (!result.rent) {
    const m = document.body.innerText.replace(/,/g, '').match(/\$\s*([\d]+)\s*(?:per\s*week|\/\s*w(?:eek)?|p\.?w\.?)/i);
    if (m) result.rent = m[1];
  }

  // ── Feature fallbacks ─────────────────────────────────────────────────────
  if (!result.bedrooms || !result.bathrooms) {
    const bodyText = document.body.innerText;
    const bedM  = bodyText.match(/\b(\d+)\s*bed(?:room)?s?\b/i);
    const bathM = bodyText.match(/\b(\d+)\s*bath(?:room)?s?\b/i);
    const carM  = bodyText.match(/\b(\d+)\s*(?:car\s*(?:space|park|garage)?s?)\b/i);
    if (bedM  && !result.bedrooms)  result.bedrooms  = bedM[1];
    if (bathM && !result.bathrooms) result.bathrooms = bathM[1];
    if (carM  && !result.carParks)  result.carParks  = carM[1];
  }

  console.log('[HouseX] DOM result:', result);
  return (result.address || result.rent) ? result : null;
}

// ─── Extract & inject ──────────────────────────────────────────────────────

function extractListingData() {
  // Run all methods and merge — later fields don't overwrite earlier ones
  const results = [tryNextData(), tryJsonLd(), tryDom()].filter(Boolean);
  if (!results.length) return null;

  const merged = {};
  for (const r of results) {
    for (const [k, v] of Object.entries(r)) {
      if (v != null && v !== '' && !(k in merged)) merged[k] = v;
    }
  }
  console.log('[HouseX] Merged result:', merged);
  return Object.keys(merged).length ? merged : null;
}

function injectButton() {
  if (document.getElementById('housex-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'housex-btn';
  btn.textContent = '＋ Add to HouseX';
  btn.title = 'Import this listing into HouseX';
  Object.assign(btn.style, {
    position:     'fixed',
    bottom:       '24px',
    right:        '24px',
    zIndex:       '2147483647',
    background:   '#4f46e5',
    color:        '#fff',
    border:       'none',
    borderRadius: '999px',
    padding:      '12px 20px',
    fontSize:     '14px',
    fontWeight:   '600',
    cursor:       'pointer',
    boxShadow:    '0 4px 16px rgba(79,70,229,0.4)',
    fontFamily:   'system-ui, sans-serif',
    letterSpacing: '-0.02em',
    transition:   'transform 0.1s, box-shadow 0.1s',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.transform  = 'scale(1.04)';
    btn.style.boxShadow  = '0 6px 20px rgba(79,70,229,0.5)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform  = 'scale(1)';
    btn.style.boxShadow  = '0 4px 16px rgba(79,70,229,0.4)';
  });

  btn.addEventListener('click', () => {
    const data = extractListingData();
    if (!data || (!data.address && !data.rent)) {
      btn.textContent = '✗ Could not read listing';
      btn.style.background = '#dc2626';
      setTimeout(() => {
        btn.textContent = '＋ Add to HouseX';
        btn.style.background = '#4f46e5';
      }, 2500);
      return;
    }

    // Include the listing URL
    data.listing = location.href;

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const target  = `${HOUSEX_URL}/?import=${encoded}`;

    btn.textContent = '✓ Opening HouseX…';
    btn.style.background = '#059669';
    window.open(target, '_blank');

    setTimeout(() => {
      btn.textContent = '＋ Add to HouseX';
      btn.style.background = '#4f46e5';
    }, 2500);
  });

  document.body.appendChild(btn);
}

injectButton();
