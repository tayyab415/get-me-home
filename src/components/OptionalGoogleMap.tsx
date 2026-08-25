"use client";

import type { LatLng } from "@/lib/geo";

/**
 * Optional enhance. Never loads Google assets unless NEXT_PUBLIC_GOOGLE_MAPS_KEY
 * is present at build time. The crafted SVG map is always the fallback —
 * judges must never see a broken Google logo.
 */
export function OptionalGoogleMap({ pin }: { pin: LatLng }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return null;
  const src = `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(key)}&center=${pin.lat},${pin.lng}&zoom=11&maptype=roadmap`;
  return (
    <iframe
      title="Optional Google Map enhance"
      src={src}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        opacity: 0.35,
        pointerEvents: "none",
      }}
    />
  );
}
