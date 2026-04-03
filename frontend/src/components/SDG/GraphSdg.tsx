import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type FC,
  type CSSProperties,
  memo,
  useMemo,
} from "react";
import type { SDGDataPoint, SDGNumber } from "../types/SDG.types";
import "./GraphSdg.css";

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL SDG COLOURS  (UN canonical hex, one per goal)
// ─────────────────────────────────────────────────────────────────────────────
const SDG_COLORS: Record<number, string> = {
  1: "#E5243B",
  2: "#DDA63A",
  3: "#4C9F38",
  4: "#C5192D",
  5: "#FF3A21",
  6: "#26BDE2",
  7: "#FCC30B",
  8: "#A21942",
  9: "#FD6925",
  10: "#DD1367",
  11: "#FD9D24",
  12: "#BF8B2E",
  13: "#3F7E44",
  14: "#0A97D9",
  15: "#56C02B",
  16: "#00689D",
  17: "#19486A",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function blendToWhite(r: number, g: number, b: number, alpha: number): string {
  const mix = (c: number) => Math.round(c * alpha + 255 * (1 - alpha));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

interface SDGTheme {
  bg: string;
  actual: string;
  projected: string;
  dot: string;
  muted: string;
  faint: string;
}

// Precompute all themes at module initialization for O(1) lookup
const precomputedThemes = (() => {
  const themes: Record<number, SDGTheme> = {};
  for (const [sdgIdStr, hex] of Object.entries(SDG_COLORS)) {
    const sdgId = Number(sdgIdStr);
    const [r, g, b] = hexToRgb(hex);
    themes[sdgId] = {
      bg: "#ffffff",
      actual: hex,
      projected: blendToWhite(r, g, b, 0.55),
      dot: hex,
      muted: blendToWhite(r, g, b, 0.18),
      faint: blendToWhite(r, g, b, 0.07),
    };
  }
  return themes;
})();

function getTheme(sdgId: number): SDGTheme {
  return precomputedThemes[sdgId] ?? precomputedThemes[1]!;
}

const HIGHLIGHT_YEARS = Object.freeze(new Set([2047, 2060]));

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SeriesPoint {
  year: number;
  value: number;
  isProjected: boolean;
}

interface GraphSdgProps {
  sdgId: SDGNumber;
  metricName: string;
  unit: string | null;
  dataPoints: SDGDataPoint[];
  /** Indicator code (e.g. "1.1.1") — shown in expanded / card view */
  indicatorCode?: string;
  /** Source string — shown in expanded / card view */
  source?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG CHART — compact (card) and expanded (modal) variants
// ─────────────────────────────────────────────────────────────────────────────

const W_COMPACT = 560;
const H_COMPACT = 200;
const W_EXPANDED = 900;
const H_EXPANDED = 340;
const PAD_COMPACT = { top: 28, right: 24, bottom: 40, left: 56 };
const PAD_EXPANDED = { top: 40, right: 48, bottom: 56, left: 72 };

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
  theme: SDGTheme;
  animated: boolean;
  expanded?: boolean;
}

const ChartSvg = memo(
  (props: ChartSvgProps) => {
    const { series, unit, theme, animated, expanded = false } = props;
  const sorted = [...series].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return null;

  const W = expanded ? W_EXPANDED : W_COMPACT;
  const H = expanded ? H_EXPANDED : H_COMPACT;
  const PAD = expanded ? PAD_EXPANDED : PAD_COMPACT;
  const INNER_W = W - PAD.left - PAD.right;
  const INNER_H = H - PAD.top - PAD.bottom;

  const years = sorted.map((p) => p.year);
  const values = sorted.map((p) => p.value);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yPad = (maxY - minY) * 0.18 || 5;
  const yMin = minY - yPad;
  const yMax = maxY + yPad;
  const minX = Math.min(...years);
  const maxX = Math.max(...years);

  const px = (year: number) => lerp(year, minX, maxX, 0, INNER_W);
  const py = (val: number) => lerp(val, yMin, yMax, INNER_H, 0);

  const actualPts = sorted.filter((p) => !p.isProjected);
  const projectedPts = sorted.filter((p) => p.isProjected);
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

  // Area fill paths
  const areaActual =
    actualPts.length > 1
      ? `${actualPath} L ${px(actualPts[actualPts.length - 1]!.year)} ${INNER_H} L ${px(actualPts[0]!.year)} ${INNER_H} Z`
      : "";
  const areaProj =
    projectedPts.length > 1
      ? `${projectedPath} L ${px(projectedPts[projectedPts.length - 1]!.year)} ${INNER_H} L ${px(lastActual ? lastActual.year : projectedPts[0]!.year)} ${INNER_H} Z`
      : "";

  const tickCount = expanded ? 6 : 4;
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const v = yMin + ((yMax - yMin) * i) / (tickCount - 1);
    return { y: py(v), label: fmtVal(v) };
  });

  const keyXYears = new Set(
    [minX, maxX, 2030, 2047, 2060].filter((y) => y >= minX && y <= maxX),
  );
  // For expanded: add intermediate years every ~10 yrs
  if (expanded) {
    for (let y = Math.ceil(minX / 5) * 5; y <= maxX; y += 5) {
      if (y > minX && y < maxX) keyXYears.add(y);
    }
  }
  const xTicks = [...keyXYears]
    .sort((a, b) => a - b)
    .map((y) => ({ x: px(y), label: y.toString() }));

  const labelPts = sorted.filter(
    (p, i) => i === 0 || i === sorted.length - 1 || HIGHLIGHT_YEARS.has(p.year),
  );
  const actualGradId = `ag-${theme.actual.replace("#", "")}${expanded ? "-ex" : ""}`;
  const projGradId = `pg-${theme.projected.replace(/[^a-z0-9]/gi, "")}${expanded ? "-ex" : ""}`;
  const clipId = `clip-${theme.actual.replace("#", "")}${expanded ? "-ex" : ""}`;

  const fontSize = expanded ? 11 : 8.5;
  const dotR = expanded ? 5 : 3.5;
  const strokeW = expanded ? 2.5 : 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`gsdg-svg${expanded ? " gsdg-svg--expanded" : ""}`}
      role="img"
    >
      <defs>
        <linearGradient id={actualGradId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={theme.actual}
            stopOpacity={expanded ? "0.22" : "0.15"}
          />
          <stop offset="100%" stopColor={theme.actual} stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id={projGradId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={theme.projected}
            stopOpacity={expanded ? "0.15" : "0.10"}
          />
          <stop offset="100%" stopColor={theme.projected} stopOpacity="0.01" />
        </linearGradient>
        {animated && (
          <clipPath id={clipId}>
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
        {/* ── Background subtle tint ── */}
        <rect
          x="0"
          y="0"
          width={INNER_W}
          height={INNER_H}
          fill="#ffffff"
          rx="2"
        />

        {/* ── Grid lines ── */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={0}
            y1={t.y.toFixed(1)}
            x2={INNER_W}
            y2={t.y.toFixed(1)}
            stroke="#D8DCE4"
            strokeWidth={i === 0 ? "0" : "0.7"}
            strokeDasharray={i === yTicks.length - 1 ? "0" : "4 3"}
            opacity="0.8"
          />
        ))}

        {/* ── Y-axis line ── */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={INNER_H}
          stroke="#C8CDD8"
          strokeWidth="1"
        />

        {/* ── X baseline ── */}
        <line
          x1={0}
          y1={INNER_H}
          x2={INNER_W}
          y2={INNER_H}
          stroke="#C8CDD8"
          strokeWidth="1"
        />

        {/* ── Highlight year verticals ── */}
        {[...HIGHLIGHT_YEARS].map((hy) => {
          if (hy < minX || hy > maxX) return null;
          const x = px(hy);
          return (
            <g key={hy}>
              <line
                x1={x.toFixed(1)}
                y1="0"
                x2={x.toFixed(1)}
                y2={INNER_H}
                stroke={theme.actual}
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              {expanded && (
                <text
                  x={(x + 4).toFixed(1)}
                  y="12"
                  fontSize="9"
                  fill={theme.actual}
                  fontFamily="'DM Mono', monospace"
                  opacity="0.6"
                >
                  {hy}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Area fills ── */}
        {areaActual && (
          <path
            d={areaActual}
            fill={`url(#${actualGradId})`}
            className="gsdg-area"
          />
        )}
        {areaProj && (
          <path
            d={areaProj}
            fill={`url(#${projGradId})`}
            className="gsdg-area"
          />
        )}

        {/* ── Projected line ── */}
        {projectedPts.length > 0 && (
          <path
            d={projectedPath}
            fill="none"
            stroke={theme.projected}
            strokeWidth={strokeW - 0.4}
            strokeDasharray={expanded ? "7 4" : "5 3"}
            strokeLinecap="round"
            opacity="0.85"
            className={animated ? "gsdg-line-proj" : ""}
          />
        )}

        {/* ── Actual line ── */}
        {actualPts.length > 0 && (
          <path
            d={actualPath}
            fill="none"
            stroke={theme.actual}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animated ? "gsdg-line-actual" : ""}
            style={
              animated ? ({ "--line-len": "800" } as CSSProperties) : undefined
            }
          />
        )}

        {/* ── Dots for key points ── */}
        {labelPts.map((p) => {
          const cx = px(p.year);
          const cy = py(p.value);
          const color = p.isProjected ? theme.projected : theme.actual;
          return (
            <g
              key={`dot-${p.year}`}
              className={animated ? "gsdg-dot-enter" : ""}
            >
              <circle
                cx={cx.toFixed(1)}
                cy={cy.toFixed(1)}
                r={dotR + 2}
                fill={color}
                opacity="0.12"
              />
              <circle
                cx={cx.toFixed(1)}
                cy={cy.toFixed(1)}
                r={dotR}
                fill="white"
                stroke={color}
                strokeWidth={expanded ? 2.5 : 2}
              />
              <text
                x={(cx + (expanded ? 8 : 6)).toFixed(1)}
                y={(cy - (expanded ? 10 : 7)).toFixed(1)}
                fontSize={expanded ? 10 : 9}
                fill={color}
                fontFamily="'DM Mono', monospace"
                fontWeight="600"
              >
                {fmtVal(p.value)}
                {unit === "%" ? "%" : ""}
              </text>
            </g>
          );
        })}

        {/* ── Y-axis labels ── */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={-10}
            y={(t.y + 4).toFixed(1)}
            fontSize={fontSize}
            textAnchor="end"
            fill="#8892A4"
            fontFamily="'DM Mono', monospace"
            letterSpacing="-0.3"
          >
            {t.label}
          </text>
        ))}

        {/* ── X-axis labels ── */}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={t.x.toFixed(1)}
            y={(INNER_H + (expanded ? 18 : 14)).toFixed(1)}
            fontSize={fontSize}
            textAnchor="middle"
            fill="#8892A4"
            fontFamily="'DM Mono', monospace"
          >
            {t.label}
          </text>
        ))}
      </g>

      {/* ── Y-axis label ── */}
      <text
        x={-100}
        y={0}
        fontSize={expanded ? 10 : 8}
            fill={theme.actual}
            fontFamily="'DM Mono', monospace"
            fontWeight="600"
            opacity="0.8"
        textAnchor="middle"
        transform={`rotate(-90, ${PAD.top}, 20)`}
        letterSpacing="-0.3"
      >
        {unit}
      </text>
    </svg>
  );
  },
) as FC<ChartSvgProps>;

// ─────────────────────────────────────────────────────────────────────────────
// SPARSE DATA CARD  (≤ 2 distinct years → show as stat card, not graph)
// ─────────────────────────────────────────────────────────────────────────────

interface SparseCardProps {
  sdgId: SDGNumber;
  metricName: string;
  unit: string | null;
  series: SeriesPoint[];
  indicatorCode?: string;
  source?: string;
}

const SparseDataCard = memo((props: SparseCardProps) => {
  const { sdgId, metricName, series, unit, indicatorCode, source } = props;
  const theme = useMemo(() => getTheme(sdgId), [sdgId]);
  const sorted = useMemo(() => [...series].sort((a, b) => a.year - b.year), [series]);
  const latest = useMemo(() => sorted[sorted.length - 1], [sorted]);
  const earliest = useMemo(() => sorted[0], [sorted]);
  const hasDelta = useMemo(
    () => sorted.length >= 2 && latest && earliest && latest !== earliest,
    [sorted, latest, earliest],
  );
  const delta = useMemo(() => (hasDelta ? latest!.value - earliest!.value : null), [hasDelta, latest, earliest]);
  const deltaPositive = useMemo(() => delta !== null && delta >= 0, [delta]);

  return (
    <>
      <div
        className={"gsdg-sparse-card"}
        style={
          {
            "--theme-actual": theme.actual,
            "--theme-faint": theme.faint,
          } as CSSProperties
        }
      >
        {/* Top accent bar */}
        <div
          className="gsdg-sparse-accent"
          style={{ background: theme.actual }}
        />

        {/* Header */}
        <div className="gsdg-sparse-header">
          <p className="gsdg-sparse-title">{metricName}</p>
        </div>

        {/* Stats */}
        <div className="gsdg-sparse-stats">
          {sorted.map((p) => (
            <div className="gsdg-sparse-stat" key={p.year}>
              <span className="gsdg-sparse-year">
                {p.year}
                {p.isProjected ? " ◌" : ""}
              </span>
              <span
                className="gsdg-sparse-value"
                style={{ color: theme.actual }}
              >
                {fmtVal(p.value)}
                {unit === "%" ? "%" : ""}
              </span>
            </div>
          ))}

          {hasDelta && delta !== null && (
            <div className="gsdg-sparse-delta">
              <span
                className={`gsdg-delta-badge${deltaPositive ? " gsdg-delta-badge--pos" : " gsdg-delta-badge--neg"}`}
              >
                {deltaPositive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
              </span>
              <span className="gsdg-delta-label">change</span>
            </div>
          )}
        </div>
        <div className="gsdg-meta-panel">
          {indicatorCode && (
            <div className="gsdg-meta-row">
              <span className="gsdg-meta-key">Indicator Code</span>
              <span className="gsdg-meta-val">{indicatorCode}</span>
            </div>
          )}
          {source && (
            <div className="gsdg-meta-row">
              <span className="gsdg-meta-key">Source</span>
              <span className="gsdg-meta-val">{source}</span>
            </div>
          )}
          {/* <div className="gsdg-meta-row">
            <span className="gsdg-meta-key">Data Points</span>
            <span className="gsdg-meta-val">
              {series.length} observation{series.length !== 1 ? "s" : ""}
            </span>
          </div> */}
          <p className="gsdg-sparse-note">
            More Data Needed to show trend <br /> (≥ 3 distinct years)
          </p>
        </div>
      </div>
    </>
  );
}) as FC<SparseCardProps>;

// ─────────────────────────────────────────────────────────────────────────────
// LEGEND
// ─────────────────────────────────────────────────────────────────────────────

const Legend = memo((props: {
  theme: SDGTheme;
  hasProjected: boolean;
  expanded?: boolean;
}) => {
  const { theme, hasProjected, expanded } = props;
  return (
  <div className={`gsdg-legend${expanded ? " gsdg-legend--expanded" : ""}`}>
    <span className="gsdg-legend-item">
      <svg width="24" height="10">
        <line
          x1="0"
          y1="5"
          x2="24"
          y2="5"
          stroke={theme.actual}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="5"
          r="3"
          fill="white"
          stroke={theme.actual}
          strokeWidth="2"
        />
      </svg>
      Actual
    </span>
    {hasProjected && (
      <span className="gsdg-legend-item">
        <svg width="24" height="10">
          <line
            x1="0"
            y1="5"
            x2="24"
            y2="5"
            stroke={theme.projected}
            strokeWidth="2"
            strokeDasharray="6 3"
          />
        </svg>
        Projected
      </span>
    )}
    {expanded && (
      <span className="gsdg-legend-item gsdg-legend-item--muted">
        <svg width="10" height="10">
          <circle
            cx="5"
            cy="5"
            r="4"
            fill="none"
            stroke="#aaa"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        </svg>
        ◌ Projected year
      </span>
    )}
  </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE INDICATOR CARD  (rich graph version — > 2 years of data)
// ─────────────────────────────────────────────────────────────────────────────

const IndicatorCard = memo((props: GraphSdgProps) => {
  const { sdgId, metricName, unit, dataPoints, indicatorCode, source } = props;
  const theme = useMemo(() => getTheme(sdgId), [sdgId]);
  const [fullscreen, setFullscreen] = useState(false);
  const [animated, setAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const series: SeriesPoint[] = useMemo(() => {
    return dataPoints
      .filter((p) => p.metricName === metricName)
      .map((p) => ({ year: p.year, value: p.value, isProjected: p.isProjected }))
      .sort((a, b) => a.year - b.year);
  }, [dataPoints, metricName]);

  // ── Sparse path: ≤ 2 distinct years ─────────────────────────────────────
  const distinctYears = useMemo(() => new Set(series.map((p) => p.year)).size, [series]);

  const hasProjected = series.some((p) => p.isProjected);
  const latestPt = [...series].sort((a, b) => b.year - a.year)[0];

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

  const toggleFullscreen = useCallback(() => setFullscreen((f) => !f), []);

  // ── Early returns AFTER all hooks ──────────────────────────────────────
  if (distinctYears <= 2) {
    return (
      <SparseDataCard
        sdgId={sdgId}
        metricName={metricName}
        unit={unit}
        series={series}
        indicatorCode={indicatorCode}
        source={source}
      />
    );
  }

  if (series.length === 0) return null;

  return (
    <>
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
        {/* Left accent stripe */}
        <div
          className="gsdg-card-stripe"
          style={{ background: theme.actual }}
        />

        {/* Header */}
        <div className="gsdg-card-header">
          <div className="gsdg-card-title-group">
            <p className="gsdg-card-title">{metricName}</p>
            {latestPt && (
              <span
                className="gsdg-card-latest"
                style={{ color: theme.actual }}
              >
                {fmtVal(latestPt.value)}
                {unit === "%" ? "%" : ""}{" "}
                <span className="gsdg-card-latest-yr">({latestPt.year})</span>
              </span>
            )}
          </div>
          <div className="gsdg-card-actions">
            <button
              className="gsdg-action-btn"
              title="Download SVG"
              onClick={handleDownload}
              aria-label="Download chart"
            >
              <DownloadIcon />
            </button>
            <button
              className="gsdg-action-btn"
              title={fullscreen ? "Collapse" : "Expand"}
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Collapse chart" : "Expand chart"}
            >
              {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          </div>
        </div>

        {/* Legend */}
        <Legend
          theme={theme}
          hasProjected={hasProjected}
          expanded={fullscreen}
        />

        {/* Chart */}
        <div className="gsdg-chart-wrap">
          <ChartSvg
            series={series}
            unit={unit}
            theme={theme}
            animated={animated}
            expanded={fullscreen}
          />
        </div>

        {/* Expanded meta panel */}
        {fullscreen && (
          <div className="gsdg-meta-panel gsdg-meta-panel--inline">
            {indicatorCode && (
              <div className="gsdg-meta-row">
                <span className="gsdg-meta-key">Indicator Code</span>
                <span className="gsdg-meta-val">{indicatorCode}</span>
              </div>
            )}
            {source && (
              <div className="gsdg-meta-row">
                <span className="gsdg-meta-key">Source</span>
                <span className="gsdg-meta-val">{source}</span>
              </div>
            )}
            <div className="gsdg-meta-row">
              <span className="gsdg-meta-key">Data Points</span>
              <span className="gsdg-meta-val">
                {series.length} observations ·{" "}
                {new Set(series.map((p) => p.year)).size} years
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}) as FC<GraphSdgProps>;

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────

const DownloadIcon = memo(() => (
  <svg
    width="14"
    height="14"
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
));

const ExpandIcon = memo(() => (
  <svg
    width="14"
    height="14"
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
));

const CollapseIcon = memo(() => (
  <svg
    width="14"
    height="14"
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
));

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH SDG — root export
// ─────────────────────────────────────────────────────────────────────────────
// GRAPH SDG — root export
// ─────────────────────────────────────────────────────────────────────────────

interface GraphSdgRootProps {
  sdgId: SDGNumber;
  dataPoints: SDGDataPoint[];
  geography?: string;
}

const GraphSdg = memo((props: GraphSdgRootProps) => {
  const { sdgId, dataPoints, geography } = props;
  const metrics = useMemo(() => {
    return [
      ...new Map(
        dataPoints.map((p) => [
          p.metricName,
          {
            name: p.metricName,
            unit: p.unit,
            indicatorCode: (p as any).indicatorCode as string | undefined,
            source: (p as any).source as string | undefined,
          },
        ]),
      ).values(),
    ];
  }, [dataPoints]);

  if (metrics.length === 0) {
    return (
      <div className="gsdg-empty">
        {geography
          ? `No indicator data available for ${geography}.`
          : "No indicator data available for the selected geography."}
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
          indicatorCode={m.indicatorCode}
          source={m.source}
        />
      ))}
    </div>
  );
}) as FC<GraphSdgRootProps>;

export default GraphSdg;
