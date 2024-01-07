import { useEffect, useState } from "react"
import { fields, sampleEntry } from "./AddEntry"
import { getHouseEntries } from "../firebase/database";
import { calculateScore } from "./Score";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTitle } from "../App";

type HeaderCell = {
	id: string,
	text: string,
	isHidden: boolean
}

type Props = {
  currentEntry: string,
  setCurrentEntry: (newEntry: string) => void,
  changeHandler: () => void
}

function Table(props: Props) {
	const [data, setData] = useState([sampleEntry]);

	const getDataFromDb = async () => {
		let tempData = await getHouseEntries();
		setData(tempData);
	}

	// call function
	useEffect(() => {
		getDataFromDb();
	}, [])

	const showUpdateView = (event: Event, entryId: string) => {
		event.preventDefault()

		props.setCurrentEntry(entryId)
		props.changeHandler()
	}

	const showDeleteView = (event: Event) => {
		event.preventDefault()
	}

	const options = [
		{id: "update", icon: faPenToSquare, text: "Update", onClick: showUpdateView},
		{id: "delete", icon: faTrash, text: "Delete", onClick: showDeleteView},
	]

	const headerCells: HeaderCell[] = [
		{id: "options", text: "", isHidden: false},
		{id: "score", text: "Score", isHidden: false},
		...fields.map(field => {
				return {id: field.id, text: field.label, isHidden: field.isHidden ? true : false}
		})
	]

	useTitle("Dashboard")

	return (
		<div className="overflow-x-scroll w-full rounded scroll-smooth">
			<table className="rounded border-solid">
				<tr>
					{headerCells.map(headerCell => {
						if (headerCell.isHidden) {
							return
						}
						return <th className={"bg-gray-200 dark:bg-black text-indigo-500 px-10 py-3 " + (headerCell.id == "address" ? "w-96 " : "") + "border-solid border-1 border-white"}>{headerCell.text}</th>
					})}
				</tr>
				{[...data].sort((a, b) => parseInt(a.rent) - parseInt(b.rent)).map(entry => {
						return (<tr>
							{headerCells.map(headerCell => {
								if (headerCell.isHidden) {
									return
								}
								let cellData: string = "";
								if (headerCell.id == "score") {
									cellData = calculateScore(entry).toString();
								} else if (headerCell.id == "options") {
									return (
										<td>
											{options.map(option => {
												return (
												<button 
													className="bg-gray-100 rounded-md px-2 py-1 m-1"
													onClick={
														(option.id == "update") 
														// @ts-ignore
														? (event => option.onClick(event, entry.id))
														: (() => option.onClick)

													}
												>
													<FontAwesomeIcon icon={option.icon} />
												</button>)
											})
											}
										</td>
									)
								} else {
									// @ts-ignore
									cellData = entry[headerCell.id];
									if (typeof cellData == "boolean") {
										if (cellData) {
											cellData = "Yes"
										} else {
											cellData = "No"
										}
									}

									if (cellData == "") {
										cellData = "-"
									}
								}

								return (<td className="px-10 py-3">{cellData}</td>)
							})}
						</tr>)
				})}
			</table>
		</div>
	)
}

export default Table