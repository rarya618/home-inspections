type FormInput = {
    label: string,
    dataType?: string,
    placeholder?: string,
}

const formInputs: FormInput[] = [
    {label: "Address", placeholder: "Enter the address"},
    {label: "Weekly Rent"},
    {label: "PNR🚍"},
    {label: "PNR🚴"},
    {label: "PNR🚶"},
    {label: "Star🚍"},
    {label: "Star🚴"},
    {label: "Star🚶"},
    {label: "Parra🚍"},
    {label: "Parra🚴"},
    {label: "Groceries🚶"},
    {label: "Food"},
    {label: "Size"},
    {label: "Convenience"},
    {label: "Ensuite?"},
    {label: "Furnished?", dataType: "checkbox"},
    {label: "Sharehouse?"},
    {label: "Electricity?"},
    {label: "Water?"},
    {label: "Internet?"},
    {label: "Rented?"}
]
function Form() {
    return (
        <div className="flex h-96">
        <form className="overflow-y-scroll bg-white text-black rounded px-8 py-5">
            {formInputs.map(formInput => {
                return (
                    <div className="my-2 flex w-full">
                        <p className="m-0 pr-5 py-2">{formInput.label}</p>
                        {formInput.dataType == "checkbox" ? 
                        <input 
                            className="mx-0 my-3"
                            type={formInput.dataType}
                        /> : 
                        <input 
                            className="relative bg-slate-200 text-black px-4 py-2 rounded right-0"
                            placeholder={formInput.placeholder}
                            type={formInput.dataType}
                        />}
                    </div>
                )
            })}
        </form>
        </div>
    )
}

export default Form

