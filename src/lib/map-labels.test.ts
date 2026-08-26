import { describe, expect, it } from "vitest";
import { INDIA_VIEW, MUMBAI_DEFAULT, project, unproject } from "./geo";
import { STATIONS } from "./rail-graph";
import { labelAnchorPoint, stationLabelLayout } from "./map-labels";

describe("map projection inset", () => {
  it("keeps the default Mumbai pin inside the viewBox with room for the pin glyph", () => {
    const p = project(MUMBAI_DEFAULT);
    expect(p.x).toBeGreaterThan(INDIA_VIEW.padX + 16);
    expect(p.x).toBeLessThan(INDIA_VIEW.width - INDIA_VIEW.padX - 16);
    expect(p.y).toBeGreaterThan(INDIA_VIEW.padY + 32);
    expect(p.y).toBeLessThan(INDIA_VIEW.height - INDIA_VIEW.padY - 16);
  });

  it("round-trips project and unproject", () => {
    const back = unproject(project(MUMBAI_DEFAULT).x, project(MUMBAI_DEFAULT).y);
    expect(back.lat).toBeCloseTo(MUMBAI_DEFAULT.lat, 5);
    expect(back.lng).toBeCloseTo(MUMBAI_DEFAULT.lng, 5);
  });
});

describe("station label collision", () => {
  it("separates NDLS and NZM so the codes do not overprint", () => {
    const layout = stationLabelLayout(STATIONS);
    const ndls = layout.find((l) => l.code === "NDLS");
    const nzm = layout.find((l) => l.code === "NZM");
    expect(ndls).toBeTruthy();
    expect(nzm).toBeTruthy();
    const a = labelAnchorPoint(ndls!);
    const b = labelAnchorPoint(nzm!);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(20);
    expect(ndls!.anchor).not.toBe("middle");
    expect(nzm!.anchor).not.toBe("middle");
    expect(ndls!.anchor).not.toBe(nzm!.anchor);
  });

  it("fans Mumbai cluster labels instead of stacking them on the pin", () => {
    const layout = stationLabelLayout(STATIONS);
    const mumbai = layout.filter((l) =>
      ["CSMT", "BCT", "DR", "LTT", "PNVL"].includes(l.code),
    );
    const keys = new Set(mumbai.map((l) => `${l.dx},${l.dy},${l.anchor}`));
    expect(keys.size).toBe(mumbai.length);
  });
});
