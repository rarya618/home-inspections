import { FormEvent, useEffect, useState } from "react";
import { getEntry, updateEntry, refreshTransitTimes } from "../firebase/database";
import { TransitTimes } from "../utils/maps";
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
    <h3 className="text-xs font-bold tracking-tight uppercase text-gray-400 dark:text-gray-600 mb-3">{children}</h3>
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefreshTransit = async () => {
    const address = (document.getElementById('address') as HTMLInputElement)?.value || data.address;
    if (!address) return;
    setIsRefreshing(true);
    try {
      const times = await refreshTransitTimes(props.currentEntry, address);
      setData(prev => ({ ...prev, ...times }));
    } finally {
      setIsRefreshing(false);
    }
  };

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
              <TextInput id="listing" label="Listing URL" placeholder="https://..." defaultValue={data.listing} />
              <TextInput id="rent" label="Weekly rent ($)" placeholder="380" defaultValue={data.rent} />
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
              <Toggle id="isKitchenPrivate" label="Private kitchen" defaultChecked={data.isKitchenPrivate} />
              <Toggle id="isFurnished" label="Furnished" defaultChecked={data.isFurnished} />
              <Toggle id="hasAirCon" label="Air conditioning" defaultChecked={data.hasAirCon} />
              <Toggle id="isPetsAllowed" label="Pets allowed" defaultChecked={data.isPetsAllowed} />
              <Toggle id="hasGarage" label="Garage" defaultChecked={data.hasGarage} />
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
            <SectionTitle>Transit &amp; nearby</SectionTitle>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
              {([
                'uniPT','uniWalk','uniDrive','workPT','workWalk','workDrive',
                'trainWalk','trainPT','trainDrive',
                'coles','woolies','aldi','gyg','shoppingCenter',
              ] as (keyof TransitTimes)[]).some(k => data[k]) ? (
                <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs mb-1">
                  {[
                    { key: 'uniPT',          label: 'Uni 🚍' },
                    { key: 'uniDrive',        label: 'Uni 🚗' },
                    { key: 'workPT',          label: 'Work 🚍' },
                    { key: 'workDrive',       label: 'Work 🚗' },
                    { key: 'trainWalk',       label: 'Train 🚶' },
                    { key: 'trainPT',         label: 'Train 🚍' },
                    { key: 'trainDrive',      label: 'Train 🚗' },
                    { key: 'coles',           label: 'Coles 🛒' },
                    { key: 'woolies',         label: 'Woolies 🛒' },
                    { key: 'aldi',            label: 'ALDI 🛒' },
                    { key: 'gyg',             label: 'GYG 🌮' },
                    { key: 'shoppingCenter',  label: 'Mall 🏬' },
                  ].map(({ key, label }) => data[key] ? (
                    <div key={key}>
                      <span className="text-gray-400 dark:text-gray-500">{label} </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">{data[key]}m</span>
                    </div>
                  ) : null)}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">No times fetched yet.</p>
              )}
              <button
                type="button"
                onClick={handleRefreshTransit}
                disabled={isRefreshing}
                className="w-full py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRefreshing ? 'Fetching times…' : 'Refresh travel times'}
              </button>
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
