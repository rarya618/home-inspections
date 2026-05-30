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

function FeatureChip({ icon, label, value }: { icon: IconDefinition, label: string, value: boolean | undefined }) {
  if (value === undefined) return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
      value
        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"
        : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 line-through"
    }`}>
      <FontAwesomeIcon icon={icon} className="w-3.5 shrink-0" />
      {label}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 mt-8">{children}</h3>
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

  const handleFetchTransit = async () => {
    setFetchingTransit(true);
    await refreshTransitTimes(entry.id, entry.address);
    setFetchingTransit(false);
    setTransitFetched(true);
  };

  useTitle(entry.address || "Property");

  const hasTransit = entry.uniPT || entry.uniWalk || entry.uniDrive || entry.workPT || entry.workWalk || entry.workDrive || entry.trainWalk || entry.trainPT || entry.trainDrive;
  const hasNearby  = entry.coles || entry.woolies || entry.aldi || entry.gyg || entry.shoppingCenter;
  const hasFeatures = entry.isKitchenPrivate !== undefined ||
                      entry.isFurnished !== undefined ||
                      entry.hasAirCon !== undefined || entry.isPetsAllowed !== undefined ||
                      entry.hasLawn !== undefined;
  const hasUtils   = entry.hasElectricity !== undefined || entry.hasWater !== undefined || entry.hasInternet !== undefined;
  const hasOffsets = (entry.size && entry.size !== "0") || (entry.convenience && entry.convenience !== "0");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Hero */}
      <div className={`relative bg-gradient-to-br ${meta.gradient} px-5 pt-14 pb-8`}>

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
            Back
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-sm font-semibold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
            Edit
          </button>
        </div>

        {/* Score + Address */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {entry.isInspected && (
              <p className="text-xs font-bold tracking-tight uppercase text-white/70 mb-2 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs" /> Inspected
              </p>
            )}
            <h1 className="text-2xl font-extrabold text-white leading-tight break-words drop-shadow-sm">
              {entry.address || "Unknown address"}
            </h1>
            {getSuburb(entry.address || "") && (
              <p className="text-sm text-white/70 mt-1">{getSuburb(entry.address || "")}</p>
            )}
            {entry.listing && (
              <a
                href={entry.listing}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white mt-2 transition-colors"
              >
                View listing ↗
              </a>
            )}
          </div>
          <div className={`${meta.badge} shrink-0 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[72px]`}>
            <p className="text-2xl font-extrabold tabular-nums leading-none">{score}</p>
            <p className="text-xs mt-1 opacity-80 whitespace-nowrap">{meta.label}</p>
          </div>
        </div>

        {/* Rent */}
        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold text-white tabular-nums drop-shadow-sm">${entry.rent}</span>
          <span className="text-sm text-white/60 font-medium">per week</span>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 pb-24">

        {/* Specs */}
        {(entry.bedrooms || entry.bathrooms || entry.carParks) && (
          <div className="flex gap-4 mt-6">
            {entry.bedrooms && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FontAwesomeIcon icon={faBed} className="w-4 text-gray-400" /> {entry.bedrooms} bed
              </div>
            )}
            {entry.bathrooms && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FontAwesomeIcon icon={faShower} className="w-4 text-gray-400" /> {entry.bathrooms} bath
              </div>
            )}
            {entry.carParks && entry.carParks !== "0" && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FontAwesomeIcon icon={faCar} className="w-4 text-gray-400" /> {entry.carParks} park
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">

          {/* Property features */}
          {hasFeatures && (
            <div>
              <SectionTitle>Property</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <FeatureChip icon={faUtensils}  label="Private kitchen" value={entry.isKitchenPrivate} />
                <FeatureChip icon={faCouch}     label="Furnished"       value={entry.isFurnished} />
                <FeatureChip icon={faWind}      label="Air con"         value={entry.hasAirCon} />
                <FeatureChip icon={faPaw}       label="Pets allowed"    value={entry.isPetsAllowed} />
                <FeatureChip icon={faWarehouse}  label="Garage"          value={entry.hasGarage} />
                <FeatureChip icon={faSeedling}   label="Lawn"            value={entry.hasLawn} />
              </div>
            </div>
          )}

          {/* Utilities */}
          {hasUtils && (
            <div>
              <SectionTitle>Utilities included</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                <FeatureChip icon={faBolt}    label="Electricity" value={entry.hasElectricity} />
                <FeatureChip icon={faDroplet} label="Water"       value={entry.hasWater} />
                <FeatureChip icon={faWifi}    label="Internet"    value={entry.hasInternet} />
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
              <div className="space-y-4">
                {[
                  { label: 'Uni', tiles: [
                    { icon: faBus, label: 'Bus/train', value: entry.uniPT },
                    { icon: faPersonWalking, label: 'Walking', value: entry.uniWalk },
                    { icon: faCar, label: 'Driving', value: entry.uniDrive },
                  ]},
                  { label: 'Work', tiles: [
                    { icon: faBus, label: 'Bus/train', value: entry.workPT },
                    { icon: faPersonWalking, label: 'Walking', value: entry.workWalk },
                    { icon: faCar, label: 'Driving', value: entry.workDrive },
                  ]},
                  { label: 'Train station', tiles: [
                    { icon: faBus, label: 'Bus/train', value: entry.trainPT },
                    { icon: faPersonWalking, label: 'Walking', value: entry.trainWalk },
                    { icon: faCar, label: 'Driving', value: entry.trainDrive },
                  ]},
                  { label: 'Groceries', tiles: [
                    { icon: faBasketShopping, label: 'Coles', value: entry.coles },
                    { icon: faBasketShopping, label: 'Woolworths', value: entry.woolies },
                    { icon: faBasketShopping, label: 'ALDI', value: entry.aldi },
                    { icon: faStore, label: 'Shopping centre', value: entry.shoppingCenter },
                  ]},
                  { label: 'Food', tiles: [
                    { icon: faBurger, label: 'GYG', value: entry.gyg },
                  ]},
                ].map(group => {
                  const visible = group.tiles.filter(t => t.value && t.value !== "0");
                  if (visible.length === 0) return null;
                  return (
                    <div key={group.label}>
                      <p className="text-xs font-semibold uppercase tracking-tight text-gray-400 dark:text-gray-500 mb-2">{group.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {visible.map(t => <StatTile key={t.label} icon={t.icon} label={t.label} value={t.value} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offsets */}
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

        </div>

        {/* Score breakdown */}
        {breakdown.length > 0 && (
          <div>
            <SectionTitle>Score breakdown</SectionTitle>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              {breakdown.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`text-sm font-bold tabular-nums ${value > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {value > 0 ? "+" : ""}{value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-sm font-extrabold tabular-nums text-gray-900 dark:text-white">{score}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
