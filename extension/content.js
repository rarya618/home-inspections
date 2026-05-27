// HouseX Importer — content script

const PROJECT_ID = 'russ-home-search';
const API_KEY    = 'AIzaSyD0_PKdIrndnwmgl1pq62AiUUUwLNVM1Rw';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/data?key=${API_KEY}`;

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
  const listing = pick(data, ['props','pageProps','listing'], ['props','pageProps','listingData','listing']);
  if (!listing) return result;

  const displayAddress = pick(listing, ['address','displayAddress']);
  const street   = pick(listing, ['address','streetAddress']);
  const suburb   = pick(listing, ['address','suburb']);
  const state    = pick(listing, ['address','state']);
  const postcode = pick(listing, ['address','postcode']);
  if (displayAddress) result.address = String(displayAddress);
  else if (street) result.address = [street, suburb, state, postcode].filter(Boolean).join(', ');

  const priceDisplay = String(pick(listing, ['price','display'], ['priceDetails','display'], ['pricing','label']) ?? '');
  const pm = priceDisplay.replace(/,/g,'').match(/\$?([\d]+)/);
  if (pm) result.rent = pm[1];

  result.bedrooms  = String(pick(listing, ['generalFeatures','bedrooms','value'])  ?? '');
  result.bathrooms = String(pick(listing, ['generalFeatures','bathrooms','value'])  ?? '');
  result.carParks  = String(pick(listing, ['generalFeatures','parkingSpaces','value']) ?? '');

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
  const listing = pick(data, ['props','pageProps','listingDetails'], ['props','pageProps','listing']);
  if (!listing) return result;

  const displayAddress = pick(listing, ['address','displayAddress']);
  const street   = pick(listing, ['address','street']);
  const suburb   = pick(listing, ['address','suburb']);
  const state    = pick(listing, ['address','state']);
  const postcode = pick(listing, ['address','postcode']);
  if (displayAddress) result.address = String(displayAddress);
  else if (street) result.address = [street, suburb, state, postcode].filter(Boolean).join(', ');

  const priceDisplay = String(pick(listing, ['priceDetails','displayPrice'], ['price','displayPrice'], ['price']) ?? '');
  const pm = priceDisplay.replace(/,/g,'').match(/\$?([\d]+)/);
  if (pm) result.rent = pm[1];

  result.bedrooms  = String(pick(listing, ['features','bedrooms'])  ?? '');
  result.bathrooms = String(pick(listing, ['features','bathrooms']) ?? '');
  result.carParks  = String(pick(listing, ['features','carparks'])  ?? '');

  const featureStrs = [];
  const rawFeatures = pick(listing, ['features','features']);
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

// ─── Extraction methods ────────────────────────────────────────────────────

function tryNextData() {
  const el = document.getElementById('__NEXT_DATA__');
  if (!el) return null;
  try {
    const data = JSON.parse(el.textContent);
    return location.hostname.includes('realestate.com.au') ? parseREA(data) : parseDomain(data);
  } catch { return null; }
}

function tryJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const result = {};
  for (const script of scripts) {
    let ld;
    try { ld = JSON.parse(script.textContent); } catch { continue; }
    const items = Array.isArray(ld) ? ld : [ld];
    for (const item of items) {
      if (item.address && !result.address) {
        const a = item.address;
        const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean);
        if (parts.length) result.address = parts.join(', ');
      }
      if (!result.address && item.name && /\d/.test(item.name)) result.address = item.name;
      if (item.price && !result.rent) {
        const m = String(item.price).replace(/,/g,'').match(/[\d]+/);
        if (m) result.rent = m[0];
      }
      if (item.numberOfBedrooms && !result.bedrooms)  result.bedrooms  = String(item.numberOfBedrooms);
      if (item.numberOfBathroomsTotal && !result.bathrooms) result.bathrooms = String(item.numberOfBathroomsTotal);
      const amenities = (item.amenityFeature ?? []).map(f => String(f.name ?? f).toLowerCase());
      if (amenities.length) {
        if (!result.hasAirCon)     result.hasAirCon     = featureMatch(amenities, 'air conditioning', 'ducted', 'split system');
        if (!result.isFurnished)   result.isFurnished   = featureMatch(amenities, 'furnished');
        if (!result.hasGarage)     result.hasGarage     = featureMatch(amenities, 'garage');
        if (!result.isPetsAllowed) result.isPetsAllowed = featureMatch(amenities, 'pets allowed', 'pet friendly');
      }
    }
  }
  return (result.address || result.rent) ? result : null;
}

function tryMeta() {
  const result = {};
  const metaDesc = document.querySelector('meta[name="description"]')?.content
                ?? document.querySelector('meta[property="og:description"]')?.content ?? '';
  const ogTitle  = document.querySelector('meta[property="og:title"]')?.content ?? '';

  if (ogTitle) result.address = ogTitle.replace(/\s*[-–|]\s*(property|house|apartment|unit|flat|studio|townhouse|villa|rent|sale|buy).*$/i,'').trim();

  if (metaDesc) {
    const rentM = metaDesc.replace(/,/g,'').match(/\$\s*([\d]+)\s*(?:per\s*week|\/\s*w(?:eek)?|p\.?w\.?)/i);
    if (rentM) result.rent = rentM[1];
    const bedM  = metaDesc.match(/(\d+)\s*bed(?:room)?s?/i);
    const bathM = metaDesc.match(/(\d+)\s*bath(?:room)?s?/i);
    const carM  = metaDesc.match(/(\d+)\s*(?:car\s*(?:space|park|garage)?s?|parking\s*space)/i);
    if (bedM)  result.bedrooms  = bedM[1];
    if (bathM) result.bathrooms = bathM[1];
    if (carM)  result.carParks  = carM[1];
  }
  return (result.address || result.rent || result.bedrooms) ? result : null;
}

function extractListingData() {
  const sources = [tryNextData(), tryJsonLd(), tryMeta()].filter(Boolean);
  if (!sources.length) return {};
  const merged = {};
  for (const r of sources) {
    for (const [k, v] of Object.entries(r)) {
      if (v != null && v !== '' && !(k in merged)) merged[k] = v;
    }
  }
  return merged;
}

// ─── Firestore ─────────────────────────────────────────────────────────────

function toFirestoreDoc(data) {
  const fields = {};
  const strings = ['address','rent','bedrooms','bathrooms','carParks','listing'];
  const bools   = ['isKitchenPrivate','isFurnished','hasAirCon','isPetsAllowed','hasGarage','hasLawn',
                   'hasElectricity','hasWater','hasInternet','isInspected','isRented'];
  for (const k of strings) {
    if (data[k] != null && data[k] !== '') fields[k] = { stringValue: String(data[k]) };
  }
  for (const k of bools) {
    fields[k] = { booleanValue: Boolean(data[k]) };
  }
  return { fields };
}

async function saveEntry(data) {
  const res = await fetch(FIRESTORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestoreDoc(data)),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Panel UI ──────────────────────────────────────────────────────────────

const S = {
  panel: `
    position:fixed; top:0; right:0; bottom:0; width:340px; z-index:2147483647;
    background:#fff; box-shadow:-4px 0 24px rgba(0,0,0,0.12);
    display:flex; flex-direction:column; font-family:system-ui,sans-serif;
    letter-spacing:-0.02em; transform:translateX(100%);
    transition:transform 0.25s cubic-bezier(0.4,0,0.2,1);
  `,
  header: `
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 20px; border-bottom:1px solid #f1f5f9; flex-shrink:0;
  `,
  title: `font-size:16px; font-weight:800; color:#111827; margin:0;`,
  closeBtn: `
    background:none; border:none; cursor:pointer; padding:4px; color:#9ca3af;
    font-size:20px; line-height:1; border-radius:6px;
  `,
  body: `flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px;`,
  label: `display:block; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:5px;`,
  input: `
    width:100%; box-sizing:border-box; background:#fff; border:1px solid #e5e7eb;
    border-radius:10px; padding:9px 12px; font-size:13px; font-weight:500;
    color:#111827; font-family:inherit; letter-spacing:-0.02em; outline:none;
  `,
  row: `display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;`,
  toggleRow: `
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; border-radius:10px; cursor:pointer;
    transition:background 0.1s;
  `,
  toggleLabel: `font-size:13px; font-weight:500; color:#374151;`,
  toggleTrack: `
    width:36px; height:20px; border-radius:999px; background:#e5e7eb;
    position:relative; flex-shrink:0; transition:background 0.15s;
  `,
  toggleThumb: `
    position:absolute; top:2px; left:2px; width:16px; height:16px;
    border-radius:999px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.2);
    transition:transform 0.15s;
  `,
  saveBtn: `
    width:100%; padding:12px; background:#4f46e5; color:#fff; border:none;
    border-radius:12px; font-size:14px; font-weight:700; cursor:pointer;
    font-family:inherit; letter-spacing:-0.02em; transition:background 0.15s;
    flex-shrink:0;
  `,
  footer: `padding:16px 20px; border-top:1px solid #f1f5f9; flex-shrink:0;`,
  note: `font-size:11px; color:#9ca3af; text-align:center; margin-top:8px;`,
};

function makeToggle(id, label, checked) {
  const row = document.createElement('label');
  row.style.cssText = S.toggleRow;
  row.htmlFor = `hx-${id}`;

  const lbl = document.createElement('span');
  lbl.style.cssText = S.toggleLabel;
  lbl.textContent = label;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `hx-${id}`;
  input.checked = !!checked;
  input.style.cssText = 'position:absolute;opacity:0;width:0;height:0;';

  const track = document.createElement('div');
  track.style.cssText = S.toggleTrack;
  const thumb = document.createElement('div');
  thumb.style.cssText = S.toggleThumb;
  track.appendChild(thumb);

  function updateTrack() {
    track.style.background = input.checked ? '#4f46e5' : '#e5e7eb';
    thumb.style.transform  = input.checked ? 'translateX(16px)' : 'translateX(0)';
  }
  updateTrack();
  input.addEventListener('change', updateTrack);

  row.addEventListener('mouseenter', () => row.style.background = '#f9fafb');
  row.addEventListener('mouseleave', () => row.style.background = '');

  row.appendChild(lbl);
  row.appendChild(input);
  row.appendChild(track);
  return row;
}

function makeInput(id, label, value, placeholder) {
  const wrap = document.createElement('div');
  const lbl  = document.createElement('label');
  lbl.style.cssText = S.label;
  lbl.textContent   = label;
  lbl.htmlFor       = `hx-${id}`;
  const inp = document.createElement('input');
  inp.style.cssText = S.input;
  inp.id            = `hx-${id}`;
  inp.value         = value ?? '';
  inp.placeholder   = placeholder ?? '';
  inp.addEventListener('focus', () => inp.style.borderColor = '#4f46e5');
  inp.addEventListener('blur',  () => inp.style.borderColor = '#e5e7eb');
  wrap.appendChild(lbl);
  wrap.appendChild(inp);
  return wrap;
}

function val(id)     { return (document.getElementById(`hx-${id}`)?.value ?? '').trim(); }
function checked(id) { return document.getElementById(`hx-${id}`)?.checked ?? false; }

function injectPanel() {
  if (document.getElementById('housex-panel')) return;

  const prefill = extractListingData();
  console.log('[HouseX] prefill:', prefill);

  // ── Panel shell ──────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'housex-panel';
  panel.style.cssText = S.panel;

  // Header
  const header = document.createElement('div');
  header.style.cssText = S.header;
  const title = document.createElement('p');
  title.style.cssText = S.title;
  title.textContent = 'HouseX';
  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = S.closeBtn;
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closePanel);
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.style.cssText = S.body;

  body.appendChild(makeInput('address', 'Address', prefill.address, 'Full address'));
  body.appendChild(makeInput('listing', 'Listing URL', location.href, 'https://...'));
  body.appendChild(makeInput('rent', 'Rent / week ($)', prefill.rent, '500'));

  const row = document.createElement('div');
  row.style.cssText = S.row;
  row.appendChild(makeInput('bedrooms',  'Beds',  prefill.bedrooms,  '2'));
  row.appendChild(makeInput('bathrooms', 'Bath',  prefill.bathrooms, '1'));
  row.appendChild(makeInput('carParks',  'Cars',  prefill.carParks,  '0'));
  body.appendChild(row);

  const togglesWrap = document.createElement('div');
  togglesWrap.style.cssText = 'background:#f9fafb; border-radius:12px; overflow:hidden;';
  const toggles = [
    ['isKitchenPrivate', 'Private kitchen', false],
    ['isFurnished',      'Furnished',       prefill.isFurnished],
    ['hasAirCon',        'Air conditioning', prefill.hasAirCon],
    ['isPetsAllowed',    'Pets allowed',    prefill.isPetsAllowed],
    ['hasGarage',        'Garage',          prefill.hasGarage],
    ['hasLawn',          'Lawn',            false],
    ['hasElectricity',   'Electricity incl.', false],
    ['hasWater',         'Water incl.',     false],
    ['hasInternet',      'Internet incl.',  false],
  ];
  for (const [id, label, chk] of toggles) {
    togglesWrap.appendChild(makeToggle(id, label, chk));
  }
  body.appendChild(togglesWrap);

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = S.footer;

  const saveBtn = document.createElement('button');
  saveBtn.style.cssText = S.saveBtn;
  saveBtn.textContent = 'Save to HouseX';
  saveBtn.addEventListener('mouseenter', () => saveBtn.style.background = '#4338ca');
  saveBtn.addEventListener('mouseleave', () => saveBtn.style.background = '#4f46e5');

  const note = document.createElement('p');
  note.style.cssText = S.note;
  note.textContent = 'Transit times will auto-fetch when opened in HouseX';

  saveBtn.addEventListener('click', async () => {
    const address = val('address');
    const rent    = val('rent');
    if (!address || !rent) {
      saveBtn.textContent = '⚠ Address and rent are required';
      saveBtn.style.background = '#dc2626';
      setTimeout(() => { saveBtn.textContent = 'Save to HouseX'; saveBtn.style.background = '#4f46e5'; }, 2500);
      return;
    }

    saveBtn.textContent  = 'Saving…';
    saveBtn.disabled     = true;
    saveBtn.style.opacity = '0.7';

    try {
      await saveEntry({
        address,
        rent,
        bedrooms:        val('bedrooms'),
        bathrooms:       val('bathrooms'),
        carParks:        val('carParks'),
        listing:         val('listing'),
        isKitchenPrivate: checked('isKitchenPrivate'),
        isFurnished:     checked('isFurnished'),
        hasAirCon:       checked('hasAirCon'),
        isPetsAllowed:   checked('isPetsAllowed'),
        hasGarage:       checked('hasGarage'),
        hasLawn:         checked('hasLawn'),
        hasElectricity:  checked('hasElectricity'),
        hasWater:        checked('hasWater'),
        hasInternet:     checked('hasInternet'),
        isInspected:     false,
        isRented:        false,
      });
      saveBtn.textContent   = '✓ Saved!';
      saveBtn.style.background = '#059669';
      saveBtn.style.opacity = '1';
      note.textContent = 'Entry saved — open HouseX to see it';
      setTimeout(closePanel, 1800);
    } catch (err) {
      saveBtn.textContent   = `✗ ${err.message}`;
      saveBtn.style.background = '#dc2626';
      saveBtn.disabled      = false;
      saveBtn.style.opacity = '1';
      setTimeout(() => { saveBtn.textContent = 'Save to HouseX'; saveBtn.style.background = '#4f46e5'; }, 3000);
    }
  });

  footer.appendChild(saveBtn);
  footer.appendChild(note);

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(footer);
  document.body.appendChild(panel);

  // Slide in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; });
  });
}

function closePanel() {
  const panel = document.getElementById('housex-panel');
  if (!panel) return;
  panel.style.transform = 'translateX(100%)';
  setTimeout(() => panel.remove(), 260);
}

// ─── Trigger button ────────────────────────────────────────────────────────

function injectButton() {
  if (document.getElementById('housex-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'housex-btn';
  btn.textContent = '＋ HouseX';
  Object.assign(btn.style, {
    position:     'fixed',
    bottom:       '24px',
    right:        '24px',
    zIndex:       '2147483646',
    background:   '#4f46e5',
    color:        '#fff',
    border:       'none',
    borderRadius: '999px',
    padding:      '11px 18px',
    fontSize:     '13px',
    fontWeight:   '700',
    cursor:       'pointer',
    boxShadow:    '0 4px 16px rgba(79,70,229,0.4)',
    fontFamily:   'system-ui, sans-serif',
    letterSpacing: '-0.02em',
    transition:   'transform 0.1s, background 0.15s',
  });
  btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.04)');
  btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
  btn.addEventListener('click', () => {
    if (document.getElementById('housex-panel')) closePanel();
    else injectPanel();
  });

  document.body.appendChild(btn);
}

injectButton();
