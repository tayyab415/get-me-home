export function PrototypeBanner() {
  return (
    <div
      role="note"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 80,
        background: "#c45c32",
        color: "#07090e",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textAlign: "center",
        padding: "8px 12px",
        minHeight: 52,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1.3,
      }}
    >
      Independent hackathon prototype · mock data only · not affiliated with
      IRCTC or Indian Railways
      <span style={{ display: "block", fontWeight: 600, marginTop: 2 }}>
        स्वतंत्र हैकथॉन प्रोटोटाइप · केवल काल्पनिक डेटा · आईआरसीटीसी / भारतीय रेल से
        संबद्ध नहीं
      </span>
    </div>
  );
}
