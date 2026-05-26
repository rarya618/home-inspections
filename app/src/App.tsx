import { useEffect, useState } from 'react'
import './App.css'
import Table from './components/Table'
import AddEntryForm from './components/AddEntry';
import UpdateEntryForm from './components/UpdateEntry';

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

// close button
const closeButton = (toggle: () => void) => {
  return (<button 
    className="px-2 pt-0 pb-0.5 mt-8 rounded-full bg-red-500 hover:bg-red-600 text-white fixed top-0 right-8 text-base transition-colors"
    onClick={toggle}>
      ×
    </button>)
}

// button
export function Button(text: string, onclick?: () => void) {
  return (
    <button
      className="fixed bottom-8 right-8 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-150"
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
  const [currentEntry, setCurrentEntry] = useState("none")

  const changeAddFormDisplay = () => {
    toggleAddFormDisplay(!isAddFormDisplayed);
  };

  const changeUpdateFormDisplay = () => {
    toggleUpdateFormDisplay(!isUpdateFormDisplayed);
  };

  useTitle("Home Inspections")
  
  return (
    <>
    {
      isAddFormDisplayed ? (
        <div className="flex flex-col h-screen pb-5 items-center">
          <AddEntryForm changeHandler={changeAddFormDisplay}/>
          {closeButton(changeAddFormDisplay)}
        </div>
      ): isUpdateFormDisplayed ? (
        <div className="flex flex-col h-screen pb-5 items-center">
          <UpdateEntryForm 
            currentEntry={currentEntry} 
            setCurrentEntry={(newEntry: string) => setCurrentEntry(newEntry)} 
            changeHandler={changeUpdateFormDisplay}/>
          {closeButton(changeUpdateFormDisplay)}
        </div>
      )
      : (<>
      <div className="mx-2 my-2.5">
        <h3 className="text-left text-3xl mb-5 font-bold">Dashboard</h3>
        <Table 
          currentEntry={currentEntry}
          setCurrentEntry={(newEntry: string) => setCurrentEntry(newEntry)} 
          changeHandler={changeUpdateFormDisplay}
        />
      </div>
      {Button("Add entry", changeAddFormDisplay)}
      </>)
    }
    </>
  )
}

export default App
