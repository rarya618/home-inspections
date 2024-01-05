import { FormEvent, useState } from "react";
import { submitHouseData } from "../firebase/database";

type Field = {
  id: string,
  label: string,
  dataType?: string,
  placeholder?: string,
}

export const blankField: Field = {id: "null", label: "sample"};

export const fields: Field[] = [
  {id: "address", label: "Address", placeholder: "Enter the address"},
  {id: "rent", label: "Rent", placeholder: "Enter the weekly rent"},
  {id: "uniPT", label: "PNR🚍", placeholder: "in minutes"},
  {id: "uniWalk", label: "PNR🚶", placeholder: "in minutes"},
  {id: "workPT", label: "Star🚍", placeholder: "in minutes"},
  {id: "workWalk", label: "Star🚶", placeholder: "in minutes"},
  {id: "miscPT", label: "Parra🚍", placeholder: "in minutes"},
  {id: "coles", label: "Coles🚶", placeholder: "in minutes"},
  {id: "woolies", label: "Woolies🚶", placeholder: "in minutes"},
  {id: "aldi", label: "ALDI🚶", placeholder: "in minutes"},
  {id: "7eleven", label: "7-eleven🚶", placeholder: "in minutes"},
  {id: "gyg", label: "GYG", placeholder: "in minutes"},
  {id: "broadway", label: "Broadway", placeholder: "in minutes"},
  {id: "size", label: "Size", placeholder: "rating out of 5"},
  {id: "convenience", label: "Convenience", placeholder: "rating out of 5"},
  {id: "isEnsuite", label: "Ensuite?", dataType: "checkbox"},
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
  "7eleven"?: string,
  aldi?: string, 
  broadway?: string,
  coles?: string,
  convenience?: string,
  gyg?: string,
  hasElectricity?: boolean,
  hasInternet?: boolean,
  hasWater?: boolean,
  isEnsuite?: boolean,
  isFurnished?: boolean,
  isRented?: boolean,
  isSharehouse?: boolean,
  miscPT?: string,
  rent: string,
  size?: string,
  uniPT?: string,
  uniWalk?: string,
  woolies?: string,
  workPT?: string,
  workWalk?: string
}

export const sampleEntry: Entry = {id: "null", address: "sample", rent: "0"};

type Props = {
  changeHandler: () => void
}

function Form(props: Props) {
  
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
			if (data.address === '') throw("Please enter an address")
			if (data.rent === '') throw("Please enter rent")
				
			await submitHouseData(data);
      props.changeHandler();
		}
		catch (error) {
			// @ts-ignore
			alert(error);
		}
  }

  return (
    <form className="bg-white dark:bg-black text-black dark:text-white rounded-md px-8 py-7 shadow" onSubmit={formSubmit}>
      <h2 className="mb-4 text-xl">New entry</h2>
      {fields.map(field => {
        return (
          <div className="my-2 flex w-full">
            <p className="m-0 pr-5 py-2 w-28 text-left">{field.label}</p>
            {field.dataType == "checkbox" ? 
              <input 
                className="mx-0 my-3 w-4 h-4 rounded"
                id={field.id}
                type={field.dataType}
              /> : 
              <input 
                className="relative bg-gray-100 text-black px-4 py-2 rounded right-0"
                placeholder={field.placeholder}
                id={field.id}
                type={field.dataType}
              />}
          </div>
        )
      })}
      <button 
        className="px-10 py-2.5 mt-8 mb-3 rounded bg-indigo-500 text-white flex"
      >Submit</button>
    </form>
  )
}

export default Form

