# Get Me Home

Independent hackathon prototype of a citizen train journey for **Build What Moves India**.

**Not affiliated with IRCTC or Indian Railways.** This app never calls live IRCTC / Indian Railways APIs. Every passenger, PNR, station clock, fare, and payment is **mock / fictional**. Do not treat it as an official booking channel.

Persistent on-screen label (English + Hindi): *Independent hackathon prototype · mock data only · not affiliated with IRCTC or Indian Railways.*

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

Optional (local only, never commit real secrets) — see `.env.example`:

- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — if present, a faint Google embed can enhance the map. **Without it, a crafted SVG India rail map is the demo.** Judges should never see a broken Google logo.

Do **not** put Google Maps keys, GEE keys, or any real credentials in git.

## Tests

```bash
npm test
```

Covers:

- Payment state machine: success (PNR issued)
- Debit-with-no-ticket → same-day resume/retry at the same amount, **no double charge**
- Same-day / IST calendar gate for resume
- Catchability from a Mumbai pin, and Tatkal/ARP computed on the **originating station** clock

## Stack

- Next.js 15 (App Router) + TypeScript
- Vitest for payment + catchability
- Client-side mock rail graph (Mumbai CSMT/BCT/LTT/DR · Delhi NDLS/NZM · Konkan PNVL/RN/MAO)
- No live IRCTC

## Live preview

Anonymous Vercel deployment (claim it so it does not expire):

- App: https://temporary-rushing-zither-khnl5ii.vercel.app
- Claim / keep: https://vercel.com/claim-deployment?code=158d3c4e-4632-4ffd-9c1f-3845a55b0b3c

**Captain click (permanent):** open [vercel.com/new](https://vercel.com/new), import `tayyab415/get-me-home`, deploy branch `cursor/get-me-home-citizen-journey-ccab`. No env vars are required.

Local: `npm install && npm test && npm run dev` → http://localhost:3000

## Demo seed

Use **Play the citizen story** for a two-minute recording (minute one as citizen):

pin (Bandra) → Delhi in plain language → trains → book Narmada Night Mail (board Dadar, originates CSMT) → debit-no-ticket → recover → PNR (mixed CNF + waitlist).

Tatkal is a **clock and a rule** on the originating station, not a speed or concurrency boast.

## What this is not

- Not an official IRCTC / Railways product
- Not a Tatkal-fast claim
- Not production payments
