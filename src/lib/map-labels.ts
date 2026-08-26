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
const FANS: { dx: number; dy: number; anchor: LabelAnchor }[] = [
  { dx: -12, dy: -14, anchor: "end" },
  { dx: 12, dy: -14, anchor: "start" },
  { dx: -13, dy: 16, anchor: "end" },
  { dx: 13, dy: 16, anchor: "start" },
  { dx: 0, dy: -26, anchor: "middle" },
];

const SOLO = { dx: 0, dy: -12, anchor: "middle" as const };

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
      const fan = cluster.length === 1 ? SOLO : FANS[k % FANS.length];
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
