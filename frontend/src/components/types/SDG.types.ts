// ─── RAW CSV ROW ──────────────────────────────────────────────────────────────
// Mirrors the exact column layout of Master_SDG.csv.
// When switching to a DB, this is your SELECT result row shape.

export interface SDGRawRow {
  sdgGoal: number; // e.g. 1, 2, … 16   (the "SDG Goal" integer column)
  sdgGoalName: string; // e.g. "No Poverty"
  indicatorCode: string; // e.g. "SDG1.1.4.7"
  metricName: string; // full indicator/metric description
  geography: string; // e.g. "Wardha", "Arvi"
  level: "District" | "Taluka" | string;
  year: number;
  value: number;
  unit: string | null; // e.g. "%", "Number", null when absent
  source: string | null; // e.g. "MahaSDB"
  isProjected: boolean; // true when "Projected?" column is "YES"
}

// ─── PARSED / NORMALISED TYPES ────────────────────────────────────────────────

export type SDGNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17;

/** Static metadata about each SDG goal (used for the card display). */
export interface SDGMeta {
  id: SDGNumber;
  name: string; // Short display name, e.g. "No Poverty"
  fullLabel: string; // Canonical label, e.g. "SDG1 - No Poverty"
  color: string; // Official UN hex colour
  iconKey: string; // Maps to SVG icon registry
}

/** A single data point for a given indicator / location / year. */
export interface SDGDataPoint {
  indicatorCode: string;
  metricName: string;
  unit: string | null;
  geography: string;
  level: string;
  year: number;
  value: number;
  isProjected: boolean;
  source: string | null;
  // Note: CI bounds are not present in the current dataset.
  // Add ciLower / ciUpper here if the data source provides them in future.
}

/** All data belonging to one SDG goal. */
export interface SDGGoalData {
  meta: SDGMeta;
  /** Unique indicator codes tracked under this goal. */
  indicatorCodes: string[];
  /** Unique metric (indicator) names tracked under this goal. */
  indicatorNames: string[];
  /** Flat list of every data point for this goal. */
  dataPoints: SDGDataPoint[];
}

/** The complete parsed dataset, keyed by SDG number. */
export type SDGDataset = Map<SDGNumber, SDGGoalData>;

// ─── CARD DISPLAY MODEL ───────────────────────────────────────────────────────
// This is what SDGMain / the card component actually consumes.

export interface SDGCardModel {
  id: SDGNumber;
  name: string;
  color: string;
  iconKey: string;
  /** Count of distinct indicators (metric names) under this goal in the dataset. */
  indicatorCount: number;
  /** Distinct geographies found in the data for this goal. */
  locations: string[];
  /** Distinct levels (District / Taluka) present for this goal. */
  levels: string[];
  /** Year range present in the data for this goal. */
  yearRange: { min: number; max: number } | null;
}
