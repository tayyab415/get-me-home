"use client";

import type { RankedTrain } from "@/lib/search";
import { STATION_BY_CODE } from "@/lib/rail-graph";
import { formatIstClock } from "@/lib/catchability";
import { fill, t, type Lang } from "@/lib/i18n";
import { formatInrFromPaise } from "@/lib/payment-machine";

export function TrainCard({
  row,
  lang,
  onPick,
  disabled,
}: {
  row: RankedTrain;
  lang: Lang;
  onPick: () => void;
  disabled?: boolean;
}) {
  const origin = STATION_BY_CODE[row.catch.originCode];
  const board = STATION_BY_CODE[row.catch.boardingCode];
  const originName = lang === "hi" ? origin.nameHi : origin.nameEn;
  const boardName = lang === "hi" ? board.nameHi : board.nameEn;
  const trainName = lang === "hi" ? row.train.nameHi : row.train.nameEn;
  const avail = row.availability;
  const quota =
    row.window.quota === "TATKAL"
      ? fill(t(lang, "quotaTatkal"), {
          origin: row.catch.originCode,
          when: formatIstClock(row.window.opensAt),
        })
      : row.window.quota === "ARP"
        ? fill(t(lang, "quotaArp"), { when: formatIstClock(row.window.opensAt) })
        : t(lang, "quotaClosed");

  return (
    <article className={`train-card ${row.catch.catchable ? "catchable" : "missed"}`}>
      <header>
        <h3 className="train-name">{trainName}</h3>
        <span className="train-no">{row.train.number}</span>
      </header>
      <div className="meta">
        <span className="pill">
          {t(lang, "originAt")} {row.catch.originCode} {row.train.originDepartHm}
        </span>
        <span className="pill">
          {t(lang, "boardAt")} {row.catch.boardingCode} {formatIstClock(row.catch.trainDepartsBoardingAt)}
        </span>
        <span className={`pill ${row.catch.catchable ? "good" : "bad"}`}>
          {row.catch.travelLabel} {t(lang, "travelToBoard")}
        </span>
        {avail && avail.kind !== "CLOSED" ? (
          <span className="pill">
            {avail.kind === "AVAILABLE"
              ? `${avail.count} ${t(lang, "avail")}`
              : avail.kind === "WL"
                ? `${t(lang, "wl")} ${avail.count}`
                : `${t(lang, "rac")} ${avail.count}`}
            · {formatInrFromPaise(row.farePaise)}
          </span>
        ) : (
          <span className="pill bad">{t(lang, "closedClass")}</span>
        )}
      </div>
      {!row.catch.boardingIsOrigin ? (
        <div className="warn">
          <strong>{t(lang, "boardingNeOriginTitle")}</strong>
          <p style={{ margin: "6px 0 0" }}>
            {fill(t(lang, "boardingNeOrigin"), {
              origin: `${originName} (${origin.code})`,
              board: `${boardName} (${board.code})`,
              mins: `${row.train.stops.find((s) => s.stationCode === board.code)?.departOffsetMin ?? 0} min`,
            })}
          </p>
        </div>
      ) : null}
      <p className="clock-callout">
        {row.catch.boardingIsOrigin
          ? fill(t(lang, "originClockSame"), { origin: origin.code })
          : fill(t(lang, "originClock"), { origin: origin.code, board: board.code })}{" "}
        {quota}
      </p>
      {row.train.monsoonWatch ? <p className="clock-callout">{t(lang, "monsoon")}</p> : null}
      <p className="clock-callout">
        {row.catch.catchable
          ? `${t(lang, "corridorOpen")} · ${t(lang, "leavesIn")} ${row.catch.slackMin} min`
          : `${t(lang, "cantCatch")} · ${t(lang, "missedBy")} ${Math.abs(row.catch.slackMin)} min ${t(lang, "ago")}`}
      </p>
      <button
        type="button"
        className="cta"
        style={{ marginTop: 10 }}
        disabled={disabled || !row.catch.catchable || !avail || avail.kind === "CLOSED" || row.farePaise <= 0}
        onClick={onPick}
      >
        {t(lang, "pickTrain")}
      </button>
    </article>
  );
}
