import { useEffect, useState } from "react"
import { sampleEntry, Entry } from "./AddEntry"
import { getHouseEntries, deleteEntry } from "../firebase/database";
import { calculateScore } from "./Score";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useTitle } from "../App";

type Props = {
  currentEntry: string,
  setCurrentEntry: (newEntry: string) => void,
  changeHandler: () => void
}

const getScoreMeta = (score: number) => {
  if (score >= 1000) return {
    bg: "bg-emerald-500",
    text: "text-white",
    ring: "ring-emerald-400/30",
  };
  if (score >= 0) return {
    bg: "bg-amber-400",
    text: "text-amber-950",
    ring: "ring-amber-300/30",
  };
  return {
    bg: "bg-red-500",
    text: "text-white",
    ring: "ring-red-400/30",
  };
};

function Chip({ label, active, color = "default" }: { label: string, active: boolean, color?: "default" | "green" | "red" }) {
  if (!active) return null;
  const colorClass =
    color === "green" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
    color === "red"   ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" :
                        "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300";
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string, value: string | undefined }) {
  if (!value || value === "0" || value === "") return null;
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{label}</span>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 tabular-nums">{value}m</span>
    </div>
  );
}

function PropertyCard({ entry, onEdit, onDelete }: {
  entry: Entry,
  onEdit: () => void,
  onDelete: () => void,
}) {
  const score = entry.score ?? calculateScore(entry);
  const scoreMeta = getScoreMeta(score);

  const hasAnyTransit = entry.uniPT || entry.uniWalk || entry.workPT || entry.workWalk || entry.miscPT || entry.train;
  const hasAnyGrocery = entry.coles || entry.woolies || entry.aldi || entry["7eleven"];
  const hasAnyUtil = entry.hasElectricity || entry.hasWater || entry.hasInternet;

  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">

      {/* Score badge */}
      <div className="absolute top-4 right-4">
        <div className={`${scoreMeta.bg} ${scoreMeta.text} ${scoreMeta.ring} ring-4 w-14 h-14 rounded-full flex items-center justify-center`}>
          <span className="text-sm font-bold leading-none tabular-nums">{score}</span>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 pr-20">
        {entry.isInspected && (
          <span className="inline-block text-xs font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 uppercase mb-2">
            ✓ Inspected
          </span>
        )}
        <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{entry.address || "—"}</h2>
        {entry.suburb && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{entry.suburb}</p>
        )}
      </div>

      {/* Rent */}
      <div className="px-5 pb-4">
        <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
          ${entry.rent}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">/wk</span>
      </div>

      {/* Feature chips */}
      <div className="px-5 pb-4 flex flex-wrap gap-1.5">
        <Chip label="Ensuite" active={!!entry.isEnsuite} color="green" />
        <Chip label="Private Kitchen" active={!!entry.isKitchenPrivate} color="green" />
        <Chip label="Furnished" active={!!entry.isFurnished} color="green" />
        <Chip label="Sharehouse" active={!!entry.isSharehouse} color="red" />
        {hasAnyUtil && (
          <>
            <Chip label="⚡ Electricity" active={!!entry.hasElectricity} />
            <Chip label="💧 Water" active={!!entry.hasWater} />
            <Chip label="📶 Internet" active={!!entry.hasInternet} />
          </>
        )}
      </div>

      {/* Transit stats */}
      {hasAnyTransit && (
        <div className="px-5 pb-4 border-t border-gray-50 dark:border-gray-800 pt-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Transit</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <Stat label="🚍 Uni" value={entry.uniPT} />
            <Stat label="🚶 Uni" value={entry.uniWalk} />
            <Stat label="🚍 Work" value={entry.workPT} />
            <Stat label="🚶 Work" value={entry.workWalk} />
            <Stat label="🚍 Misc" value={entry.miscPT} />
            <Stat label="🚉 Train" value={entry.train} />
          </div>
        </div>
      )}

      {/* Grocery stats */}
      {hasAnyGrocery && (
        <div className="px-5 pb-4 border-t border-gray-50 dark:border-gray-800 pt-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Nearby</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <Stat label="Coles" value={entry.coles} />
            <Stat label="Woolies" value={entry.woolies} />
            <Stat label="ALDI" value={entry.aldi} />
            <Stat label="7-Eleven" value={entry["7eleven"]} />
            <Stat label="GYG" value={entry.gyg} />
            <Stat label="Broadway" value={entry.broadway} />
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <FontAwesomeIcon icon={faTrash} className="text-xs" />
          Delete
        </button>
      </div>
    </div>
  );
}

function Table(props: Props) {
  const [data, setData] = useState([sampleEntry]);
  const [isLoading, setIsLoading] = useState(true);

  const getDataFromDb = async () => {
    setIsLoading(true);
    let tempData = await getHouseEntries();
    setData(tempData);
    setIsLoading(false);
  }

  useEffect(() => {
    getDataFromDb();
  }, [])

  useTitle("Dashboard")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-indigo-500">
        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    )
  }

  const visibleEntries = [...data]
    .filter(e => !e.isRented)
    .sort((a, b) => (b.score ?? calculateScore(b)) - (a.score ?? calculateScore(a)));

  if (visibleEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
        <p className="text-lg font-medium">No properties yet</p>
        <p className="text-sm mt-1">Click "Add entry" to get started.</p>
      </div>
    )
  }

  const handleEdit = (entryId: string) => {
    props.setCurrentEntry(entryId);
    props.changeHandler();
  }

  const handleDelete = async (entryId: string) => {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    await deleteEntry(entryId);
    await getDataFromDb();
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
      {visibleEntries.map(entry => (
        <PropertyCard
          key={entry.id}
          entry={entry}
          onEdit={() => handleEdit(entry.id)}
          onDelete={() => handleDelete(entry.id)}
        />
      ))}
    </div>
  )
}

export default Table
