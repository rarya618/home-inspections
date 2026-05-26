import { FormEvent, useEffect, useState } from "react";
import { getEntry, updateEntry } from "../firebase/database";
import { labelStyle, textboxStyle } from "./AddEntry";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useTitle } from "../App";

type FormProps = {
  currentEntry: string,
  setCurrentEntry: (newEntry: string) => void,
  changeHandler: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-600 mb-3">{children}</h3>
  );
}

function TextInput({ id, label, placeholder, defaultValue }: {
  id: string, label: string, placeholder?: string, defaultValue?: string
}) {
  return (
    <div>
      <label htmlFor={id} className={labelStyle}>{label}</label>
      <input
        id={id}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={textboxStyle}
      />
    </div>
  );
}

function Toggle({ id, label, defaultChecked }: { id: string, label: string, defaultChecked?: boolean }) {
  return (
    <label htmlFor={id} className="flex items-center justify-between px-4 py-3 cursor-pointer select-none">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      <div className="relative shrink-0 ml-4">
        <input type="checkbox" id={id} defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-10 h-6 rounded-full bg-gray-200 dark:bg-gray-700 peer-checked:bg-indigo-500 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 pointer-events-none" />
      </div>
    </label>
  );
}

function UpdateEntryForm(props: FormProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getEntry(props.currentEntry).then(tempData => {
      setData(tempData as Record<string, any>);
      setIsLoading(false);
    });
  }, [])

  const formSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // @ts-ignore
    const elementsArray = [...event.target.elements];

    const formData = elementsArray.reduce((acc, element) => {
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
      if (formData.address === '') throw("Cannot leave address blank")
      if (formData.rent === '') throw("Cannot leave rent blank")
      setIsSubmitting(true);
      await updateEntry(props.currentEntry, formData);
      props.changeHandler();
    } catch (err) {
      // @ts-ignore
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  useTitle("Update Entry")

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
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Edit entry</h1>
        <div className="w-14" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-indigo-500">
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : (
        <form onSubmit={formSubmit} className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-8">

          {/* Property */}
          <section>
            <SectionTitle>Property</SectionTitle>
            <div className="space-y-3">
              <TextInput id="address" label="Address" placeholder="Full address" defaultValue={data.address} />
              <div className="grid grid-cols-2 gap-3">
                <TextInput id="rent" label="Weekly rent ($)" placeholder="380" defaultValue={data.rent} />
                <TextInput id="suburb" label="Suburb" placeholder="Surry Hills" defaultValue={data.suburb} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <TextInput id="bedrooms" label="Bedrooms" placeholder="2" defaultValue={data.bedrooms} />
                <TextInput id="bathrooms" label="Bathrooms" placeholder="1" defaultValue={data.bathrooms} />
                <TextInput id="carParks" label="Car parks" placeholder="0" defaultValue={data.carParks} />
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <SectionTitle>Features</SectionTitle>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              <Toggle id="isInspected" label="Inspected" defaultChecked={data.isInspected} />
              <Toggle id="isEnsuite" label="Ensuite bathroom" defaultChecked={data.isEnsuite} />
              <Toggle id="isKitchenPrivate" label="Private kitchen" defaultChecked={data.isKitchenPrivate} />
              <Toggle id="isFurnished" label="Furnished" defaultChecked={data.isFurnished} />
              <Toggle id="isSharehouse" label="Sharehouse" defaultChecked={data.isSharehouse} />
              <Toggle id="isRented" label="Already rented" defaultChecked={data.isRented} />
            </div>
          </section>

          {/* Utilities */}
          <section>
            <SectionTitle>Utilities included</SectionTitle>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              <Toggle id="hasElectricity" label="Electricity" defaultChecked={data.hasElectricity} />
              <Toggle id="hasWater" label="Water" defaultChecked={data.hasWater} />
              <Toggle id="hasInternet" label="Internet" defaultChecked={data.hasInternet} />
            </div>
          </section>

          {/* Transit */}
          <section>
            <SectionTitle>Transit (minutes)</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <TextInput id="uniPT" label="Uni — bus / train" placeholder="0" defaultValue={data.uniPT} />
              <TextInput id="uniWalk" label="Uni — walking" placeholder="0" defaultValue={data.uniWalk} />
              <TextInput id="workPT" label="Work — bus / train" placeholder="0" defaultValue={data.workPT} />
              <TextInput id="workWalk" label="Work — walking" placeholder="0" defaultValue={data.workWalk} />
              <TextInput id="miscPT" label="Misc transit" placeholder="0" defaultValue={data.miscPT} />
              <TextInput id="train" label="Train station" placeholder="0" defaultValue={data.train} />
            </div>
          </section>

          {/* Nearby */}
          <section>
            <SectionTitle>Nearby (minutes)</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <TextInput id="coles" label="Coles" placeholder="0" defaultValue={data.coles} />
              <TextInput id="woolies" label="Woolworths" placeholder="0" defaultValue={data.woolies} />
              <TextInput id="aldi" label="ALDI" placeholder="0" defaultValue={data.aldi} />
              <TextInput id="7eleven" label="7-Eleven" placeholder="0" defaultValue={data["7eleven"]} />
              <TextInput id="gyg" label="GYG" placeholder="0" defaultValue={data.gyg} />
              <TextInput id="broadway" label="Broadway" placeholder="0" defaultValue={data.broadway} />
            </div>
          </section>

          {/* Adjustments */}
          <section>
            <SectionTitle>Score adjustments</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <TextInput id="size" label="Size offset" placeholder="-5 to 5" defaultValue={data.size} />
              <TextInput id="convenience" label="Convenience" placeholder="-5 to 5" defaultValue={data.convenience} />
            </div>
          </section>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>

        </form>
      )}
    </div>
  )
}

export default UpdateEntryForm
