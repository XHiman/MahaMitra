import type { SDGDataset, SDGCardModel, SDGNumber, SDGGoalData } from "../types/SDG.types";
import { parseSDGCsv, buildSDGDataset } from "./sdgCsvParser";

// ─── DATA SOURCE CONFIGURATION ────────────────────────────────────────────────
// Toggle between CSV (current) and DB (future) by swapping the implementation
// of `fetchRawRows` below. The rest of this module is source-agnostic.

/** Path to the CSV file when running in a local / Vite dev environment. */
const CSV_PATH = "/data/sdg_data_full.csv";

// ─── DB-READY FETCH LAYER ─────────────────────────────────────────────────────

/**
 * Primary data-fetch function.
 *
 * CURRENT:  reads the bundled CSV file.
 * TO SWITCH TO DB:  replace `fetchFromCSV` with `fetchFromDB` below, or with
 * your own API call.  The returned `SDGDataset` shape stays identical, so no
 * downstream components need changes.
 */
export async function fetchSDGDataset(): Promise<SDGDataset> {
  const rows = await fetchFromCSV(CSV_PATH);
  return buildSDGDataset(rows);
}

// ─── CSV IMPLEMENTATION ───────────────────────────────────────────────────────

async function fetchFromCSV(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(
      `Failed to load SDG CSV from "${path}": ${response.status} ${response.statusText}`
    );
  }
  const text = await response.text();
  return parseSDGCsv(text);
}

// ─── DB STUB (swap in when ready) ─────────────────────────────────────────────
// Replace the body with real DB / API logic when migrating off CSV.
//
// async function fetchFromDB() {
//   const response = await fetch("/api/sdg-data");
//   if (!response.ok) throw new Error("DB fetch failed");
//   // Server returns SDGRawRow[]
//   return (await response.json()) as SDGRawRow[];
// }

// ─── DERIVED VIEW: CARD MODELS ────────────────────────────────────────────────

/**
 * Derive the lightweight `SDGCardModel[]` array that SDGMain renders.
 *
 * Sorted by SDG number so the grid order always matches the UN ordering.
 * Extend or adjust the mapping here without touching the card component.
 */
export function deriveCardModels(dataset: SDGDataset): SDGCardModel[] {
  const allIds: SDGNumber[] = Array.from(dataset.keys()).sort((a, b) => a - b);

  return allIds.map((id) => {
    const goal = dataset.get(id) as SDGGoalData;
    const years = goal.dataPoints.map((d) => d.year);
    const locations = [...new Set(goal.dataPoints.map((d) => d.location))];

    return {
      id,
      name: goal.meta.name,
      color: goal.meta.color,
      iconKey: goal.meta.iconKey,
      indicatorCount: goal.indicatorNames.length,
      locations,
      yearRange:
        years.length > 0
          ? { min: Math.min(...years), max: Math.max(...years) }
          : null,
    };
  });
}

// ─── CONVENIENCE: SINGLE-GOAL LOOKUP ─────────────────────────────────────────

/**
 * Return all data points for a specific SDG, optionally filtered by location
 * and/or indicator name.
 */
export function queryGoalData(
  dataset: SDGDataset,
  sdgId: SDGNumber,
  opts?: { location?: string; indicator?: string; projectedOnly?: boolean }
) {
  const goal = dataset.get(sdgId);
  if (!goal) return [];

  let points = goal.dataPoints;

  if (opts?.location) {
    points = points.filter((p) => p.location === opts.location);
  }
  if (opts?.indicator) {
    points = points.filter((p) => p.indicator === opts.indicator);
  }
  if (opts?.projectedOnly) {
    points = points.filter((p) => p.isProjected);
  }

  return points;
}