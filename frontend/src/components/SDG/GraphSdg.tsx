import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type FC,
  type CSSProperties,
} from "react";
import type { SDGDataPoint, SDGNumber } from "../types/SDG.types";
import "./GraphSdg.css";

// ─────────────────────────────────────────────────────────────────────────────
// SDG COLOUR THEMES  —  one pastel palette per goal
// Each theme: bg strip tint, actual-line colour, projected-line colour, dot fill
// ─────────────────────────────────────────────────────────────────────────────
const SDG_THEMES: Record<
  number,
  { bg: string; actual: string; projected: string; dot: string; muted: string }
> = {
  1: {
    bg: "#fff0f1",
    actual: "#e07a87",
    projected: "#f4b8c0",
    dot: "#e07a87",
    muted: "#f9d6da",
  },
  2: {
    bg: "#fffaf0",
    actual: "#c9963a",
    projected: "#e8c882",
    dot: "#c9963a",
    muted: "#f5e4be",
  },
  3: {
    bg: "#f2fbf0",
    actual: "#5a9e50",
    projected: "#a8d4a2",
    dot: "#5a9e50",
    muted: "#ceebc9",
  },
  4: {
    bg: "#fff2f2",
    actual: "#c0404e",
    projected: "#e89ca4",
    dot: "#c0404e",
    muted: "#f5c8cc",
  },
  5: {
    bg: "#fff3f0",
    actual: "#d9614f",
    projected: "#f0a898",
    dot: "#d9614f",
    muted: "#f9d3cc",
  },
  6: {
    bg: "#f0fbff",
    actual: "#3da0c7",
    projected: "#93d0e8",
    dot: "#3da0c7",
    muted: "#bfe8f5",
  },
  7: {
    bg: "#fffdf0",
    actual: "#c9a82a",
    projected: "#e6d07a",
    dot: "#c9a82a",
    muted: "#f5eaae",
  },
  8: {
    bg: "#fff0f5",
    actual: "#9e3058",
    projected: "#d48fa8",
    dot: "#9e3058",
    muted: "#f2cdd9",
  },
  9: {
    bg: "#fff6f0",
    actual: "#d4682a",
    projected: "#f0b080",
    dot: "#d4682a",
    muted: "#f8d9be",
  },
  10: {
    bg: "#fff0f8",
    actual: "#c03070",
    projected: "#e898c0",
    dot: "#c03070",
    muted: "#f5cce4",
  },
  11: {
    bg: "#fff8f0",
    actual: "#cc8030",
    projected: "#e8bc82",
    dot: "#cc8030",
    muted: "#f5e0c0",
  },
  12: {
    bg: "#fdf8f0",
    actual: "#9e7830",
    projected: "#d4b87a",
    dot: "#9e7830",
    muted: "#f0e0ba",
  },
  13: {
    bg: "#f0f8f2",
    actual: "#3a7840",
    projected: "#88c090",
    dot: "#3a7840",
    muted: "#bcdfc2",
  },
  14: {
    bg: "#f0f8ff",
    actual: "#2888c8",
    projected: "#80c0e8",
    dot: "#2888c8",
    muted: "#b8ddf5",
  },
  15: {
    bg: "#f2faf0",
    actual: "#5aaa40",
    projected: "#a0d890",
    dot: "#5aaa40",
    muted: "#ccebc0",
  },
  16: {
    bg: "#f0f6ff",
    actual: "#2870a8",
    projected: "#7ab0d8",
    dot: "#2870a8",
    muted: "#b8d4f0",
  },
  17: {
    bg: "#f0f4f8",
    actual: "#2a5070",
    projected: "#7aa0b8",
    dot: "#2a5070",
    muted: "#b8cedc",
  },
};

const DEFAULT_THEME = SDG_THEMES[1]!;

// ─────────────────────────────────────────────────────────────────────────────
// HIGHLIGHT YEARS
// ─────────────────────────────────────────────────────────────────────────────
const HIGHLIGHT_YEARS = new Set([2047, 2060]);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SeriesPoint {
  year: number;
  value: number;
  isProjected: boolean;
  isObservedAdvance?: boolean;
}

interface GraphSdgProps {
  /** SDG goal number — determines colour theme */
  sdgId: SDGNumber;
  /** Indicator metric name — used as the graph title */
  metricName: string;
  /** Unit string (e.g. "%", "Number") */
  unit: string | null;
  /** Data points already filtered to the right geography + level by parent */
  dataPoints: SDGDataPoint[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG CHART — renders a single indicator timeseries
// ─────────────────────────────────────────────────────────────────────────────

const W = 560;
const H = 200;
const PAD = { top: 24, right: 20, bottom: 36, left: 52 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function lerp(
  val: number,
  minV: number,
  maxV: number,
  minP: number,
  maxP: number,
) {
  if (maxV === minV) return (minP + maxP) / 2;
  return minP + ((val - minV) / (maxV - minV)) * (maxP - minP);
}

function fmtVal(v: number): string {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + "k";
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(1);
}

interface ChartSvgProps {
  series: SeriesPoint[];
  unit: string | null;
  theme: (typeof SDG_THEMES)[number];
  animated: boolean;
}

const ChartSvg: FC<ChartSvgProps> = ({ series, unit, theme, animated }) => {
  const sorted = [...series].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return null;

  const years = sorted.map((p) => p.year);
  const values = sorted.map((p) => p.value);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yPad = (maxY - minY) * 0.15 || 5;
  const yMin = minY - yPad;
  const yMax = maxY + yPad;

  const minX = Math.min(...years);
  const maxX = Math.max(...years);

  const px = (year: number) => lerp(year, minX, maxX, 0, INNER_W);
  const py = (val: number) => lerp(val, yMin, yMax, INNER_H, 0);

  // Split into actual and projected segments
  const actualPts = sorted.filter((p) => !p.isProjected);
  const projectedPts = sorted.filter((p) => p.isProjected);

  // Build a bridge point: last actual → first projected (for visual continuity)
  const lastActual = actualPts[actualPts.length - 1];
  const firstProjected = projectedPts[0];

  const toPath = (pts: SeriesPoint[]) =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${px(p.year).toFixed(1)} ${py(p.value).toFixed(1)}`,
      )
      .join(" ");

  const actualPath = toPath(actualPts);
  const projectedPath =
    lastActual && firstProjected
      ? `M ${px(lastActual.year).toFixed(1)} ${py(lastActual.value).toFixed(1)} L ${px(firstProjected.year).toFixed(1)} ${py(firstProjected.value).toFixed(1)} ` +
        projectedPts
          .slice(1)
          .map((p) => `L ${px(p.year).toFixed(1)} ${py(p.value).toFixed(1)}`)
          .join(" ")
      : toPath(projectedPts);

  // Y-axis ticks (4)
  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const v = yMin + ((yMax - yMin) * i) / 3;
    return { y: py(v), label: fmtVal(v) };
  });

  // X-axis ticks — show first, last, and key years
  const keyXYears = new Set(
    [minX, maxX, 2030, 2047, 2060].filter((y) => y >= minX && y <= maxX),
  );
  const xTicks = [...keyXYears]
    .sort((a, b) => a - b)
    .map((y) => ({ x: px(y), label: y.toString() }));

  // Special label points: first actual, 2047, 2060
  const labelPts = sorted.filter(
    (p, i) => i === 0 || HIGHLIGHT_YEARS.has(p.year),
  );

  const totalLen = 600; // rough path length for stroke-dasharray animation

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className="gsdg-svg"
      role="img"
    >
      <defs>
        {/* Actual area gradient */}
        <linearGradient
          id={`ag-${theme.actual.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={theme.actual} stopOpacity="0.18" />
          <stop offset="100%" stopColor={theme.actual} stopOpacity="0.02" />
        </linearGradient>
        {/* Projected area gradient */}
        <linearGradient
          id={`pg-${theme.projected.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={theme.projected} stopOpacity="0.14" />
          <stop offset="100%" stopColor={theme.projected} stopOpacity="0.01" />
        </linearGradient>

        {/* Clip for animation */}
        {animated && (
          <clipPath id="reveal-clip">
            <rect
              x="0"
              y="0"
              width={INNER_W}
              height={INNER_H}
              className="gsdg-reveal-clip"
            />
          </clipPath>
        )}
      </defs>

      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={0}
            y1={t.y.toFixed(1)}
            x2={INNER_W}
            y2={t.y.toFixed(1)}
            stroke={theme.muted}
            strokeWidth="1"
          />
        ))}

        {/* Projected fill area */}
        {projectedPts.length > 1 && (
          <path
            d={`${projectedPath} V ${INNER_H} L ${px(lastActual ? lastActual.year : projectedPts[0]!.year)} ${INNER_H} Z`}
            fill={`url(#pg-${theme.projected.replace("#", "")})`}
            className="gsdg-area"
          />
        )}

        {/* Actual fill area */}
        {actualPts.length > 1 && (
          <path
            d={`${actualPath} V ${INNER_H} L ${px(actualPts[0]!.year)} ${INNER_H} Z`}
            fill={`url(#ag-${theme.actual.replace("#", "")})`}
            className="gsdg-area"
          />
        )}

        {/* Projected line */}
        {projectedPts.length > 0 && (
          <path
            d={projectedPath}
            fill="none"
            stroke={theme.projected}
            strokeWidth="1.8"
            strokeDasharray="5 3"
            className={animated ? "gsdg-line-proj" : ""}
          />
        )}

        {/* Actual line */}
        {actualPts.length > 0 && (
          <path
            d={actualPath}
            fill="none"
            stroke={theme.actual}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animated ? "gsdg-line-actual" : ""}
            style={
              animated
                ? ({ "--line-len": `${totalLen}` } as CSSProperties)
                : undefined
            }
          />
        )}

        {/* Highlight year verticals */}
        {[...HIGHLIGHT_YEARS].map((hy) => {
          if (hy < minX || hy > maxX) return null;
          const x = px(hy);
          return (
            <line
              key={hy}
              x1={x.toFixed(1)}
              y1="0"
              x2={x.toFixed(1)}
              y2={INNER_H}
              stroke={theme.projected}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          );
        })}

        {/* Dots for special points */}
        {labelPts.map((p) => {
          const cx = px(p.year);
          const cy = py(p.value);
          const isHighlight = HIGHLIGHT_YEARS.has(p.year);
          return (
            <g
              key={`dot-${p.year}`}
              className={animated ? "gsdg-dot-enter" : ""}
            >
              <circle
                cx={cx.toFixed(1)}
                cy={cy.toFixed(1)}
                r="3.5"
                fill="white"
                stroke={p.isProjected ? theme.projected : theme.actual}
                strokeWidth="2"
              />
              {/* Value label */}
              <text
                x={(cx + 5).toFixed(1)}
                y={(cy - 6).toFixed(1)}
                fontSize="9"
                fill={p.isProjected ? theme.projected : theme.actual}
                fontFamily="'DM Mono', monospace"
                fontWeight="600"
              >
                {fmtVal(p.value)}
                {unit === "%" ? "%" : ""}
              </text>
              {/* Year label below dot for highlights */}
              {isHighlight && (
                <text
                  x={cx.toFixed(1)}
                  y={(cy + 16).toFixed(1)}
                  fontSize="8"
                  fill={theme.projected}
                  fontFamily="'DM Mono', monospace"
                  textAnchor="middle"
                  opacity="0.85"
                >
                  {p.year}
                </text>
              )}
            </g>
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x="-8"
            y={(t.y + 3.5).toFixed(1)}
            fontSize="8.5"
            textAnchor="end"
            fill="#888"
            fontFamily="'DM Mono', monospace"
          >
            {t.label}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={t.x.toFixed(1)}
            y={(INNER_H + 14).toFixed(1)}
            fontSize="8.5"
            textAnchor="middle"
            fill="#999"
            fontFamily="'DM Mono', monospace"
          >
            {t.label}
          </text>
        ))}

        {/* Unit label top-left */}
        {unit && (
          <text
            x="0"
            y="-8"
            fontSize="8"
            fill={theme.actual}
            fontFamily="'DM Mono', monospace"
            opacity="0.7"
          >
            {unit}
          </text>
        )}
      </g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGEND
// ─────────────────────────────────────────────────────────────────────────────

const Legend: FC<{
  theme: (typeof SDG_THEMES)[number];
  hasProjected: boolean;
}> = ({ theme, hasProjected }) => (
  <div className="gsdg-legend">
    <span className="gsdg-legend-item">
      <svg width="20" height="8">
        <line
          x1="0"
          y1="4"
          x2="20"
          y2="4"
          stroke={theme.actual}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      Actual
    </span>
    {hasProjected && (
      <span className="gsdg-legend-item">
        <svg width="20" height="8">
          <line
            x1="0"
            y1="4"
            x2="20"
            y2="4"
            stroke={theme.projected}
            strokeWidth="1.8"
            strokeDasharray="5 3"
          />
        </svg>
        Projected
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE INDICATOR CARD
// ─────────────────────────────────────────────────────────────────────────────

const IndicatorCard: FC<GraphSdgProps> = ({
  sdgId,
  metricName,
  unit,
  dataPoints,
}) => {
  const theme = SDG_THEMES[sdgId] ?? DEFAULT_THEME;
  const [fullscreen, setFullscreen] = useState(false);
  const [animated, setAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Build series
  const series: SeriesPoint[] = dataPoints
    .filter((p) => p.metricName === metricName)
    .map((p) => ({
      year: p.year,
      value: p.value,
      isProjected: p.isProjected,
    }))
    .sort((a, b) => a.year - b.year);

  const hasProjected = series.some((p) => p.isProjected);

  // Trigger animation on intersect
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setAnimated(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, []);

  // Download as SVG
  const handleDownload = useCallback(() => {
    const svgEl = cardRef.current?.querySelector("svg.gsdg-svg");
    if (!svgEl) return;
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SDG${sdgId}_${metricName.slice(0, 40).replace(/[^a-z0-9]/gi, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sdgId, metricName]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen((f) => !f);
  }, []);

  if (series.length === 0) return null;

  return (
    <>
      {/* Fullscreen backdrop */}
      {fullscreen && (
        <div className="gsdg-backdrop" onClick={toggleFullscreen} />
      )}

      <div
        ref={cardRef}
        className={`gsdg-card${fullscreen ? " gsdg-card--fullscreen" : ""}${animated ? " gsdg-card--animated" : ""}`}
        style={
          {
            "--theme-bg": theme.bg,
            "--theme-actual": theme.actual,
          } as CSSProperties
        }
      >
        {/* Header */}
        <div className="gsdg-card-header">
          <p className="gsdg-card-title">{metricName}</p>
          <div className="gsdg-card-actions">
            <button
              className="gsdg-action-btn"
              title="Download SVG"
              onClick={handleDownload}
              aria-label="Download chart as SVG"
            >
              <DownloadIcon />
            </button>
            <button
              className="gsdg-action-btn"
              title={fullscreen ? "Exit fullscreen" : "Expand"}
              onClick={toggleFullscreen}
              aria-label={
                fullscreen ? "Collapse chart" : "Expand chart to fullscreen"
              }
            >
              {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>
        </div>

        {/* Legend */}
        <Legend theme={theme} hasProjected={hasProjected} />

        {/* Chart */}
        <div className="gsdg-chart-wrap">
          <ChartSvg
            series={series}
            unit={unit}
            theme={theme}
            animated={animated}
          />
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────

const DownloadIcon: FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ExpandIcon: FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const CollapseIcon: FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="10" y1="14" x2="21" y2="3" />
    <line x1="3" y1="21" x2="14" y2="10" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH SDG — root export
// Renders all indicators for the given SDG goal + geography + level combo
// ─────────────────────────────────────────────────────────────────────────────

interface GraphSdgRootProps {
  sdgId: SDGNumber;
  /** All data points for this SDG goal — already filtered by geography/level
   *  in the parent (SDGDetail). Pass queryGoalData(...) result here. */
  dataPoints: SDGDataPoint[];
}

const GraphSdg: FC<GraphSdgRootProps> = ({ sdgId, dataPoints }) => {
  // Derive unique metrics preserving insertion order
  const metrics = [
    ...new Map(
      dataPoints.map((p) => [
        p.metricName,
        { name: p.metricName, unit: p.unit },
      ]),
    ).values(),
  ];

  if (metrics.length === 0) {
    return (
      <div className="gsdg-empty">
        No indicator data available for the selected geography.
      </div>
    );
  }

  return (
    <div className="gsdg-grid">
      {metrics.map((m) => (
        <IndicatorCard
          key={m.name}
          sdgId={sdgId}
          metricName={m.name}
          unit={m.unit}
          dataPoints={dataPoints}
        />
      ))}
    </div>
  );
};

export default GraphSdg;
