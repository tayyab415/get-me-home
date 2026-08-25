import { describe, expect, it } from "vitest";
import { bookingWindow, evaluateCatch, tatkalOpensAt } from "./catchability";
import { TRAINS } from "./rail-graph";
import { searchTrains } from "./search";

describe("originating-station clock and catchability", () => {
  const now = new Date("2026-08-25T09:20:00+05:30");
  const pin = { lat: 19.0596, lng: 72.8295 }; // Bandra West
  const night = TRAINS.find((t) => t.id === "night-mail")!;
  const dawn = TRAINS.find((t) => t.id === "early-mail")!;

  it("uses travel time to boarding, and can board Dadar on a CSMT-origin train", () => {
    const c = evaluateCatch(pin, night, "2026-08-25", now);
    expect(c.catchable).toBe(true);
    expect(c.originCode).toBe("CSMT");
    expect(c.boardingCode).toBe("DR");
    expect(c.boardingIsOrigin).toBe(false);
  });

  it("marks a train already departed from reachable stations as uncatchable", () => {
    const c = evaluateCatch(pin, dawn, "2026-08-25", now);
    expect(c.catchable).toBe(false);
  });

  it("opens Tatkal on the day before departure at 10:00 origin clock for 3A", () => {
    const open = tatkalOpensAt("2026-08-26", "3A");
    expect(open.toISOString()).toBe(new Date("2026-08-25T10:00:00+05:30").toISOString());
    const w = bookingWindow(new Date("2026-08-25T10:05:00+05:30"), "2026-08-26", "3A");
    expect(w.quota).toBe("TATKAL");
  });

  it("returns Delhi trains ranked catchable-first from a Mumbai pin", () => {
    const rows = searchTrains({
      pin,
      destCodes: ["NDLS", "NZM"],
      journeyDateIst: "2026-08-25",
      coach: "3A",
      now,
    });
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0].catch.catchable).toBe(true);
    expect(rows.some((r) => !r.catch.catchable)).toBe(true);
  });

  it("includes trains that stop at Ratnagiri, not only trains that terminate there", () => {
    const rows = searchTrains({
      pin,
      destCodes: ["RN"],
      journeyDateIst: "2026-08-25",
      coach: "3A",
      now,
    });
    expect(rows.some((r) => r.train.id === "konkan-rain")).toBe(true);
    expect(rows.every((r) => r.train.destinationCode === "RN")).toBe(false);
  });
});
