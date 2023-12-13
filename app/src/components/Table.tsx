type Cell = {
    text: string
}

function Table() {
    const firstHeader: Cell[] = [
        {text: "Address"},
        {text: "Weekly Rent"},
        {text: "PNR🚍"},
        {text: "PNR🚴"},
        {text: "PNR🚶"},
        {text: "Star🚍"},
        {text: "Star🚴"},
        {text: "Star🚶"},
        {text: "Parra🚍"},
        {text: "Parra🚴"},
        {text: "Groceries🚶"},
        {text: "Food"},
        {text: "Size"},
        {text: "Convenience"},
        {text: "Ensuite?"},
        {text: "Furnished?"},
        {text: "Sharehouse?"},
        {text: "Electricity?"},
        {text: "Water?"},
        {text: "Internet?"},
        {text: "Rented?"},
        {text: "Score"}
    ]

    const secondHeader: Cell[] = [
        {text: "🚍"},
        {text: "🚴"},
        {text: "🚶"},
    ]
    return (
        <div className="overflow-x-scroll w-full rounded scroll-smooth">
            <table className="table-auto rounded bordder-solid">
                <tr>
                    {firstHeader.map(headerCell => {
                        return <th className="bg-slate-200 text-indigo-500 px-10 py-3 border-solid border-1 border-white">{headerCell.text}</th>
                    })}
                </tr>
            </table>
        </div>
    )
}

export default Table