import type { LatLng } from "./geo";

export type CoachClass = "SL" | "3A" | "2A" | "CC";

export interface Station {
  code: string;
  nameEn: string;
  nameHi: string;
  cityEn: string;
  cityHi: string;
  lat: number;
  lng: number;
  cluster: "mumbai" | "delhi" | "konkan" | "corridor";
}

export interface PlaceHint {
  id: string;
  query: string[];
  labelEn: string;
  labelHi: string;
  lat: number;
  lng: number;
}

export interface TrainStop {
  stationCode: string;
  /** Minutes from originating departure. */
  arriveOffsetMin: number;
  departOffsetMin: number;
}

export type AvailKind = "AVAILABLE" | "RAC" | "WL" | "CLOSED";

export interface ClassAvailability {
  coach: CoachClass;
  kind: AvailKind;
  count: number;
  farePaise: number;
}

export interface TrainService {
  id: string;
  number: string;
  nameEn: string;
  nameHi: string;
  originCode: string;
  destinationCode: string;
  /** Originating departure on the journey date, IST "HH:MM". */
  originDepartHm: string;
  durationMin: number;
  stops: TrainStop[];
  classes: ClassAvailability[];
  corridor: "mumbai-delhi" | "konkan";
  monsoonWatch?: boolean;
}

export const STATIONS: Station[] = [
  {
    code: "CSMT",
    nameEn: "Chhatrapati Shivaji Maharaj Terminus",
    nameHi: "छत्रपति शिवाजी महाराज टर्मिनस",
    cityEn: "Mumbai",
    cityHi: "मुंबई",
    lat: 18.9402,
    lng: 72.8356,
    cluster: "mumbai",
  },
  {
    code: "BCT",
    nameEn: "Mumbai Central",
    nameHi: "मुंबई सेंट्रल",
    cityEn: "Mumbai",
    cityHi: "मुंबई",
    lat: 18.9696,
    lng: 72.8194,
    cluster: "mumbai",
  },
  {
    code: "DR",
    nameEn: "Dadar",
    nameHi: "दादर",
    cityEn: "Mumbai",
    cityHi: "मुंबई",
    lat: 19.0183,
    lng: 72.8428,
    cluster: "mumbai",
  },
  {
    code: "LTT",
    nameEn: "Lokmanya Tilak Terminus",
    nameHi: "लोकमान्य तिलक टर्मिनस",
    cityEn: "Mumbai",
    cityHi: "मुंबई",
    lat: 19.0694,
    lng: 72.8917,
    cluster: "mumbai",
  },
  {
    code: "PNVL",
    nameEn: "Panvel",
    nameHi: "पनवेल",
    cityEn: "Navi Mumbai",
    cityHi: "नवी मुंबई",
    lat: 18.9894,
    lng: 73.1175,
    cluster: "mumbai",
  },
  {
    code: "NDLS",
    nameEn: "New Delhi",
    nameHi: "नई दिल्ली",
    cityEn: "Delhi",
    cityHi: "दिल्ली",
    lat: 28.642,
    lng: 77.2191,
    cluster: "delhi",
  },
  {
    code: "NZM",
    nameEn: "Hazrat Nizamuddin",
    nameHi: "हजरत निजामुद्दीन",
    cityEn: "Delhi",
    cityHi: "दिल्ली",
    lat: 28.5889,
    lng: 77.2506,
    cluster: "delhi",
  },
  {
    code: "BRC",
    nameEn: "Vadodara",
    nameHi: "वडोदरा",
    cityEn: "Vadodara",
    cityHi: "वडोदरा",
    lat: 22.3108,
    lng: 73.1812,
    cluster: "corridor",
  },
  {
    code: "KOTA",
    nameEn: "Kota",
    nameHi: "कोटा",
    cityEn: "Kota",
    cityHi: "कोटा",
    lat: 25.195,
    lng: 75.824,
    cluster: "corridor",
  },
  {
    code: "RN",
    nameEn: "Ratnagiri",
    nameHi: "रत्नागिरी",
    cityEn: "Ratnagiri",
    cityHi: "रत्नागिरी",
    lat: 16.9902,
    lng: 73.312,
    cluster: "konkan",
  },
  {
    code: "MAO",
    nameEn: "Madgaon",
    nameHi: "मडगाँव",
    cityEn: "Goa",
    cityHi: "गोवा",
    lat: 15.2705,
    lng: 73.9578,
    cluster: "konkan",
  },
];

export const STATION_BY_CODE: Record<string, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.code, s]),
);

export const PLACES: PlaceHint[] = [
  {
    id: "colaba",
    query: ["colaba", "fort", "cst area", "csmt"],
    labelEn: "Colaba, Mumbai",
    labelHi: "कुलाबा, मुंबई",
    lat: 18.9067,
    lng: 72.8147,
  },
  {
    id: "bandra",
    query: ["bandra", "bandra west", "linking road"],
    labelEn: "Bandra West, Mumbai",
    labelHi: "बांद्रा पश्चिम, मुंबई",
    lat: 19.0596,
    lng: 72.8295,
  },
  {
    id: "andheri",
    query: ["andheri", "andheri east", "chakala"],
    labelEn: "Andheri East, Mumbai",
    labelHi: "अंधेरी पूर्व, मुंबई",
    lat: 19.1136,
    lng: 72.8697,
  },
  {
    id: "dadar-place",
    query: ["dadar", "dadar west"],
    labelEn: "Dadar, Mumbai",
    labelHi: "दादर, मुंबई",
    lat: 19.0183,
    lng: 72.8428,
  },
  {
    id: "powai",
    query: ["powai", "iit bombay", "ghatkopar"],
    labelEn: "Powai, Mumbai",
    labelHi: "पवई, मुंबई",
    lat: 19.1197,
    lng: 72.905,
  },
  {
    id: "thane",
    query: ["thane", "thane west"],
    labelEn: "Thane West",
    labelHi: "ठाणे पश्चिम",
    lat: 19.2183,
    lng: 72.9781,
  },
  {
    id: "default-mumbai",
    query: ["mumbai", "bombay", "south mumbai"],
    labelEn: "Mumbai (default pin)",
    labelHi: "मुंबई (डिफ़ॉल्ट पिन)",
    lat: 19.076,
    lng: 72.8777,
  },
];

export const DESTINATION_ALIASES: {
  query: string[];
  labelEn: string;
  labelHi: string;
  stationCodes: string[];
}[] = [
  {
    query: [
      "delhi",
      "new delhi",
      "ndls",
      "dilli",
      "home in delhi",
      "ncr",
      "nizamuddin",
      "nzm",
      "दिल्ली",
      "नई दिल्ली",
      "निजामुद्दीन",
    ],
    labelEn: "Delhi — New Delhi & Nizamuddin",
    labelHi: "दिल्ली — नई दिल्ली और निजामुद्दीन",
    stationCodes: ["NDLS", "NZM"],
  },
  {
    query: [
      "goa",
      "madgaon",
      "mao",
      "panaji",
      "konkan home",
      "home in goa",
      "गोवा",
      "मडगाँव",
      "गोवा का घर",
    ],
    labelEn: "Goa — Madgaon",
    labelHi: "गोवा — मडगाँव",
    stationCodes: ["MAO"],
  },
  {
    query: ["ratnagiri", "rn", "konkan", "रत्नागिरी", "कोंकण"],
    labelEn: "Ratnagiri (Konkan)",
    labelHi: "रत्नागिरी (कोंकण)",
    stationCodes: ["RN"],
  },
];

export const TRAINS: TrainService[] = [
  {
    id: "night-mail",
    number: "29012",
    nameEn: "Narmada Night Mail",
    nameHi: "नर्मदा नाइट मेल",
    originCode: "CSMT",
    destinationCode: "NDLS",
    originDepartHm: "16:40",
    durationMin: 17 * 60 + 5,
    corridor: "mumbai-delhi",
    stops: [
      { stationCode: "CSMT", arriveOffsetMin: 0, departOffsetMin: 0 },
      { stationCode: "DR", arriveOffsetMin: 14, departOffsetMin: 16 },
      { stationCode: "BRC", arriveOffsetMin: 6 * 60 + 10, departOffsetMin: 6 * 60 + 15 },
      { stationCode: "KOTA", arriveOffsetMin: 11 * 60 + 40, departOffsetMin: 11 * 60 + 45 },
      { stationCode: "NDLS", arriveOffsetMin: 17 * 60 + 5, departOffsetMin: 17 * 60 + 5 },
    ],
    classes: [
      { coach: "SL", kind: "WL", count: 42, farePaise: 78500 },
      { coach: "3A", kind: "AVAILABLE", count: 12, farePaise: 184500 },
      { coach: "2A", kind: "RAC", count: 3, farePaise: 268000 },
      { coach: "CC", kind: "CLOSED", count: 0, farePaise: 0 },
    ],
  },
  {
    id: "capital-super",
    number: "22008",
    nameEn: "Capital Super",
    nameHi: "कैपिटल सुपर",
    originCode: "BCT",
    destinationCode: "NDLS",
    originDepartHm: "17:55",
    durationMin: 16 * 60 + 20,
    corridor: "mumbai-delhi",
    stops: [
      { stationCode: "BCT", arriveOffsetMin: 0, departOffsetMin: 0 },
      { stationCode: "BRC", arriveOffsetMin: 5 * 60 + 40, departOffsetMin: 5 * 60 + 45 },
      { stationCode: "KOTA", arriveOffsetMin: 10 * 60 + 50, departOffsetMin: 10 * 60 + 55 },
      { stationCode: "NDLS", arriveOffsetMin: 16 * 60 + 20, departOffsetMin: 16 * 60 + 20 },
    ],
    classes: [
      { coach: "SL", kind: "AVAILABLE", count: 64, farePaise: 81000 },
      { coach: "3A", kind: "AVAILABLE", count: 4, farePaise: 192000 },
      { coach: "2A", kind: "WL", count: 8, farePaise: 279000 },
      { coach: "CC", kind: "CLOSED", count: 0, farePaise: 0 },
    ],
  },
  {
    id: "western-link",
    number: "11044",
    nameEn: "Western Link Express",
    nameHi: "वेस्टर्न लिंक एक्सप्रेस",
    originCode: "LTT",
    destinationCode: "NZM",
    originDepartHm: "11:15",
    durationMin: 21 * 60 + 40,
    corridor: "mumbai-delhi",
    stops: [
      { stationCode: "LTT", arriveOffsetMin: 0, departOffsetMin: 0 },
      { stationCode: "KOTA", arriveOffsetMin: 14 * 60 + 10, departOffsetMin: 14 * 60 + 20 },
      { stationCode: "NZM", arriveOffsetMin: 21 * 60 + 40, departOffsetMin: 21 * 60 + 40 },
    ],
    classes: [
      { coach: "SL", kind: "AVAILABLE", count: 120, farePaise: 69500 },
      { coach: "3A", kind: "WL", count: 21, farePaise: 166000 },
      { coach: "2A", kind: "AVAILABLE", count: 9, farePaise: 241000 },
      { coach: "CC", kind: "CLOSED", count: 0, farePaise: 0 },
    ],
  },
  {
    id: "early-mail",
    number: "12138",
    nameEn: "Island Dawn Mail",
    nameHi: "आइलैंड डॉन मेल",
    originCode: "CSMT",
    destinationCode: "NDLS",
    originDepartHm: "08:05",
    durationMin: 16 * 60 + 55,
    corridor: "mumbai-delhi",
    stops: [
      { stationCode: "CSMT", arriveOffsetMin: 0, departOffsetMin: 0 },
      { stationCode: "DR", arriveOffsetMin: 12, departOffsetMin: 14 },
      { stationCode: "NDLS", arriveOffsetMin: 16 * 60 + 55, departOffsetMin: 16 * 60 + 55 },
    ],
    classes: [
      { coach: "SL", kind: "AVAILABLE", count: 18, farePaise: 77000 },
      { coach: "3A", kind: "AVAILABLE", count: 6, farePaise: 179000 },
      { coach: "2A", kind: "AVAILABLE", count: 2, farePaise: 255000 },
      { coach: "CC", kind: "CLOSED", count: 0, farePaise: 0 },
    ],
  },
  {
    id: "konkan-rain",
    number: "01076",
    nameEn: "Konkan Rain Express",
    nameHi: "कोंकण रेन एक्सप्रेस",
    originCode: "PNVL",
    destinationCode: "MAO",
    originDepartHm: "19:20",
    durationMin: 10 * 60 + 35,
    corridor: "konkan",
    monsoonWatch: true,
    stops: [
      { stationCode: "PNVL", arriveOffsetMin: 0, departOffsetMin: 0 },
      { stationCode: "RN", arriveOffsetMin: 5 * 60 + 50, departOffsetMin: 5 * 60 + 55 },
      { stationCode: "MAO", arriveOffsetMin: 10 * 60 + 35, departOffsetMin: 10 * 60 + 35 },
    ],
    classes: [
      { coach: "SL", kind: "AVAILABLE", count: 40, farePaise: 45500 },
      { coach: "3A", kind: "AVAILABLE", count: 11, farePaise: 118000 },
      { coach: "2A", kind: "RAC", count: 1, farePaise: 168000 },
      { coach: "CC", kind: "AVAILABLE", count: 24, farePaise: 89000 },
    ],
  },
];

export const RAIL_CORRIDORS: { id: string; stations: string[]; monsoon?: boolean }[] = [
  { id: "mumbai-delhi", stations: ["CSMT", "DR", "BCT", "LTT", "BRC", "KOTA", "NZM", "NDLS"] },
  { id: "konkan", stations: ["PNVL", "RN", "MAO"], monsoon: true },
];

export function stationLatLng(code: string): LatLng {
  const s = STATION_BY_CODE[code];
  return { lat: s.lat, lng: s.lng };
}

export function resolvePlace(text: string): PlaceHint | undefined {
  const q = text.trim().toLowerCase();
  if (!q) return undefined;
  return PLACES.find((p) =>
    p.query.some((n) => q.includes(n) || (q.length >= 3 && n.includes(q))),
  );
}

export function resolveDestination(text: string) {
  const q = text.trim().toLowerCase();
  if (!q) return undefined;
  const byCode = STATIONS.find((s) => s.code.toLowerCase() === q);
  if (byCode) {
    return {
      labelEn: `${byCode.cityEn} — ${byCode.nameEn}`,
      labelHi: `${byCode.cityHi} — ${byCode.nameHi}`,
      stationCodes: [byCode.code],
    };
  }
  return DESTINATION_ALIASES.find((d) =>
    d.query.some((n) => q.includes(n)),
  );
}
