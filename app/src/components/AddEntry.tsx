import { FormEvent, useState } from "react";
import { addEntry } from "../firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useTitle } from "../App";

type Field = {
  id: string,
  label: string,
  dataType?: string,
  placeholder?: string,
  isHidden?: boolean
}

// kept for UpdateEntry.tsx compatibility
export const formStyle = ""
export const textboxStyle = "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-white"
export const checkboxStyle = "sr-only peer"
export const labelStyle = "block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5"

export const fields: Field[] = [
  {id: "address", label: "Address", placeholder: "Full address"},
  {id: "rent", label: "Rent", placeholder: "Weekly rent"},
  {id: "suburb", label: "Suburb", placeholder: "Suburb"},
  {id: "isInspected", label: "Inspected?", dataType: "checkbox"},
  {id: "uniPT", label: "Uni🚍", placeholder: "in minutes"},
  {id: "uniWalk", label: "Uni🚶", placeholder: "in minutes"},
  {id: "workPT", label: "Work🚍", placeholder: "in minutes"},
  {id: "workWalk", label: "Work🚶", placeholder: "in minutes"},

  {id: "trainWalk", label: "Train station 🚶", placeholder: "in minutes"},
  {id: "trainPT", label: "Train station 🚍", placeholder: "in minutes"},
  {id: "trainDrive", label: "Train station 🚗", placeholder: "in minutes"},
  {id: "coles", label: "Coles (min.)", placeholder: "in minutes"},
  {id: "woolies", label: "Woolies (min.)", placeholder: "in minutes"},
  {id: "aldi", label: "ALDI (min.)", placeholder: "in minutes"},

  {id: "gyg", label: "GYG (min.)", placeholder: "in minutes"},
  {id: "shoppingCenter", label: "Shopping centre (min.)", placeholder: "in minutes"},
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
  bedrooms?: string,
  bathrooms?: string,
  carParks?: string,

  aldi?: string,
  shoppingCenter?: string,
  trainWalk?: string,
  trainPT?: string,
  trainDrive?: string,
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
  hasAirCon?: boolean,
  isPetsAllowed?: boolean,
  uniDrive?: string,
  workDrive?: string,
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-600 mb-3">{children}</h3>
  );
}

function TextInput({ id, label, placeholder }: { id: string, label: string, placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelStyle}>{label}</label>
      <input
        id={id}
        placeholder={placeholder}
        className={textboxStyle}
      />
    </div>
  );
}

function Toggle({ id, label }: { id: string, label: string }) {
  return (
    <label htmlFor={id} className="flex items-center justify-between px-4 py-3 cursor-pointer select-none">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      <div className="relative shrink-0 ml-4">
        <input type="checkbox" id={id} className="sr-only peer" />
        <div className="w-10 h-6 rounded-full bg-gray-200 dark:bg-gray-700 peer-checked:bg-indigo-500 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 pointer-events-none" />
      </div>
    </label>
  );
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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={props.changeHandler}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Back
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white">New entry</h1>
        <div className="w-14" />
      </div>

      <form onSubmit={formSubmit} className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-8">

        {/* Property */}
        <section>
          <SectionTitle>Property</SectionTitle>
          <div className="space-y-3">
            <TextInput id="address" label="Address" placeholder="Full address" />
            <div className="grid grid-cols-2 gap-3">
              <TextInput id="rent" label="Weekly rent ($)" placeholder="380" />
              <TextInput id="suburb" label="Suburb" placeholder="Surry Hills" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <TextInput id="bedrooms" label="Bedrooms" placeholder="2" />
              <TextInput id="bathrooms" label="Bathrooms" placeholder="1" />
              <TextInput id="carParks" label="Car parks" placeholder="0" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <SectionTitle>Features</SectionTitle>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            <Toggle id="isInspected" label="Inspected" />
            <Toggle id="isEnsuite" label="Ensuite bathroom" />
            <Toggle id="isKitchenPrivate" label="Private kitchen" />
            <Toggle id="isFurnished" label="Furnished" />
            <Toggle id="isSharehouse" label="Sharehouse" />
            <Toggle id="hasAirCon" label="Air conditioning" />
            <Toggle id="isPetsAllowed" label="Pets allowed" />
            <Toggle id="isRented" label="Already rented" />
          </div>
        </section>

        {/* Utilities */}
        <section>
          <SectionTitle>Utilities included</SectionTitle>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            <Toggle id="hasElectricity" label="Electricity" />
            <Toggle id="hasWater" label="Water" />
            <Toggle id="hasInternet" label="Internet" />
          </div>
        </section>

        {/* Transit */}
        <section>
          <SectionTitle>Transit (minutes)</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="uniPT" label="Uni — bus / train" placeholder="0" />
            <TextInput id="uniWalk" label="Uni — walking" placeholder="0" />
            <TextInput id="uniDrive" label="Uni — driving" placeholder="0" />
            <TextInput id="workPT" label="Work — bus / train" placeholder="0" />
            <TextInput id="workWalk" label="Work — walking" placeholder="0" />
            <TextInput id="workDrive" label="Work — driving" placeholder="0" />
            <TextInput id="trainWalk" label="Train station — walking" placeholder="0" />
            <TextInput id="trainPT" label="Train station — bus / train" placeholder="0" />
            <TextInput id="trainDrive" label="Train station — driving" placeholder="0" />
          </div>
        </section>

        {/* Nearby */}
        <section>
          <SectionTitle>Nearby (minutes)</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="coles" label="Coles" placeholder="0" />
            <TextInput id="woolies" label="Woolworths" placeholder="0" />
            <TextInput id="aldi" label="ALDI" placeholder="0" />

            <TextInput id="gyg" label="GYG" placeholder="0" />
            <TextInput id="shoppingCenter" label="Shopping centre" placeholder="0" />
          </div>
        </section>

        {/* Adjustments */}
        <section>
          <SectionTitle>Score adjustments</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="size" label="Size offset" placeholder="-5 to 5" />
            <TextInput id="convenience" label="Convenience" placeholder="-5 to 5" />
          </div>
        </section>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
        >
          {isSubmitting ? "Saving..." : "Save entry"}
        </button>

      </form>
    </div>
  )
}

export default AddEntryForm
