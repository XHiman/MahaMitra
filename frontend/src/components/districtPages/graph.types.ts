// types/graph.types.ts

// District and column types
export type District = 
  | 'Ahilyanagar'
  | 'Akola'
  | 'Amravati'
  | 'Beed'
  | 'Bhandara'
  | 'Buldhana'
  | 'Chandrapur'
  | 'Chhatrapati Sambhaji Nagar'
  | 'Dharashiv'
  | 'Dhule'
  | 'Gadchiroli'
  | 'Gondia'
  | 'Hingoli'
  | 'Jalgaon'
  | 'Jalna'
  | 'Kolhapur'
  | 'Latur'
  | 'Mumbai City and Suburban'
  | 'Nagpur'
  | 'Nanded'
  | 'Nandurbar'
  | 'Nashik'
  | 'Parbhani'
  | 'Pune'
  | 'Raigad'
  | 'Ratnagiri'
  | 'Sangli'
  | 'Satara'
  | 'Sindhudurg'
  | 'Solapur'
  | 'Thane and Palghar'
  | 'Wardha'
  | 'Washim'
  | 'Yavatmal'
  | 'Maharashtra';

export const DISTRICTS: District[] = [
  'Ahilyanagar',
  'Akola',
  'Amravati',
  'Beed',
  'Bhandara',
  'Buldhana',
  'Chandrapur',
  'Chhatrapati Sambhaji Nagar',
  'Dharashiv',
  'Dhule',
  'Gadchiroli',
  'Gondia',
  'Hingoli',
  'Jalgaon',
  'Jalna',
  'Kolhapur',
  'Latur',
  'Mumbai City and Suburban',
  'Nagpur',
  'Nanded',
  'Nandurbar',
  'Nashik',
  'Parbhani',
  'Pune',
  'Raigad',
  'Ratnagiri',
  'Sangli',
  'Satara',
  'Sindhudurg',
  'Solapur',
  'Thane and Palghar',
  'Wardha',
  'Washim',
  'Yavatmal',
  'Maharashtra',
];

export type DataColumn = 
  | 'district'
  | 'crops'
  | 'livestock'
  | 'forestry_and_logging'
  | 'fishing_and_aquaculture'
  | 'agriculture_allied_activities'
  | 'minign_quarrying'
  | 'primary_sector'
  | 'manufacturing'
  | 'electricity_gas_water_supply_other_utility_services'
  | 'construction'
  | 'secondary_sector'
  | 'industry'
  | 'trade_repair_hotels_restaurants'
  | 'railways'
  | 'transport_by_means_other_than_railways'
  | 'storage'
  | 'comm_and_services_related_to_broad'
  | 'financial_services'
  | 'r_estate_o_dwellings_professional_services'
  | 'public_administration_defence'
  | 'other_services'
  | 'services_tertiary_sector'
  | 'gdva'
  | 'taxes_on_products'
  | 'less_subsidies_on_products'
  | 'gddp'
  | 'population_000'
  | 'per_capita_district_domestic_product';

export type Year = 
  | '2011_12'
  | '2012_13'
  | '2013_14'
  | '2014_15'
  | '2015_16'
  | '2016_17'
  | '2017_18'
  | '2018_19'
  | '2019_20'
  | '2020_21'
  | '2021_22'
  | '2022_23'
  | '2023_24'
  | '2023_24P'
  | '2023_24D'
  | '2024_25'
  | '2024_25P'
  | '2024_25D'
  | '2025_26'
  | '2025_26P'
  | '2025_26D'
  | '2026_27'
  | '2026_27P'
  | '2026_27D'
  | '2027_28'
  | '2027_28P'
  | '2027_28D';

// ✅ ALL YEARS including projected and draft
export const ALL_YEARS: Year[] = [
  '2011_12',
  '2012_13',
  '2013_14',
  '2014_15',
  '2015_16',
  '2016_17',
  '2017_18',
  '2018_19',
  '2019_20',
  '2020_21',
  '2021_22',
  '2022_23',
  '2023_24',
  '2023_24P',
  '2023_24D',
  '2024_25',
  '2024_25P',
  '2024_25D',
  '2025_26',
  '2025_26P',
  '2025_26D',
  '2026_27',
  '2026_27P',
  '2026_27D',
  '2027_28',
  '2027_28P',
  '2027_28D'
];

export const CurrentYear: Year = '2023_24';
export const State: District = 'Maharashtra';

// ✅ Helper function to get display year (without P/D suffix)
export const getDisplayYear = (year: Year): string => {
  return year.replace(/[PD]$/, '');
};

// ✅ Helper function to get year type
export const getYearType = (year: Year): 'actual' | 'projected' | 'DSP' => {
  if (year.endsWith('P')) return 'projected';
  if (year.endsWith('D')) return 'DSP';
  return 'actual';
};

// ✅ Group years by base year
export const groupYearsByBase = (years: Year[]): Map<string, Year[]> => {
  const grouped = new Map<string, Year[]>();
  
  years.forEach(year => {
    const baseYear = getDisplayYear(year);
    if (!grouped.has(baseYear)) {
      grouped.set(baseYear, []);
    }
    grouped.get(baseYear)!.push(year);
  });
  
  return grouped;
};

export type Region = 'Konkan' | 'Nashik' | 'Pune' | 'CSN' | 'Nagpur' | 'Amravati';

export type GraphType = 'line' | 'bar' | 'pie' | 'area' | 'multiline' | 'doublepie';

// ✅ REGIONAL DISTRICTS MAPPING
export const REGIONAL_DISTRICTS: Record<Region, District[]> = {
  Konkan: [
    'Mumbai City and Suburban',
    'Thane and Palghar',
    'Raigad',
    'Ratnagiri',
    'Sindhudurg'
  ],
  Nashik: [
    'Nashik',
    'Dhule',
    'Nandurbar',
    'Jalgaon',
    'Ahilyanagar'
  ],
  Pune: [
    'Pune',
    'Solapur',
    'Satara',
    'Sangli',
    'Kolhapur'
  ],
  CSN: [ // Chhatrapati Sambhaji Nagar (formerly Aurangabad)
    'Chhatrapati Sambhaji Nagar',
    'Jalna',
    'Beed',
    'Latur',
    'Dharashiv',
    'Parbhani',
    'Hingoli',
    'Nanded'
  ],
  Nagpur: [
    'Nagpur',
    'Wardha',
    'Bhandara',
    'Gondia',
    'Chandrapur',
    'Gadchiroli'
  ],
  Amravati: [
    'Amravati',
    'Akola',
    'Washim',
    'Buldhana',
    'Yavatmal'
  ]
};

// ✅ ALL DISTRICTS (flattened from regions)
export const ALL_DISTRICTS: District[] = Object.values(REGIONAL_DISTRICTS).flat();

// ✅ HELPER: Get districts by region
export const getDistrictsByRegion = (region: Region): District[] => {
  return REGIONAL_DISTRICTS[region];
};

// ✅ HELPER: Get region by district
export const getRegionByDistrict = (district: District): Region | undefined => {
  for (const [region, districts] of Object.entries(REGIONAL_DISTRICTS)) {
    if (districts.includes(district)) {
      return region as Region;
    }
  }
  return undefined;
};

// Add new interface for DoublePie specific config
export interface DoublePieConfig {
  leftTitle: string;
  rightTitle: string;
}

// Data query configuration
export interface DataQuery {
  years: Year[] | 'all'; // Support 'all' for convenience
  districts: District[] | Region; // Support region names directly
  columns: DataColumn[];
}

// Graph configuration
export interface GraphConfig {
  type: GraphType;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  legendVisible?: boolean;
  colors?: string[];
  height?: number;
  width?: string;
  doublePieConfig?: DoublePieConfig;
}

// Main props for GraphModule
export interface GraphModuleProps {
  query: DataQuery;
  config: GraphConfig;
  className?: string;
}

// Raw data from backend
export interface BackendDataRow {
  district: District;
  year?: Year;
  [key: string]: string | number | undefined;
}

export interface DistrictPageProps {
  pageDistrict: District;
}