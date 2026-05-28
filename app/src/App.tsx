import { useEffect, useState } from 'react'
import './App.css'
import Table from './components/Table'
import MapView from './components/MapView'
import AddEntryForm from './components/AddEntry';
import UpdateEntryForm from './components/UpdateEntry';
import PropertyDetail from './components/PropertyDetail';
import { Entry } from './components/AddEntry';
import { ListingPrefill } from './utils/fetchListing';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableCells, faList, faMap, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';

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

// main app
function App() {
  const [isAddFormDisplayed, toggleAddFormDisplay] = useState(false)
  const [isUpdateFormDisplayed, toggleUpdateFormDisplay] = useState(false)
  const [isDetailDisplayed, toggleDetailDisplay] = useState(false)
  const [currentEntry, setCurrentEntry] = useState("none")
  const [currentEntryData, setCurrentEntryData] = useState<Entry | null>(null)
  const [transitMode, setTransitMode] = useState<'pt' | 'drive'>('pt')
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'map'>('list')
  const [importPrefill, setImportPrefill] = useState<ListingPrefill | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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
      <div className={`sticky top-0 z-20 px-4 py-4 transition-colors ${viewMode === 'map' ? '' : 'bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">HouseX</h1>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors rounded-lg"
              title="Refresh"
            >
              <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {viewMode !== 'map' && (
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
            )}
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
          </div>
        </div>
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
          />
        </div>
      )}
      {Button("Add entry", changeAddFormDisplay)}
      </>)
    }
    </>
  )
}

export default App
