function Table() {
    const cols = [
        "Address",
        "Weekly Rent",
        "Public Transport",
        "Cycling",
        "Walk",
        "Groceries (walk times)",
        "Food",
        "Size",
        "Convenience",
        "Ensuite?",
        "Furnished?",
        "Sharehouse?",
        "Bills",
        "Rented?"
    ]
    return (
        <>
            <table className="table-auto rounded">
                <tr>
                    {cols.map(col => {
                        return <th className="bg-indigo-500 px-10 py-2.5 text-white border-solid border-1 border-white">{col}</th>
                    })}
                </tr>
            </table>
        </>
    )
}

export default Table