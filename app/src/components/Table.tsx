import { useEffect, useState } from "react"
import { fields, sampleEntry } from "./Form"
import { getHouseData } from "../firebase/database";

type Cell = {
    text: string
}

function Table() {
    const [data, setData] = useState([sampleEntry]);

    const getDataFromDb = async () => {
        let tempData = await getHouseData();
        console.log(tempData);
        setData(tempData);
    }

    // call function
	useEffect(() => {
		getDataFromDb();
	}, [])

    const firstHeader: Cell[] = [
        ...fields.map(field => {
            return {text: field.label}
        }),
        {text: "Score"}
    ]

    return (
        <div className="overflow-x-scroll w-full rounded scroll-smooth">
            <table className="table-auto rounded bordder-solid">
                <tr>
                    {firstHeader.map(headerCell => {
                        return <th className="bg-gray-200 dark:bg-black text-indigo-500 px-10 py-3 border-solid border-1 border-white">{headerCell.text}</th>
                    })}
                </tr>
                {data.map(entry => {
                    return (<tr>
                        {fields.map(field => {
                            // @ts-ignore
                            let cellData = entry[field.id];
                            if (typeof cellData == "boolean") {
                                if (cellData) {
                                    cellData = "True"
                                } else {
                                    cellData = "False"
                                }
                            }

                            if (cellData == "") {
                                cellData = "-"
                            }
                            return (<td>{cellData}</td>)
                        })}
                    </tr>)
                })}
            </table>
        </div>
    )
}

export default Table