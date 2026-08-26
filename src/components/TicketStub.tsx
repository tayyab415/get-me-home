"use client";

import { STATION_BY_CODE } from "@/lib/rail-graph";
import { fill, localeFor, t, type Lang } from "@/lib/i18n";
import { formatIstLong } from "@/lib/catchability";
import { formatInrFromPaise, type PaymentSession } from "@/lib/payment-machine";
import type { IssuedTicket } from "@/lib/payment-machine";
import type { RankedTrain } from "@/lib/search";

export function TicketStub({
  lang,
  ticket,
  row,
  session,
  deadline,
}: {
  lang: Lang;
  ticket: IssuedTicket;
  row: RankedTrain;
  session: PaymentSession;
  deadline: Date;
}) {
  const origin = STATION_BY_CODE[row.catch.originCode];
  const board = STATION_BY_CODE[row.catch.boardingCode];
  const can = ticket.passengers.filter((p) => p.status === "CNF" || p.status === "RAC");
  const cannot = ticket.passengers.filter((p) => p.status === "WL");
  const loc = localeFor(lang);
  const bars = [10, 22, 16, 28, 12, 24, 18, 26, 11, 28, 14, 20, 27, 9, 23, 17, 28, 13, 21, 25, 12, 19];

  return (
    <div className="ticket" aria-label={t(lang, "ticketTitle")}>
      <div className="stub">
        <div>
          <p className="kicker" style={{ color: "#8a3318" }}>
            {t(lang, "ticketTitle")}
          </p>
          <h2>
            {t(lang, "pnr")} {ticket.pnr}
          </h2>
        </div>
        <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
          <div>{lang === "hi" ? row.train.nameHi : row.train.nameEn}</div>
          <div>{row.train.number}</div>
          <div>{formatInrFromPaise(session.amountPaise, loc)}</div>
        </div>
      </div>
      <p>
        {t(lang, "boardAt")} {board.code} · {t(lang, "originAt")} {origin.code}
      </p>
      {!row.catch.boardingIsOrigin ? (
        <p>
          {fill(t(lang, "boardingNeOrigin"), {
            origin: `${origin.code}`,
            board: `${board.code}`,
            mins: fill(t(lang, "boardingMins"), {
              n: String(
                row.train.stops.find((s) => s.stationCode === board.code)?.departOffsetMin ?? 0,
              ),
            }),
          })}
        </p>
      ) : null}
      <p>
        <strong>{t(lang, "canBoard")}</strong>
      </p>
      <ol>
        {can.map((p) => (
          <li key={p.id}>
            {p.name} · {p.age} · {p.status === "RAC" ? t(lang, "statusRac") : t(lang, "statusCnf")}
          </li>
        ))}
      </ol>
      {cannot.length ? (
        <>
          <p>
            <strong>{t(lang, "cannotBoard")}</strong>
          </p>
          <ol>
            {cannot.map((p) => (
              <li key={p.id}>
                {p.name} · {p.age} · {t(lang, "statusWl")} {p.waitlistNumber}
              </li>
            ))}
          </ol>
          <p>{t(lang, "mixedFamily")}</p>
        </>
      ) : null}
      <p>
        <strong>{t(lang, "tdrTitle")}</strong>
      </p>
      <p>
        {fill(t(lang, "tdrBody"), {
          origin: origin.code,
          deadline: formatIstLong(deadline, loc),
        })}
      </p>
      <div className="barcode" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} style={{ height: h }} />
        ))}
      </div>
      <p style={{ fontSize: "0.8rem", opacity: 0.75 }}>{t(lang, "prototype")}</p>
    </div>
  );
}
