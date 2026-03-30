import type {
  SDGRawRow,
  SDGNumber,
  SDGMeta,
  SDGDataPoint,
  SDGDataset,
} from "../types/SDG.types";

// ─── STATIC SDG METADATA ──────────────────────────────────────────────────────
// Authoritative mapping from the "SDGn - ..." label in the CSV to display data.
// Add / update entries here when new goals arrive in the data.

const SDG_META_MAP: Record<string, SDGMeta> = {
  "SDG1 - No Poverty": {
    id: 1,
    name: "No Poverty",
    fullLabel: "SDG1 - No Poverty",
    color: "#E5243B",
    iconKey: "poverty",
  },
  "SDG2 - Zero Hunger": {
    id: 2,
    name: "Zero Hunger",
    fullLabel: "SDG2 - Zero Hunger",
    color: "#DDA63A",
    iconKey: "hunger",
  },
  "SDG3 - Good Health and Well-Being": {
    id: 3,
    name: "Good Health and Well-Being",
    fullLabel: "SDG3 - Good Health and Well-Being",
    color: "#4C9F38",
    iconKey: "health",
  },
  "SDG4 - Quality Education": {
    id: 4,
    name: "Quality Education",
    fullLabel: "SDG4 - Quality Education",
    color: "#C5192D",
    iconKey: "education",
  },
  "SDG5 - Gender Equality": {
    id: 5,
    name: "Gender Equality",
    fullLabel: "SDG5 - Gender Equality",
    color: "#FF3A21",
    iconKey: "gender",
  },
  "SDG6 - Clean Water & Sanitation": {
    id: 6,
    name: "Clean Water and Sanitation",
    fullLabel: "SDG6 - Clean Water & Sanitation",
    color: "#26BDE2",
    iconKey: "water",
  },
  "SDG7 - Affordable & Clean Energy": {
    id: 7,
    name: "Affordable and Clean Energy",
    fullLabel: "SDG7 - Affordable & Clean Energy",
    color: "#FCC30B",
    iconKey: "energy",
  },
  "SDG8 - Decent Work and Economic Growth": {
    id: 8,
    name: "Decent Work and Economic Growth",
    fullLabel: "SDG8 - Decent Work and Economic Growth",
    color: "#A21942",
    iconKey: "work",
  },
  "SDG9 - Industry, Innovation & Infrastructure": {
    id: 9,
    name: "Industry, Innovation and Infrastructure",
    fullLabel: "SDG9 - Industry, Innovation & Infrastructure",
    color: "#FD6925",
    iconKey: "industry",
  },
  "SDG10 - Reduced Inequalities": {
    id: 10,
    name: "Reduced Inequalities",
    fullLabel: "SDG10 - Reduced Inequalities",
    color: "#DD1367",
    iconKey: "inequality",
  },
  "SDG11 - Sustainable Cities and Communities": {
    id: 11,
    name: "Sustainable Cities and Communities",
    fullLabel: "SDG11 - Sustainable Cities and Communities",
    color: "#FD9D24",
    iconKey: "cities",
  },
  "SDG12 - Responsible Consumption & Production": {
    id: 12,
    name: "Responsible Consumption and Production",
    fullLabel: "SDG12 - Responsible Consumption & Production",
    color: "#BF8B2E",
    iconKey: "consumption",
  },
  "SDG13 - Climate Action": {
    id: 13,
    name: "Climate Action",
    fullLabel: "SDG13 - Climate Action",
    color: "#3F7E44",
    iconKey: "climate",
  },
  "SDG14 - Life Below Water": {
    id: 14,
    name: "Life Below Water",
    fullLabel: "SDG14 - Life Below Water",
    color: "#0A97D9",
    iconKey: "water_life",
  },
  "SDG15 - Life on Land": {
    id: 15,
    name: "Life on Land",
    fullLabel: "SDG15 - Life on Land",
    color: "#56C02B",
    iconKey: "land",
  },
  "SDG16 - Peace, Justice & Strong Institutions": {
    id: 16,
    name: "Peace, Justice and Strong Institutions",
    fullLabel: "SDG16 - Peace, Justice & Strong Institutions",
    color: "#00689D",
    iconKey: "peace",
  },
  "SDG17 - Partnerships for the Goals": {
    id: 17,
    name: "Partnerships for the Goals",
    fullLabel: "SDG17 - Partnerships for the Goals",
    color: "#19486A",
    iconKey: "partnership",
  },
};

// ─── PARSING HELPERS ──────────────────────────────────────────────────────────

/**
 * Parse a raw CSV text string into an array of SDGRawRow objects.
 *
 * Handles:
 *  - Header row (first line)
 *  - NaN / empty values for numeric fields → null
 *  - Whitespace trimming on all string fields
 *
 * NOTE: This parser assumes well-formed RFC-4180 CSV with no embedded newlines
 * inside quoted fields. For production use, replace with a hardened library
 * (e.g. Papa Parse) or swap the whole function for a DB query.
 */
export function parseSDGCsv(csvText: string): SDGRawRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]!);
  const rows: SDGRawRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const cells = splitCsvLine(line);
    const get = (col: string): string =>
      (cells[headers.indexOf(col)] ?? "").trim();

    const numOrNull = (val: string): number | null => {
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    const sdgLabel = get("sdg");
    const yearRaw = parseInt(get("year"), 10);

    // Skip rows we cannot place into a goal or that have no year
    if (!sdgLabel || isNaN(yearRaw)) continue;

    rows.push({
      sdg: sdgLabel,
      indicator: get("indicator"),
      unit: get("unit") || null,
      location: get("location"),
      year: yearRaw,
      value: numOrNull(get("value")) ?? 0,
      is_projected: get("is_projected") === "1" ? 1 : 0,
      ci_lower: numOrNull(get("ci_lower")),
      ci_upper: numOrNull(get("ci_upper")),
    });
  }

  return rows;
}

/**
 * Split a single CSV line respecting double-quoted fields.
 * A minimal implementation — swap for a library in production.
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── TRANSFORM: RAW ROWS → TYPED DATASET ─────────────────────────────────────

/**
 * Convert a flat list of SDGRawRow records (from CSV or DB) into a structured
 * SDGDataset keyed by goal number.
 *
 * Goals found in the data but absent from SDG_META_MAP are silently skipped so
 * the UI doesn't break when the DB contains unexpected / future goals.
 */
export function buildSDGDataset(rows: SDGRawRow[]): SDGDataset {
  const dataset: SDGDataset = new Map();

  for (const row of rows) {
    const meta = resolveSDGMeta(row.sdg);
    if (!meta) continue;

    const id = meta.id as SDGNumber;

    if (!dataset.has(id)) {
      dataset.set(id, {
        meta,
        indicatorNames: [],
        dataPoints: [],
      });
    }

    const goal = dataset.get(id)!;

    // Track unique indicator names
    if (!goal.indicatorNames.includes(row.indicator)) {
      goal.indicatorNames.push(row.indicator);
    }

    const dp: SDGDataPoint = {
      indicator: row.indicator,
      unit: row.unit,
      location: row.location,
      year: row.year,
      value: row.value,
      isProjected: row.is_projected === 1,
      ciLower: row.ci_lower,
      ciUpper: row.ci_upper,
    };

    goal.dataPoints.push(dp);
  }

  return dataset;
}

/**
 * Attempt to resolve a raw SDG label string to its SDGMeta entry.
 *
 * Handles slight variations in spacing / casing by trying:
 *  1. Exact match on the raw label
 *  2. Match on the "SDGn" prefix (e.g. "SDG2")
 */
function resolveSDGMeta(rawLabel: string): SDGMeta | null {
  const trimmed = rawLabel.trim();

  // 1. Exact match
  if (SDG_META_MAP[trimmed]) return SDG_META_MAP[trimmed]!;

  // 2. Prefix match — extract "SDGn" and find the corresponding entry
  const prefixMatch = trimmed.match(/^SDG(\d+)/i);
  if (prefixMatch) {
    const num = prefixMatch[1];
    const found = Object.values(SDG_META_MAP).find((m) =>
      m.fullLabel.startsWith(`SDG${num} `),
    );
    if (found) return found;
  }

  return null;
}
