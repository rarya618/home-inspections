import { FormEvent, useEffect, useState } from "react";
import { getEntry, updateEntry } from "../firebase/database";
import { checkboxStyle, fields, formStyle, labelStyle, textboxStyle } from "./AddEntry";
import { useTitle } from "../App";

type FormProps = {
  currentEntry: string,
  setCurrentEntry: (newEntry: string) => void,
  changeHandler: () => void
}

function UpdateEntryForm(props: FormProps) {
  const [data, setData] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getData = async () => {
    let tempData = await getEntry(props.currentEntry)
    // @ts-ignore
    setData(tempData)
  }

  useEffect(() => {
    getData();
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
    <form className={formStyle} onSubmit={formSubmit}>
      <h2 className="mb-4 text-xl font-semibold">Update entry</h2>
      {fields.map(field => {
        return (
          <div className="my-2 flex w-full">
            <p className={labelStyle}>{field.label}</p>
            {field.dataType == "checkbox" ?
              <input
                className={checkboxStyle}
                id={field.id}
                type={field.dataType}
                // @ts-ignore
                defaultChecked={data[field.id]}
              /> :
              <input
                className={textboxStyle}
                placeholder={field.placeholder}
                id={field.id}
                type={field.dataType}
                // @ts-ignore
                defaultValue={data[field.id]}
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
        {isSubmitting ? "Updating..." : "Update"}
      </button>
    </form>
  )
}

export default UpdateEntryForm
