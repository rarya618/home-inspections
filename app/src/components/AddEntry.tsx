import { FormEvent } from "react";
import { addEntry } from "../firebase/database";
import { Button, useTitle } from "../App";

type Field = {
  id: string,
  label: string,
  dataType?: string,
  placeholder?: string,
  isHidden?: boolean
}

export const formStyle = "bg-white dark:bg-black text-black dark:text-white rounded-md px-8 py-7 mt-0 mb-10 shadow"
export const textboxStyle = "relative text-sm bg-gray-100 text-black px-4 py-2 rounded right-0"
export const checkboxStyle = "mx-0 my-3 w-4 h-4 rounded"
export const labelStyle = "m-0 pr-5 py-2 w-32 text-left"

export const fields: Field[] = [
  {id: "address", label: "Address", placeholder: "Full address"},
  {id: "rent", label: "Rent", placeholder: "Weekly rent"},
  {id: "suburb", label: "Suburb", placeholder: "Suburb"},
  {id: "isInspected", label: "Inspected?", dataType: "checkbox"},
  {id: "uniPT", label: "Uni🚍", placeholder: "in minutes"},
  {id: "uniWalk", label: "Uni🚶", placeholder: "in minutes"},
  {id: "workPT", label: "Work🚍", placeholder: "in minutes"},
  {id: "workWalk", label: "Work🚶", placeholder: "in minutes"},
  {id: "miscPT", label: "Misc🚍", placeholder: "in minutes"},
  {id: "train", label: "🚍 station (min.)", placeholder: "in minutes"},
  {id: "coles", label: "Coles (min.)", placeholder: "in minutes"},
  {id: "woolies", label: "Woolies (min.)", placeholder: "in minutes"},
  {id: "aldi", label: "ALDI (min.)", placeholder: "in minutes"},
  {id: "7eleven", label: "7-eleven (min.)", placeholder: "in minutes"},
  {id: "gyg", label: "GYG (min.)", placeholder: "in minutes"},
  {id: "broadway", label: "Broadway (min.)", placeholder: "in minutes"},
  {id: "size", label: "Size offset", placeholder: "From -5 to 5"},
  {id: "convenience", label: "Offset", placeholder: "Offset"},
  {id: "isEnsuite", label: "Ensuite?", dataType: "checkbox"},
  {id: "isKitchenPrivate", label: "Private kitchen?", dataType: "checkbox"},
  {id: "isFurnished", label: "Furnished?", dataType: "checkbox"},
  {id: "isSharehouse", label: "Sharehouse?", dataType: "checkbox"},
  {id: "hasElectricity", label: "Electricity?", dataType: "checkbox"},
  {id: "hasWater", label: "Water?", dataType: "checkbox"},
  {id: "hasInternet", label: "Internet?", dataType: "checkbox"},
  {id: "isRented", label: "Rented?", dataType: "checkbox"}
]

export type Entry = {
  id: string,
  address: string,
  score: number,
  suburb?: string,
  "7eleven"?: string,
  aldi?: string, 
  broadway?: string,
  train?: string,
  coles?: string,
  convenience?: string,
  gyg?: string,
  hasElectricity?: boolean,
  hasInternet?: boolean,
  hasWater?: boolean,
  isEnsuite?: boolean,
  isKitchenPrivate?: boolean,
  isFurnished?: boolean,
  isRented?: boolean,
  isSharehouse?: boolean,
  isInspected?: boolean,
  miscPT?: string,
  rent: string,
  size?: string,
  uniPT?: string,
  uniWalk?: string,
  woolies?: string,
  workPT?: string,
  workWalk?: string
}

// sample entry to create dataset
export const sampleEntry: Entry = {id: "null", address: "sample", rent: "0", score: 0};

type FormProps = {
  changeHandler: () => void
}

// main form function
function AddEntryForm(props: FormProps) {
  
  // form submit operation
  const formSubmit = async (event: FormEvent) => {
		event.preventDefault();

		// @ts-ignore
		const elementsArray = [...event.target.elements];

		const data = elementsArray.reduce((acc, element) => {
			if (element.id) {
        if (element.type == "checkbox") {
  				acc[element.id] = element.checked;
        } else {
  				acc[element.id] = element.value;
        }
			}

			return acc;
		}, {});

    try {
      // check for required data
			if (data.address === '') throw("Cannot leave address blank")
      if (data.rent === '') throw("Cannot leave rent blank")
				
			await addEntry(data);

      // hide form after doc is added
      props.changeHandler();
		} catch (error) {
			// @ts-ignore
			alert(error);
		}
  }

	useTitle("Add Entry")


  return (
    <form className={formStyle} onSubmit={formSubmit}>
      <h2 className="mb-4 text-xl">New entry</h2>
      {fields.map(field => {
        return (
          <div className="my-2 flex w-full">
            <p className={labelStyle}>{field.label}</p>
            {field.dataType == "checkbox" ? 
              <input 
                className={checkboxStyle}
                id={field.id}
                type={field.dataType}
              /> : 
              <input 
                className={textboxStyle}
                placeholder={field.placeholder}
                id={field.id}
                type={field.dataType}
              />}
          </div>
        )
      })}
      {Button("Submit")}
    </form>
  )
}

export default AddEntryForm

