"use client";

export function JourneyShell() {
  return (
    <main
      style={{
        minHeight: "calc(100dvh - 44px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section style={{ maxWidth: 420, textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--amber)",
            fontSize: 12,
            margin: 0,
          }}
        >
          Night rail · citizen journey
        </p>
        <h1
          style={{
            fontFamily: "var(--font-ticket)",
            fontSize: "clamp(2.4rem, 8vw, 4rem)",
            margin: "12px 0 16px",
            lineHeight: 0.95,
          }}
        >
          Get Me Home
        </h1>
        <p style={{ color: "var(--paper)", opacity: 0.84 }}>
          Scaffold is live. Map, trains, honest payment recovery, and Hindi /
          English strings ship next on this branch.
        </p>
      </section>
    </main>
  );
}
