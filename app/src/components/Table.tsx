import { useEffect, useRef, useState } from "react"
import { sampleEntry, Entry } from "./AddEntry"
import { getHouseEntries, deleteEntry } from "../firebase/database";
import { calculateScore } from "./Score";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import {
  faTrash, faCircleCheck, faUtensils, faCouch, faWind, faPaw,
  faWarehouse, faWifi, faBolt, faDroplet, faBed, faShower, faCar,
  faEllipsisVertical, faArrowUpRightFromSquare, faExpand,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useTitle } from "../App";

const getSuburb = (address: string): string => {
  const match = address.match(/,\s*([^,]+?)\s*(?:,\s*NSW\b|\s+NSW\b)/i)
  return match ? match[1].trim() : ""
}

const getStreet = (address: string): string => address.split(',')[0].trim()

type Props = {
  currentEntry: string,
  setCurrentEntry: (newEntry: string) => void,
  changeHandler: () => void,
  onCardClick: (entry: Entry) => void,
  transitMode: 'pt' | 'drive',
  viewMode: 'cards' | 'list',
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Build a compact feature icon row — only show what's present
  const features: { icon: IconDefinition; title: string }[] = [];
  if (entry.isInspected)      features.push({ icon: faCircleCheck, title: "Inspected" });
  if (entry.isKitchenPrivate) features.push({ icon: faUtensils,    title: "Private kitchen" });
  if (entry.isFurnished)      features.push({ icon: faCouch,       title: "Furnished" });
  if (entry.hasAirCon)        features.push({ icon: faWind,        title: "Air con" });
  if (entry.isPetsAllowed)    features.push({ icon: faPaw,         title: "Pets allowed" });
  if (entry.hasGarage)        features.push({ icon: faWarehouse,   title: "Garage" });
  if (entry.hasInternet)      features.push({ icon: faWifi,        title: "Internet" });
  if (entry.hasElectricity)   features.push({ icon: faBolt,        title: "Electricity" });
  if (entry.hasWater)         features.push({ icon: faDroplet,     title: "Water" });

  const transitStats: { label: string; value: string }[] = [];
  if (transitMode === 'pt') {
    if (entry.uniPT)   transitStats.push({ label: "Uni",   value: entry.uniPT });
    if (entry.workPT)  transitStats.push({ label: "Work",  value: entry.workPT });
    if (entry.trainPT) transitStats.push({ label: "Train", value: entry.trainPT });
  } else {
    if (entry.uniDrive)   transitStats.push({ label: "Uni",   value: entry.uniDrive });
    if (entry.workDrive)  transitStats.push({ label: "Work",  value: entry.workDrive });
    if (entry.trainDrive) transitStats.push({ label: "Train", value: entry.trainDrive });
  }
  const topStats = transitStats.slice(0, 3);

  return (
    <div
      className={`relative bg-white dark:bg-gray-900 rounded-lg border-l-4 ${meta.border} border-t border-r border-b border-t-gray-100 border-r-gray-100 border-b-gray-100 dark:border-t-gray-800 dark:border-r-gray-800 dark:border-b-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors duration-150 flex flex-col cursor-pointer`}
      onClick={onClick}
    >
      {/* Header row: address + score + menu */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">
            {getStreet(entry.address || "") || "—"}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {getSuburb(entry.address || "") || "—"}
          </p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <div className={`${meta.scoreBg} ${meta.scoreText} rounded-lg px-2.5 py-1.5 text-right`}>
            <p className="text-lg font-extrabold leading-none tabular-nums">{score}</p>
            <p className="text-[10px] font-semibold opacity-70 mt-0.5">score</p>
          </div>
          {/* Ellipsis menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} className="w-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onClick(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FontAwesomeIcon icon={faExpand} className="w-3.5 text-gray-400" />
                  See details
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 text-gray-400" />
                  Edit
                </button>
                {entry.listing && (
                  <a
                    href={entry.listing}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 text-gray-400" />
                    View listing
                  </a>
                )}
                <div className="border-t border-gray-100 dark:border-gray-800" />
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rent + specs */}
      <div className="px-4 pb-3 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">${entry.rent}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">/wk</span>
          {entry.bedrooms && parseInt(entry.bedrooms) > 1 && (
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-0.5">
              ${Math.round(parseInt(entry.rent) / parseInt(entry.bedrooms))}/pp
            </p>
          )}
        </div>
        {(entry.bedrooms || entry.bathrooms || entry.carParks) && (
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            {entry.bedrooms && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faBed} className="w-3" /> {entry.bedrooms}</span>}
            {entry.bathrooms && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faShower} className="w-3" /> {entry.bathrooms}</span>}
            {entry.carParks && entry.carParks !== "0" && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCar} className="w-3" /> {entry.carParks}</span>}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />

      {/* Feature icons */}
      {features.length > 0 && (
        <div className="px-4 py-2.5 flex gap-3 flex-wrap">
          {features.map((f, i) => (
            <span key={i} className="relative group/tip">
              <FontAwesomeIcon icon={f.icon} className="text-sm text-gray-400 dark:text-gray-500" />
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-gray-700 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
                {f.title}
              </span>
            </span>
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
    </div>
  );
}

function ListRow({ entry, onEdit, onDelete, onClick, transitMode }: {
  entry: Entry,
  onEdit: () => void,
  onDelete: () => void,
  onClick: () => void,
  transitMode: 'pt' | 'drive',
}) {
  const score = entry.score ?? calculateScore(entry);
  const meta = getScoreMeta(score);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const beds = entry.bedrooms ? parseInt(entry.bedrooms) : 1;
  const ppRent = beds > 1 ? Math.round(parseInt(entry.rent) / beds) : null;

  const transitVal = transitMode === 'pt'
    ? (entry.uniPT || entry.workPT || null)
    : (entry.uniDrive || entry.workDrive || null);
  const transitLabel = transitMode === 'pt' ? 'Uni PT' : 'Uni drive';

  return (
    <div
      className={`relative flex items-center gap-4 px-4 py-3 border-l-4 ${meta.border} bg-white dark:bg-gray-900 border-b border-b-gray-100 dark:border-b-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors cursor-pointer`}
      onClick={onClick}
    >
      {/* Address */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{getStreet(entry.address || "") || "—"}</p>
      </div>

      {/* Specs */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 shrink-0">
        {entry.bedrooms && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faBed} className="w-3" />{entry.bedrooms}</span>}
        {entry.bathrooms && <span className="flex items-center gap-1"><FontAwesomeIcon icon={faShower} className="w-3" />{entry.bathrooms}</span>}
      </div>

      {/* Transit */}
      {transitVal && (
        <div className="hidden sm:flex flex-col items-end shrink-0 w-16">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums">{transitVal}<span className="text-xs font-normal text-gray-400 ml-0.5">m</span></span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{transitLabel}</span>
        </div>
      )}

      {/* Rent */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">${entry.rent}<span className="text-xs font-normal text-gray-400 dark:text-gray-500">/wk</span></p>
        {ppRent && <p className="text-xs text-gray-400 dark:text-gray-500">${ppRent}/pp</p>}
      </div>

      {/* Score */}
      <div className={`shrink-0 ${meta.scoreBg} ${meta.scoreText} rounded-md px-2 py-1 text-center min-w-[44px]`}>
        <p className="text-sm font-extrabold tabular-nums leading-none">{score}</p>
      </div>

      {/* Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faEllipsisVertical} className="w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(false); onClick(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FontAwesomeIcon icon={faExpand} className="w-3.5 text-gray-400" /> See details
            </button>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 text-gray-400" /> Edit
            </button>
            {entry.listing && (
              <a href={entry.listing} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 text-gray-400" /> View listing
              </a>
            )}
            <div className="border-t border-gray-100 dark:border-gray-800" />
            <button onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <FontAwesomeIcon icon={faTrash} className="w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Table(props: Props) {
  const { transitMode, viewMode } = props;
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

  // Group by suburb, preserving score-sorted order within each group
  const groups: { suburb: string; entries: typeof visibleEntries }[] = []
  for (const entry of visibleEntries) {
    const suburb = getSuburb(entry.address || "") || "Other"
    const existing = groups.find(g => g.suburb === suburb)
    if (existing) existing.entries.push(entry)
    else groups.push({ suburb, entries: [entry] })
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 pb-24">
        {groups.map(({ suburb, entries }) => (
          <div key={suburb}>
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2 px-0.5">{suburb}</h2>
            <div className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
              {entries.map(entry => (
                <ListRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() => handleEdit(entry.id)}
                  onDelete={() => handleDelete(entry.id)}
                  onClick={() => props.onCardClick(entry)}
                  transitMode={transitMode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-24">
      {groups.map(({ suburb, entries }) => (
        <div key={suburb}>
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 px-0.5">{suburb}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map(entry => (
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
        </div>
      ))}
    </div>
  )
}

export default Table
