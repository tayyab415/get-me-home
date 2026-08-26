# Get Me Home — Build What Moves India submission

Paste-ready copy. Independent hackathon prototype. Mock data only. Not affiliated with IRCTC or Indian Railways. No live IRCTC. Record locally (`npm run dev` → http://localhost:3000). There is no public Vercel demo.

---

## 1) Project summary

Paste the block below. Do not include this heading.

_Word count: 198 (limit 250)._

Get Me Home is an independent hackathon prototype built for Build What Moves India. It is not affiliated with IRCTC or Indian Railways. The app never calls live IRCTC or Indian Railways APIs. Every passenger, PNR, fare, station clock, and payment is mock.

The citizen journey is named for the job: get home by train from where you actually are. The product is map-first. You pin a place — Bandra, not a form’s default station — and ask for trains you can still catch. This is not a government form rebuild.

Boarding station and originating station are told in human language. Narmada Night Mail originates at CSMT; you board at Dadar after it has already left the start. Tatkal and ARP windows follow the originating-station clock, not the boarding-station clock. Tatkal is a clock and a rule. We did not make 10am Tatkal fast.

Mock pay has two outcomes. One issues a PNR. The other is debit-with-no-ticket: money left, no ticket — then same-day resume at the same amount, with no double charge. Recovery is the second act, not a footnote.

Hindi and English actually switch strings. The surface is a night-rail product, not a beige civic PDF.

---

## 2) Two-minute video shot list

Record the local app. Use **Play the citizen story**, or walk the same path by hand. Leave reduced motion off — it skips beats. Hold each beat so it is readable on camera. VO can sit under the picture. Do not claim Tatkal speed. Do not show a live IRCTC site.

### Minute one — citizen

Play the citizen story path. Slow enough to film.

| Time | Beat | On screen | Say |
| --- | --- | --- | --- |
| 0:00–0:08 | Pin Bandra | Map-first home. Pin on Bandra. “You are here.” | Start from where I actually am — not a station-code form. |
| 0:08–0:16 | Destination Delhi | “Where is home tonight?” Plain language, then station chips. | Home is Delhi. City name is enough. |
| 0:16–0:28 | Narmada Night Mail | Train card: originates CSMT, boards Dadar (DR). Human-language warning: you are not starting where this train starts. | This train starts at CSMT. I board at Dadar after it has already left. Boarding is not origin. |
| 0:28–0:38 | Debit, no ticket | Review. Choose **Pay — debit with no ticket**. Then “Money left. No ticket.” | The debit succeeded. A PNR was not issued. |
| 0:38–0:50 | Recover | Ledger: debited once. **Resume / retry · same amount · no second debit.** | Same day. Same amount. No double charge. |
| 0:50–1:00 | PNR, mixed family | Ticket stub exists. **May board reserved coaches** (CNF) vs **Must not board reserved coaches** (WL). Mixed-family copy. | Confirmed passengers may board reserved coaches. Waitlisted must not — even if they travel together. |

If autoplay feels fast, linger on recovery and the ticket stub. Those two screens are the point of minute one.

### Minute two — how / why

Start over. Click through by hand so you can pause.

| Time | Beat | On screen | Say |
| --- | --- | --- | --- |
| 1:00–1:20 | Originating-station clock | Narmada Night Mail card or review: Tatkal / ARP clock is CSMT, not Dadar. Quota line says the window is a clock, not a speed claim. | Tatkal is a clock and a rule on the originating station. We did not make 10am Tatkal fast. |
| 1:20–1:40 | Honest recovery as the second act | Recovery sheet again: money left, no ticket; resume today; ledger still one debit. | The honest second act is money gone, no ticket — then same-day resume, no double charge. That failure is the product, not a footnote. |
| 1:40–2:00 | Not a form rebuild | Map still home. Pin, catchability from travel time, boarding vs origin in human language. Optional: toggle **हिन्दी** so strings actually switch. | A form defaults a station and hides boarding vs origin. Map-first starts from the pin. Get home from where you are. |

End on the ticket stub or the night map. Independent prototype label stays on screen. No live IRCTC. No production pay.
