import { useState } from "react";
import { Entry } from "./AddEntry";
import { calculateScore, calculateScoreBreakdown } from "./Score";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft, faBed, faShower, faCar, faUtensils, faCouch, faWind,
  faPaw, faWarehouse, faWifi, faBolt, faDroplet, faBus, faPersonWalking,
  faBasketShopping, faBurger, faStore, faCircleCheck, faSeedling, faRotate,
  faCheck, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useTitle } from "../App";
import { refreshTransitTimes } from "../firebase/database";

type Props = {
  entry: Entry,
  onClose: () => void,
  onEdit: () => void,
}

const getScoreMeta = (score: number) => {
  if (score >= 800) return { scoreText: 'text-emerald-600 dark:text-emerald-400', scoreBg: 'bg-emerald-50 dark:bg-emerald-950/60', label: 'Strong match' };
  if (score >= 650) return { scoreText: 'text-teal-600 dark:text-teal-400',       scoreBg: 'bg-teal-50 dark:bg-teal-950/60',     label: 'Good match' };
  if (score >= 450) return { scoreText: 'text-sky-600 dark:text-sky-400',         scoreBg: 'bg-sky-50 dark:bg-sky-950/60',       label: 'Moderate match' };
  if (score >= 300) return { scoreText: 'text-amber-600 dark:text-amber-400',     scoreBg: 'bg-amber-50 dark:bg-amber-950/60',   label: 'Decent match' };
  if (score >= 0)   return { scoreText: 'text-orange-600 dark:text-orange-400',   scoreBg: 'bg-orange-50 dark:bg-orange-950/60', label: 'Passable' };
  return               { scoreText: 'text-red-600 dark:text-red-400',             scoreBg: 'bg-red-50 dark:bg-red-950/60',       label: 'Bad match' };
};

function StatTile({ icon, label, value }: { icon: IconDefinition, label: string, value: string | undefined }) {
  if (!value || value === "0" || value === "") return null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
      <FontAwesomeIcon icon={icon} className="text-gray-400 dark:text-gray-500 text-base w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{label}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{value}min</p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, label, value }: { icon: IconDefinition, label: string, value: boolean | undefined }) {
  if (value === undefined) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <FontAwesomeIcon icon={icon} className={`w-4 shrink-0 ${value ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-700'}`} />
      <span className={`text-sm flex-1 ${value ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-600'}`}>{label}</span>
      <FontAwesomeIcon icon={value ? faCheck : faXmark} className={`w-3 ${value ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-700'}`} />
    </div>
  );
}

function TransitSplit({ tiles }: { tiles: { icon: IconDefinition; label: string; value: string | undefined }[] }) {
  const visible = tiles.filter(t => t.value && t.value !== "0");
  if (visible.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex divide-x divide-gray-100 dark:divide-gray-800">
      {visible.map(t => (
        <div key={t.label} className="flex-1 flex items-center gap-2.5 px-3 py-3">
          <FontAwesomeIcon icon={t.icon} className="text-gray-400 dark:text-gray-500 w-3.5 shrink-0" />
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums leading-none">{t.value}<span className="text-xs font-normal text-gray-400 ml-0.5">m</span></p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-tight uppercase text-gray-400 dark:text-gray-500 mb-2 mt-6">{children}</h3>
  );
}

const getSuburb = (address: string): string => {
  const match = address.match(/,\s*([^,]+?)\s*(?:,\s*NSW\b|\s+NSW\b)/i)
  return match ? match[1].trim() : ""
}

export default function PropertyDetail({ entry, onClose, onEdit }: Props) {
  const score = entry.score ?? calculateScore(entry);
  const meta = getScoreMeta(score);
  const breakdown = calculateScoreBreakdown(entry);
  const [fetchingTransit, setFetchingTransit] = useState(false);
  const [transitFetched, setTransitFetched] = useState(false);

  const missingTransit = !entry.uniPT && !entry.uniWalk && !entry.uniDrive &&
                         !entry.workPT && !entry.workWalk && !entry.workDrive &&
                         !entry.trainPT && !entry.trainWalk && !entry.trainDrive;
  const hasStaleDrive = !missingTransit &&
    (!!entry.uniDrive || !!entry.workDrive || !!entry.trainDrive) &&
    (!entry.transitVersion || entry.transitVersion < 2);

  const handleFetchTransit = async () => {
    setFetchingTransit(true);
    await refreshTransitTimes(entry.id, entry.address);
    setFetchingTransit(false);
    setTransitFetched(true);
  };

  useTitle(entry.address || "Property");

  const street = entry.address?.split(',')[0] ?? 'Property';
  const suburb = getSuburb(entry.address || '');
  const beds = entry.bedrooms ? parseInt(entry.bedrooms) : null;
  const ppRent = beds && beds > 1 ? Math.round(parseInt(entry.rent) / beds) : null;

  const hasTransit = entry.uniPT || entry.uniWalk || entry.uniDrive ||
                     entry.workPT || entry.workWalk || entry.workDrive ||
                     entry.trainWalk || entry.trainPT || entry.trainDrive;
  const hasNearby  = entry.coles || entry.woolies || entry.aldi || entry.gyg || entry.shoppingCenter;
  const hasFeatures = [
    entry.isKitchenPrivate, entry.isFurnished, entry.hasAirCon,
    entry.isPetsAllowed, entry.hasGarage, entry.hasLawn,
    entry.hasElectricity, entry.hasWater, entry.hasInternet,
  ].some(v => v !== undefined);
  const hasOffsets = (entry.size && entry.size !== "0") || (entry.convenience && entry.convenience !== "0");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Back
        </button>
        <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[180px]">{street}</h1>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
          Edit
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4">

        {/* Info block */}
        <div className="pt-5 pb-2">

          {/* Badges */}
          {(entry.isInspected || entry.isUnavailable) && (
            <div className="flex items-center gap-2 mb-2.5">
              {entry.isInspected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-3" /> Inspected
                </span>
              )}
              {entry.isUnavailable && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                  Unavailable
                </span>
              )}
            </div>
          )}

          {/* Address */}
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-snug">{entry.address || 'Unknown address'}</h2>
          {suburb && <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{suburb}</p>}
          {entry.listing && (
            <a
              href={entry.listing}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1.5 transition-colors"
            >
              View listing ↗
            </a>
          )}

          {/* Rent + Score */}
          <div className="flex items-end justify-between mt-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">${entry.rent}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">/wk</span>
              </div>
              {ppRent && <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">${ppRent}/pp</p>}
            </div>
            <div className={`${meta.scoreBg} ${meta.scoreText} rounded-2xl px-4 py-2.5 text-center min-w-[80px]`}>
              <p className="text-2xl font-extrabold tabular-nums leading-none">{score}</p>
              <p className="text-[11px] mt-0.5 opacity-70 whitespace-nowrap">{meta.label}</p>
            </div>
          </div>

          {/* Specs */}
          {(entry.bedrooms || entry.bathrooms || entry.carParks) && (
            <div className="flex gap-4 mt-3">
              {entry.bedrooms && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <FontAwesomeIcon icon={faBed} className="w-4 text-gray-400 dark:text-gray-600" /> {entry.bedrooms} bed
                </div>
              )}
              {entry.bathrooms && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <FontAwesomeIcon icon={faShower} className="w-4 text-gray-400 dark:text-gray-600" /> {entry.bathrooms} bath
                </div>
              )}
              {entry.carParks && entry.carParks !== "0" && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <FontAwesomeIcon icon={faCar} className="w-4 text-gray-400 dark:text-gray-600" /> {entry.carParks} park
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features (property + utilities merged) */}
        {hasFeatures && (
          <div>
            <SectionTitle>Features</SectionTitle>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              <FeatureRow icon={faUtensils}  label="Private kitchen"  value={entry.isKitchenPrivate} />
              <FeatureRow icon={faCouch}     label="Furnished"        value={entry.isFurnished} />
              <FeatureRow icon={faWind}      label="Air conditioning" value={entry.hasAirCon} />
              <FeatureRow icon={faPaw}       label="Pets allowed"     value={entry.isPetsAllowed} />
              <FeatureRow icon={faWarehouse} label="Garage"           value={entry.hasGarage} />
              <FeatureRow icon={faSeedling}  label="Lawn"             value={entry.hasLawn} />
              <FeatureRow icon={faBolt}      label="Electricity"      value={entry.hasElectricity} />
              <FeatureRow icon={faDroplet}   label="Water"            value={entry.hasWater} />
              <FeatureRow icon={faWifi}      label="Internet"         value={entry.hasInternet} />
            </div>
          </div>
        )}

        {/* Transit & Nearby */}
        {(hasTransit || hasNearby || missingTransit) && (
          <div>
            <SectionTitle>Transit &amp; nearby</SectionTitle>
            {missingTransit && (
              <button
                onClick={handleFetchTransit}
                disabled={fetchingTransit || transitFetched}
                className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 px-4 py-2.5 rounded-xl mb-3 transition-colors w-full"
              >
                <FontAwesomeIcon icon={faRotate} className={fetchingTransit ? 'animate-spin' : ''} />
                {transitFetched ? 'Fetched — reopen to see times' : fetchingTransit ? 'Fetching travel times…' : 'Fetch travel times'}
              </button>
            )}
            {hasStaleDrive && (
              <button
                onClick={handleFetchTransit}
                disabled={fetchingTransit || transitFetched}
                className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 disabled:opacity-50 px-4 py-2.5 rounded-xl mb-3 transition-colors w-full"
              >
                <FontAwesomeIcon icon={faRotate} className={fetchingTransit ? 'animate-spin' : ''} />
                {transitFetched ? 'Refreshed — reopen to see times' : fetchingTransit ? 'Refreshing…' : 'Drive times may include tolls — refresh'}
              </button>
            )}
            <div className="space-y-4">
              {[
                { label: 'Uni', split: true, tiles: [
                  { icon: faBus,           label: 'Bus/train', value: entry.uniPT },
                  { icon: faPersonWalking, label: 'Walking',   value: entry.uniWalk },
                  { icon: faCar,           label: 'Driving',   value: entry.uniDrive },
                ]},
                { label: 'Work', split: true, tiles: [
                  { icon: faBus,           label: 'Bus/train', value: entry.workPT },
                  { icon: faPersonWalking, label: 'Walking',   value: entry.workWalk },
                  { icon: faCar,           label: 'Driving',   value: entry.workDrive },
                ]},
                { label: 'Train station', split: true, tiles: [
                  { icon: faBus,           label: 'Bus/train', value: entry.trainPT },
                  { icon: faPersonWalking, label: 'Walking',   value: entry.trainWalk },
                  { icon: faCar,           label: 'Driving',   value: entry.trainDrive },
                ]},
                { label: 'Groceries', split: false, tiles: [
                  { icon: faBasketShopping, label: 'Coles',           value: entry.coles },
                  { icon: faBasketShopping, label: 'Woolworths',      value: entry.woolies },
                  { icon: faBasketShopping, label: 'ALDI',            value: entry.aldi },
                  { icon: faStore,          label: 'Shopping centre', value: entry.shoppingCenter },
                ]},
                { label: 'Food', split: false, tiles: [
                  { icon: faBurger, label: 'GYG', value: entry.gyg },
                ]},
              ].map(group => {
                const visible = group.tiles.filter(t => t.value && t.value !== "0");
                if (visible.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="text-xs font-semibold uppercase tracking-tight text-gray-400 dark:text-gray-500 mb-2">{group.label}</p>
                    {group.split
                      ? <TransitSplit tiles={group.tiles} />
                      : <div className="grid grid-cols-2 gap-2">
                          {visible.map(t => <StatTile key={t.label} icon={t.icon} label={t.label} value={t.value} />)}
                        </div>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Score adjustments */}
        {hasOffsets && (
          <div>
            <SectionTitle>Score adjustments</SectionTitle>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {entry.size && entry.size !== "0" && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Size</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {parseInt(entry.size) > 0 ? "+" : ""}{parseInt(entry.size) * 100}
                  </span>
                </div>
              )}
              {entry.convenience && entry.convenience !== "0" && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Convenience</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {parseInt(entry.convenience) > 0 ? "+" : ""}{parseInt(entry.convenience) * 100}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pros & Cons */}
        {breakdown.length > 0 && (() => {
          const pros = breakdown.filter(b => b.value > 0).sort((a, b) => b.value - a.value)
          const cons = breakdown.filter(b => b.value < 0).sort((a, b) => a.value - b.value)
          return (
            <div>
              <SectionTitle>Pros &amp; cons</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {pros.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-bold uppercase tracking-tight text-emerald-600 dark:text-emerald-400">Pros</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {pros.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-2 gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{label}</span>
                          <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">+{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {cons.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-bold uppercase tracking-tight text-red-500 dark:text-red-400">Cons</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {cons.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-2 gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{label}</span>
                          <span className="text-xs font-bold tabular-nums text-red-500 dark:text-red-400 shrink-0">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        <div className="pb-24" />
      </div>
    </div>
  );
}
