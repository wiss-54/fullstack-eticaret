import citiesDistricts from '@/lib/data/tr-cities-districts.json';

export type TrCitiesMap = Record<string, string[]>;

export const TR_CITIES_DISTRICTS = citiesDistricts as TrCitiesMap;

export const TR_CITIES = Object.keys(TR_CITIES_DISTRICTS).sort((a, b) =>
  a.localeCompare(b, 'tr'),
);

export function getDistrictsForCity(city: string): string[] {
  return TR_CITIES_DISTRICTS[city] ?? [];
}
