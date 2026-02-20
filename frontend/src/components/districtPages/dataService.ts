// services/dataService.ts
import type { DataQuery, BackendDataRow, Year, Region} from './graph.types';
import {  ALL_YEARS, REGIONAL_DISTRICTS } from './graph.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class DataService {
  /**
   * Normalizes query to handle 'all' years and region names
   */
  private static normalizeQuery(query: DataQuery): { years: Year[], districts: string[] } {
    // Handle years
    const years = query.years === 'all' ? ALL_YEARS : query.years;
    
    // Handle districts (check if it's a region name)
    let districts: string[];
    if (typeof query.districts === 'string' && query.districts in REGIONAL_DISTRICTS) {
      districts = REGIONAL_DISTRICTS[query.districts as Region];
    } else {
      districts = query.districts as string[];
    }
    
    return { years, districts };
  }

  /**
   * Fetches data from backend based on query
   */
  static async fetchData(query: DataQuery): Promise<BackendDataRow[]> {
    try {
      const { years, districts } = this.normalizeQuery(query);
      
      console.log('🔍 Fetching data with query:', { years, districts, columns: query.columns });
      console.log('🌐 API URL:', `${API_BASE_URL}/api/data`);
      
      const response = await fetch(`${API_BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          years,
          districts,
          columns: query.columns
        }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Data received:', data);
      
      return data.data || data;
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      throw error;
    }
  }

  /**
   * Fetches data for a specific year
   */
  static async fetchYearData(
    year: Year,
    districts: string[],
    columns: string[]
  ): Promise<BackendDataRow[]> {
    try {
      console.log('🔍 Fetching year data:', { year, districts, columns });
      
      const response = await fetch(`${API_BASE_URL}/api/data/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ districts, columns }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Data received:', data);
      
      return data.data || data;
    } catch (error) {
      console.error('❌ Error fetching year data:', error);
      throw error;
    }
  }
}
