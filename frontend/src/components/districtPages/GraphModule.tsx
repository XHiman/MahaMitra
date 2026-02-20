import { useEffect, useState, useRef } from "react";
import type { FC } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Line, Bar, Pie } from "react-chartjs-2";
import type { GraphModuleProps, Region, District } from "./graph.types";
import { ALL_YEARS, REGIONAL_DISTRICTS } from "./graph.types";
import { DataService } from "./dataService";
import { DataTransformer } from "./dataTransformer";
import type { ChartData } from "./dataTransformer";
import "./GraphModule.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels,
);

const GraphModule: FC<GraphModuleProps> = ({ query, config, className }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [doublePieData, setDoublePieData] = useState<{
    leftChart: ChartData;
    rightChart: ChartData;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const chartRef = useRef<any>(null);
  const leftPieRef = useRef<any>(null);
  const rightPieRef = useRef<any>(null);

  useEffect(() => {
    fetchAndTransformData();
  }, [query, config]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Replace underscore with hyphen in year labels
  const formatYearLabels = (labels: any[]) => {
    return labels.map((label) =>
      typeof label === "string" ? label.replace(/_/g, "-") : label,
    );
  };

  // Helper function to normalize query
  const normalizeQuery = () => {
    const years = query.years === "all" ? ALL_YEARS : query.years;

    let districts: District[];
    if (
      typeof query.districts === "string" &&
      query.districts in REGIONAL_DISTRICTS
    ) {
      districts = REGIONAL_DISTRICTS[query.districts as Region];
    } else {
      districts = query.districts as District[];
    }

    return { years, districts };
  };

  const fetchAndTransformData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { years, districts } = normalizeQuery();
      const rawData = await DataService.fetchData(query);

      // Handle DoublePie separately
      if (config.type === "doublepie") {
        if (districts.length !== 2) {
          throw new Error("DoublePie chart requires exactly 2 districts");
        }

        const doublePieTransformed = DataTransformer.toDoublePieComparison(
          rawData as any,
          districts[0],
          districts[1],
          query.columns,
        );

        // Apply colors to both charts
        if (config.colors) {
          doublePieTransformed.leftChart.datasets[0].backgroundColor =
            config.colors;
          doublePieTransformed.leftChart.datasets[0].borderColor = "#ffffff";

          doublePieTransformed.rightChart.datasets[0].backgroundColor =
            config.colors;
          doublePieTransformed.rightChart.datasets[0].borderColor = "#ffffff";
        }

        setDoublePieData(doublePieTransformed);
        setChartData(null);
        setLoading(false);
        return;
      }

      // Regular chart transformations
      let transformed: ChartData;

      if (years.length > 1 && query.columns.length === 1) {
        transformed = DataTransformer.toTimeSeries(
          rawData as any,
          years,
          districts,
          query.columns[0],
        );
      } else if (years.length === 1 && districts.length > 1) {
        transformed = DataTransformer.toDistrictComparison(
          rawData as any,
          districts,
          query.columns[0],
        );
      } else if (districts.length === 1 && query.columns.length > 1) {
        transformed = DataTransformer.toMetricComparison(
          rawData as any,
          districts[0],
          query.columns,
        );
      } else {
        transformed = DataTransformer.toMultiSeries(
          rawData as any,
          years,
          districts,
          query.columns,
        );
      }

      transformed.labels = formatYearLabels(transformed.labels);

      // Add empty labels for spacing (not for pie charts)
      const isPieChart = config.type === "pie";
      if (!isPieChart) {
        transformed.labels = ["", ...transformed.labels, ""];
        transformed.datasets = transformed.datasets.map((dataset) => ({
          ...dataset,
          data: [null, ...dataset.data, null] as any[],
        }));
      }

      // Apply colors
      if (config.colors && transformed.datasets) {
        if (config.type === "pie") {
          transformed.datasets = transformed.datasets.map((dataset) => ({
            ...dataset,
            backgroundColor: config.colors,
            borderColor: "#ffffff",
            borderWidth: 2,
          }));
        } else {
          transformed.datasets = transformed.datasets.map((dataset, index) => ({
            ...dataset,
            backgroundColor: config.colors![index % config.colors!.length],
            borderColor: config.colors![index % config.colors!.length],
          }));
        }
      }

      setChartData(transformed);
      setDoublePieData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Download chart as image
  const downloadChart = () => {
    if (config.type === "doublepie") {
      if (leftPieRef.current && rightPieRef.current) {
        const leftCanvas = leftPieRef.current.canvas;
        const rightCanvas = rightPieRef.current.canvas;

        const combinedCanvas = document.createElement("canvas");
        const ctx = combinedCanvas.getContext("2d");

        combinedCanvas.width = leftCanvas.width + rightCanvas.width + 40;
        combinedCanvas.height = Math.max(leftCanvas.height, rightCanvas.height);

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
          ctx.drawImage(leftCanvas, 0, 0);
          ctx.drawImage(rightCanvas, leftCanvas.width + 40, 0);
        }

        const url = combinedCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${config.title.replace(/\s+/g, "_")}.png`;
        link.href = url;
        link.click();
      }
    } else if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${config.title.replace(/\s+/g, "_")}.png`;
      link.href = url;
      link.click();
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Get pie chart options for DoublePie
  const getPieChartOptions = (title?: string): ChartOptions<"pie"> => {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: !!title,
          text: title || "",
          font: {
            size: 16,
            weight: "bold",
          },
          position: "bottom" as const,
          padding: {
            top: 15,
          },
        },
        datalabels: {
          display: true,
          color: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? "#fff" : "#333";
          },
          font: {
            weight: "bold" as const,
            size: 14,
          },
          formatter: (value: number, context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return percentage + "%";
          },
          anchor: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? "center" : "end";
          },
          align: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? "center" : "end";
          },
          offset: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? 0 : 10;
          },
          backgroundColor: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? "transparent" : "rgba(255, 255, 255, 0.95)";
          },
          borderColor: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? "transparent" : "#333";
          },
          borderWidth: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? 0 : 1;
          },
          borderRadius: 4,
          padding: (context: any) => {
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce(
              (acc: number, val: number) => acc + val,
              0,
            );
            const percentage =
              (context.dataset.data[context.dataIndex] / total) * 100;
            return percentage > 8 ? 0 : 4;
          },
        },
      },
    };
  };

  // Get regular chart options
  const getChartOptions = (): ChartOptions<any> => {
    const isPieChart = config.type === "pie";
    const isLineChart =
      config.type === "line" ||
      config.type === "multiline" ||
      config.type === "area";

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: config.legendPosition || ("top" as const),
          display:
            config.legendVisible !== undefined ? config.legendVisible : true,
        },
        title: {
          display: true,
        },
        datalabels: isPieChart
          ? {
              display: true,
              color: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8 ? "#fff" : "#333";
              },
              font: { weight: "bold" as const, size: 14 },
              formatter: (value: number, context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                return ((value / total) * 100).toFixed(1) + "%";
              },
              anchor: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8 ? "center" : "end";
              },
              align: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8 ? "center" : "end";
              },
              offset: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8 ? 0 : 10;
              },
              backgroundColor: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8
                  ? "transparent"
                  : "rgba(255, 255, 255, 0.95)";
              },
              borderColor: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8 ? "transparent" : "#333";
              },
              borderWidth: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8 ? 0 : 1;
              },
              borderRadius: 4,
              padding: (context: any) => {
                const dataset = context.chart.data.datasets[0];
                const total = dataset.data.reduce(
                  (acc: number, val: number) => acc + val,
                  0,
                );
                const percentage =
                  (context.dataset.data[context.dataIndex] / total) * 100;
                return percentage > 8 ? 0 : 4;
              },
            }
          : isLineChart
            ? {
                display: (context: any) => {
                  const index = context.dataIndex;
                  const dataLength = context.dataset.data.length;
                  return index === 1 || index === dataLength - 2;
                },
                align: "top" as const,
                anchor: "end" as const,
                offset: 5,
                color: (context: any) => context.dataset.borderColor || "#333",
                font: { weight: "bold" as const, size: 12 },
                formatter: (value: number) => {
                  if (value >= 1000000)
                    return (value / 1000000).toFixed(1) + "M";
                  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
                  return value.toFixed(0);
                },
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderColor: (context: any) =>
                  context.dataset.borderColor || "#333",
                borderWidth: 1,
                borderRadius: 4,
                padding: 2,
              }
            : {
                display: false,
              },
      },
      scales: !isPieChart
        ? {
            x: {
              title: {
                display: !!config.xAxisLabel,
                text: config.xAxisLabel || "",
              },
              grid: { display: false },
            },
            y: {
              title: {
                display: !!config.yAxisLabel,
                text: config.yAxisLabel || "",
              },
              grid: { display: false },
            },
          }
        : undefined,
    };
  };

  const renderChart = () => {
    // Render DoublePie with shared legend
    if (config.type === "doublepie" && doublePieData) {
      const leftTitle = config.doublePieConfig?.leftTitle || "Chart 1";
      const rightTitle = config.doublePieConfig?.rightTitle || "Chart 2";

      const legendItems = doublePieData.leftChart.labels.map(
        (label, index) => ({
          label: label,
          color: config.colors?.[index] || "#ccc",
        }),
      );

      return (
        <div className="double-pie-wrapper">
          <div className="double-pie-charts">
            <div className="pie-chart-item">
              <Pie
                ref={leftPieRef}
                data={doublePieData.leftChart}
                options={getPieChartOptions(leftTitle)}
              />
            </div>
            <div className="pie-chart-item">
              <Pie
                ref={rightPieRef}
                data={doublePieData.rightChart}
                options={getPieChartOptions(rightTitle)}
              />
            </div>
          </div>

          <div className="shared-legend">
            {legendItems.map((item, index) => (
              <div key={index} className="legend-item">
                <span
                  className="legend-color"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="legend-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Regular chart rendering
    if (!chartData) return null;

    const chartOptions = getChartOptions();
    const commonProps = {
      ref: chartRef,
      data: chartData,
      options: chartOptions,
    };

    switch (config.type) {
      case "line":
      case "multiline":
        return <Line {...commonProps} />;
      case "bar":
        return <Bar {...commonProps} />;
      case "pie":
        return <Pie {...commonProps} />;
      case "area":
        return (
          <Line
            {...commonProps}
            options={{
              ...chartOptions,
              elements: { line: { fill: true } },
            }}
          />
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  if (loading) {
    return (
      <div className={`graph-module ${className || ""}`}>
        <div className="graph-loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`graph-module ${className || ""}`}>
        <div className="graph-error">
          <p>Error: {error}</p>
          <button onClick={fetchAndTransformData}>Retry</button>
        </div>
      </div>
    );
  }

  // Render content
  const graphContent = (
    <>
      <div className="graph-header">
        <h3 className="graph-title">{config.title}</h3>
        <div className="graph-actions">
          {/* Fullscreen button */}
          <button
            className="action-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>

          {/* Download button */}
          <button
            className="action-btn download-btn"
            onClick={downloadChart}
            title="Download as Image"
            aria-label="Download chart as PNG"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="graph-container"
        style={{
          height: isFullscreen ? "calc(100vh - 120px)" : config.height || 400,
          width: config.width || "100%",
        }}
      >
        {renderChart()}
      </div>
    </>
  );

  // Return with or without fullscreen overlay
  return (
    <>
      {/* Normal view */}
      {!isFullscreen && (
        <div className={`graph-module ${className || ""}`}>{graphContent}</div>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="graph-fullscreen-overlay">
          <div className="graph-fullscreen-content">
            <button
              className="fullscreen-close-btn"
              onClick={toggleFullscreen}
              title="Close Fullscreen (ESC)"
              aria-label="Close fullscreen"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            {graphContent}
          </div>
        </div>
      )}
    </>
  );
};

export default GraphModule;
