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
  changeHandler: () => void,
  onCardClick: (entry: Entry) => void,
  transitMode: 'pt' | 'drive',
}

const getScoreMeta = (score: number) => {
  if (score >= 800) return {
    border: "border-l-emerald-500",
    scoreText: "text-emerald-600 dark:text-emerald-400",
    scoreBg: "bg-emerald-50 dark:bg-emerald-950/60",
  };
  if (score >= 650) return {
    border: "border-l-teal-500",
    scoreText: "text-teal-600 dark:text-teal-400",
    scoreBg: "bg-teal-50 dark:bg-teal-950/60",
  };
  if (score >= 450) return {
    border: "border-l-sky-500",
    scoreText: "text-sky-600 dark:text-sky-400",
    scoreBg: "bg-sky-50 dark:bg-sky-950/60",
  };
  if (score >= 300) return {
    border: "border-l-amber-400",
    scoreText: "text-amber-600 dark:text-amber-400",
    scoreBg: "bg-amber-50 dark:bg-amber-950/60",
  };
  if (score >= 0) return {
    border: "border-l-orange-400",
    scoreText: "text-orange-600 dark:text-orange-400",
    scoreBg: "bg-orange-50 dark:bg-orange-950/60",
  };
  return {
    border: "border-l-red-500",
    scoreText: "text-red-600 dark:text-red-400",
    scoreBg: "bg-red-50 dark:bg-red-950/60",
  };
};

function PropertyCard({ entry, onEdit, onDelete, onClick, transitMode }: {
  entry: Entry,
  onEdit: () => void,
  onDelete: () => void,
  onClick: () => void,
  transitMode: 'pt' | 'drive',
}) {
  const score = entry.score ?? calculateScore(entry);
  const meta = getScoreMeta(score);

  // Build a compact feature dot row — only show what's present
  const features: string[] = [];
  if (entry.isInspected)      features.push("✓");
  if (entry.isEnsuite)        features.push("🚿");
  if (entry.isKitchenPrivate) features.push("🍳");
  if (entry.isFurnished)      features.push("🛋️");
  if (entry.isSharehouse)     features.push("👥");
  if (entry.hasAirCon)        features.push("❄️");
  if (entry.isPetsAllowed)    features.push("🐾");
  if (entry.hasGarage)        features.push("🏠");
  if (entry.hasInternet)      features.push("📶");
  if (entry.hasElectricity)   features.push("⚡");
  if (entry.hasWater)         features.push("💧");

  const transitStats: { label: string; value: string }[] = [];
  if (transitMode === 'pt') {
    if (entry.uniPT)   transitStats.push({ label: "Uni 🚍",   value: entry.uniPT });
    if (entry.workPT)  transitStats.push({ label: "Work 🚍",  value: entry.workPT });
    if (entry.trainPT) transitStats.push({ label: "Train 🚍", value: entry.trainPT });
  } else {
    if (entry.uniDrive)   transitStats.push({ label: "Uni 🚗",   value: entry.uniDrive });
    if (entry.workDrive)  transitStats.push({ label: "Work 🚗",  value: entry.workDrive });
    if (entry.trainDrive) transitStats.push({ label: "Train 🚗", value: entry.trainDrive });
  }
  const topStats = transitStats.slice(0, 3);

  return (
    <div
      className={`group relative bg-white dark:bg-gray-900 rounded-xl border-l-4 ${meta.border} border-t border-r border-b border-t-gray-100 border-r-gray-100 border-b-gray-100 dark:border-t-gray-800 dark:border-r-gray-800 dark:border-b-gray-800 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer overflow-hidden`}
      onClick={onClick}
    >
      {/* Header row: address + score */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">
            {entry.address || "—"}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {entry.suburb || "—"}
          </p>
        </div>
        <div className={`shrink-0 ${meta.scoreBg} ${meta.scoreText} rounded-lg px-2.5 py-1.5 text-right`}>
          <p className="text-lg font-extrabold leading-none tabular-nums">{score}</p>
          <p className="text-[10px] font-semibold opacity-70 mt-0.5">score</p>
        </div>
      </div>

      {/* Rent + specs */}
      <div className="px-4 pb-3 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">${entry.rent}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">/wk</span>
        </div>
        {(entry.bedrooms || entry.bathrooms || entry.carParks) && (
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            {entry.bedrooms && <span>🛏 {entry.bedrooms}</span>}
            {entry.bathrooms && <span>🚿 {entry.bathrooms}</span>}
            {entry.carParks && entry.carParks !== "0" && <span>🚗 {entry.carParks}</span>}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />

      {/* Feature dots */}
      {features.length > 0 && (
        <div className="px-4 py-2.5 flex gap-1.5 flex-wrap">
          {features.map((f, i) => (
            <span key={i} className="text-sm leading-none">{f}</span>
          ))}
        </div>
      )}

      {/* Transit stats */}
      {topStats.length > 0 && (
        <div className="px-4 pb-3 pt-1 flex gap-4">
          {topStats.map(s => (
            <div key={s.label} className="flex flex-col items-start">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200 tabular-nums leading-tight">{s.value}<span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-1">min</span></span>
              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap leading-tight mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions — hidden until hover */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <FontAwesomeIcon icon={faPenToSquare} />
          Edit
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete
        </button>
      </div>
    </div>
  );
}

function Table(props: Props) {
  const { transitMode } = props;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-24">
      {visibleEntries.map(entry => (
        <PropertyCard
          key={entry.id}
          entry={entry}
          onEdit={() => handleEdit(entry.id)}
          onDelete={() => handleDelete(entry.id)}
          onClick={() => props.onCardClick(entry)}
          transitMode={transitMode}
        />
      ))}
    </div>
  )
}

export default Table
