import { formatMinutes, travelMinutes, type LatLng } from "./geo";
import {
  STATION_BY_CODE,
  type CoachClass,
  type ClassAvailability,
  type TrainService,
} from "./rail-graph";
import { istCalendarDate } from "./payment-machine";

export type BookingQuota = "ARP" | "TATKAL" | "CLOSED";

/** Tatkal opens the day before departure on the ORIGINATING station clock. */
export const TATKAL_OPEN_AC = { h: 10, m: 0 };
export const TATKAL_OPEN_SL = { h: 11, m: 0 };
/** Advance Reservation Period: 60 days, 08:00 IST at origin. */
export const ARP_DAYS = 60;
export const ARP_OPEN = { h: 8, m: 0 };

export function parseHmOnDate(dayIst: string, hm: string): Date {
  const [h, m] = hm.split(":").map(Number);
  return new Date(`${dayIst}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+05:30`);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function originDeparture(train: TrainService, journeyDateIst: string): Date {
  return parseHmOnDate(journeyDateIst, train.originDepartHm);
}

export function boardingDeparture(
  train: TrainService,
  journeyDateIst: string,
  boardingCode: string,
): Date {
  const origin = originDeparture(train, journeyDateIst);
  const stop = train.stops.find((s) => s.stationCode === boardingCode);
  const offset = stop?.departOffsetMin ?? 0;
  return addMinutes(origin, offset);
}

function atOriginClock(dayIst: string, h: number, m: number): Date {
  return parseHmOnDate(dayIst, `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}

export function arpOpensAt(journeyDateIst: string): Date {
  const journey = parseHmOnDate(journeyDateIst, "00:00");
  const openDay = new Date(journey.getTime() - ARP_DAYS * 24 * 60 * 60 * 1000);
  const day = istCalendarDate(openDay);
  return atOriginClock(day, ARP_OPEN.h, ARP_OPEN.m);
}

export function tatkalOpensAt(journeyDateIst: string, coach: CoachClass): Date {
  const journey = parseHmOnDate(journeyDateIst, "00:00");
  const prev = new Date(journey.getTime() - 24 * 60 * 60 * 1000);
  const day = istCalendarDate(prev);
  const t = coach === "SL" ? TATKAL_OPEN_SL : TATKAL_OPEN_AC;
  return atOriginClock(day, t.h, t.m);
}

export function bookingWindow(
  now: Date,
  journeyDateIst: string,
  coach: CoachClass,
): { quota: BookingQuota; opensAt: Date; noteKey: "arpOpen" | "tatkalOpen" | "closed" } {
  const arp = arpOpensAt(journeyDateIst);
  const tatkal = tatkalOpensAt(journeyDateIst, coach);
  const journey = parseHmOnDate(journeyDateIst, "23:59");
  if (now > journey) {
    return { quota: "CLOSED", opensAt: journey, noteKey: "closed" };
  }
  if (now >= tatkal) {
    return { quota: "TATKAL", opensAt: tatkal, noteKey: "tatkalOpen" };
  }
  if (now >= arp) {
    return { quota: "ARP", opensAt: arp, noteKey: "arpOpen" };
  }
  return { quota: "CLOSED", opensAt: arp, noteKey: "closed" };
}

export interface Catchability {
  boardingCode: string;
  originCode: string;
  boardingIsOrigin: boolean;
  travelMin: number;
  travelLabel: string;
  arriveStationAt: Date;
  trainDepartsBoardingAt: Date;
  catchable: boolean;
  slackMin: number;
}

const STATION_BUFFER_MIN = 12;

export function evaluateCatch(
  pin: LatLng,
  train: TrainService,
  journeyDateIst: string,
  now: Date,
  preferredBoarding?: string,
): Catchability {
  const mumbaiStops = train.stops.filter((s) => {
    const st = STATION_BY_CODE[s.stationCode];
    return st?.cluster === "mumbai";
  });
  const candidates = mumbaiStops.length ? mumbaiStops : [train.stops[0]];

  const scored = candidates.map((stop) => {
    const st = STATION_BY_CODE[stop.stationCode];
    const travelMin = travelMinutes(pin, { lat: st.lat, lng: st.lng });
    const depart = boardingDeparture(train, journeyDateIst, stop.stationCode);
    const arrive = addMinutes(now, travelMin + STATION_BUFFER_MIN);
    const slackMin = Math.round((depart.getTime() - arrive.getTime()) / 60_000);
    return {
      boardingCode: stop.stationCode,
      originCode: train.originCode,
      boardingIsOrigin: stop.stationCode === train.originCode,
      travelMin,
      travelLabel: formatMinutes(travelMin),
      arriveStationAt: arrive,
      trainDepartsBoardingAt: depart,
      catchable: slackMin >= 0,
      slackMin,
    } satisfies Catchability;
  });

  if (preferredBoarding) {
    const preferred = scored.find((s) => s.boardingCode === preferredBoarding);
    if (preferred) return preferred;
  }

  const catchable = scored.filter((s) => s.catchable);
  const pool = catchable.length ? catchable : scored;
  pool.sort((a, b) => b.slackMin - a.slackMin || a.travelMin - b.travelMin);
  return pool[0];
}

export function classFare(train: TrainService, coach: CoachClass): ClassAvailability | undefined {
  return train.classes.find((c) => c.coach === coach);
}

export function formatIstClock(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatIstLong(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
