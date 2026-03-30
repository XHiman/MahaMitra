// ─── RAW CSV ROW ──────────────────────────────────────────────────────────────
// Mirrors the exact column layout of the source CSV / DB table.
// When switching to a DB, this is your SELECT result row shape.

export interface SDGRawRow {
  sdg: string;          // e.g. "SDG2 - Zero Hunger"
  indicator: string;    // full indicator name
  unit: string | null;  // e.g. "%", "Number", "Kg/Ha", null when absent
  location: string;     // e.g. "Wardha", "Arvi"
  year: number;
  value: number;
  is_projected: 0 | 1;  // 0 = observed, 1 = projected
  ci_lower: number | null;
  ci_upper: number | null;
}

// ─── PARSED / NORMALISED TYPES ────────────────────────────────────────────────

export type SDGNumber =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17;

/** Static metadata about each SDG goal (used for the card display). */
export interface SDGMeta {
  id: SDGNumber;
  name: string;          // Short display name, e.g. "No Poverty"
  fullLabel: string;     // Original label, e.g. "SDG1 - No Poverty"
  color: string;         // Official UN hex colour
  iconKey: string;       // Maps to SVG icon registry
}

/** A single data point for a given indicator / location / year. */
export interface SDGDataPoint {
  indicator: string;
  unit: string | null;
  location: string;
  year: number;
  value: number;
  isProjected: boolean;
  ciLower: number | null;
  ciUpper: number | null;
}

/** All data belonging to one SDG goal. */
export interface SDGGoalData {
  meta: SDGMeta;
  /** Unique indicator names tracked under this goal. */
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
  /** Count of distinct indicators under this goal in the dataset. */
  indicatorCount: number;
  /** Distinct locations found in the data for this goal. */
  locations: string[];
  /** Year range present in the data for this goal. */
  yearRange: { min: number; max: number } | null;
}