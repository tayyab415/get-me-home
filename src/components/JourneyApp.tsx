"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OptionalGoogleMap } from "@/components/OptionalGoogleMap";
import { RailMap } from "@/components/RailMap";
import { TicketStub } from "@/components/TicketStub";
import { TrainCard } from "@/components/TrainCard";
import { MUMBAI_DEFAULT, type LatLng } from "@/lib/geo";
import {
  PLACES,
  STATION_BY_CODE,
  resolveDestination,
  resolvePlace,
  type CoachClass,
} from "@/lib/rail-graph";
import { originDeparture, tdrDeadline } from "@/lib/ticket";
import {
  canResume,
  createIdleSession,
  formatInrFromPaise,
  istCalendarDate,
  resolveGateway,
  resolveResume,
  startPay,
  startResume,
  totalDebitedPaise,
  type LedgerEntry,
  type PaymentSession,
} from "@/lib/payment-machine";
import { nextTraveller, searchTrains, seedTravellers, type RankedTrain, type Traveller } from "@/lib/search";
import { fill, localeFor, t, type Lang, type StringKey } from "@/lib/i18n";
import { formatIstLong } from "@/lib/catchability";
import { issueMockTicket } from "@/lib/ticket";

type Step =
  | "map"
  | "results"
  | "passengers"
  | "review"
  | "paying"
  | "recovery"
  | "ticket"
  | "failed";

const DEMO_NOW = new Date("2026-08-25T09:20:00+05:30");
const CLASSES: CoachClass[] = ["SL", "3A", "2A", "CC"];

const LEDGER_NOTES: Record<string, StringKey> = {
  "Single debit. PNR issued.": "ledgerNoteDebitPnr",
  "Debit succeeded. Ticket/PNR not issued.": "ledgerNoteDebitNoTicket",
  "Idempotent resume. No second debit. PNR issued against original charge.": "ledgerNoteResumePnr",
  "Idempotent resume. No second debit. Ticket still not issued.": "ledgerNoteResumeFail",
};

function sleep(ms: number, signal: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    const t = window.setTimeout(() => resolve(), ms);
    if (signal.cancelled) {
      window.clearTimeout(t);
      resolve();
    }
  });
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function defaultJourneyDate(now: Date): string {
  return istCalendarDate(now);
}

function markIndex(step: Step): number {
  if (step === "map") return 0;
  if (step === "results") return 1;
  if (step === "passengers") return 2;
  if (step === "review" || step === "paying") return 3;
  if (step === "recovery" || step === "failed") return 4;
  return 5;
}

function ledgerLabel(lang: Lang, entry: LedgerEntry): string {
  const kind = entry.kind === "debit" ? t(lang, "ledgerKindDebit") : t(lang, "ledgerKindResume");
  const key = LEDGER_NOTES[entry.note];
  const note = key ? t(lang, key) : entry.note;
  return `${kind} · ${formatInrFromPaise(entry.amountPaise, localeFor(lang))} · ${note}`;
}

export function JourneyApp() {
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("map");
  const [pin, setPin] = useState<LatLng>(MUMBAI_DEFAULT);
  const [placeText, setPlaceText] = useState("");
  const [destText, setDestText] = useState("");
  const [destCodes, setDestCodes] = useState<string[]>([]);
  const [destLabel, setDestLabel] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const [coach, setCoach] = useState<CoachClass>("3A");
  const [now, setNow] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RankedTrain[]>([]);
  const [picked, setPicked] = useState<RankedTrain | null>(null);
  const [travellers, setTravellers] = useState<Traveller[]>(() => seedTravellers());
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [story, setStory] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const cancelRef = useRef({ cancelled: false });
  const payLockRef = useRef(false);
  const storyLockRef = useRef(false);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const monsoon = destCodes.includes("MAO") || destCodes.includes("RN") || Boolean(picked?.train.monsoonWatch);
  const loc = localeFor(lang);

  const destResolved = useMemo(() => resolveDestination(destText), [destText]);

  useEffect(() => {
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
  }, [lang]);

  useEffect(() => {
    const clock = new Date();
    setNow(clock);
    setJourneyDate(defaultJourneyDate(clock));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!destResolved) {
      setDestCodes([]);
      setDestLabel("");
      return;
    }
    setDestCodes(destResolved.stationCodes);
    setDestLabel(lang === "hi" ? destResolved.labelHi : destResolved.labelEn);
  }, [destResolved, lang]);

  const farePaise = picked ? picked.farePaise * travellers.length : 0;

  function runSearch(customNow?: Date, customPin?: LatLng, codes?: string[], date?: string, cls?: CoachClass) {
    const clock = customNow ?? now;
    const p = customPin ?? pin;
    const d = codes ?? destCodes;
    const day = date ?? journeyDate;
    const c = cls ?? coach;
    if (!d.length) {
      setError("emptyDest");
      return [];
    }
    if (!clock) {
      return [];
    }
    setError(null);
    setLoading(true);
    try {
      const found = searchTrains({
        pin: p,
        destCodes: d,
        journeyDateIst: day,
        coach: c,
        now: clock,
      });
      setRows(found);
      setStep("results");
      return found;
    } catch {
      setError("search");
      return [];
    } finally {
      window.setTimeout(() => setLoading(false), prefersReducedMotion() ? 0 : 420);
    }
  }

  async function playCitizenStory() {
    if (storyLockRef.current) return;
    storyLockRef.current = true;
    cancelRef.current.cancelled = false;
    setStory(true);
    try {
    const wait = (ms: number) => sleep(prefersReducedMotion() ? 0 : ms, cancelRef.current);
    const bandra = PLACES.find((p) => p.id === "bandra")!;
    setNow(DEMO_NOW);
    setPin({ lat: bandra.lat, lng: bandra.lng });
    setPlaceText(lang === "hi" ? bandra.labelHi : bandra.labelEn);
    setDestText("home in Delhi");
    setCoach("3A");
    setJourneyDate("2026-08-25");
    setTravellers(seedTravellers());
    await wait(1400);
    const found = runSearch(
      DEMO_NOW,
      { lat: bandra.lat, lng: bandra.lng },
      ["NDLS", "NZM"],
      "2026-08-25",
      "3A",
    );
    await wait(2800);
    const night = found.find((r) => r.train.id === "night-mail") ?? found.find((r) => r.catch.catchable);
    if (!night) {
      return;
    }
    setPicked(night);
    setStep("passengers");
    await wait(2000);
    setStep("review");
    await wait(2400);
    const idle = createIdleSession(
      night.farePaise * 3,
      "gmh-idem-citizen-story-001",
      DEMO_NOW,
    );
    let pay = startPay(idle, DEMO_NOW);
    setSession(pay);
    setStep("paying");
    await wait(1400);
    pay = resolveGateway(
      pay,
      "debit_no_ticket",
      issueMockTicket(seedTravellers(), pay.idempotencyKey, DEMO_NOW),
      DEMO_NOW,
    );
    setSession(pay);
    setStep("recovery");
    await wait(3600);
    pay = startResume(pay, new Date("2026-08-25T09:22:00+05:30"));
    setSession(pay);
    await wait(1400);
    const issued = issueMockTicket(
      seedTravellers(),
      `${pay.idempotencyKey}-resume`,
      new Date("2026-08-25T09:22:04+05:30"),
    );
    pay = resolveResume(pay, "success", issued, new Date("2026-08-25T09:22:04+05:30"));
    setSession(pay);
    setStep("ticket");
    } finally {
      setStory(false);
      storyLockRef.current = false;
    }
  }

  function applyPlace() {
    const hit = resolvePlace(placeText);
    if (hit) setPin({ lat: hit.lat, lng: hit.lng });
  }

  const primaryCta = (() => {
    if (step === "map") {
      return {
        label: t(lang, "findTrains"),
        action: () => runSearch(),
        disabled: !destCodes.length || story || !now,
      };
    }
    if (step === "passengers") {
      return {
        label: t(lang, "review"),
        action: () => setStep("review"),
        disabled: travellers.length === 0,
      };
    }
    if (step === "review" && picked) {
      return {
        label: `${t(lang, "paySuccess")} · ${formatInrFromPaise(farePaise, loc)}`,
        action: () => beginPay("success"),
        disabled: story,
        extra: {
          label: `${t(lang, "payDebit")} · ${formatInrFromPaise(farePaise, loc)}`,
          action: () => beginPay("debit_no_ticket"),
        },
      };
    }
    if (step === "paying") {
      return {
        label: t(lang, "paying"),
        action: () => undefined,
        disabled: true,
      };
    }
    if (step === "recovery" && session) {
      return {
        label: t(lang, "resume"),
        action: () => doResume("success"),
        disabled: story || !now || !canResume(session, now).ok,
      };
    }
    if (step === "ticket" || step === "failed") {
      return {
        label: t(lang, "newSearch"),
        action: () => {
          payLockRef.current = false;
          storyLockRef.current = false;
          const clock = new Date();
          setStep("map");
          setPicked(null);
          setSession(null);
          setRows([]);
          setNow(clock);
          setJourneyDate(defaultJourneyDate(clock));
        },
        disabled: false,
      };
    }
    return null;
  })();

  function beginPay(outcome: "success" | "debit_no_ticket") {
    if (!picked || !now) return;
    if (payLockRef.current) return;
    if (
      session?.status === "debit_no_ticket" ||
      session?.status === "resuming" ||
      session?.status === "paying" ||
      step === "paying"
    ) {
      return;
    }
    payLockRef.current = true;
    const clock = now;
    const idle = createIdleSession(
      farePaise,
      `gmh-${picked.train.id}-${clock.getTime()}`,
      clock,
    );
    let pay = startPay(idle, clock);
    setSession(pay);
    setStep("paying");
    window.setTimeout(() => {
      const ticket = issueMockTicket(travellers, pay.idempotencyKey, clock);
      pay = resolveGateway(pay, outcome, ticket, clock);
      setSession(pay);
      setStep(outcome === "success" ? "ticket" : "recovery");
      payLockRef.current = false;
    }, prefersReducedMotion() ? 0 : 640);
  }

  function doResume(outcome: "success" | "still_failed") {
    if (!session || !now) return;
    if (payLockRef.current) return;
    if (step === "paying" || session.status === "resuming") return;
    const clock = now;
    const gate = canResume(session, clock);
    if (!gate.ok) return;
    payLockRef.current = true;
    setStep("paying");
    try {
      let pay = startResume(session, clock);
      setSession(pay);
      window.setTimeout(() => {
        const ticket =
          outcome === "success"
            ? issueMockTicket(travellers, `${pay.idempotencyKey}-resume`, clock)
            : undefined;
        pay = resolveResume(pay, outcome, ticket, clock);
        setSession(pay);
        setStep(pay.status === "success" ? "ticket" : "failed");
        payLockRef.current = false;
      }, prefersReducedMotion() ? 0 : 500);
    } catch {
      payLockRef.current = false;
      setStep("recovery");
    }
  }

  const highlight = picked?.catch.boardingCode;
  const activeMark = markIndex(step);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-block">
          <p className="kicker">{t(lang, "kicker")}</p>
          <h1>{t(lang, "brand")}</h1>
        </div>
        <div className="lang-toggle" role="group" aria-label={t(lang, "langSwitch")}>
          <button
            type="button"
            aria-pressed={lang === "en"}
            aria-label={t(lang, "langEn")}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            aria-pressed={lang === "hi"}
            lang="hi"
            aria-label={t(lang, "langHi")}
            onClick={() => setLang("hi")}
          >
            हिं
          </button>
        </div>
      </header>

      <div className="stage">
        <div className="map-wrap">
          <OptionalGoogleMap pin={pin} />
          <RailMap
            pin={pin}
            onPin={setPin}
            destCodes={destCodes}
            highlightBoarding={highlight}
            monsoon={monsoon || destText.toLowerCase().includes("goa")}
            labels={{
              aria: t(lang, "mapAria"),
              arabian: t(lang, "seaArabian"),
              bengal: t(lang, "seaBengal"),
              himalaya: t(lang, "himalaya"),
              mock: t(lang, "mockRail"),
              north: t(lang, "north"),
            }}
          />
          <div className="map-hud">
            <div className="hud-card">
              {step === "map" ? (
                <>
                  <label className="field">
                    {t(lang, "destination")}
                    <input
                      value={destText}
                      placeholder={t(lang, "destPlaceholder")}
                      onChange={(e) => setDestText(e.target.value)}
                      disabled={story}
                    />
                  </label>
                  <label className="field">
                    {t(lang, "movePin")}
                    <input
                      value={placeText}
                      placeholder={t(lang, "placePlaceholder")}
                      onChange={(e) => setPlaceText(e.target.value)}
                      onBlur={applyPlace}
                      disabled={story}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyPlace();
                      }}
                    />
                  </label>
                  {destCodes.length ? (
                    <div className="station-chips" aria-live="polite">
                      {destCodes.map((c) => (
                        <span key={c}>
                          {c} · {lang === "hi" ? STATION_BY_CODE[c].nameHi : STATION_BY_CODE[c].nameEn}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {destLabel ? <p className="hint" style={{ marginBottom: 0 }}>{destLabel}</p> : null}
                </>
              ) : (
                <>
                  <p className="kicker" style={{ marginBottom: 4 }}>
                    {t(lang, "fromStamp")}
                  </p>
                  <p className="train-name" style={{ fontSize: "1.15rem" }}>
                    {placeText || `${pin.lat.toFixed(2)}° ${pin.lng.toFixed(2)}°`}
                    {destLabel ? ` → ${destLabel}` : destText ? ` → ${destText}` : ""}
                  </p>
                  {destCodes.length ? (
                    <div className="station-chips" style={{ marginTop: 8, marginBottom: 0 }}>
                      {destCodes.map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className="map-caption">
            <span className="chip">
              {t(lang, "whereYouAre")} · {pin.lat.toFixed(3)}, {pin.lng.toFixed(3)}
            </span>
            <span className="chip">
              {t(lang, "clockMock")}: {now ? formatIstLong(now, loc) : "—"}
            </span>
          </div>
        </div>

        <section className="sheet" lang={lang === "hi" ? "hi" : "en"}>
          <div className="marks" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={i <= activeMark ? "mark on" : "mark"} />
            ))}
          </div>
          <button
            type="button"
            className="story-btn"
            onClick={() => void playCitizenStory()}
            disabled={story || step !== "map"}
          >
            {story ? t(lang, "playingStory") : t(lang, "playStory")}
          </button>
          <p className="hint">{t(lang, "storyCaption")}</p>
          {reduceMotion ? <p className="hint">{t(lang, "skipMotion")}</p> : null}

          {step === "map" ? (
            <>
              <p className="hint">{t(lang, "destHint")}</p>
              <div className="row-2">
                <label className="field">
                  {t(lang, "journeyDate")}
                  <input
                    type="date"
                    value={journeyDate}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    disabled={story}
                  />
                </label>
                <label className="field">
                  {t(lang, "coachClass")}
                  <select
                    value={coach}
                    onChange={(e) => setCoach(e.target.value as CoachClass)}
                    disabled={story}
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c} · {t(lang, ({ SL: "classSL", "3A": "class3A", "2A": "class2A", CC: "classCC" } as const)[c])}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {error === "emptyDest" ? (
                <div className="empty-state">{t(lang, "emptyDest")}</div>
              ) : null}
              <p className="maps-note">{mapsKey ? t(lang, "mapsEnhanceOn") : t(lang, "mapsEnhance")}</p>
            </>
          ) : null}

          {step === "results" ? (
            <>
              <h2 className="train-name">{t(lang, "resultsTitle")}</h2>
              <p className="hint">{t(lang, "resultsSub")}</p>
              {loading ? (
                <>
                  <div className="skeleton" />
                  <div className="skeleton" />
                </>
              ) : error === "search" ? (
                <div className="error-state">
                  <h3>{t(lang, "errorTitle")}</h3>
                  <p>{t(lang, "errorBody")}</p>
                  <button type="button" className="cta" onClick={() => runSearch()}>
                    {t(lang, "retry")}
                  </button>
                </div>
              ) : rows.length === 0 ? (
                <div className="empty-state">
                  <h3>{t(lang, "noneCatchable")}</h3>
                  <p>{t(lang, "noneBody")}</p>
                </div>
              ) : (
                <>
                  <p className="hint">{fill(t(lang, "resultsCount"), { n: String(rows.length) })}</p>
                  <div className="train-list">
                    {rows.map((row) => (
                      <TrainCard
                        key={row.train.id}
                        row={row}
                        lang={lang}
                        disabled={story}
                        onPick={() => {
                          setPicked(row);
                          setStep("passengers");
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : null}

          {step === "passengers" ? (
            <>
              <h2 className="train-name">{t(lang, "passengers")}</h2>
              <p className="hint">{t(lang, "passengersHint")}</p>
              {travellers.map((p, idx) => (
                <div className="passenger" key={p.id}>
                  <label className="field">
                    {t(lang, "name")}
                    <input
                      value={p.name}
                      onChange={(e) => {
                        const next = [...travellers];
                        next[idx] = { ...p, name: e.target.value };
                        setTravellers(next);
                      }}
                    />
                  </label>
                  <label className="field">
                    {t(lang, "age")}
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={p.age}
                      onChange={(e) => {
                        const next = [...travellers];
                        next[idx] = { ...p, age: Number(e.target.value) };
                        setTravellers(next);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t(lang, "remove")}
                    onClick={() => setTravellers(travellers.filter((x) => x.id !== p.id))}
                  >
                    −
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="cta ghost"
                onClick={() => setTravellers([...travellers, nextTraveller(travellers)])}
              >
                {t(lang, "addPassenger")}
              </button>
              {travellers.length === 0 ? <p className="hint">{t(lang, "passengerNeed")}</p> : null}
            </>
          ) : null}

          {step === "review" && picked ? (
            <>
              <h2 className="train-name">{t(lang, "review")}</h2>
              <p className="hint">
                {lang === "hi" ? picked.train.nameHi : picked.train.nameEn} · {picked.train.number}
              </p>
              {!picked.catch.boardingIsOrigin ? (
                <div className="warn">
                  <strong>{t(lang, "boardingNeOriginTitle")}</strong>
                  <p>
                    {fill(t(lang, "boardingNeOrigin"), {
                      origin: `${STATION_BY_CODE[picked.catch.originCode].code}`,
                      board: `${STATION_BY_CODE[picked.catch.boardingCode].code}`,
                      mins: fill(t(lang, "boardingMins"), {
                        n: String(
                          picked.train.stops.find((s) => s.stationCode === picked.catch.boardingCode)
                            ?.departOffsetMin ?? 0,
                        ),
                      }),
                    })}
                  </p>
                  <p>
                    {fill(t(lang, "originClock"), {
                      origin: picked.catch.originCode,
                      board: picked.catch.boardingCode,
                    })}
                  </p>
                </div>
              ) : (
                <p className="hint">
                  {fill(t(lang, "originClockSame"), { origin: picked.catch.originCode })}
                </p>
              )}
              <p>
                {t(lang, "fare")}: {formatInrFromPaise(farePaise, loc)} · {travellers.length}{" "}
                {t(lang, "passengers").toLowerCase()}
              </p>
              <p className="hint">{t(lang, "payHint")}</p>
            </>
          ) : null}

          {step === "paying" ? (
            <>
              <div className="skeleton" />
              <p className="hint">{t(lang, "paying")}</p>
            </>
          ) : null}

          {step === "recovery" && session ? (
            <div className="recovery">
              <h2>{t(lang, "recoveryTitle")}</h2>
              <p>{t(lang, "recoveryBody")}</p>
              <div className="ledger">
                <div>
                  {t(lang, "ledger")} · {t(lang, "debitOnce")} · {formatInrFromPaise(totalDebitedPaise(session), loc)}
                </div>
                <div>
                  {t(lang, "noSecond")} · {session.idempotencyKey}
                </div>
                {session.ledger.map((e) => (
                  <div key={e.id}>{ledgerLabel(lang, e)}</div>
                ))}
              </div>
              <p className="hint">{t(lang, "resumeHint")}</p>
              <button
                type="button"
                className="cta ghost"
                onClick={() => doResume("still_failed")}
                disabled={story || !now || !canResume(session, now).ok}
              >
                {t(lang, "stillFailed")}
              </button>
            </div>
          ) : null}

          {step === "failed" ? (
            <div className="error-state">
              <h3>{t(lang, "stillFailed")}</h3>
              <p>{t(lang, "stillFailedBody")}</p>
            </div>
          ) : null}

          {step === "ticket" && session?.ticket && picked ? (
            <TicketStub
              lang={lang}
              ticket={session.ticket}
              row={picked}
              session={session}
              deadline={tdrDeadline(originDeparture(picked.train, journeyDate))}
            />
          ) : null}

          {primaryCta && step !== "results" ? (
            <div className="cta-dock">
              {step !== "map" &&
              step !== "ticket" &&
              step !== "failed" &&
              step !== "paying" &&
              step !== "recovery" ? (
                <div className="cta-row">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t(lang, "back")}
                    onClick={() => {
                      if (step === "passengers") setStep("results");
                      else if (step === "review") setStep("passengers");
                    }}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="cta"
                    disabled={primaryCta.disabled}
                    onClick={primaryCta.action}
                  >
                    {primaryCta.label}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cta"
                  disabled={primaryCta.disabled}
                  onClick={primaryCta.action}
                >
                  {primaryCta.label}
                </button>
              )}
              {step === "review" && "extra" in primaryCta && primaryCta.extra ? (
                <button
                  type="button"
                  className="cta ghost"
                  style={{ marginTop: 8 }}
                  onClick={primaryCta.extra.action}
                  disabled={story}
                >
                  {primaryCta.extra.label}
                </button>
              ) : null}
            </div>
          ) : step === "results" ? (
            <div className="cta-dock">
              <button type="button" className="cta ghost" onClick={() => setStep("map")}>
                {t(lang, "back")}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
