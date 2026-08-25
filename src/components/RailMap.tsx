"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MUMBAI_DEFAULT, project, unproject, type LatLng } from "@/lib/geo";
import { RAIL_CORRIDORS, STATIONS, stationLatLng } from "@/lib/rail-graph";

const INDIA_RING: LatLng[] = [
  { lat: 35.4, lng: 77.5 },
  { lat: 34.2, lng: 74.8 },
  { lat: 32.6, lng: 74.6 },
  { lat: 29.9, lng: 73.2 },
  { lat: 28.0, lng: 70.4 },
  { lat: 24.7, lng: 68.2 },
  { lat: 22.8, lng: 69.1 },
  { lat: 21.2, lng: 72.0 },
  { lat: 19.08, lng: 72.82 },
  { lat: 16.9, lng: 73.2 },
  { lat: 15.3, lng: 73.8 },
  { lat: 12.9, lng: 74.8 },
  { lat: 8.1, lng: 77.5 },
  { lat: 10.0, lng: 79.2 },
  { lat: 13.1, lng: 80.3 },
  { lat: 16.5, lng: 82.3 },
  { lat: 19.8, lng: 85.8 },
  { lat: 21.5, lng: 87.0 },
  { lat: 22.4, lng: 88.4 },
  { lat: 26.2, lng: 89.7 },
  { lat: 27.6, lng: 88.1 },
  { lat: 27.4, lng: 84.0 },
  { lat: 28.8, lng: 80.1 },
  { lat: 30.4, lng: 78.1 },
  { lat: 32.9, lng: 79.0 },
  { lat: 35.4, lng: 77.5 },
];

const NE_RING: LatLng[] = [
  { lat: 27.6, lng: 89.8 },
  { lat: 27.9, lng: 95.2 },
  { lat: 26.1, lng: 95.4 },
  { lat: 24.3, lng: 93.6 },
  { lat: 23.0, lng: 91.8 },
  { lat: 24.8, lng: 88.9 },
  { lat: 26.4, lng: 89.0 },
  { lat: 27.6, lng: 89.8 },
];

const KONKAN_WATER: LatLng[] = [
  { lat: 19.2, lng: 72.6 },
  { lat: 18.9, lng: 73.05 },
  { lat: 16.9, lng: 73.15 },
  { lat: 15.4, lng: 73.7 },
  { lat: 15.2, lng: 73.4 },
  { lat: 16.8, lng: 72.9 },
  { lat: 19.0, lng: 72.55 },
];

function toPath(ring: LatLng[]): string {
  return ring
    .map((p, i) => {
      const { x, y } = project(p);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function corridorPath(codes: string[]): string {
  return codes
    .map((c, i) => {
      const { x, y } = project(stationLatLng(c));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

interface RailMapProps {
  pin: LatLng;
  onPin: (next: LatLng) => void;
  destCodes: string[];
  highlightBoarding?: string;
  monsoon: boolean;
}

export function RailMap({
  pin,
  onPin,
  destCodes,
  highlightBoarding,
  monsoon,
}: RailMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const clipId = useId();
  const pinPt = project(pin);
  const mainland = useMemo(() => toPath(INDIA_RING), []);
  const northeast = useMemo(() => toPath(NE_RING), []);
  const water = useMemo(() => toPath(KONKAN_WATER), []);

  function clientToLatLng(clientX: number, clientY: number): LatLng | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = pt.matrixTransform(ctm.inverse());
    return unproject(loc.x, loc.y);
  }

  function move(clientX: number, clientY: number) {
    const next = clientToLatLng(clientX, clientY);
    if (!next) return;
    if (next.lat < 7 || next.lat > 36 || next.lng < 68 || next.lng > 97) return;
    onPin(next);
  }

  return (
    <svg
      ref={svgRef}
      className="rail-map"
      viewBox="0 0 390 520"
      role="img"
      aria-label="Crafted map of India rail corridors. Drag the pin to set where you are."
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setDragging(true);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!dragging && e.buttons === 0) return;
        move(e.clientX, e.clientY);
      }}
      onPointerUp={() => setDragging(false)}
    >
      <defs>
        <linearGradient id={`${clipId}-night`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#101820" />
          <stop offset="100%" stopColor="#07090e" />
        </linearGradient>
        <linearGradient id={`${clipId}-land`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2738" />
          <stop offset="100%" stopColor="#121820" />
        </linearGradient>
        <filter id={`${clipId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={`${clipId}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8 L8 0" stroke="#3d9b6e" strokeWidth="1.2" opacity="0.55" />
        </pattern>
      </defs>
      <rect width="390" height="520" fill={`url(#${clipId}-night)`} />
      <g className="stars" opacity="0.55">
        {Array.from({ length: 28 }, (_, i) => (
          <circle
            key={i}
            cx={((i * 47) % 390) + 6}
            cy={((i * 73) % 200) + 8}
            r={i % 5 === 0 ? 1.3 : 0.6}
            fill="#f3ead6"
          />
        ))}
      </g>
      <path d={mainland} fill={`url(#${clipId}-land)`} stroke="#3a4a63" strokeWidth="1.4" />
      <path d={northeast} fill={`url(#${clipId}-land)`} stroke="#3a4a63" strokeWidth="1.2" />
      {monsoon ? (
        <path
          d={water}
          fill={`url(#${clipId}-hatch)`}
          stroke="#3d9b6e"
          strokeWidth="1"
          opacity="0.85"
          className="monsoon-wash"
        />
      ) : null}
      {RAIL_CORRIDORS.map((c) => (
        <path
          key={c.id}
          d={corridorPath(c.stations)}
          fill="none"
          stroke={c.monsoon ? "#3d9b6e" : "#e8a317"}
          strokeWidth={c.monsoon ? 2.4 : 2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="corridor-line"
          filter={`url(#${clipId}-glow)`}
          opacity={c.monsoon && !monsoon ? 0.25 : 1}
        />
      ))}
      {STATIONS.map((s) => {
        const p = project({ lat: s.lat, lng: s.lng });
        const dest = destCodes.includes(s.code);
        const board = highlightBoarding === s.code;
        return (
          <g key={s.code} transform={`translate(${p.x} ${p.y})`}>
            <circle
              r={board ? 7 : dest ? 5.5 : 3.2}
              fill={board ? "#f3ead6" : dest ? "#3d9b6e" : "#e8a317"}
              stroke="#07090e"
              strokeWidth="1.2"
            />
            <text
              y="-10"
              textAnchor="middle"
              fill="#f3ead6"
              fontSize="8"
              fontFamily="var(--font-display), sans-serif"
              letterSpacing="0.08em"
            >
              {s.code}
            </text>
          </g>
        );
      })}
      <g className={dragging ? "pin dragging" : "pin drop"} transform={`translate(${pinPt.x} ${pinPt.y})`}>
        <ellipse rx="14" ry="5" cy="4" fill="#07090e" opacity="0.45" />
        <path
          d="M0 -28 C 10 -28 14 -18 14 -12 C 14 -4 0 8 0 8 C 0 8 -14 -4 -14 -12 C -14 -18 -10 -28 0 -28 Z"
          fill="#e8a317"
          stroke="#f3ead6"
          strokeWidth="1.2"
        />
        <circle cy="-16" r="4.2" fill="#07090e" />
      </g>
      {pin.lat === MUMBAI_DEFAULT.lat ? null : null}
    </svg>
  );
}
