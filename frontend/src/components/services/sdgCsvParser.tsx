import type {
  SDGRawRow,
  SDGNumber,
  SDGMeta,
  SDGDataPoint,
  SDGDataset,
} from "../types/SDG.types";

// ─── STATIC SDG METADATA ──────────────────────────────────────────────────────
// Authoritative mapping from the integer SDG Goal number to display data.
// Goal names are matched against the "SDG Goal Name" column in the CSV for
// validation; the display data here is the canonical source of truth.

const SDG_META_MAP: Record<number, SDGMeta> = {
  1: {
    id: 1,
    name: "No Poverty",
    fullLabel: "SDG1 - No Poverty",
    color: "#E5243B",
    iconKey: "poverty",
  },
  2: {
    id: 2,
    name: "Zero Hunger",
    fullLabel: "SDG2 - Zero Hunger",
    color: "#DDA63A",
    iconKey: "hunger",
  },
  3: {
    id: 3,
    name: "Good Health and Well-Being",
    fullLabel: "SDG3 - Good Health and Well-Being",
    color: "#4C9F38",
    iconKey: "health",
  },
  4: {
    id: 4,
    name: "Quality Education",
    fullLabel: "SDG4 - Quality Education",
    color: "#C5192D",
    iconKey: "education",
  },
  5: {
    id: 5,
    name: "Gender Equality",
    fullLabel: "SDG5 - Gender Equality",
    color: "#FF3A21",
    iconKey: "gender",
  },
  6: {
    id: 6,
    name: "Clean Water and Sanitation",
    fullLabel: "SDG6 - Clean Water & Sanitation",
    color: "#26BDE2",
    iconKey: "water",
  },
  7: {
    id: 7,
    name: "Affordable and Clean Energy",
    fullLabel: "SDG7 - Affordable & Clean Energy",
    color: "#FCC30B",
    iconKey: "energy",
  },
  8: {
    id: 8,
    name: "Decent Work and Economic Growth",
    fullLabel: "SDG8 - Decent Work and Economic Growth",
    color: "#A21942",
    iconKey: "work",
  },
  9: {
    id: 9,
    name: "Industry, Innovation and Infrastructure",
    fullLabel: "SDG9 - Industry, Innovation & Infrastructure",
    color: "#FD6925",
    iconKey: "industry",
  },
  10: {
    id: 10,
    name: "Reduced Inequalities",
    fullLabel: "SDG10 - Reduced Inequalities",
    color: "#DD1367",
    iconKey: "inequality",
  },
  11: {
    id: 11,
    name: "Sustainable Cities and Communities",
    fullLabel: "SDG11 - Sustainable Cities and Communities",
    color: "#FD9D24",
    iconKey: "cities",
  },
  12: {
    id: 12,
    name: "Responsible Consumption and Production",
    fullLabel: "SDG12 - Responsible Consumption & Production",
    color: "#BF8B2E",
    iconKey: "consumption",
  },
  13: {
    id: 13,
    name: "Climate Action",
    fullLabel: "SDG13 - Climate Action",
    color: "#3F7E44",
    iconKey: "climate",
  },
  14: {
    id: 14,
    name: "Life Below Water",
    fullLabel: "SDG14 - Life Below Water",
    color: "#0A97D9",
    iconKey: "water_life",
  },
  15: {
    id: 15,
    name: "Life on Land",
    fullLabel: "SDG15 - Life on Land",
    color: "#56C02B",
    iconKey: "land",
  },
  16: {
    id: 16,
    name: "Peace, Justice and Strong Institutions",
    fullLabel: "SDG16 - Peace, Justice & Strong Institutions",
    color: "#00689D",
    iconKey: "peace",
  },
  17: {
    id: 17,
    name: "Partnerships for the Goals",
    fullLabel: "SDG17 - Partnerships for the Goals",
    color: "#19486A",
    iconKey: "partnership",
  },
};

// ─── PROJECTED VALUE NORMALISATION ───────────────────────────────────────────
// The CSV "Projected?" column uses: "no" | "YES" | "observed_advance"
// Treat anything that is not explicitly "no" and not blank as projected.

function parseIsProjected(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "yes";
}

// ─── PARSING HELPERS ──────────────────────────────────────────────────────────

/**
 * Parse a raw CSV text string into an array of SDGRawRow objects.
 *
 * Handles:
 *  - Header row (first line) — columns must match Master_SDG.csv
 *  - NaN / empty values for numeric fields → null / 0
 *  - Whitespace trimming on all string fields
 *
 * Expected CSV columns (order-independent, matched by header name):
 *   SDG Goal | SDG Goal Name | Indicator Code | Metric Name |
 *   Geography | Level | Year | Value | Unit | Source | Projected?
 *
 * NOTE: This parser assumes well-formed RFC-4180 CSV with no embedded newlines
 * inside quoted fields. For production use, replace with a hardened library
 * (e.g. Papa Parse) or swap the whole function for a DB query.
 */
export function parseSDGCsv(csvText: string): SDGRawRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]!).map((h) => h.trim());
  const rows: SDGRawRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const cells = splitCsvLine(line);
    const get = (col: string): string =>
      (cells[headers.indexOf(col)] ?? "").trim();

    const sdgGoalRaw = parseInt(get("SDG Goal"), 10);
    const yearRaw = parseInt(get("Year"), 10);

    // Skip rows with no valid SDG goal number or year
    if (isNaN(sdgGoalRaw) || isNaN(yearRaw)) continue;

    const valueRaw = parseFloat(get("Value"));

    rows.push({
      sdgGoal: sdgGoalRaw,
      sdgGoalName: get("SDG Goal Name"),
      indicatorCode: get("Indicator Code"),
      metricName: get("Metric Name"),
      geography: get("Geography"),
      level: get("Level"),
      year: yearRaw,
      value: isNaN(valueRaw) ? 0 : valueRaw,
      unit: get("Unit") || null,
      source: get("Source") || null,
      isProjected: parseIsProjected(get("Projected?")),
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
 * the UI doesn't break when the source contains unexpected / future goals.
 */
export function buildSDGDataset(rows: SDGRawRow[]): SDGDataset {
  const dataset: SDGDataset = new Map();

  for (const row of rows) {
    const meta = SDG_META_MAP[row.sdgGoal];
    if (!meta) continue;

    const id = meta.id as SDGNumber;

    if (!dataset.has(id)) {
      dataset.set(id, {
        meta,
        indicatorCodes: [],
        indicatorNames: [],
        dataPoints: [],
      });
    }

    const goal = dataset.get(id)!;

    // Track unique indicator codes
    if (row.indicatorCode && !goal.indicatorCodes.includes(row.indicatorCode)) {
      goal.indicatorCodes.push(row.indicatorCode);
    }

    // Track unique metric (indicator) names
    if (row.metricName && !goal.indicatorNames.includes(row.metricName)) {
      goal.indicatorNames.push(row.metricName);
    }

    const dp: SDGDataPoint = {
      indicatorCode: row.indicatorCode,
      metricName: row.metricName,
      unit: row.unit,
      geography: row.geography,
      level: row.level,
      year: row.year,
      value: row.value,
      isProjected: row.isProjected,
      source: row.source,
    };

    goal.dataPoints.push(dp);
  }

  return dataset;
}
