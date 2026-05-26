import { Entry } from "./AddEntry";
import { calculateScore } from "./Score";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useTitle } from "../App";

type Props = {
  entry: Entry,
  onClose: () => void,
  onEdit: () => void,
}

const getScoreMeta = (score: number) => {
  if (score >= 800) return {
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-white/20 text-white",
    label: "Strong match",
  };
  if (score >= 650) return {
    gradient: "from-teal-400 to-cyan-500",
    badge: "bg-white/20 text-white",
    label: "Good match",
  };
  if (score >= 450) return {
    gradient: "from-sky-400 to-blue-500",
    badge: "bg-white/20 text-white",
    label: "Moderate match",
  };
  if (score >= 300) return {
    gradient: "from-amber-400 to-yellow-500",
    badge: "bg-white/20 text-white",
    label: "Decent match",
  };
  if (score >= 0) return {
    gradient: "from-orange-400 to-amber-500",
    badge: "bg-white/20 text-white",
    label: "Passable",
  };
  return {
    gradient: "from-red-500 to-rose-600",
    badge: "bg-white/20 text-white",
    label: "Bad match",
  };
};

function StatTile({ emoji, label, value }: { emoji: string, label: string, value: string | undefined }) {
  if (!value || value === "0" || value === "") return null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
      <span className="text-xl leading-none">{emoji}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{label}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{value}min</p>
      </div>
    </div>
  );
}

function FeatureChip({ emoji, label, value }: { emoji: string, label: string, value: boolean | undefined }) {
  if (value === undefined) return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
      value
        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"
        : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 line-through"
    }`}>
      <span className="text-base leading-none">{emoji}</span>
      {label}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 mt-8">{children}</h3>
  );
}

export default function PropertyDetail({ entry, onClose, onEdit }: Props) {
  const score = entry.score ?? calculateScore(entry);
  const meta = getScoreMeta(score);

  useTitle(entry.address || "Property");

  const hasTransit = entry.uniPT || entry.uniWalk || entry.uniDrive || entry.workPT || entry.workWalk || entry.workDrive || entry.trainWalk || entry.trainPT || entry.trainDrive;
  const hasNearby  = entry.coles || entry.woolies || entry.aldi || entry.gyg || entry.shoppingCenter;
  const hasFeatures = entry.isEnsuite !== undefined || entry.isKitchenPrivate !== undefined ||
                      entry.isFurnished !== undefined || entry.isSharehouse !== undefined ||
                      entry.hasAirCon !== undefined || entry.isPetsAllowed !== undefined;
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
              <p className="text-xs font-bold tracking-widest uppercase text-white/70 mb-2">✓ Inspected</p>
            )}
            <h1 className="text-2xl font-extrabold text-white leading-tight break-words drop-shadow-sm">
              {entry.address || "Unknown address"}
            </h1>
            {entry.suburb && (
              <p className="text-sm text-white/70 mt-1">{entry.suburb}</p>
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
                <span>🛏</span> {entry.bedrooms} bed
              </div>
            )}
            {entry.bathrooms && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>🚿</span> {entry.bathrooms} bath
              </div>
            )}
            {entry.carParks && entry.carParks !== "0" && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>🚗</span> {entry.carParks} park
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
                <FeatureChip emoji="🚿" label="Ensuite"         value={entry.isEnsuite} />
                <FeatureChip emoji="🍳" label="Private kitchen" value={entry.isKitchenPrivate} />
                <FeatureChip emoji="🛋️" label="Furnished"       value={entry.isFurnished} />
                <FeatureChip emoji="🏠" label="Whole place"     value={entry.isSharehouse === false ? true : entry.isSharehouse === true ? false : undefined} />
                <FeatureChip emoji="❄️" label="Air con"         value={entry.hasAirCon} />
                <FeatureChip emoji="🐾" label="Pets allowed"    value={entry.isPetsAllowed} />
              <FeatureChip emoji="🏠" label="Garage"          value={entry.hasGarage} />
              </div>
            </div>
          )}

          {/* Utilities */}
          {hasUtils && (
            <div>
              <SectionTitle>Utilities included</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                <FeatureChip emoji="⚡" label="Electricity" value={entry.hasElectricity} />
                <FeatureChip emoji="💧" label="Water"       value={entry.hasWater} />
                <FeatureChip emoji="📶" label="Internet"    value={entry.hasInternet} />
              </div>
            </div>
          )}

          {/* Transit */}
          {hasTransit && (
            <div>
              <SectionTitle>Transit</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <StatTile emoji="🚍" label="Uni — bus/train"  value={entry.uniPT} />
                <StatTile emoji="🚗" label="Uni — driving"    value={entry.uniDrive} />
                <StatTile emoji="🚍" label="Work — bus/train" value={entry.workPT} />
                <StatTile emoji="🚗" label="Work — driving"   value={entry.workDrive} />
                <StatTile emoji="🚶" label="Train — walking"   value={entry.trainWalk} />
                <StatTile emoji="🚍" label="Train — bus/train" value={entry.trainPT} />
                <StatTile emoji="🚗" label="Train — driving"  value={entry.trainDrive} />
              </div>
            </div>
          )}

          {/* Nearby */}
          {hasNearby && (
            <div>
              <SectionTitle>Nearby</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <StatTile emoji="🛒" label="Coles"           value={entry.coles} />
                <StatTile emoji="🛒" label="Woolworths"      value={entry.woolies} />
                <StatTile emoji="🛒" label="ALDI"            value={entry.aldi} />
                <StatTile emoji="🌮" label="GYG"             value={entry.gyg} />
                <StatTile emoji="🏬" label="Shopping centre" value={entry.shoppingCenter} />
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
      </div>
    </div>
  );
}
