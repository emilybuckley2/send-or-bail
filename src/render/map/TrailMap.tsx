import React, { useMemo } from "react";
import { getLength, getPointAtLength } from "@remotion/paths";
import type { Question } from "../../schema";
import { color, font } from "../theme";
import { terrain, } from "./terrain";
import { trailLayout } from "./geometry";
import { HazardIcon } from "./icons";

export type MapBox = { x: number; y: number; w: number; h: number };

// Draw progress values, 0..1, so the Reels can animate the same map.
export type MapProgress = { trail: number; hazards: number; fork: number; pulse: number };
export const fullyDrawn: MapProgress = { trail: 1, hazards: 1, fork: 1, pulse: 0 };

const fmtMi = (n: number) => `${n} MI`;
const fmtFt = (n: number) => `+${n.toLocaleString("en-US")} FT`;

export const Terrain: React.FC<{ seed: number; width: number; height: number }> = ({ seed, width, height }) => {
  const lines = useMemo(() => terrain(seed, width, height), [seed, width, height]);
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      {lines.map((c, i) => (
        <path key={i} d={c.d} fill="none" stroke={color.contour}
          strokeWidth={c.index ? 2.6 : 1.4} opacity={c.index ? 0.7 : 0.5} />
      ))}
    </svg>
  );
};

const Label: React.FC<{ x: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, children, style }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);

const Blaze: React.FC<{ label: string; bg: string; fg: string; scale: number }> = ({ label, bg, fg, scale }) => (
  <div style={{
    background: bg, color: fg, fontFamily: font.display, fontWeight: 800, fontSize: 54,
    letterSpacing: 1, padding: "6px 22px 4px", borderRadius: 6, lineHeight: 1,
    transform: `scale(${scale})`, boxShadow: "0 4px 0 rgba(30,29,26,0.18)",
  }}>{label}</div>
);

export const TrailMap: React.FC<{ q: Question; box: MapBox; progress?: MapProgress }> = ({ q, box, progress = fullyDrawn }) => {
  const L = useMemo(() => trailLayout(q.map.seed, box), [q.map.seed, box]);
  const lenApproach = getLength(L.approach);
  const lenA = getLength(L.branchA);
  const lenB = getLength(L.branchB);
  // Approach draws over the first 55% of trail progress, branch A over the rest.
  const tApproach = Math.min(1, progress.trail / 0.55);
  const tA = Math.max(0, (progress.trail - 0.55) / 0.45);
  const blazeA = getPointAtLength(L.branchA, lenA * 0.42) ?? L.goal;
  const blazeB = getPointAtLength(L.branchB, lenB * 0.5) ?? L.exit;
  const hazards = q.map.hazards.filter((h) => h !== "none");
  const dash = "22 16";

  const drawn = (len: number, t: number) => ({ strokeDasharray: `${len * t} ${len}` });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          {/* Reveal masks: a solid stroke animates its length, the dashed trail shows through it. */}
          <mask id="m-approach" maskUnits="userSpaceOnUse">
            <path d={L.approach} stroke="#fff" strokeWidth={40} fill="none" style={drawn(lenApproach, tApproach)} />
          </mask>
          <mask id="m-a" maskUnits="userSpaceOnUse">
            <path d={L.branchA} stroke="#fff" strokeWidth={40} fill="none" style={drawn(lenA, tA)} />
          </mask>
          <mask id="m-b" maskUnits="userSpaceOnUse">
            <path d={L.branchB} stroke="#fff" strokeWidth={40} fill="none" style={drawn(lenB, progress.fork)} />
          </mask>
        </defs>
        {/* soft paper halo under the trail keeps it readable over contours */}
        <g stroke={color.paper} strokeWidth={22} fill="none" strokeLinecap="round" opacity={0.9}>
          <path d={L.approach} mask="url(#m-approach)" />
          <path d={L.branchA} mask="url(#m-a)" />
          <path d={L.branchB} mask="url(#m-b)" />
        </g>
        <path d={L.approach} mask="url(#m-approach)" stroke={color.blaze} strokeWidth={9} fill="none" strokeDasharray={dash} strokeLinecap="round" />
        <path d={L.branchA} mask="url(#m-a)" stroke={color.blaze} strokeWidth={9} fill="none" strokeDasharray={dash} strokeLinecap="round" />
        <path d={L.branchB} mask="url(#m-b)" stroke={color.ink} strokeWidth={9} fill="none" strokeDasharray={dash} strokeLinecap="round" />
        {/* trailhead */}
        <circle cx={L.start.x} cy={L.start.y} r={10} fill={color.blaze} />
        {/* goal peak */}
        <g opacity={tA > 0.95 ? 1 : 0}>
          <path d={`M${L.goal.x - 30},${L.goal.y + 18}L${L.goal.x},${L.goal.y - 26}L${L.goal.x + 30},${L.goal.y + 18}Z`}
            fill={color.ink} />
          <path d={`M${L.goal.x - 9},${L.goal.y - 12}L${L.goal.x},${L.goal.y - 26}L${L.goal.x + 9},${L.goal.y - 12}`}
            fill={color.paper} />
        </g>
        {/* you-are-here */}
        <circle cx={L.you.x} cy={L.you.y} r={30 + progress.pulse * 30} fill="none" stroke={color.blaze}
          strokeWidth={4} opacity={0.55 * (1 - progress.pulse)} />
        <circle cx={L.you.x} cy={L.you.y} r={30} fill={color.blaze} opacity={0.18} />
        <circle cx={L.you.x} cy={L.you.y} r={15} fill={color.ink} stroke={color.paper} strokeWidth={6} />
      </svg>

      {/* goal label */}
      {(q.map.goalLabel || q.map.milesToGoal || q.map.gainFt) && tA > 0.95 && (
        <Label x={L.goal.x} y={L.goal.y - 84} style={{ textAlign: "center" }}>
          {q.map.goalLabel && (
            <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: color.ink, textTransform: "uppercase" }}>
              {q.map.goalLabel}
            </div>
          )}
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 40, color: color.ink, lineHeight: 1.05 }}>
            {[q.map.milesToGoal && fmtMi(q.map.milesToGoal), q.map.gainFt && fmtFt(q.map.gainFt)].filter(Boolean).join("  ·  ")}
          </div>
        </Label>
      )}

      {/* you label */}
      <Label x={L.you.x + (L.exit.x < L.you.x ? 1 : -1) * 120} y={L.you.y + 10}>
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 22, letterSpacing: 3, color: color.ink,
          background: color.paper, padding: "4px 10px", borderRadius: 4 }}>
          YOU{q.map.milesOut ? ` · MI ${q.map.milesOut}` : ""}
        </div>
      </Label>

      {/* hazards */}
      {hazards.map((h, i) => {
        const x = L.hazard.x + (i - (hazards.length - 1) / 2) * 120;
        const s = Math.min(1, Math.max(0, progress.hazards * hazards.length - i));
        return (
          <Label key={h} x={x} y={L.hazard.y} style={{ transform: `translate(-50%,-50%) scale(${s})` }}>
            <div style={{ width: 104, height: 104, borderRadius: 52, background: color.paper, border: `4px solid ${color.ink}`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HazardIcon hazard={h} size={64} color={color.ink} />
            </div>
          </Label>
        );
      })}
      {q.map.window && hazards.length > 0 && (
        <Label x={L.hazard.x} y={L.hazard.y + 84} style={{ opacity: progress.hazards }}>
          <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 24, letterSpacing: 2, color: color.paper,
            background: color.ink, padding: "8px 16px", borderRadius: 6, textTransform: "uppercase" }}>
            {q.map.window}
          </div>
        </Label>
      )}

      {/* fork blazes */}
      <Label x={blazeA.x} y={blazeA.y}>
        <Blaze label={q.choiceA.label} bg={color.blaze} fg={color.paper} scale={progress.fork} />
      </Label>
      <Label x={blazeB.x} y={blazeB.y}>
        <Blaze label={q.choiceB.label} bg={color.ink} fg={color.paper} scale={progress.fork} />
      </Label>
    </div>
  );
};
