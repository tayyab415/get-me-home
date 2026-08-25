import { addMinutes, originDeparture } from "./catchability";
import { fictionalPnr, type IssuedTicket, type PassengerTicketStatus } from "./payment-machine";
import type { Traveller } from "./search";

/**
 * Mixed family: first two confirm, last waitlisted when 3+ travellers.
 * Demonstrates who may board reserved coaches.
 */
export function issueMockTicket(
  travellers: Traveller[],
  seed: string,
  now: Date,
): IssuedTicket {
  const passengers: PassengerTicketStatus[] = travellers.map((p, i) => {
    if (travellers.length >= 3 && i === travellers.length - 1) {
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        status: "WL",
        waitlistNumber: 14,
      };
    }
    if (i === 1 && travellers.length === 2) {
      return { id: p.id, name: p.name, age: p.age, status: "RAC" };
    }
    return { id: p.id, name: p.name, age: p.age, status: "CNF" };
  });
  return {
    pnr: fictionalPnr(seed),
    issuedAt: now.toISOString(),
    passengers,
  };
}

export function tdrDeadline(originDepart: Date): Date {
  return addMinutes(originDepart, -4 * 60);
}

export { originDeparture };
