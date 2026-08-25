/** WGS84 helpers. Distances are great-circle; travel time is a mock urban/cab model. */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Mock Mumbai/Delhi surface speed: slower in island city traffic. */
export function travelMinutes(from: LatLng, to: LatLng): number {
  const km = haversineKm(from, to);
  const kmh = km < 8 ? 18 : 28;
  const drive = (km / kmh) * 60;
  return Math.max(8, Math.round(drive + 7));
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const MUMBAI_DEFAULT: LatLng = { lat: 19.076, lng: 72.8777 };

/** Simple equirectangular project for the crafted India map (viewBox 0 0 390 520). */
export const INDIA_VIEW = {
  west: 67.8,
  east: 97.4,
  south: 6.5,
  north: 36.8,
  width: 390,
  height: 520,
};

export function project(point: LatLng): { x: number; y: number } {
  const { west, east, south, north, width, height } = INDIA_VIEW;
  const x = ((point.lng - west) / (east - west)) * width;
  const y = ((north - point.lat) / (north - south)) * height;
  return { x, y };
}

export function unproject(x: number, y: number): LatLng {
  const { west, east, south, north, width, height } = INDIA_VIEW;
  return {
    lng: west + (x / width) * (east - west),
    lat: north - (y / height) * (north - south),
  };
}
