import { useState, useEffect, useRef, useMemo, useCallback, type FC, memo } from "react";
import type { SDGCardModel, SDGDataset, SDGNumber } from "../types/SDG.types";
import {
  fetchSDGDataset,
  deriveCardModels,
  queryGoalData,
} from "../services/fetchSdgData";
import GraphSdg from "./GraphSdg";
import InteractiveMap from "./InteractiveMap";
import "./SDGMain.css";

// ─────────────────────────────────────────────────────────────────────────────
// STATIC METADATA
// ─────────────────────────────────────────────────────────────────────────────

const SDG_DESCRIPTIONS: Record<number, string> = {
  1: "End poverty in all its forms everywhere.",
  2: "End hunger, achieve food security and improved nutrition and promote sustainable agriculture.",
  3: "Ensure healthy lives and promote well-being for all at all ages.",
  4: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.",
  5: "Achieve gender equality and empower all women and girls.",
  6: "Ensure availability and sustainable management of water and sanitation for all.",
  7: "Ensure access to affordable, reliable, sustainable and modern energy for all.",
  8: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.",
  9: "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.",
  10: "Reduce inequality within and among countries.",
  11: "Make cities and human settlements inclusive, safe, resilient and sustainable.",
  12: "Ensure sustainable consumption and production patterns.",
  13: "Take urgent action to combat climate change and its impacts.",
  14: "Conserve and sustainably use the oceans, seas and marine resources for sustainable development.",
  15: "Protect, restore and promote sustainable use of terrestrial ecosystems.",
  16: "Promote peaceful and inclusive societies, provide access to justice for all and build effective, accountable institutions.",
  17: "Strengthen the means of implementation and revitalize the global partnership for sustainable development.",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — build District → Taluka map from the live dataset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive { district: taluka[] } from the loaded SDGDataset.
 * District rows have level="District"; Taluka rows have level="Taluka".
 * We collect all distinct District geographies as keys, then all Taluka
 * geographies as the values (alphabetically sorted).
 *
 * In the current CSV there is one district (Wardha) with two talukas
 * (Wardha, Arvi), but this will adapt automatically as the data grows.
 */
function buildDistrictTalukaMap(dataset: SDGDataset): Record<string, string[]> {
  const districts = new Set<string>();
  const talukas = new Set<string>();

  for (const goal of dataset.values()) {
    for (const dp of goal.dataPoints) {
      if (dp.level === "District") districts.add(dp.geography);
      if (dp.level === "Taluka") talukas.add(dp.geography);
    }
  }

  // Map every district to the full set of talukas.
  // (If the data ever has per-district taluka lists, refine here.)
  const talukaList = [...talukas].sort();
  const map: Record<string, string[]> = {};
  for (const d of districts) {
    map[d] = talukaList;
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// SDG CARD
// ─────────────────────────────────────────────────────────────────────────────

interface SDGCardProps {
  card: SDGCardModel;
  onClick: (card: SDGCardModel) => void;
}

const SDGCard = memo((props: SDGCardProps) => {
  const { card, onClick } = props;
  return (
  <div
    className="sdg-card"
    style={{ "--sdg-color": card.color } as React.CSSProperties}
    onClick={() => onClick(card)}
    role="button"
    tabIndex={0}
    aria-label={`SDG ${card.id}: ${card.name}`}
    onKeyDown={(e) => e.key === "Enter" && onClick(card)}
  >
    <div className="sdg-card-inner">
      {/* Number + name */}
      <div className="sdg-card-top">
        <span className="sdg-card-number">{card.id}</span>
        <span className="sdg-card-name">{card.name.toUpperCase()}</span>
      </div>

      {/* Icon — served from /public/icons/sdg/{iconKey}.svg */}
      <div className="sdg-card-icon" aria-hidden="true">
        <img
          src={`/icons/sdg/${card.iconKey}.svg`}
          alt=""
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Indicator count */}
      <div className="sdg-card-footer">
        <span className="sdg-card-count">{card.indicatorCount}</span>
        <span className="sdg-card-count-label">INDICATORS</span>
      </div>
    </div>
  </div>
  );
}) as FC<SDGCardProps>;

const SkeletonCard = memo(() => (
  <div className="sdg-card sdg-card--skeleton" aria-hidden="true" />
));

// ─────────────────────────────────────────────────────────────────────────────
// PILL NAV  —  scrollable row of SDG number buttons at the top of detail view
// ─────────────────────────────────────────────────────────────────────────────

interface SDGPillNavProps {
  cards: SDGCardModel[];
  activeId: SDGNumber | "all";
  onSelect: (id: SDGNumber | "all") => void;
}

const SDGPillNav = memo((props: SDGPillNavProps) => {
  const { cards, activeId, onSelect } = props;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>(
      `[data-sdg-id="${activeId}"]`,
    );
    active?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  return (
    <nav
      className="sdg-pill-nav"
      ref={scrollRef}
      aria-label="SDG quick navigation"
    >
      

      {cards.map((c) => (
        <button
          key={c.id}
          data-sdg-id={c.id}
          className={`sdg-pill${c.id === activeId ? " sdg-pill--active" : ""}`}
          style={{ "--pill-color": c.color } as React.CSSProperties}
          aria-current={c.id === activeId ? "page" : undefined}
          onClick={() => onSelect(c.id as SDGNumber)}
          title={`SDG ${c.id}: ${c.name}`}
        >
          <p>{c.id}</p>
          <img
            src={`/icons/sdg/${c.iconKey}.svg`}
            alt=""
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </button>
      ))}
      {/* All SDG Button */}
      <button
        key="all"
        data-sdg-id="all"
        className={`sdg-pill${activeId === "all" ? " sdg-pill--active" : ""}`}
        style={{ "--pill-color": "#666" } as React.CSSProperties}
        aria-current={activeId === "all" ? "page" : undefined}
        onClick={() => onSelect("all")}
        title="All SDG Indicators"
      >
        <p>All</p>
      </button>
    </nav>
  );
}) as FC<SDGPillNavProps>;

// ─────────────────────────────────────────────────────────────────────────────
// SDG DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────

interface SDGDetailProps {
  cards: SDGCardModel[];
  dataset: SDGDataset;
  districtTalukaMap: Record<string, string[]>;
  initialId: SDGNumber | "all";
  onBack: () => void;
  selectedLocation?: string;
}

const SDGDetail: FC<SDGDetailProps> = ({
  cards,
  dataset,
  districtTalukaMap,
  initialId,
  onBack,
  selectedLocation,
}) => {
  const [activeId, setActiveId] = useState<SDGNumber | "all">(initialId);

  const allDistricts = Object.keys(districtTalukaMap);
  
  // Detect if selectedLocation is a taluka or district
  const allTalukas = new Set(
    Object.values(districtTalukaMap).flat()
  );
  const isSelectedLocationTaluka = selectedLocation && allTalukas.has(selectedLocation);
  
  // Set initial district: if selectedLocation is a taluka, find its district; otherwise use as district
  const [district, setDistrict] = useState<string>(() => {
    if (selectedLocation && selectedLocation in districtTalukaMap) {
      return selectedLocation;
    }
    if (isSelectedLocationTaluka) {
      // Find district that contains this taluka
      for (const [d, talukas] of Object.entries(districtTalukaMap)) {
        if (talukas.includes(selectedLocation)) {
          return d;
        }
      }
    }
    return allDistricts[0] ?? "";
  });
  
  const [taluka, setTaluka] = useState<string>(() => {
    if (isSelectedLocationTaluka) {
      return selectedLocation;
    }
    return "";
  });

  // Reset taluka whenever district changes (only if taluka is not in new district's list)
  useEffect(() => {
    const currentTalukas = districtTalukaMap[district] ?? [];
    if (taluka && !currentTalukas.includes(taluka)) {
      setTaluka("");
    }
  }, [district, taluka, districtTalukaMap]);

  // Update district and taluka when selectedLocation changes from map click
  useEffect(() => {
    if (selectedLocation) {
      const isLocationTaluka = allTalukas.has(selectedLocation);
      
      if (selectedLocation in districtTalukaMap) {
        // It's a district
        setDistrict(selectedLocation);
        setTaluka("");
      } else if (isLocationTaluka) {
        // It's a taluka - find its district and set both
        for (const [d, talukas] of Object.entries(districtTalukaMap)) {
          if (talukas.includes(selectedLocation)) {
            setDistrict(d);
            setTaluka(selectedLocation);
            break;
          }
        }
      }
    }
  }, [selectedLocation, districtTalukaMap, allTalukas]);

  const card = activeId === "all" ? null : cards.find((c) => c.id === activeId);
  const talukas = districtTalukaMap[district] ?? [];
  const description = activeId === "all" ? "" : (SDG_DESCRIPTIONS[activeId] ?? "");

  // Derive filtered data points for GraphSdg.
  // When activeId is "all", show all indicators for the location
  const filteredPoints = useMemo(() => {
    if (activeId === "all") {
      if (taluka === "") {
        // All SDG for district
        return Array.from(dataset.values()).flatMap((goal) =>
          goal.dataPoints.filter(
            (dp) => dp.geography === district && dp.level === "District"
          )
        );
      }
      // All SDG for taluka
      return Array.from(dataset.values()).flatMap((goal) =>
        goal.dataPoints.filter(
          (dp) => dp.geography === taluka && dp.level === "Taluka"
        )
      );
    }
    if (!card) return [];
    if (taluka === "") {
      return queryGoalData(dataset, activeId, {
        geography: district,
        level: "District",
      });
    }
    return queryGoalData(dataset, activeId, {
      geography: taluka,
      level: "Taluka",
    });
  }, [dataset, activeId, district, taluka, card]);

  // Human-readable label for the GraphSdg empty state
  const geographyLabel = taluka ? `Taluka ${taluka}` : `${district} District`;

  // Allow rendering "all indicators" view even when card is null
  return (
    <section className="sdg-detail">
      {/* ── 1. Pill nav ──────────────────────────────────────────────────── */}
      <SDGPillNav cards={cards} activeId={activeId} onSelect={setActiveId} />

      {/* ── 2. Hero header (only for specific SDG, not "all") ───────────── */}
      {card && (
        <div
          className="sdg-detail-hero"
          style={{ "--hero-color": card.color } as React.CSSProperties}
        >
          {/* Back */}
          <button
            className="sdg-back-btn"
            onClick={onBack}
            aria-label="Back to all SDGs"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Goals
          </button>

          <div className="sdg-detail-hero-body">
            {/* Icon */}
            <div className="sdg-detail-hero-icon" aria-hidden="true">
              <img
                src={`/icons/sdg/${card.iconKey}.svg`}
                alt=""
                draggable={false}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Text */}
            <div className="sdg-detail-hero-text">
              <p className="sdg-detail-eyebrow">SDG {card.id}</p>
              <h2 className="sdg-detail-name">{card.name}</h2>
              <p className="sdg-detail-desc">{description}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Stats + filter bar ────────────────────────────────────────── */}
      <div className="sdg-detail-bar">
        {/* Total indicators (only for specific SDG) */}
        {card && (
          <>
            <div className="sdg-stat">
              <span className="sdg-stat-value" style={{ color: card.color }}>
                {card.indicatorCount}
              </span>
              <span className="sdg-stat-label">Total Indicators</span>
            </div>

            <div className="sdg-bar-divider" />
          </>
        )}

        {/* District */}
        <div className="sdg-filter-group">
          <label className="sdg-filter-label" htmlFor="sdg-district">
            District
          </label>
          <div className="sdg-select-wrap">
            <select
              id="sdg-district"
              className="sdg-select"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              {allDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>
        </div>

        {/* Taluka */}
        <div className="sdg-filter-group">
          <label className="sdg-filter-label" htmlFor="sdg-taluka">
            Taluka
          </label>
          <div className="sdg-select-wrap">
            <select
              id="sdg-taluka"
              className="sdg-select"
              value={taluka}
              onChange={(e) => setTaluka(e.target.value)}
              disabled={talukas.length === 0}
            >
              {/* "All" shows district-level aggregate data */}
              <option value="">All</option>
              {talukas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>
        </div>

        {/* Data-available chips (only for specific SDG) */}
        {card && card.locations.length > 0 && (
          <>
            <div className="sdg-bar-divider" />
            <div className="sdg-filter-group">
              <span className="sdg-filter-label">Data in</span>
              <div className="sdg-location-chips">
                {card.locations.map((loc) => (
                  <span key={loc} className="sdg-chip">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 4. Content area ──────────────────────────────────────────────── */}
      <div className="sdg-detail-content">
        <p className="sdg-content-hint">
          Showing data for{" "}
          <strong>
            {district}
            {taluka ? ` › ${taluka}` : " (District)"}
          </strong>
        </p>

        {activeId === "all" ? (
          <div className="sdg-all-indicators">
            <h3 className="sdg-all-title">All Goals - All Indicators</h3>
            <div className="sdg-all-grid">
              {cards.map((sdgCard) => {
                // Filter dataPoints to only include the current SDG
                const sdgData = dataset.get(sdgCard.id as SDGNumber);
                const sdgDataPoints = sdgData
                  ? filteredPoints.filter((dp) =>
                      sdgData.dataPoints.some(
                        (gp) => gp.metricName === dp.metricName
                      )
                    )
                  : [];

                return (
                  <div key={sdgCard.id} className="sdg-all-card">
                    <div className="sdg-all-card-header">
                      <h4>SDG {sdgCard.id}</h4>
                    </div>
                    <GraphSdg
                      sdgId={sdgCard.id as SDGNumber}
                      dataPoints={sdgDataPoints}
                      geography={geographyLabel}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <GraphSdg
            sdgId={activeId}
            dataPoints={filteredPoints}
            geography={geographyLabel}
          />
        )}
      </div>
    </section>
  );
};

// Small inline chevron used by both selects
const ChevronIcon: FC = () => (
  <svg
    className="sdg-select-chevron"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — SDGMain
// ─────────────────────────────────────────────────────────────────────────────

const SDGMain: FC = () => {
  const [dataset, setDataset] = useState<SDGDataset>(new Map());
  const [cards, setCards] = useState<SDGCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSDG, setActiveSDG] = useState<SDGNumber | "all" | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Derived once after data loads — District → Taluka[] map from the CSV
  const districtTalukaMap = useMemo(
    () => buildDistrictTalukaMap(dataset),
    [dataset],
  );

  // Handle location click from map - memoized to prevent unnecessary re-renders
  const handleLocationClick = useCallback(
    (locationName: string, district?: string, taluka?: string) => {
      const allDistricts = Object.keys(districtTalukaMap);
      
      // If taluka is provided, use it; otherwise use district
      if (taluka) {
        setSelectedLocation(taluka);
      } else if (district && districtTalukaMap[district]) {
        setSelectedLocation(district);
      } else if (allDistricts.length > 0) {
        setSelectedLocation(allDistricts[0]);
        console.warn(
          `Location "${locationName}" not found in dataset. Using "${allDistricts[0]}" as fallback.`,
        );
      }
      
      setActiveSDG(1);
    },
    [districtTalukaMap],
  );

  useEffect(() => {
    let cancelled = false;
    fetchSDGDataset()
      .then((ds) => {
        if (cancelled) return;
        setDataset(ds);
        setCards(deriveCardModels(ds));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load SDG data.",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Detail view ─────────────────────────────────────────────────────────
  if (activeSDG !== null && cards.length > 0) {
    return (
      <main className="sdg-main">
        <SDGDetail
          cards={cards}
          dataset={dataset}
          districtTalukaMap={districtTalukaMap}
          initialId={activeSDG}
          onBack={() => setActiveSDG(null)}
          selectedLocation={selectedLocation}
        />
      </main>
    );
  }

  // ── Cards grid ──────────────────────────────────────────────────────────
  return (
    <main className="sdg-main">
      <header className="sdg-main-header">
        <h1 className="sdg-main-title">Sustainable Development Goals</h1>
        <p className="sdg-main-sub">
          UN 2030 Agenda · 17 Goals · Global Indicators
        </p>
      </header>
      <div className="sdg-content">
        <div className="sdgcards">
          {error && (
            <div className="sdg-error" role="alert">
              <strong>Could not load SDG data</strong>
              <span>{error}</span>
            </div>
          )}

          {loading &&
            !error &&
            Array.from({ length: 17 }, (_, i) => <SkeletonCard key={i} />)}

          {!loading &&
            !error &&
            cards.map((card) => (
              <SDGCard
                key={card.id}
                card={card}
                onClick={(c) => setActiveSDG(c.id as SDGNumber)}
              />
            ))}
        </div>
        <div className="sdgmap">
          <InteractiveMap
            onLocationClick={handleLocationClick}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    </main>
  );
};

export default SDGMain;
