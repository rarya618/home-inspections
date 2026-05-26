import { FormEvent, useState } from "react";
import { addEntry } from "../firebase/database";
import { useTitle } from "../App";

type Field = {
  id: string,
  label: string,
  dataType?: string,
  placeholder?: string,
  isHidden?: boolean
}

export const formStyle = "bg-white dark:bg-black text-black dark:text-white rounded-md px-8 py-7 mt-0 mb-10 shadow"
export const textboxStyle = "relative text-sm bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded right-0 transition-colors"
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

export const sampleEntry: Entry = {id: "null", address: "sample", rent: "0", score: 0};

type FormProps = {
  changeHandler: () => void
}

function AddEntryForm(props: FormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

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
      if (data.address === '') throw("Cannot leave address blank")
      if (data.rent === '') throw("Cannot leave rent blank")
      setIsSubmitting(true);
      await addEntry(data);
      props.changeHandler();
    } catch (err) {
      // @ts-ignore
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  useTitle("Add Entry")

  return (
    <form className={formStyle} onSubmit={formSubmit}>
      <h2 className="mb-4 text-xl font-semibold">New entry</h2>
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
      {error && <p className="text-red-500 text-sm mb-3 px-1">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 px-8 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  )
}

export default AddEntryForm
