import { useState, useEffect } from 'react';
import type { District, Year } from './graph.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface DistrictData {
  gddp: number;
  per_capita_district_domestic_product: number;
  population_000: number;
}

export const useDistrictStats = (district: District, year: Year = '2023_24') => {
  const [data, setData] = useState<{
    districtData: DistrictData | null;
    stateData: DistrictData | null;
  }>({
    districtData: null,
    stateData: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both district and state data in one call
        const response = await fetch(`${API_BASE_URL}/api/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            years: [year],
            districts: [district, 'Maharashtra'],
            columns: ['gddp', 'per_capita_district_domestic_product', 'population_000'],
          }),
        });

        const result = await response.json();
        
        const districtData = result.data.find((row: any) => row.district === district);
        const stateData = result.data.find((row: any) => row.district === 'Maharashtra');

        if (!districtData || !stateData) {
          throw new Error('No data found');
        }

        setData({
          districtData: {
            gddp: districtData.gddp,
            per_capita_district_domestic_product: districtData.per_capita_district_domestic_product,
            population_000: districtData.population_000,
          },
          stateData: {
            gddp: stateData.gddp,
            per_capita_district_domestic_product: stateData.per_capita_district_domestic_product,
            population_000: stateData.population_000,
          },
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [district, year]);

  // Return data in your requested format
  return {
    GDDP: {
      district: {
        [year]: data.districtData?.gddp || 0,
      },
      Maharashtra: {
        [year]: data.stateData?.gddp || 0,
      },
    },
    Percapita: {
      district: {
        [year]: data.districtData?.per_capita_district_domestic_product || 0,
      },
      Maharashtra: {
        [year]: data.stateData?.per_capita_district_domestic_product || 0,
      },
    },
    Population: {
      district: {
        [year]: data.districtData?.population_000 || 0,
      },
      Maharashtra: {
        [year]: data.stateData?.population_000 || 0,
      },
    },
    loading,
    error,
  };
};
