import { describe, expect, it } from "vitest";
import {
  canResume,
  createIdleSession,
  fictionalPnr,
  resolveGateway,
  resolveResume,
  startPay,
  startResume,
  totalDebitedPaise,
  PaymentMachineError,
  type IssuedTicket,
  type PassengerTicketStatus,
} from "./payment-machine";

const AMOUNT = 184500; // ₹1,845
const KEY = "gmh-idem-citizen-story-001";

const PASSENGERS: PassengerTicketStatus[] = [
  { id: "p1", name: "Asha Menon", age: 34, status: "CNF" },
  { id: "p2", name: "Kabir Menon", age: 9, status: "CNF" },
  { id: "p3", name: "Meera Menon", age: 62, status: "WL", waitlistNumber: 14 },
];

function ticket(now: Date): IssuedTicket {
  return {
    pnr: fictionalPnr(`${KEY}-${now.toISOString()}`),
    issuedAt: now.toISOString(),
    passengers: PASSENGERS,
  };
}

describe("payment recovery state machine", () => {
  it("issues a PNR on a clean success path without a second debit", () => {
    const t0 = new Date("2026-08-25T08:40:00+05:30");
    let s = createIdleSession(AMOUNT, KEY, t0);
    s = startPay(s, t0);
    expect(s.status).toBe("paying");
    const t1 = new Date("2026-08-25T08:40:04+05:30");
    s = resolveGateway(s, "success", ticket(t1), t1);

    expect(s.status).toBe("success");
    expect(s.ticket?.pnr).toMatch(/^\d{10}$/);
    expect(s.chargedPaise).toBe(AMOUNT);
    expect(totalDebitedPaise(s)).toBe(AMOUNT);
    expect(s.ledger.filter((e) => e.kind === "debit")).toHaveLength(1);
  });

  it("debit-with-no-ticket then same-day resume issues a PNR with no double charge", () => {
    const t0 = new Date("2026-08-25T09:15:00+05:30");
    let s = createIdleSession(AMOUNT, KEY, t0);
    s = startPay(s, t0);
    const t1 = new Date("2026-08-25T09:15:03+05:30");
    s = resolveGateway(s, "debit_no_ticket", ticket(t1), t1);

    expect(s.status).toBe("debit_no_ticket");
    expect(s.ticket).toBeUndefined();
    expect(s.chargedPaise).toBe(AMOUNT);
    expect(totalDebitedPaise(s)).toBe(AMOUNT);
    expect(canResume(s, t1).ok).toBe(true);

    const t2 = new Date("2026-08-25T09:16:10+05:30");
    s = startResume(s, t2);
    expect(s.status).toBe("resuming");
    // Replay resume must not increment a second debit.
    s = startResume(s, t2);

    const t3 = new Date("2026-08-25T09:16:14+05:30");
    s = resolveResume(s, "success", ticket(t3), t3);

    expect(s.status).toBe("success");
    expect(s.ticket?.pnr).toMatch(/^\d{10}$/);
    expect(s.ticket?.passengers.some((p) => p.status === "WL")).toBe(true);
    expect(totalDebitedPaise(s)).toBe(AMOUNT);
    expect(s.ledger.filter((e) => e.kind === "debit")).toHaveLength(1);
    expect(s.ledger.some((e) => e.kind === "resume_attempt" && e.amountPaise === 0)).toBe(
      true,
    );
  });

  it("refuses a new pay after debit-with-no-ticket (must resume, not re-charge)", () => {
    const t0 = new Date("2026-08-25T11:00:00+05:30");
    let s = createIdleSession(AMOUNT, KEY, t0);
    s = startPay(s, t0);
    s = resolveGateway(s, "debit_no_ticket", ticket(t0), t0);
    expect(() => startPay(s, t0)).toThrow(PaymentMachineError);
    expect(() => startPay(s, t0)).toThrow(/Use resume/);
  });

  it("blocks resume after the IST calendar day of the original debit", () => {
    const t0 = new Date("2026-08-25T22:10:00+05:30");
    let s = createIdleSession(AMOUNT, KEY, t0);
    s = startPay(s, t0);
    s = resolveGateway(s, "debit_no_ticket", ticket(t0), t0);
    const nextDay = new Date("2026-08-26T00:05:00+05:30");
    const gate = canResume(s, nextDay);
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("NOT_SAME_DAY");
    expect(() => startResume(s, nextDay)).toThrow(/same-day/);
  });

  it("does not charge again when resume still fails", () => {
    const t0 = new Date("2026-08-25T12:00:00+05:30");
    let s = createIdleSession(AMOUNT, KEY, t0);
    s = startPay(s, t0);
    s = resolveGateway(s, "debit_no_ticket", ticket(t0), t0);
    s = startResume(s, t0);
    s = resolveResume(s, "still_failed", undefined, t0);
    expect(s.status).toBe("failed");
    expect(totalDebitedPaise(s)).toBe(AMOUNT);
    expect(s.ticket).toBeUndefined();
  });

  it("is a no-op to re-enter paying with the same in-flight session", () => {
    const t0 = new Date("2026-08-25T08:00:00+05:30");
    let s = createIdleSession(AMOUNT, KEY, t0);
    s = startPay(s, t0);
    const again = startPay(s, t0);
    expect(again.attempts).toBe(1);
    expect(again.status).toBe("paying");
  });
});
