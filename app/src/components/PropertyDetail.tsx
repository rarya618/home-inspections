import { useState } from "react";
import { Entry } from "./AddEntry";
import { calculateScore, calculateScoreBreakdown } from "./Score";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft, faBed, faShower, faCar, faUtensils, faCouch, faWind,
  faPaw, faWarehouse, faWifi, faBolt, faDroplet, faBus, faPersonWalking,
  faBasketShopping, faBurger, faStore, faCircleCheck, faSeedling, faRotate,
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
  if (score >= 900) return { scoreText: 'text-green-500 dark:text-green-400',   label: 'Strong match' };
  if (score >= 750) return { scoreText: 'text-lime-500 dark:text-lime-400',     label: 'Good match' };
  if (score >= 550) return { scoreText: 'text-yellow-500 dark:text-yellow-400', label: 'Moderate match' };
  if (score >= 350) return { scoreText: 'text-amber-500 dark:text-amber-400',   label: 'Decent match' };
  if (score >= 0)   return { scoreText: 'text-orange-500 dark:text-orange-400', label: 'Passable' };
  return               { scoreText: 'text-red-500 dark:text-red-400',           label: 'Bad match' };
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-tight uppercase text-gray-400 dark:text-gray-500 mb-3 mt-8">{children}</h3>
  );
}

function TransitBlock({ label, tiles }: { label: string; tiles: { icon: IconDefinition; label: string; value: string | undefined }[] }) {
  const visible = tiles.filter(t => t.value && t.value !== "0");
  if (visible.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex divide-x divide-gray-100 dark:divide-gray-800">
        {visible.map(t => (
          <div key={t.label} className="flex-1 flex items-center justify-between px-4 py-3.5 gap-3">
            <FontAwesomeIcon icon={t.icon} className="text-gray-400 dark:text-gray-500 w-5 shrink-0" />
            <span className="text-[22px] font-black tabular-nums text-gray-900 dark:text-white leading-none">
              {t.value}<span className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 ml-1">min</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NearbyTile({ icon, label, value }: { icon: IconDefinition; label: string; value: string | undefined }) {
  if (!value || value === "0") return null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <FontAwesomeIcon icon={icon} className="text-gray-300 dark:text-gray-600 w-3.5 shrink-0" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</span>
      </div>
      <span className="text-sm font-black tabular-nums text-gray-900 dark:text-white shrink-0">{value}<span className="text-[11px] font-semibold text-gray-400 ml-1">min</span></span>
    </div>
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
                         !entry.utsPT && !entry.utsWalk && !entry.utsDrive &&
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
                     entry.utsPT || entry.utsWalk || entry.utsDrive ||
                     entry.workPT || entry.workWalk || entry.workDrive ||
                     entry.trainWalk || entry.trainPT || entry.trainDrive;
  const hasNearby = entry.coles || entry.woolies || entry.aldi || entry.gyg || entry.shoppingCenter;
  const hasOffsets = (entry.size && entry.size !== "0") || (entry.convenience && entry.convenience !== "0");

  const presentFeatures: { icon: IconDefinition; label: string }[] = [];
  if (entry.isKitchenPrivate) presentFeatures.push({ icon: faUtensils,  label: 'Private kitchen' });
  if (entry.isFurnished)      presentFeatures.push({ icon: faCouch,     label: 'Furnished' });
  if (entry.hasAirCon)        presentFeatures.push({ icon: faWind,      label: 'Air con' });
  if (entry.isPetsAllowed)    presentFeatures.push({ icon: faPaw,       label: 'Pets allowed' });
  if (entry.hasGarage)        presentFeatures.push({ icon: faWarehouse, label: 'Garage' });
  if (entry.hasLawn)          presentFeatures.push({ icon: faSeedling,  label: 'Lawn' });
  if (entry.hasElectricity)   presentFeatures.push({ icon: faBolt,      label: 'Electricity' });
  if (entry.hasWater)         presentFeatures.push({ icon: faDroplet,   label: 'Water' });
  if (entry.hasInternet)      presentFeatures.push({ icon: faWifi,      label: 'Internet' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3" />
          Back
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="w-3.5" />
          Edit
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4">

        {/* Hero */}
        <div className="pt-7 pb-4">

          {/* Badges */}
          {(entry.isInspected || entry.isUnavailable) && (
            <div className="flex items-center gap-2 mb-3">
              {entry.isInspected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full uppercase tracking-tight">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-3" /> Inspected
                </span>
              )}
              {entry.isUnavailable && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full uppercase tracking-tight">
                  Unavailable
                </span>
              )}
            </div>
          )}

          {/* Address + score */}
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">{street}</h2>
              {suburb && <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{suburb}</p>}
              {entry.listing && (
                <a
                  href={entry.listing}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1.5 transition-colors uppercase tracking-tight"
                >
                  View listing ↗
                </a>
              )}
            </div>
            <div className="shrink-0 pt-1 text-right">
              <span className={`text-5xl font-black tabular-nums leading-none ${meta.scoreText}`}>{score}</span>
              <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400 dark:text-gray-500 mt-1">{meta.label}</p>
            </div>
          </div>

          {/* Rent */}
          <div className="flex items-baseline gap-2 mt-5">
            <span className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">${entry.rent}</span>
            <span className="text-base font-semibold text-gray-400 dark:text-gray-500">/wk</span>
            {ppRent && <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 ml-1">${ppRent}/pp</span>}
          </div>

          {/* Specs */}
          {(entry.bedrooms || entry.bathrooms || entry.carParks) && (
            <div className="flex items-center gap-3 mt-3">
              {entry.bedrooms && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faBed} className="w-3.5 text-gray-400 dark:text-gray-600" /> {entry.bedrooms} bed
                </div>
              )}
              {entry.bathrooms && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faShower} className="w-3.5 text-gray-400 dark:text-gray-600" /> {entry.bathrooms} bath
                </div>
              )}
              {entry.carParks && entry.carParks !== "0" && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faCar} className="w-3.5 text-gray-400 dark:text-gray-600" /> {entry.carParks} park
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        {presentFeatures.length > 0 && (
          <div>
            <SectionTitle>Features</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {presentFeatures.map(f => (
                <span key={f.label} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <FontAwesomeIcon icon={f.icon} className="w-3.5 text-gray-400 dark:text-gray-500" />
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Transit */}
        {(hasTransit || missingTransit) && (
          <div>
            <SectionTitle>Transit</SectionTitle>
            {missingTransit && (
              <button
                onClick={handleFetchTransit}
                disabled={fetchingTransit || transitFetched}
                className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 px-4 py-2.5 rounded-xl mb-4 transition-colors w-full"
              >
                <FontAwesomeIcon icon={faRotate} className={fetchingTransit ? 'animate-spin' : ''} />
                {transitFetched ? 'Fetched — reopen to see times' : fetchingTransit ? 'Fetching travel times…' : 'Fetch travel times'}
              </button>
            )}
            {hasStaleDrive && (
              <button
                onClick={handleFetchTransit}
                disabled={fetchingTransit || transitFetched}
                className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 disabled:opacity-50 px-4 py-2.5 rounded-xl mb-4 transition-colors w-full"
              >
                <FontAwesomeIcon icon={faRotate} className={fetchingTransit ? 'animate-spin' : ''} />
                {transitFetched ? 'Refreshed — reopen to see times' : fetchingTransit ? 'Refreshing…' : 'Drive times may include tolls — refresh'}
              </button>
            )}
            <div className="space-y-3">
              <TransitBlock label="USYD" tiles={[
                { icon: faBus,           label: 'PT',      value: entry.uniPT },
                { icon: faPersonWalking, label: 'Walk',    value: entry.uniWalk },
                { icon: faCar,           label: 'Drive',   value: entry.uniDrive },
              ]} />
              <TransitBlock label="UTS" tiles={[
                { icon: faBus,           label: 'PT',      value: entry.utsPT },
                { icon: faPersonWalking, label: 'Walk',    value: entry.utsWalk },
                { icon: faCar,           label: 'Drive',   value: entry.utsDrive },
              ]} />
              <TransitBlock label="Work" tiles={[
                { icon: faBus,           label: 'PT',      value: entry.workPT },
                { icon: faPersonWalking, label: 'Walk',    value: entry.workWalk },
                { icon: faCar,           label: 'Drive',   value: entry.workDrive },
              ]} />
              <TransitBlock label="Train station" tiles={[
                { icon: faBus,           label: 'PT',      value: entry.trainPT },
                { icon: faPersonWalking, label: 'Walk',    value: entry.trainWalk },
                { icon: faCar,           label: 'Drive',   value: entry.trainDrive },
              ]} />
            </div>
          </div>
        )}

        {/* Nearby */}
        {hasNearby && (
          <div>
            <SectionTitle>Nearby</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NearbyTile icon={faBasketShopping} label="Coles"            value={entry.coles} />
              <NearbyTile icon={faBasketShopping} label="Woolworths"       value={entry.woolies} />
              <NearbyTile icon={faBasketShopping} label="ALDI"             value={entry.aldi} />
              <NearbyTile icon={faStore}          label="Shopping centre"  value={entry.shoppingCenter} />
              <NearbyTile icon={faBurger}         label="GYG"              value={entry.gyg} />
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
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Size</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {parseInt(entry.size) > 0 ? "+" : ""}{parseInt(entry.size) * 100}
                  </span>
                </div>
              )}
              {entry.convenience && entry.convenience !== "0" && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Convenience</span>
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
              <SectionTitle>Score breakdown</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {pros.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-bold uppercase tracking-tight text-emerald-600 dark:text-emerald-400">Pros</span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {pros.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2.5 gap-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">{label}</span>
                          <span className="text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">+{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {cons.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-bold uppercase tracking-tight text-red-500 dark:text-red-400">Cons</span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {cons.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2.5 gap-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">{label}</span>
                          <span className="text-xs font-black tabular-nums text-red-500 dark:text-red-400 shrink-0">{value}</span>
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
