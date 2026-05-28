import { useEffect, useRef, useState } from 'react'
import './App.css'
import Table from './components/Table'
import MapView from './components/MapView'
import AddEntryForm from './components/AddEntry';
import UpdateEntryForm from './components/UpdateEntry';
import PropertyDetail from './components/PropertyDetail';
import { Entry } from './components/AddEntry';
import { ListingPrefill } from './utils/fetchListing';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableCells, faList, faMap, faArrowsRotate, faChevronDown, faMagnifyingGlass, faSlidersH } from '@fortawesome/free-solid-svg-icons';

// set page title
export function useTitle(title: string) {
	useEffect(() => {
		const prevTitle = document.title;

		document.title = title + " - HouseX";

		return () => {
			document.title = prevTitle
		}
	})
}

// button
export function Button(text: string, onclick?: () => void) {
  return (
    <button
      className="fixed bottom-8 right-8 z-30 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-150"
      onClick={onclick}>
      <span className="text-lg leading-none">+</span>
      {text}
    </button>
  )
}

export type Filters = {
  features: Set<string>
  maxRentPP: string
  minBedrooms: string
  maxUniMins: string
  maxWorkMins: string
}

const DEFAULT_FILTERS: Filters = {
  features: new Set(),
  maxRentPP: '',
  minBedrooms: '',
  maxUniMins: '',
  maxWorkMins: '',
}

const FEATURE_OPTIONS = [
  { key: 'inspected',    label: 'Inspected' },
  { key: 'aircon',       label: 'Air con' },
  { key: 'kitchen',      label: 'Private kitchen' },
  { key: 'pets',         label: 'Pets allowed' },
  { key: 'garage',       label: 'Garage' },
  { key: 'electricity',  label: 'Electricity incl.' },
  { key: 'water',        label: 'Water incl.' },
  { key: 'internet',     label: 'Internet incl.' },
  { key: 'noLawn',       label: 'No lawn' },
  { key: 'notFurnished', label: 'Not furnished' },
]

function FilterPanel({ filters, onChange }: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleFeature = (key: string) => {
    const next = new Set(filters.features)
    next.has(key) ? next.delete(key) : next.add(key)
    onChange({ ...filters, features: next })
  }

  const activeCount =
    filters.features.size +
    (filters.maxRentPP ? 1 : 0) +
    (filters.minBedrooms ? 1 : 0) +
    (filters.maxUniMins ? 1 : 0) +
    (filters.maxWorkMins ? 1 : 0)

  const hasAny = activeCount > 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-full text-xs font-semibold transition-all ${
          hasAny
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <FontAwesomeIcon icon={faSlidersH} className="w-3" />
        Filters
        {hasAny && (
          <span className="bg-white/30 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Filters</span>
            {hasAny && (
              <button
                onClick={() => onChange(DEFAULT_FILTERS)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Features */}
            <div>
              <p className="text-xs font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 mb-2">Features</p>
              <div className="grid grid-cols-2 gap-1.5">
                {FEATURE_OPTIONS.map(({ key, label }) => {
                  const active = filters.features.has(key)
                  return (
                    <button
                      key={key}
                      onClick={() => toggleFeature(key)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Property */}
            <div>
              <p className="text-xs font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 mb-2">Property</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400 shrink-0">Max rent/pp</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="e.g. 400"
                      value={filters.maxRentPP}
                      onChange={e => onChange({ ...filters, maxRentPP: e.target.value })}
                      className="w-24 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-400">/wk</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400 shrink-0">Min bedrooms</label>
                  <input
                    type="number"
                    placeholder="e.g. 2"
                    value={filters.minBedrooms}
                    onChange={e => onChange({ ...filters, minBedrooms: e.target.value })}
                    className="w-24 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Commute */}
            <div>
              <p className="text-xs font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 mb-2">Max commute</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400 shrink-0">To uni</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      value={filters.maxUniMins}
                      onChange={e => onChange({ ...filters, maxUniMins: e.target.value })}
                      className="w-24 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-400">min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-gray-600 dark:text-gray-400 shrink-0">To work</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={filters.maxWorkMins}
                      onChange={e => onChange({ ...filters, maxWorkMins: e.target.value })}
                      className="w-24 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-400">min</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function PillDropdown<T extends string>({ value, options, onChange }: {
  value: T,
  options: { value: T; label: string }[],
  onChange: (v: T) => void,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative w-[140px]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-1.5 w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full px-3 py-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {selected?.label}
        <FontAwesomeIcon icon={faChevronDown} className={`w-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden w-full">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors ${o.value === value ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// main app
function App() {
  const [isAddFormDisplayed, toggleAddFormDisplay] = useState(false)
  const [isUpdateFormDisplayed, toggleUpdateFormDisplay] = useState(false)
  const [isDetailDisplayed, toggleDetailDisplay] = useState(false)
  const [currentEntry, setCurrentEntry] = useState("none")
  const [currentEntryData, setCurrentEntryData] = useState<Entry | null>(null)
  const [transitMode, setTransitMode] = useState<'pt' | 'drive'>('pt')
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'map'>('list')
  const [groupBy, setGroupBy] = useState<'none' | 'suburb' | 'uni' | 'work'>('none')
  const [importPrefill, setImportPrefill] = useState<ListingPrefill | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  // Handle ?import= param set by the Chrome extension
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('import')
    if (!raw) return
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(raw)))) as ListingPrefill
      setImportPrefill(data)
      toggleAddFormDisplay(true)
      window.history.replaceState({}, '', window.location.pathname)
    } catch { /* malformed param — ignore */ }
  }, [])

  const changeAddFormDisplay = () => {
    if (isAddFormDisplayed) setImportPrefill(null)
    toggleAddFormDisplay(!isAddFormDisplayed);
  };

  const changeUpdateFormDisplay = () => {
    toggleUpdateFormDisplay(!isUpdateFormDisplayed);
  };

  const openDetail = (entry: Entry) => {
    setCurrentEntryData(entry);
    setCurrentEntry(entry.id);
    toggleDetailDisplay(true);
  };

  const closeDetail = () => {
    toggleDetailDisplay(false);
  };

  const openEditFromDetail = () => {
    toggleDetailDisplay(false);
    toggleUpdateFormDisplay(true);
  };

  useTitle("Home Inspections")

  return (
    <>
    {
      isAddFormDisplayed ? (
        <AddEntryForm changeHandler={changeAddFormDisplay} initialPrefill={importPrefill} />
      ): isUpdateFormDisplayed ? (
        <UpdateEntryForm
          currentEntry={currentEntry}
          setCurrentEntry={(newEntry: string) => setCurrentEntry(newEntry)}
          changeHandler={changeUpdateFormDisplay}/>
      ): isDetailDisplayed && currentEntryData ? (
        <PropertyDetail
          entry={currentEntryData}
          onClose={closeDetail}
          onEdit={openEditFromDetail}
        />
      )
      : (<>
      <div className={`sticky top-0 z-20 px-4 py-3 transition-colors ${viewMode === 'map' ? '' : 'bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800'}`}>
        {/* Row 1: always visible */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-extrabold text-gray-900 ${viewMode !== 'map' ? 'dark:text-white' : ''}`}>HouseX</h1>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors rounded-lg"
              title="Refresh"
            >
              <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop-only controls */}
            {viewMode !== 'map' && (
              <>
              <div className="hidden md:block relative">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800 rounded-full pl-8 pr-3 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-48"
                />
              </div>
              <div className="hidden md:block"><FilterPanel filters={filters} onChange={setFilters} /></div>
              <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-0.5">
                <button
                  onClick={() => setTransitMode('pt')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${transitMode === 'pt' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >PT</button>
                <button
                  onClick={() => setTransitMode('drive')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${transitMode === 'drive' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >Drive</button>
              </div>
              <div className="hidden md:block">
                <PillDropdown
                  value={groupBy}
                  options={[
                    { value: 'none', label: 'No grouping' },
                    { value: 'suburb', label: 'Suburb' },
                    { value: 'uni', label: 'Uni proximity' },
                    { value: 'work', label: 'Work proximity' },
                  ]}
                  onChange={setGroupBy}
                />
              </div>
              </>
            )}
            {/* View toggle — always visible */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              ><FontAwesomeIcon icon={faTableCells} /></button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              ><FontAwesomeIcon icon={faList} /></button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              ><FontAwesomeIcon icon={faMap} /></button>
            </div>
            {/* Add button — rightmost */}
            <button
              onClick={changeAddFormDisplay}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold px-3 py-2.5 rounded-full shadow-sm transition-all"
            >
              <span className="text-sm leading-none">+</span>
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Row 2: mobile only */}
        {viewMode !== 'map' && (
          <div className="flex md:hidden items-center gap-2 mt-3">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-full pl-8 pr-3 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <FilterPanel filters={filters} onChange={setFilters} />
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 gap-0.5">
              <button
                onClick={() => setTransitMode('pt')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${transitMode === 'pt' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >PT</button>
              <button
                onClick={() => setTransitMode('drive')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${transitMode === 'drive' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >Drive</button>
            </div>
          </div>
        )}
      </div>
      {viewMode === 'map' ? (
        <MapView onCardClick={openDetail} />
      ) : (
        <div className="px-4 pt-4">
          <Table
            currentEntry={currentEntry}
            setCurrentEntry={(newEntry: string) => setCurrentEntry(newEntry)}
            changeHandler={changeUpdateFormDisplay}
            onCardClick={openDetail}
            transitMode={transitMode}
            viewMode={viewMode}
            refreshKey={refreshKey}
            groupBy={groupBy}
            search={search}
            filters={filters}
          />
        </div>
      )}

      </>)
    }
    </>
  )
}

export default App
