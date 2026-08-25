import { evaluateCatch, classFare, bookingWindow, type Catchability } from "./catchability";
import { TRAINS, type CoachClass, type TrainService } from "./rail-graph";
import type { LatLng } from "./geo";

export interface RankedTrain {
  train: TrainService;
  catch: Catchability;
  window: ReturnType<typeof bookingWindow>;
  farePaise: number;
  availability: ReturnType<typeof classFare>;
}

export function searchTrains(args: {
  pin: LatLng;
  destCodes: string[];
  journeyDateIst: string;
  coach: CoachClass;
  now: Date;
}): RankedTrain[] {
  const dest = new Set(args.destCodes);
  const matches = TRAINS.filter((tr) => dest.has(tr.destinationCode));
  const ranked = matches.map((train) => {
    const catchability = evaluateCatch(args.pin, train, args.journeyDateIst, args.now);
    const availability = classFare(train, args.coach);
    const window = bookingWindow(args.now, args.journeyDateIst, args.coach);
    return {
      train,
      catch: catchability,
      window,
      farePaise: availability?.farePaise ?? 0,
      availability,
    };
  });
  ranked.sort((a, b) => {
    if (a.catch.catchable !== b.catch.catchable) return a.catch.catchable ? -1 : 1;
    return b.catch.slackMin - a.catch.slackMin;
  });
  return ranked;
}

export const FICTIONAL_FIRST = [
  "Asha Menon",
  "Kabir Menon",
  "Meera Menon",
  "Rohan Iyer",
  "Leela Krishnan",
  "Vikram Sethi",
  "Noor Qureshi",
  "Devika Rao",
];

export interface Traveller {
  id: string;
  name: string;
  age: number;
}

export function seedTravellers(): Traveller[] {
  return [
    { id: "t1", name: "Asha Menon", age: 34 },
    { id: "t2", name: "Kabir Menon", age: 9 },
    { id: "t3", name: "Meera Menon", age: 62 },
  ];
}

export function nextTraveller(existing: Traveller[]): Traveller {
  const used = new Set(existing.map((t) => t.name));
  const name = FICTIONAL_FIRST.find((n) => !used.has(n)) ?? `Passenger ${existing.length + 1}`;
  return {
    id: `t-${existing.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    age: 28,
  };
}
