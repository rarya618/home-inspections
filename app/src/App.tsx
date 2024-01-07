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
    className="px-2 pt-0 pb-0.5 mt-8 rounded-full bg-red-500 text-white fixed top-0 right-8 text-base"
    onClick={toggle}>
      ×
    </button>)
}

// button
export function Button(text: string, onclick?: () => void) {
  return (
    <button 
        className="px-8 py-2 rounded-md fixed bottom-10 right-10 bg-indigo-500 text-white"
        onClick={onclick}>{text}</button>
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
        <h3 className="text-left text-4xl mb-5">Dashboard</h3>
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
