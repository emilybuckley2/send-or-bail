import React from "react";
import { AbsoluteFill } from "remotion";
import { brand } from "../../brand";
import type { Question } from "../../schema";
import { color, font, safe } from "../theme";
import { Terrain, TrailMap } from "../map/TrailMap";
import { profile } from "../map/geometry";

export type CoverProps = { q: Question };

export const Logo: React.FC<{ size?: number }> = ({ size = 60 }) => {
  // "?" in blaze if the name ends with one.
  const name = brand.name.toUpperCase();
  const q = name.endsWith("?");
  return (
    <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: size, color: color.ink, letterSpacing: 1, lineHeight: 1 }}>
      {q ? name.slice(0, -1) : name}
      {q && <span style={{ color: color.blaze }}>?</span>}
    </div>
  );
};

export const Handle: React.FC = () => (
  <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 26, color: color.ink, opacity: 0.65, letterSpacing: 1 }}>
    {brand.handle}
  </div>
);

const Profile: React.FC<{ seed: number; gainFt: number; x: number; y: number; w: number; h: number }> = ({ seed, gainFt, x, y, w, h }) => {
  const p = profile(seed);
  const pts = p.map((v, i) => `${x + (i / (p.length - 1)) * w},${y + h - v * h}`);
  return (
    <svg style={{ position: "absolute", inset: 0 }} width="100%" height="100%">
      <polygon points={`${x},${y + h} ${pts.join(" ")} ${x + w},${y + h}`} fill={color.ink} opacity={0.08} />
      <polyline points={pts.join(" ")} fill="none" stroke={color.ink} strokeWidth={3} />
      <line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={color.ink} strokeWidth={2} opacity={0.4} />
      <text x={x + w} y={y - 10} textAnchor="end" fontFamily={font.body} fontWeight={600} fontSize={22}
        letterSpacing={2} fill={color.ink}>{`+${gainFt.toLocaleString("en-US")} FT`}</text>
    </svg>
  );
};

export const Cover: React.FC<CoverProps> = ({ q }) => {
  const W = 1080;
  const H = 1920;
  const map = { x: safe.side + 40, y: 760, w: W - 2 * safe.side - 80, h: 560 };
  return (
    <AbsoluteFill style={{ background: color.paper }}>
      <Terrain seed={q.map.seed} width={W} height={H} />
      {/* wash behind the header so text never fights the contours */}
      <AbsoluteFill style={{ background: `linear-gradient(${color.paper} 0%, ${color.paper}EE 34%, ${color.paper}00 42%)` }} />

      <div style={{ position: "absolute", top: safe.top + 10, left: safe.side, right: safe.side,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: color.ink,
          border: `3px solid ${color.ink}`, borderRadius: 40, padding: "8px 20px", textTransform: "uppercase" }}>
          {q.category}
        </div>
      </div>

      <div style={{ position: "absolute", top: safe.top + 110, left: safe.side, right: safe.side,
        fontFamily: font.display, fontWeight: 800, fontSize: 124, lineHeight: 0.94, color: color.ink,
        textTransform: "uppercase", letterSpacing: -0.5 }}>
        {q.headline}
      </div>

      <TrailMap q={q} box={map} />

      {q.map.gainFt && <Profile seed={q.map.seed} gainFt={q.map.gainFt} x={safe.side} y={1350} w={W - 2 * safe.side} h={84} />}

      <div style={{ position: "absolute", bottom: safe.bottom + 64, left: safe.side, right: safe.side,
        fontFamily: font.display, fontWeight: 800, fontSize: 64, color: color.ink, textTransform: "uppercase", lineHeight: 1 }}>
        Comment <span style={{ color: color.blaze }}>{q.choiceA.keyword}</span> or{" "}
        <span style={{ textDecoration: "underline", textDecorationThickness: 6, textUnderlineOffset: 8 }}>{q.choiceB.keyword}</span>
      </div>
      <div style={{ position: "absolute", bottom: safe.bottom + 8, left: safe.side }}>
        <Handle />
      </div>
    </AbsoluteFill>
  );
};
