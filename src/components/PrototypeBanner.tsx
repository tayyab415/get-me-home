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
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1.3,
      }}
    >
      Independent hackathon prototype · mock data only · not affiliated with
      IRCTC or Indian Railways
    </div>
  );
}
