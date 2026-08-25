/**
 * Booking / payment recovery state machine.
 *
 * Mock IRCTC-style failure: money leaves the citizen, no PNR is issued.
 * Resume/retry is same-day, same amount, same idempotency key — never a second debit.
 *
 * This is a clock-and-ledger problem, not a speed boast.
 */

export type PaymentStatus =
  | "idle"
  | "paying"
  | "success"
  | "debit_no_ticket"
  | "resuming"
  | "failed";

export type GatewayOutcome = "success" | "debit_no_ticket" | "still_failed";

export type PaymentErrorCode =
  | "INVALID_AMOUNT"
  | "INVALID_STATE"
  | "ALREADY_SUCCEEDED"
  | "NOT_SAME_DAY"
  | "AMOUNT_MISMATCH"
  | "MISSING_IDEMPOTENCY_KEY";

export class PaymentMachineError extends Error {
  readonly code: PaymentErrorCode;

  constructor(code: PaymentErrorCode, message: string) {
    super(message);
    this.name = "PaymentMachineError";
    this.code = code;
  }
}

export interface LedgerEntry {
  id: string;
  at: string;
  kind: "debit" | "resume_attempt";
  amountPaise: number;
  note: string;
}

export interface PassengerTicketStatus {
  id: string;
  name: string;
  age: number;
  status: "CNF" | "RAC" | "WL";
  waitlistNumber?: number;
}

export interface IssuedTicket {
  pnr: string;
  issuedAt: string;
  passengers: PassengerTicketStatus[];
}

export interface PaymentSession {
  status: PaymentStatus;
  amountPaise: number;
  currency: "INR";
  idempotencyKey: string;
  chargedPaise: number;
  chargeLedgerId?: string;
  createdAt: string;
  lastUpdatedAt: string;
  chargedAt?: string;
  /** IST calendar date (YYYY-MM-DD) of the original debit; resume must match. */
  chargeDayIst?: string;
  attempts: number;
  ledger: LedgerEntry[];
  ticket?: IssuedTicket;
  lastError?: string;
}

export interface Clock {
  now(): Date;
}

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function istCalendarDate(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

export function isSameIstDay(a: Date, b: Date): boolean {
  return istCalendarDate(a) === istCalendarDate(b);
}

function iso(date: Date): string {
  return date.toISOString();
}

function assertPositiveAmount(amountPaise: number): void {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new PaymentMachineError(
      "INVALID_AMOUNT",
      "Fare must be a whole number of paise greater than zero.",
    );
  }
}

export function createIdleSession(
  amountPaise: number,
  idempotencyKey: string,
  now: Date = new Date(),
): PaymentSession {
  assertPositiveAmount(amountPaise);
  if (!idempotencyKey.trim()) {
    throw new PaymentMachineError(
      "MISSING_IDEMPOTENCY_KEY",
      "An idempotency key is required so retry cannot double-charge.",
    );
  }

  return {
    status: "idle",
    amountPaise,
    currency: "INR",
    idempotencyKey: idempotencyKey.trim(),
    chargedPaise: 0,
    createdAt: iso(now),
    lastUpdatedAt: iso(now),
    attempts: 0,
    ledger: [],
  };
}

function touch(
  session: PaymentSession,
  now: Date,
  patch: Partial<PaymentSession>,
): PaymentSession {
  return {
    ...session,
    ...patch,
    lastUpdatedAt: iso(now),
  };
}

function appendLedger(
  session: PaymentSession,
  entry: Omit<LedgerEntry, "id">,
): LedgerEntry[] {
  const id = `led-${session.ledger.length + 1}-${entry.kind}`;
  return [...session.ledger, { id, ...entry }];
}

/**
 * Begin a first charge. Replaying START_PAY with the same idempotency key
 * while a charge is in flight or already taken is a no-op (no second debit).
 */
export function startPay(
  session: PaymentSession,
  now: Date = new Date(),
): PaymentSession {
  if (session.status === "success") {
    throw new PaymentMachineError(
      "ALREADY_SUCCEEDED",
      "PNR already issued. Do not charge again.",
    );
  }

  if (session.status === "paying" || session.status === "resuming") {
    return session;
  }

  if (session.status === "debit_no_ticket") {
    throw new PaymentMachineError(
      "INVALID_STATE",
      "Money already left. Use resume — do not start a new payment.",
    );
  }

  if (session.status === "failed") {
    throw new PaymentMachineError(
      "INVALID_STATE",
      "This attempt is closed. Start a new session with a new idempotency key.",
    );
  }

  if (session.status !== "idle") {
    throw new PaymentMachineError(
      "INVALID_STATE",
      `Cannot start pay from ${session.status}.`,
    );
  }

  return touch(session, now, {
    status: "paying",
    attempts: session.attempts + 1,
  });
}

export function resolveGateway(
  session: PaymentSession,
  outcome: Exclude<GatewayOutcome, "still_failed">,
  ticket: IssuedTicket,
  now: Date = new Date(),
): PaymentSession {
  if (session.status !== "paying") {
    throw new PaymentMachineError(
      "INVALID_STATE",
      `Gateway result only applies while paying, not ${session.status}.`,
    );
  }

  if (outcome === "success") {
    const ledger = appendLedger(session, {
      at: iso(now),
      kind: "debit",
      amountPaise: session.amountPaise,
      note: "Single debit. PNR issued.",
    });
    return touch(session, now, {
      status: "success",
      chargedPaise: session.amountPaise,
      chargeLedgerId: ledger[ledger.length - 1].id,
      chargedAt: iso(now),
      chargeDayIst: istCalendarDate(now),
      ledger,
      ticket,
      lastError: undefined,
    });
  }

  const ledger = appendLedger(session, {
    at: iso(now),
    kind: "debit",
    amountPaise: session.amountPaise,
    note: "Debit succeeded. Ticket/PNR not issued.",
  });
  return touch(session, now, {
    status: "debit_no_ticket",
    chargedPaise: session.amountPaise,
    chargeLedgerId: ledger[ledger.length - 1].id,
    chargedAt: iso(now),
    chargeDayIst: istCalendarDate(now),
    ledger,
    lastError: "Money left the account. No ticket was issued.",
  });
}

export function canResume(
  session: PaymentSession,
  now: Date = new Date(),
): { ok: true } | { ok: false; code: PaymentErrorCode; reason: string } {
  if (session.status === "success") {
    return {
      ok: false,
      code: "ALREADY_SUCCEEDED",
      reason: "PNR already issued. Nothing to resume.",
    };
  }
  if (session.status !== "debit_no_ticket" && session.status !== "resuming") {
    return {
      ok: false,
      code: "INVALID_STATE",
      reason: `Resume is only for debit-with-no-ticket, not ${session.status}.`,
    };
  }
  if (!session.chargedAt || !session.chargeDayIst) {
    return {
      ok: false,
      code: "INVALID_STATE",
      reason: "No original debit to resume.",
    };
  }
  if (istCalendarDate(now) !== session.chargeDayIst) {
    return {
      ok: false,
      code: "NOT_SAME_DAY",
      reason:
        "Resume is same-day only (originating-country clock: Asia/Kolkata). Come back with a fresh booking tomorrow — this debit will need a refund path, not another charge.",
    };
  }
  if (session.chargedPaise !== session.amountPaise) {
    return {
      ok: false,
      code: "AMOUNT_MISMATCH",
      reason: "Resume amount must match the original debit exactly.",
    };
  }
  return { ok: true };
}

/**
 * Resume / retry after debit-with-no-ticket.
 * Same idempotency key, same amount, same IST day. Charged delta is always 0.
 */
export function startResume(
  session: PaymentSession,
  now: Date = new Date(),
): PaymentSession {
  const gate = canResume(session, now);
  if (!gate.ok) {
    throw new PaymentMachineError(gate.code, gate.reason);
  }

  if (session.status === "resuming") {
    return session;
  }

  return touch(session, now, {
    status: "resuming",
    attempts: session.attempts + 1,
    lastError: undefined,
  });
}

export function resolveResume(
  session: PaymentSession,
  outcome: Exclude<GatewayOutcome, "debit_no_ticket">,
  ticket: IssuedTicket | undefined,
  now: Date = new Date(),
): PaymentSession {
  if (session.status !== "resuming") {
    throw new PaymentMachineError(
      "INVALID_STATE",
      `Resume result only applies while resuming, not ${session.status}.`,
    );
  }

  const ledger = appendLedger(session, {
    at: iso(now),
    kind: "resume_attempt",
    amountPaise: 0,
    note:
      outcome === "success"
        ? "Idempotent resume. No second debit. PNR issued against original charge."
        : "Idempotent resume. No second debit. Ticket still not issued.",
  });

  if (outcome === "success") {
    if (!ticket) {
      throw new PaymentMachineError(
        "INVALID_STATE",
        "A ticket must be issued on successful resume.",
      );
    }
    return touch(session, now, {
      status: "success",
      ledger,
      ticket,
      lastError: undefined,
    });
  }

  return touch(session, now, {
    status: "failed",
    ledger,
    lastError:
      "Resume did not issue a ticket. You were not charged again. File a refund on the original debit.",
  });
}

export function totalDebitedPaise(session: PaymentSession): number {
  return session.ledger
    .filter((e) => e.kind === "debit")
    .reduce((sum, e) => sum + e.amountPaise, 0);
}

export function formatInrFromPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function fictionalPnr(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  }
  const n = 1000000000 + (h % 8999999999);
  return String(n).padStart(10, "0").slice(0, 10);
}
