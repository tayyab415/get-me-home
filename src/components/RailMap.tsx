"use client";

import { useId, useMemo, useRef, useState } from "react";
import { project, unproject, type LatLng } from "@/lib/geo";
import { stationLabelLayout } from "@/lib/map-labels";
import { RAIL_CORRIDORS, STATIONS, stationLatLng } from "@/lib/rail-graph";

const INDIA_RING: LatLng[] = [
  { lat: 35.5, lng: 77.6 },
  { lat: 34.5, lng: 76.1 },
  { lat: 34.1, lng: 74.8 },
  { lat: 32.5, lng: 74.7 },
  { lat: 30.5, lng: 73.9 },
  { lat: 28.6, lng: 70.8 },
  { lat: 26.8, lng: 69.6 },
  { lat: 24.7, lng: 68.1 },
  { lat: 23.6, lng: 68.4 },
  { lat: 22.4, lng: 69.0 },
  { lat: 22.2, lng: 70.0 },
  { lat: 21.4, lng: 72.0 },
  { lat: 20.2, lng: 72.7 },
  { lat: 19.08, lng: 72.82 },
  { lat: 17.9, lng: 73.05 },
  { lat: 16.0, lng: 73.4 },
  { lat: 14.8, lng: 74.1 },
  { lat: 12.9, lng: 74.8 },
  { lat: 11.3, lng: 75.8 },
  { lat: 9.9, lng: 76.2 },
  { lat: 8.1, lng: 77.5 },
  { lat: 8.2, lng: 77.9 },
  { lat: 10.2, lng: 79.3 },
  { lat: 11.7, lng: 79.8 },
  { lat: 13.1, lng: 80.3 },
  { lat: 15.3, lng: 80.1 },
  { lat: 16.5, lng: 82.3 },
  { lat: 17.7, lng: 83.3 },
  { lat: 19.8, lng: 85.8 },
  { lat: 20.3, lng: 86.7 },
  { lat: 21.6, lng: 87.5 },
  { lat: 22.4, lng: 88.4 },
  { lat: 24.8, lng: 88.2 },
  { lat: 26.2, lng: 89.7 },
  { lat: 27.2, lng: 88.9 },
  { lat: 27.4, lng: 84.0 },
  { lat: 28.8, lng: 80.1 },
  { lat: 30.4, lng: 78.1 },
  { lat: 32.9, lng: 79.0 },
  { lat: 34.4, lng: 78.4 },
  { lat: 35.5, lng: 77.6 },
];

const NE_RING: LatLng[] = [
  { lat: 27.6, lng: 89.8 },
  { lat: 28.0, lng: 94.2 },
  { lat: 27.6, lng: 96.0 },
  { lat: 26.1, lng: 95.4 },
  { lat: 24.3, lng: 93.6 },
  { lat: 23.0, lng: 91.8 },
  { lat: 22.8, lng: 91.0 },
  { lat: 24.8, lng: 88.9 },
  { lat: 26.4, lng: 89.0 },
  { lat: 27.6, lng: 89.8 },
];

const SRI_RING: LatLng[] = [
  { lat: 9.8, lng: 79.9 },
  { lat: 8.5, lng: 79.8 },
  { lat: 6.1, lng: 80.2 },
  { lat: 6.0, lng: 81.5 },
  { lat: 7.5, lng: 81.9 },
  { lat: 9.3, lng: 80.9 },
  { lat: 9.8, lng: 80.2 },
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

export interface RailMapLabels {
  aria: string;
  arabian: string;
  bengal: string;
  himalaya: string;
  mock: string;
  north: string;
}

interface RailMapProps {
  pin: LatLng;
  onPin: (next: LatLng) => void;
  destCodes: string[];
  highlightBoarding?: string;
  monsoon: boolean;
  labels: RailMapLabels;
}

export function RailMap({
  pin,
  onPin,
  destCodes,
  highlightBoarding,
  monsoon,
  labels,
}: RailMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const clipId = useId();
  const pinPt = project(pin);
  const mainland = useMemo(() => toPath(INDIA_RING), []);
  const northeast = useMemo(() => toPath(NE_RING), []);
  const sri = useMemo(() => toPath(SRI_RING), []);
  const water = useMemo(() => toPath(KONKAN_WATER), []);
  const mumbai = project({ lat: 19.076, lng: 72.8777 });
  const delhi = project({ lat: 28.6139, lng: 77.209 });
  const labelsByCode = useMemo(() => {
    const map = new Map<string, ReturnType<typeof stationLabelLayout>[number]>();
    for (const row of stationLabelLayout(STATIONS)) map.set(row.code, row);
    return map;
  }, []);
  const denseType = /[\u0900-\u097F]/.test(labels.arabian);
  const geoFont = denseType
    ? "var(--font-ui), sans-serif"
    : "var(--font-display), var(--font-ui), sans-serif";
  const geoTrack = denseType ? "0.02em" : "0.16em";

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
      viewBox="-16 0 422 520"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={labels.aria}
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
          <stop offset="0%" stopColor="#0b1524" />
          <stop offset="55%" stopColor="#070b12" />
          <stop offset="100%" stopColor="#05070b" />
        </linearGradient>
        <linearGradient id={`${clipId}-land`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#243044" />
          <stop offset="42%" stopColor="#1a2433" />
          <stop offset="100%" stopColor="#101820" />
        </linearGradient>
        <radialGradient id={`${clipId}-city`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0a202" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f0a202" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${clipId}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f4ead5" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f4ead5" stopOpacity="0" />
        </radialGradient>
        <filter id={`${clipId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={`${clipId}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8 L8 0" stroke="#2f9e6b" strokeWidth="1.2" opacity="0.6" />
        </pattern>
        <pattern id={`${clipId}-grid`} width="39" height="40" patternUnits="userSpaceOnUse">
          <path d="M39 0 L0 0 0 40" fill="none" stroke="#f4ead5" strokeOpacity="0.05" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect x="-16" y="0" width="422" height="520" fill={`url(#${clipId}-night)`} />
      <rect x="-16" y="0" width="422" height="520" fill={`url(#${clipId}-grid)`} />
      <circle cx="318" cy="48" r="70" fill={`url(#${clipId}-moon)`} />
      <circle cx="312" cy="44" r="9" fill="#f4ead5" opacity="0.85" />
      <g className="stars" opacity="0.7">
        {Array.from({ length: 42 }, (_, i) => (
          <circle
            key={i}
            cx={((i * 53) % 390) + 4}
            cy={((i * 67) % 240) + 6}
            r={i % 7 === 0 ? 1.4 : 0.55}
            fill="#f4ead5"
            opacity={i % 4 === 0 ? 0.95 : 0.45}
          />
        ))}
      </g>
      <circle cx={mumbai.x} cy={mumbai.y} r="34" fill={`url(#${clipId}-city)`} />
      <circle cx={delhi.x} cy={delhi.y} r="38" fill={`url(#${clipId}-city)`} />
      <path d={sri} fill="#121820" stroke="#2a384c" strokeWidth="0.8" opacity="0.55" />
      <path d={mainland} fill={`url(#${clipId}-land)`} stroke="#8aa0c0" strokeWidth="1.35" />
      <path d={northeast} fill={`url(#${clipId}-land)`} stroke="#8aa0c0" strokeWidth="1.15" />
      {monsoon ? (
        <path
          d={water}
          fill={`url(#${clipId}-hatch)`}
          stroke="#2f9e6b"
          strokeWidth="1"
          opacity="0.9"
          className="monsoon-wash"
        />
      ) : null}
      {RAIL_CORRIDORS.map((c) => (
        <path
          key={c.id}
          d={corridorPath(c.stations)}
          fill="none"
          stroke={c.monsoon ? "#2f9e6b" : "#f0a202"}
          strokeWidth={c.monsoon ? 2.6 : 3.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="corridor-line"
          filter={`url(#${clipId}-glow)`}
          opacity={c.monsoon && !monsoon ? 0.22 : 1}
        />
      ))}
      {STATIONS.map((s) => {
        const p = project({ lat: s.lat, lng: s.lng });
        const dest = destCodes.includes(s.code);
        const board = highlightBoarding === s.code;
        const label = labelsByCode.get(s.code);
        return (
          <g key={s.code} transform={`translate(${p.x} ${p.y})`}>
            {dest || board ? (
              <circle
                r={board ? 14 : 11}
                fill={board ? "#f4ead5" : "#2f9e6b"}
                opacity="0.22"
                className="station-halo"
              />
            ) : null}
            <circle
              r={board ? 7 : dest ? 5.6 : 3.1}
              fill={board ? "#f4ead5" : dest ? "#2f9e6b" : "#f0a202"}
              stroke="#05070b"
              strokeWidth="1.2"
            />
            <text
              x={label?.dx ?? 0}
              y={label?.dy ?? -12}
              textAnchor={label?.anchor ?? "middle"}
              fill="#f4ead5"
              stroke="#05070b"
              strokeWidth="2.6"
              paintOrder="stroke"
              fontSize="8.5"
              fontFamily="var(--font-display), sans-serif"
              letterSpacing="0.1em"
              fontWeight="700"
            >
              {s.code}
            </text>
          </g>
        );
      })}
      <text
        x="42"
        y="268"
        fill="#8aa0c0"
        fontSize={denseType ? 9 : 8}
        letterSpacing={geoTrack}
        fontFamily={geoFont}
        opacity="0.8"
      >
        {labels.arabian}
      </text>
      <text
        x="258"
        y="250"
        fill="#8aa0c0"
        fontSize={denseType ? 9 : 8}
        letterSpacing={geoTrack}
        fontFamily={geoFont}
        opacity="0.8"
      >
        {labels.bengal}
      </text>
      <text
        x="168"
        y="58"
        fill="#cbb99a"
        fontSize={denseType ? 9 : 8}
        letterSpacing={geoTrack}
        fontFamily={geoFont}
        opacity="0.85"
      >
        {labels.himalaya}
      </text>
      <text
        x="14"
        y="506"
        fill="#f0a202"
        fontSize={denseType ? 10 : 9}
        letterSpacing={geoTrack}
        fontFamily={geoFont}
        opacity="0.9"
      >
        {labels.mock}
      </text>
      <g transform="translate(356 488)" fill="#f4ead5" opacity="0.8">
        <circle r="11" fill="none" stroke="#f4ead5" strokeWidth="1" />
        <path d="M0 -7 L2.2 2 L0 0 L-2.2 2 Z" fill="#f0a202" />
        <text
          y="20"
          textAnchor="middle"
          fontSize={denseType ? 9 : 7}
          letterSpacing={denseType ? "0.02em" : "0.12em"}
          fontFamily={geoFont}
        >
          {labels.north}
        </text>
      </g>
      <g transform={`translate(${pinPt.x} ${pinPt.y})`}>
        {!dragging ? (
          <circle
            className="pin-ripple"
            r="16"
            fill="none"
            stroke="#f0a202"
            strokeWidth="1.4"
          />
        ) : null}
        <g className={dragging ? "pin dragging" : "pin drop"}>
          <ellipse rx="14" ry="5" cy="4" fill="#05070b" opacity="0.5" />
          <path
            d="M0 -28 C 10 -28 14 -18 14 -12 C 14 -4 0 8 0 8 C 0 8 -14 -4 -14 -12 C -14 -18 -10 -28 0 -28 Z"
            fill="#f0a202"
            stroke="#f4ead5"
            strokeWidth="1.2"
          />
          <circle cy="-16" r="4.2" fill="#05070b" />
        </g>
      </g>
    </svg>
  );
}
