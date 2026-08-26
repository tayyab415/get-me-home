import { project } from "./geo";

export type LabelAnchor = "start" | "middle" | "end";

export interface StationLabelLayout {
  code: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  anchor: LabelAnchor;
}

/** Stations closer than this (map px) share a cluster and get fanned labels. */
const CLUSTER_PX = 22;

/** Offsets that keep 3–4 letter codes from overprinting inside a cluster. */
const PAIR: { dx: number; dy: number; anchor: LabelAnchor }[] = [
  { dx: -14, dy: -12, anchor: "end" },
  { dx: 14, dy: 12, anchor: "start" },
];

const SOLO = { dx: 0, dy: -12, anchor: "middle" as const };

function fanFor(index: number, count: number): { dx: number; dy: number; anchor: LabelAnchor } {
  if (count <= 1) return SOLO;
  if (count === 2) return PAIR[index] ?? PAIR[0];
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const r = 18 + count * 5;
  const dx = Math.cos(angle) * r;
  const dy = Math.sin(angle) * r * 0.88;
  const anchor: LabelAnchor = dx < -6 ? "end" : dx > 6 ? "start" : "middle";
  return { dx, dy, anchor };
}

export function labelAnchorPoint(layout: StationLabelLayout): { x: number; y: number } {
  return { x: layout.x + layout.dx, y: layout.y + layout.dy };
}

export function stationLabelLayout(
  stations: { code: string; lat: number; lng: number }[],
): StationLabelLayout[] {
  const pts = stations.map((s) => {
    const p = project({ lat: s.lat, lng: s.lng });
    return { code: s.code, x: p.x, y: p.y };
  });

  const assigned = new Array(pts.length).fill(false);
  const result: StationLabelLayout[] = [];

  for (let i = 0; i < pts.length; i++) {
    if (assigned[i]) continue;
    const cluster = [i];
    let grew = true;
    while (grew) {
      grew = false;
      for (let j = 0; j < pts.length; j++) {
        if (cluster.includes(j)) continue;
        const near = cluster.some(
          (ci) => Math.hypot(pts[ci].x - pts[j].x, pts[ci].y - pts[j].y) < CLUSTER_PX,
        );
        if (near) {
          cluster.push(j);
          grew = true;
        }
      }
    }

    cluster.sort((a, b) => pts[a].x - pts[b].x || pts[a].y - pts[b].y);
    cluster.forEach((idx, k) => {
      assigned[idx] = true;
      const fan = fanFor(k, cluster.length);
      result.push({
        code: pts[idx].code,
        x: pts[idx].x,
        y: pts[idx].y,
        dx: fan.dx,
        dy: fan.dy,
        anchor: fan.anchor,
      });
    });
  }

  return result;
}
