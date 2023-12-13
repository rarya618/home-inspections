import { useState } from 'react'
import './App.css'
import Table from './components/Table'
import Form from './components/Form';

function App() {
  const [isFormDisplayed, toggleFormDisplay] = useState(false)

  const handleChange = () => {
    toggleFormDisplay(!isFormDisplayed);
  };

  return (
    <>
    {
      !isFormDisplayed ? null :(
      <div className="absolute items-center h-auto ">
        <Form />
        <button 
          className="px-10 py-2.5 mt-8 rounded bg-indigo-500 text-white"
          onClick={handleChange}>Close</button>
      </div>)
    }
    <div className="mx-2 my-2.5">
      <h3 className="text-left text-4xl mb-5">Home Inspections</h3>
      <Table />
    </div>
    <button 
      className="px-10 py-2.5 rounded fixed bottom-10 right-10 bg-indigo-500 text-white"
      onClick={handleChange}>Add entry</button>
    </>
  )
}

export default App
