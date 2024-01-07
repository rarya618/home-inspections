import { FormEvent, useEffect, useState } from "react";
import { getEntry, updateEntry } from "../firebase/database";
import { checkboxStyle, fields, labelStyle, textboxStyle } from "./AddEntry";
import { Button, useTitle } from "../App";

type FormProps = {
  currentEntry: string,
  setCurrentEntry: (newEntry: string) => void,
  changeHandler: () => void
}

function UpdateEntryForm(props: FormProps) {
	const [data, setData] = useState({});

  // get data
  const getData = async () => {
    let tempData = await getEntry(props.currentEntry)

    // @ts-ignore
    setData(tempData)
  }

  // call function
	useEffect(() => {
		getData();
	}, [])

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
          
      await updateEntry(props.currentEntry, data);

      // hide form after doc is added
      props.changeHandler();
    } catch (error) {
      // @ts-ignore
      alert(error);
    }
  }

  useTitle("Update Entry")

  return (
    <form className="bg-white dark:bg-black text-black dark:text-white rounded-md px-8 py-7 shadow" onSubmit={formSubmit}>
      <h2 className="mb-4 text-xl">Update entry</h2>
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
      {Button("Update")}
    </form>
  )
}

export default UpdateEntryForm
