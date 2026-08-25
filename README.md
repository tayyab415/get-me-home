# Get Me Home

Independent hackathon prototype of a citizen train journey for **Build What Moves India**.

**Not affiliated with IRCTC or Indian Railways.** This app never calls live IRCTC / Indian Railways APIs. Every passenger, PNR, station clock, fare, and payment is **mock / fictional**. Do not treat it as an official booking channel.

Persistent on-screen label: *Independent hackathon prototype · mock data only · not affiliated with IRCTC or Indian Railways.*

## Job to be done

A citizen who needs to get home by train, from where they actually are, without being lied to about boarding vs originating station, and without disappearing into “money gone, no ticket.”

## How to run

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No mock login credentials are required. There is no Aadhaar, PAN, OTP, bank, or phone verification.

Optional (later, never committed):

- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — if present, the map can enhance. Without it, a crafted SVG India rail map is the demo. Judges should never see a broken Google logo.

Do **not** put Google Maps keys, GEE keys, or any real credentials in `.env` files that get committed.

## Tests

```bash
npm test
```

Covers the booking / payment state machine: pay success, and debit-with-no-ticket → same-day resume/retry at the same amount with no double charge.

## Stack

- Next.js (App Router) + TypeScript
- Vitest for the payment state machine
- Client-side mock rail graph (Mumbai–Delhi + Konkan)
- No live IRCTC

## What this is not

- Not an official IRCTC / Railways product
- Not a Tatkal speed claim. Tatkal is a **clock and a rule** computed from the **originating station**, not a concurrency boast
- Not production payments

## Demo seed

Use **Play the citizen story** (once the journey UI lands on this branch) for a two-minute recording: pin → trains → book → debit-no-ticket → recover → PNR.
