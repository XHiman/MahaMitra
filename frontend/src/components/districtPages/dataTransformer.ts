import { getDisplayYear, getYearType, groupYearsByBase } from './graph.types';
import type { BackendDataRow, DataColumn, Year } from './graph.types';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    borderDash?: number[]; // For dashed lines (projected/DSP)
    pointStyle?: string; // Different point styles
  }[];
}

export class DataTransformer {
  /**
   * Transform backend data for time series with P and D variants
   * Groups multiple year variants (2024_25, 2024_25P, 2024_25D) into same X position
   */
  static toTimeSeries(
    data: BackendDataRow[],
    years: Year[] | string[],
    districts: string[],
    column: DataColumn
  ): ChartData {
    // Get unique display years (without P/D)
    const displayYears = Array.from(new Set(years.map(y => getDisplayYear(y as Year))));
    
    // Group years by their base year
    const yearGroups = groupYearsByBase(years as Year[]);
    
    const datasets = districts.flatMap((district) => {
      const results = [];
      
      // Check if we have multiple variants (actual, P, D) for any year
      const hasVariants = Array.from(yearGroups.values()).some(group => group.length > 1);
      
      if (hasVariants) {
        // Create separate datasets for actual, projected, and DSP
        const actualYears: (number | null)[] = [];
        const projectedYears: (number | null)[] = [];
        const DSPYears: (number | null)[] = [];
        
        displayYears.forEach((displayYear) => {
          const variants = yearGroups.get(displayYear) || [];
          
          // Find actual data
          const actualYear = variants.find(y => getYearType(y as Year) === 'actual');
          if (actualYear) {
            const row = data.find((d) => d.district === district && d.year === actualYear);
            actualYears.push(row ? Number(row[column]) : null);
          } else {
            actualYears.push(null);
          }
          
          // Find projected data
          const projectedYear = variants.find(y => getYearType(y as Year) === 'projected');
          if (projectedYear) {
            const row = data.find((d) => d.district === district && d.year === projectedYear);
            projectedYears.push(row ? Number(row[column]) : null);
          } else {
            projectedYears.push(null);
          }
          
          // Find DSP data
          const DSPYear = variants.find(y => getYearType(y as Year) === 'DSP');
          if (DSPYear) {
            const row = data.find((d) => d.district === district && d.year === DSPYear);
            DSPYears.push(row ? Number(row[column]) : null);
          } else {
            DSPYears.push(null);
          }
        });
        
        // Add actual data dataset
        if (actualYears.some(v => v !== null)) {
          results.push({
            label: `${district} (Actual)`,
            data: actualYears,
            borderWidth: 2,
          });
        }
        
        // Add projected data dataset (dashed line)
        if (projectedYears.some(v => v !== null)) {
          results.push({
            label: `${district} (Projected)`,
            data: projectedYears,
            borderWidth: 2,
            borderDash: [5, 5], // Dashed line
            pointStyle: 'triangle',
          });
        }
        
        // Add DSP data dataset (dotted line)
        if (DSPYears.some(v => v !== null)) {
          results.push({
            label: `${district} (DSP)`,
            data: DSPYears,
            borderWidth: 2,
            borderDash: [2, 2], // Dotted line
            pointStyle: 'rect',
          });
        }
      } else {
        // No variants, use original logic
        const districtData = displayYears.map((displayYear) => {
          const yearToUse = yearGroups.get(displayYear)?.[0];
          const row = data.find(
            (d) => d.district === district && d.year === yearToUse
          );
          return row ? Number(row[column]) : null;
        });
        
        results.push({
          label: district,
          data: districtData,
          borderWidth: 2,
        });
      }
      
      return results;
    });

    return {
      labels: displayYears,
      datasets,
    };
  }

  /**
   * Transform backend data for district comparison
   */
  static toDistrictComparison(
    data: BackendDataRow[],
    districts: string[],
    column: DataColumn
  ): ChartData {
    const values = districts.map((district) => {
      const row = data.find((d) => d.district === district);
      return row ? Number(row[column]) : 0;
    });

    return {
      labels: districts.map(d => String(d)),
      datasets: [
        {
          label: column.replace(/_/g, ' ').toUpperCase(),
          data: values,
          borderWidth: 1,
        },
      ],
    };
  }

  /**
   * Transform data for multiple metrics comparison
   */
  static toMetricComparison(
    data: BackendDataRow[],
    district: string,
    columns: DataColumn[]
  ): ChartData {
    const row = data.find((d) => d.district === district);
    
    const values = columns.map((col) => {
      return row ? Number(row[col]) : 0;
    });

    return {
      labels: columns.map((col) => col.replace(/_/g, ' ')),
      datasets: [
        {
          label: String(district),
          data: values,
          borderWidth: 1,
        },
      ],
    };
  }

  /**
   * Transform for multi-line/area charts with P and D variants
   */
  static toMultiSeries(
    data: BackendDataRow[],
    years: Year[] | string[],
    districts: string[],
    columns: DataColumn[]
  ): ChartData {
    const displayYears = Array.from(new Set(years.map(y => getDisplayYear(y as Year))));
    const yearGroups = groupYearsByBase(years as Year[]);
    
    const datasets = districts.flatMap((district) =>
      columns.flatMap((column) => {
        const results = [];
        const hasVariants = Array.from(yearGroups.values()).some(group => group.length > 1);
        
        if (hasVariants) {
          const actualYears: (number | null)[] = [];
          const projectedYears: (number | null)[] = [];
          const DSPYears: (number | null)[] = [];
          
          displayYears.forEach((displayYear) => {
            const variants = yearGroups.get(displayYear) || [];
            
            const actualYear = variants.find(y => getYearType(y as Year) === 'actual');
            if (actualYear) {
              const row = data.find((d) => d.district === district && d.year === actualYear);
              actualYears.push(row ? Number(row[column]) : null);
            } else {
              actualYears.push(null);
            }
            
            const projectedYear = variants.find(y => getYearType(y as Year) === 'projected');
            if (projectedYear) {
              const row = data.find((d) => d.district === district && d.year === projectedYear);
              projectedYears.push(row ? Number(row[column]) : null);
            } else {
              projectedYears.push(null);
            }
            
            const DSPYear = variants.find(y => getYearType(y as Year) === 'DSP');
            if (DSPYear) {
              const row = data.find((d) => d.district === district && d.year === DSPYear);
              DSPYears.push(row ? Number(row[column]) : null);
            } else {
              DSPYears.push(null);
            }
          });
          
          if (actualYears.some(v => v !== null)) {
            results.push({
              label: `${district} - ${column.replace(/_/g, ' ')} (Actual)`,
              data: actualYears,
              borderWidth: 2,
            });
          }
          
          if (projectedYears.some(v => v !== null)) {
            results.push({
              label: `${district} - ${column.replace(/_/g, ' ')} (Projected)`,
              data: projectedYears,
              borderWidth: 2,
              borderDash: [5, 5],
              pointStyle: 'triangle',
            });
          }

          if (DSPYears.some(v => v !== null)) {
            results.push({
              label: `${district} - ${column.replace(/_/g, ' ')} (DSP)`,
              data: DSPYears,
              borderWidth: 2,
              borderDash: [2, 2],
              pointStyle: 'rect',
            });
          }
        } else {
          const districtData = displayYears.map((displayYear) => {
            const yearToUse = yearGroups.get(displayYear)?.[0];
            const row = data.find((d) => d.district === district && d.year === yearToUse);
            return row ? Number(row[column]) : null;
          });
          
          results.push({
            label: `${district} - ${column.replace(/_/g, ' ')}`,
            data: districtData,
            borderWidth: 2,
          });
        }
        
        return results;
      })
    );

    return {
      labels: displayYears,
      datasets,
    };
  }

  /**
   * Transform data for double pie chart comparison
   */
  static toDoublePieComparison(
    data: BackendDataRow[],
    entity1: string,
    entity2: string,
    columns: DataColumn[]
  ): { leftChart: ChartData; rightChart: ChartData } {
    const leftRow = data.find((d) => d.district === entity1 || d[entity1 as any]);
    const leftValues = columns.map((col) => {
      return leftRow ? Number(leftRow[col]) : 0;
    });

    const rightRow = data.find((d) => d.district === entity2 || d[entity2 as any]);
    const rightValues = columns.map((col) => {
      return rightRow ? Number(rightRow[col]) : 0;
    });

    const labels = columns.map((col) => col.replace(/_/g, ' '));

    return {
      leftChart: {
        labels,
        datasets: [
          {
            label: entity1,
            data: leftValues,
            borderWidth: 2,
          },
        ],
      },
      rightChart: {
        labels,
        datasets: [
          {
            label: entity2,
            data: rightValues,
            borderWidth: 2,
          },
        ],
      },
    };
  }
}
