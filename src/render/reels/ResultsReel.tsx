import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../../brand";
import type { Question, Result } from "../../schema";
import { color, font, safe } from "../theme";
import { Terrain, TrailMap } from "../map/TrailMap";
import { Handle, Logo } from "../stills/Cover";

export type ResultsProps = { q: Question; r: Result; music?: { file: string; startSec: number } | null; still?: boolean };

export const RESULTS_FRAMES = 285; // 9.5 s at 30 fps
const W = 1080;
const H = 1920;
export const resultsMap = { x: safe.side + 40, y: 800, w: W - 2 * safe.side - 80, h: 340 };

const sec = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function shares(r: Result) {
  const total = r.countA + r.countB;
  const a = total ? r.countA / total : 0.5;
  // Rounded percentages that always add to 100.
  const pctA = Math.round(a * 100);
  return { total, shareA: a, shareB: 1 - a, pctA, pctB: 100 - pctA };
}

const Entry: React.FC<{ c: Result["topComments"][number]; t: number }> = ({ c, t }) => (
  <div style={{ display: "flex", gap: 20, padding: "16px 0", borderTop: `2px solid ${color.contour}`,
    opacity: t, transform: `translateX(${(1 - t) * 60}px)` }}>
    <div style={{ width: 18, height: 18, marginTop: 8, flex: "none", borderRadius: 3,
      background: c.choice === "A" ? color.blaze : color.ink }} />
    <div>
      <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 24, letterSpacing: 1, color: color.ink, opacity: 0.7 }}>{c.handle}</div>
      <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 34, lineHeight: 1.2, color: color.ink }}>"{c.text}"</div>
    </div>
  </div>
);

export const ResultsReel: React.FC<ResultsProps> = ({ q, r, music, still }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // The static results.png is the hero moment: comments on screen, numbers settled.
  const f = still ? sec(6.4) : frame;
  const s = shares(r);

  const intro = interpolate(f, [0, sec(0.6)], [0, 1], clamp);
  const grow = interpolate(f, [sec(1.0), sec(3.5)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const comments = r.topComments.map((_, i) => interpolate(f, [sec(3.5) + i * 30, sec(3.5) + i * 30 + 12], [0, 1], clamp));
  const swap = interpolate(f, [sec(6.5), sec(6.9)], [0, 1], clamp); // comments out, reality check in
  const outro = spring({ frame: f - sec(6.8), fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{ background: color.paper }}>
      <Terrain seed={q.map.seed} width={W} height={H} />
      <TrailMap q={q} box={resultsMap}
        progress={{ trail: 1, hazards: 1, fork: 1, pulse: 0 }}
        result={{ shareA: s.shareA, shareB: s.shareB, grow, pctA: s.pctA * grow, pctB: s.pctB * grow }} />
      <AbsoluteFill style={{ background: `linear-gradient(${color.paper} 0%, ${color.paper}F2 34%, ${color.paper}00 41%)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(${color.paper}00 62%, ${color.paper}F2 66%, ${color.paper} 100%)` }} />

      <div style={{ position: "absolute", top: safe.top + 10, left: safe.side, right: safe.side,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: color.ink,
          border: `3px solid ${color.ink}`, borderRadius: 40, padding: "8px 20px", textTransform: "uppercase" }}>
          {s.total.toLocaleString("en-US")} votes
        </div>
      </div>

      <div style={{ position: "absolute", top: safe.top + 110, left: safe.side, right: safe.side, opacity: intro,
        transform: `translateY(${(1 - intro) * 20}px)` }}>
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 26, letterSpacing: 4, color: color.blaze, textTransform: "uppercase" }}>
          Yesterday we asked
        </div>
        <div style={{ marginTop: 10, fontFamily: font.display, fontWeight: 800, fontSize: q.headline.length > 30 ? 80 : 92,
          lineHeight: 0.94, color: color.ink, textTransform: "uppercase" }}>
          {q.headline}
        </div>
      </div>

      {/* trail register */}
      <div style={{ position: "absolute", top: 1270, left: safe.side, right: safe.side, opacity: 1 - swap }}>
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 22, letterSpacing: 4, color: color.ink,
          opacity: comments[0] ?? 0, marginBottom: 4 }}>TRAIL REGISTER</div>
        {r.topComments.map((c, i) => <Entry key={i} c={c} t={comments[i]} />)}
      </div>

      {/* reality check, then tomorrow line */}
      <div style={{ position: "absolute", top: 1300, left: safe.side, right: safe.side, opacity: swap,
        transform: `translateY(${(1 - swap) * 30}px)` }}>
        {q.realityCheck && (
          <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 34, lineHeight: 1.3, color: color.ink,
            borderLeft: `8px solid ${color.blaze}`, paddingLeft: 24 }}>
            {q.realityCheck}
          </div>
        )}
        <div style={{ marginTop: 32, fontFamily: font.display, fontWeight: 800, fontSize: 64, lineHeight: 1, color: color.ink,
          textTransform: "uppercase", opacity: Math.min(1, outro) }}>
          {brand.tomorrowLine}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: safe.bottom + 8, left: safe.side }}>
        <Handle />
      </div>

      {music && !still && (
        <Audio src={staticFile(`music/${music.file}`)} startFrom={Math.round(music.startSec * fps)}
          volume={(fr) => interpolate(fr, [0, 9, durationInFrames - 24, durationInFrames], [0, 1, 1, 0], clamp)} />
      )}
    </AbsoluteFill>
  );
};
