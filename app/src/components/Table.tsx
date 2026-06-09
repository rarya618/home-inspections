import { useEffect, useRef, useState } from "react"
import { sampleEntry, Entry } from "./AddEntry"
import { Filters } from "../App"
import { getHouseEntries, deleteEntry, refreshTransitTimes, updateEntry } from "../firebase/database";
import { calculateScore } from "./Score";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import {
  faTrash, faCircleCheck, faUtensils, faCouch, faWind, faPaw,
  faWarehouse, faWifi, faBolt, faDroplet, faBed, faShower, faCar,
  faEllipsisVertical, faArrowUpRightFromSquare, faExpand, faSeedling,
  faRotate, faStar,
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
  viewMode: 'cards' | 'list',  // 'map' is handled above in App and never passed here
  refreshKey: number,
  groupBy: 'none' | 'suburb' | 'uni' | 'work' | 'score',
  search: string,
  filters: Filters,
  sortBy: 'score' | 'rent-asc' | 'rent-desc',
  starsFirst: boolean,
}

const getScoreMeta = (score: number) => {
  if (score >= 900) return {
    border: "border-l-green-400",
    scoreText: "text-green-600 dark:text-green-400",
    scoreBg: "bg-green-50 dark:bg-green-950/60",
    badgeBg: "bg-green-500",
    dot: "bg-green-400",
  };
  if (score >= 750) return {
    border: "border-l-lime-400",
    scoreText: "text-lime-600 dark:text-lime-400",
    scoreBg: "bg-lime-50 dark:bg-lime-950/60",
    badgeBg: "bg-lime-500",
    dot: "bg-lime-400",
  };
  if (score >= 550) return {
    border: "border-l-yellow-400",
    scoreText: "text-yellow-600 dark:text-yellow-400",
    scoreBg: "bg-yellow-50 dark:bg-yellow-950/60",
    badgeBg: "bg-yellow-400",
    dot: "bg-yellow-400",
  };
  if (score >= 350) return {
    border: "border-l-amber-400",
    scoreText: "text-amber-600 dark:text-amber-400",
    scoreBg: "bg-amber-50 dark:bg-amber-950/60",
    badgeBg: "bg-amber-500",
    dot: "bg-amber-400",
  };
  if (score >= 0) return {
    border: "border-l-orange-400",
    scoreText: "text-orange-600 dark:text-orange-400",
    scoreBg: "bg-orange-50 dark:bg-orange-950/60",
    badgeBg: "bg-orange-500",
    dot: "bg-orange-400",
  };
  return {
    border: "border-l-red-400",
    scoreText: "text-red-600 dark:text-red-400",
    scoreBg: "bg-red-50 dark:bg-red-950/60",
    badgeBg: "bg-red-500",
    dot: "bg-red-400",
  };
};

function PropertyCard({ entry, onEdit, onDelete, onClick, onStar, transitMode }: {
  entry: Entry,
  onEdit: () => void,
  onDelete: () => void,
  onClick: () => void,
  onStar: () => void,
  transitMode: 'pt' | 'drive',
}) {
  const score = entry.score ?? calculateScore(entry);
  const meta = getScoreMeta(score);
  const hasStaleDrive = (!!entry.uniDrive || !!entry.workDrive || !!entry.trainDrive) &&
    (!entry.transitVersion || entry.transitVersion < 2);
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
  if (entry.hasLawn)          features.push({ icon: faSeedling,    title: "Lawn" });
  if (entry.hasInternet)      features.push({ icon: faWifi,        title: "Internet" });
  if (entry.hasElectricity)   features.push({ icon: faBolt,        title: "Electricity" });
  if (entry.hasWater)         features.push({ icon: faDroplet,     title: "Water" });

  const transitStats: { label: string; value: string }[] = [];
  if (transitMode === 'pt') {
    if (entry.uniPT)   transitStats.push({ label: "USYD",   value: entry.uniPT });
    if (entry.utsPT)   transitStats.push({ label: "UTS",   value: entry.utsPT });
    if (entry.workPT)  transitStats.push({ label: "Work",  value: entry.workPT });
    if (entry.trainPT) transitStats.push({ label: "Train", value: entry.trainPT });
  } else {
    if (entry.uniDrive)   transitStats.push({ label: "USYD",   value: entry.uniDrive });
    if (entry.utsDrive)   transitStats.push({ label: "UTS",   value: entry.utsDrive });
    if (entry.workDrive)  transitStats.push({ label: "Work",  value: entry.workDrive });
    if (entry.trainDrive) transitStats.push({ label: "Train", value: entry.trainDrive });
  }
  const topStats = transitStats.slice(0, 3);

  const beds = entry.bedrooms ? parseInt(entry.bedrooms) : null;
  const ppRent = beds && beds > 1 ? Math.round(parseInt(entry.rent) / beds) : null;

  const street = getStreet(entry.address || "") || "—";
  const suburb = getSuburb(entry.address || "");

  return (
    <div
      className={`relative bg-white dark:bg-gray-900 rounded-xl border-l-[3px] ${meta.border} border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150 flex flex-col cursor-pointer`}
      onClick={onClick}
    >
      {/* Top: address + actions */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-white leading-snug truncate">{street}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {suburb && <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 truncate">{suburb}</span>}
            {(entry.bedrooms || entry.bathrooms || entry.carParks) && (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                {entry.bedrooms && <span className="flex items-center gap-0.5"><FontAwesomeIcon icon={faBed} className="w-2.5" />{entry.bedrooms}</span>}
                {entry.bathrooms && <span className="flex items-center gap-0.5"><FontAwesomeIcon icon={faShower} className="w-2.5" />{entry.bathrooms}</span>}
                {entry.carParks && entry.carParks !== "0" && <span className="flex items-center gap-0.5"><FontAwesomeIcon icon={faCar} className="w-2.5" />{entry.carParks}</span>}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); onStar(); }} className="p-1.5 rounded-lg transition-colors">
            <FontAwesomeIcon icon={entry.isStarred ? faStar : faStarOutline} className={`w-3.5 ${entry.isStarred ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`} />
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors rounded-lg">
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
      </div>

      {/* Rent + Score */}
      <div className="px-4 pb-4 flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">${entry.rent}</span>
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">/wk</span>
          </div>
          {ppRent && <p className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">${ppRent}/pp</p>}
        </div>
        <span className={`text-3xl font-black tabular-nums leading-none ${meta.scoreText}`}>{score}</span>
      </div>

      {/* Stale drive times warning */}
      {hasStaleDrive && (
        <div className="px-4 py-1.5 border-t border-orange-100 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/30">
          <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <FontAwesomeIcon icon={faRotate} className="w-2.5" />
            Drive times may include tolls
          </span>
        </div>
      )}

      {/* Transit footer */}
      {(topStats.length > 0 || features.length > 0) && (
        <div className="border-t border-gray-100 dark:border-gray-800 flex">
          {topStats.length > 0 && (
            <div className="flex flex-1 divide-x divide-gray-100 dark:divide-gray-800">
              {topStats.map(s => (
                <div key={s.label} className="flex-1 flex flex-col items-center justify-center py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 leading-none">{s.label}</span>
                  <span className="text-[17px] font-black tabular-nums text-gray-900 dark:text-white leading-none mt-0.5">
                    {s.value}<span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 ml-0.5">min</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {features.length > 0 && (
            <div className="flex items-center gap-2 px-3 border-l border-gray-100 dark:border-gray-800 shrink-0">
              {features.map((f, i) => (
                <span key={i} className="relative group/tip">
                  <FontAwesomeIcon icon={f.icon} className="text-xs text-gray-300 dark:text-gray-600" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-gray-700 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
                    {f.title}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TransitPill({ val, label }: { val: string | null; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 shrink-0">
      <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 leading-none">{label}</span>
      <span className="mt-0.5 text-[18px] font-black tabular-nums leading-none text-gray-800 dark:text-gray-100">
        {val
          ? <>{val}<span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 ml-1">min</span></>
          : <span className="text-gray-300 dark:text-gray-700">—</span>
        }
      </span>
    </div>
  );
}

function ListRow({ entry, onEdit, onDelete, onClick, onFetchTransit, onStar, transitMode }: {
  entry: Entry,
  onEdit: () => void,
  onDelete: () => void,
  onClick: () => void,
  onFetchTransit: () => Promise<void>,
  onStar: () => void,
  transitMode: 'pt' | 'drive',
}) {
  const score = entry.score ?? calculateScore(entry);
  const meta = getScoreMeta(score);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuPos) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuPos(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuPos]);

  const openMenu = (x: number, y: number) => {
    const menuW = 176;
    const menuH = 200;
    setMenuPos({
      x: Math.min(x, window.innerWidth - menuW - 8),
      y: Math.min(y, window.innerHeight - menuH - 8),
    });
  };

  const beds = entry.bedrooms ? parseInt(entry.bedrooms) : 1;
  const ppRent = beds > 1 ? Math.round(parseInt(entry.rent) / beds) : null;

  const uniRaw  = transitMode === 'pt' ? (entry.uniPT  || null) : (entry.uniDrive  || null);
  const utsRaw  = transitMode === 'pt' ? (entry.utsPT  || null) : (entry.utsDrive  || null);
  const workVal = transitMode === 'pt' ? (entry.workPT || null) : (entry.workDrive || null);

  const missingTransit = !entry.uniPT && !entry.uniWalk && !entry.uniDrive &&
                         !entry.utsPT && !entry.utsWalk && !entry.utsDrive &&
                         !entry.workPT && !entry.workWalk && !entry.workDrive &&
                         !entry.trainPT && !entry.trainWalk && !entry.trainDrive;
  const hasStaleDrive = !missingTransit &&
    (!!entry.uniDrive || !!entry.workDrive || !!entry.trainDrive) &&
    (!entry.transitVersion || entry.transitVersion < 2);
  const [fetchingTransit, setFetchingTransit] = useState(false);

  const handleFetchTransit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuPos(null);
    setFetchingTransit(true);
    await onFetchTransit();
    setFetchingTransit(false);
  };

  const street = getStreet(entry.address || "") || "—";
  const suburb = getSuburb(entry.address || "");

  return (
    <div
      className="relative flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl last:border-b-0"
      onClick={onClick}
      onContextMenu={e => { e.preventDefault(); openMenu(e.clientX, e.clientY); }}
    >
      {/* Score */}
      <div className="shrink-0 w-12 text-center">
        <span className={`text-xl font-black tabular-nums leading-none ${meta.scoreText}`}>{score}</span>
      </div>

      {/* Address + specs */}
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-bold text-gray-900 dark:text-white truncate leading-snug">{street}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {suburb && <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 truncate">{suburb}</span>}
          {(entry.bedrooms || entry.bathrooms || entry.carParks) && (
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 dark:text-gray-500">
              {entry.bedrooms && <span className="flex items-center gap-0.5"><FontAwesomeIcon icon={faBed} className="w-2.5" />{entry.bedrooms}</span>}
              {entry.bathrooms && <span className="flex items-center gap-0.5"><FontAwesomeIcon icon={faShower} className="w-2.5" />{entry.bathrooms}</span>}
              {entry.carParks && entry.carParks !== "0" && <span className="flex items-center gap-0.5"><FontAwesomeIcon icon={faCar} className="w-2.5" />{entry.carParks}</span>}
            </span>
          )}
        </div>
        {missingTransit && (
          <button
            onClick={handleFetchTransit}
            disabled={fetchingTransit}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-1.5 py-0.5 rounded mt-0.5 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotate} className={fetchingTransit ? 'animate-spin' : ''} />
            {fetchingTransit ? 'Fetching…' : 'No travel times'}
          </button>
        )}
        {hasStaleDrive && (
          <button
            onClick={handleFetchTransit}
            disabled={fetchingTransit}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/50 px-1.5 py-0.5 rounded mt-0.5 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotate} className={fetchingTransit ? 'animate-spin' : ''} />
            {fetchingTransit ? 'Fetching…' : 'Drive times include tolls'}
          </button>
        )}
      </div>

      {/* Transit */}
      <div className="hidden sm:flex items-stretch divide-x divide-gray-100 dark:divide-gray-800 shrink-0">
        <TransitPill val={uniRaw} label="USYD" />
        <TransitPill val={utsRaw} label="UTS" />
        <TransitPill val={workVal} label="Work" />
      </div>

      {/* Rent */}
      <div className="shrink-0 text-right w-24">
        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none">${entry.rent}</p>
        {ppRent
          ? <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums mt-0.5">${ppRent}/pp</p>
          : <p className="text-[11px] invisible">—</p>
        }
      </div>

      {/* Star */}
      <button
        onClick={e => { e.stopPropagation(); onStar(); }}
        className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <FontAwesomeIcon
          icon={entry.isStarred ? faStar : faStarOutline}
          className={`w-4 ${entry.isStarred ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`}
        />
      </button>

      {/* Menu */}
      <div className="shrink-0" ref={menuRef}>
        <button
          onClick={e => { e.stopPropagation(); menuPos ? setMenuPos(null) : openMenu(e.clientX, e.clientY); }}
          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faEllipsisVertical} className="w-3.5" />
        </button>
        {menuPos && (
          <div
            className="fixed w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            <button onClick={e => { e.stopPropagation(); setMenuPos(null); onClick(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FontAwesomeIcon icon={faExpand} className="w-3.5 text-gray-400" /> See details
            </button>
            <button onClick={e => { e.stopPropagation(); setMenuPos(null); onEdit(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 text-gray-400" /> Edit
            </button>
            {missingTransit && (
              <button onClick={handleFetchTransit} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                <FontAwesomeIcon icon={faRotate} className="w-3.5" /> Fetch travel times
              </button>
            )}
            {entry.listing && (
              <a href={entry.listing} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 text-gray-400" /> View listing
              </a>
            )}
            <div className="border-t border-gray-100 dark:border-gray-800" />
            <button onClick={e => { e.stopPropagation(); setMenuPos(null); onDelete(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <FontAwesomeIcon icon={faTrash} className="w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const FEATURE_PREDICATES: Record<string, (e: Entry) => boolean> = {
  inspected:    e => !!e.isInspected,
  aircon:       e => !!e.hasAirCon,
  kitchen:      e => !!e.isKitchenPrivate,
  pets:         e => !!e.isPetsAllowed,
  garage:       e => !!e.hasGarage,
  electricity:  e => !!e.hasElectricity,
  water:        e => !!e.hasWater,
  internet:     e => !!e.hasInternet,
  noLawn:       e => !e.hasLawn,
  notFurnished: e => !e.isFurnished,
}

function Table(props: Props) {
  const { transitMode, viewMode, refreshKey, groupBy, search, filters, sortBy, starsFirst } = props;
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
  }, [refreshKey])

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

  const q = search.trim().toLowerCase();
  const visibleEntries = [...data]
    .filter(e => !e.isRented)
    .filter(e => !e.isUnavailable)
    .filter(e => !q || (e.address || '').toLowerCase().includes(q))
    .filter(e => [...filters.features].every(key => FEATURE_PREDICATES[key]?.(e)))
    .filter(e => {
      if (filters.maxRentPP) {
        const beds = e.bedrooms ? Math.max(1, parseInt(e.bedrooms)) : 1
        const rentPP = Math.round(parseInt(e.rent) / beds)
        if (rentPP > parseInt(filters.maxRentPP)) return false
      }
      if (filters.minBedrooms && (!e.bedrooms || parseInt(e.bedrooms) < parseInt(filters.minBedrooms))) return false
      if (filters.maxUniMins) {
        const pnr = transitMode === 'pt' ? e.uniPT : e.uniDrive
        const uts = transitMode === 'pt' ? e.utsPT : e.utsDrive
        const best = (pnr && uts) ? String(Math.min(parseInt(pnr), parseInt(uts))) : (pnr || uts)
        if (!best || parseInt(best) > parseInt(filters.maxUniMins)) return false
      }
      if (filters.maxWorkMins) {
        const mins = transitMode === 'pt' ? e.workPT : e.workDrive
        if (!mins || parseInt(mins) > parseInt(filters.maxWorkMins)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (starsFirst) {
        const starDiff = (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0)
        if (starDiff !== 0) return starDiff
      }
      if (sortBy === 'rent-asc')  return parseInt(a.rent) - parseInt(b.rent)
      if (sortBy === 'rent-desc') return parseInt(b.rent) - parseInt(a.rent)
      return (b.score ?? calculateScore(b)) - (a.score ?? calculateScore(a))
    });

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

  const handleFetchTransit = async (entryId: string, address: string) => {
    await refreshTransitTimes(entryId, address);
    await getDataFromDb();
  }

  const handleStar = async (entry: Entry) => {
    await updateEntry(entry.id, { isStarred: !entry.isStarred });
    await getDataFromDb();
  }

  const PROXIMITY_BUCKETS = ['≤ 10 min', '11 – 20 min', '21 – 30 min', '31 – 40 min', '41 – 55 min', '> 55 min', 'No data']
  const getProximityBucket = (mins: string | undefined): string => {
    if (!mins) return 'No data'
    const m = parseInt(mins)
    if (m <= 10) return '≤ 10 min'
    if (m <= 20) return '11 – 20 min'
    if (m <= 30) return '21 – 30 min'
    if (m <= 40) return '31 – 40 min'
    if (m <= 55) return '41 – 55 min'
    return '> 55 min'
  }
  const SCORE_BUCKETS = ['900+', '750 – 899', '550 – 749', '350 – 549', '0 – 349', 'Below 0']
  const getScoreBucket = (score: number): string => {
    if (score >= 900) return '900+'
    if (score >= 750) return '750 – 899'
    if (score >= 550) return '550 – 749'
    if (score >= 350) return '350 – 549'
    if (score >= 0)   return '0 – 349'
    return 'Below 0'
  }
  const getGroupKey = (entry: Entry): string => {
    if (groupBy === 'suburb') return getSuburb(entry.address || '') || 'Other'
    if (groupBy === 'uni') return getProximityBucket(transitMode === 'pt' ? entry.uniPT : entry.uniDrive)
    if (groupBy === 'work') return getProximityBucket(transitMode === 'pt' ? entry.workPT : entry.workDrive)
    if (groupBy === 'score') return getScoreBucket(entry.score ?? calculateScore(entry))
    return ''
  }

  const groups: { label: string; entries: typeof visibleEntries }[] = []
  for (const entry of visibleEntries) {
    const label = getGroupKey(entry)
    const existing = groups.find(g => g.label === label)
    if (existing) existing.entries.push(entry)
    else groups.push({ label, entries: [entry] })
  }
  if (groupBy === 'uni' || groupBy === 'work') {
    groups.sort((a, b) => PROXIMITY_BUCKETS.indexOf(a.label) - PROXIMITY_BUCKETS.indexOf(b.label))
  }
  if (groupBy === 'score') {
    groups.sort((a, b) => SCORE_BUCKETS.indexOf(a.label) - SCORE_BUCKETS.indexOf(b.label))
  }

  if (viewMode === 'list') {
    if (groupBy === 'none') {
      return (
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 pb-4">
          {visibleEntries.map(entry => (
            <ListRow
              key={entry.id}
              entry={entry}
              onEdit={() => handleEdit(entry.id)}
              onDelete={() => handleDelete(entry.id)}
              onClick={() => props.onCardClick(entry)}
              onFetchTransit={() => handleFetchTransit(entry.id, entry.address)}
              onStar={() => handleStar(entry)}
              transitMode={transitMode}
            />
          ))}
        </div>
      )
    }
    return (
      <div className="space-y-6 pb-4">
        {groups.map(({ label, entries }) => (
          <div key={label}>
            <h2 className="sticky top-[68px] z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur text-lg font-bold text-gray-700 dark:text-gray-300 py-2 px-0.5 mb-0">{label}</h2>
            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
              {entries.map(entry => (
                <ListRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() => handleEdit(entry.id)}
                  onDelete={() => handleDelete(entry.id)}
                  onClick={() => props.onCardClick(entry)}
                  onFetchTransit={() => handleFetchTransit(entry.id, entry.address)}
                  onStar={() => handleStar(entry)}
                  transitMode={transitMode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (groupBy === 'none') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
        {visibleEntries.map(entry => (
          <PropertyCard
            key={entry.id}
            entry={entry}
            onEdit={() => handleEdit(entry.id)}
            onDelete={() => handleDelete(entry.id)}
            onClick={() => props.onCardClick(entry)}
            onStar={() => handleStar(entry)}
            transitMode={transitMode}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-4">
      {groups.map(({ label, entries }) => (
        <div key={label}>
          <h2 className="sticky top-[68px] z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur text-lg font-bold text-gray-700 dark:text-gray-300 py-2 px-0.5 mb-1">{label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map(entry => (
              <PropertyCard
                key={entry.id}
                entry={entry}
                onEdit={() => handleEdit(entry.id)}
                onDelete={() => handleDelete(entry.id)}
                onClick={() => props.onCardClick(entry)}
                onStar={() => handleStar(entry)}
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
