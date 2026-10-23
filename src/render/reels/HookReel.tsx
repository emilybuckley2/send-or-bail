import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Question } from "../../schema";
import { color, font, safe } from "../theme";
import { Terrain, TrailMap } from "../map/TrailMap";
import { Handle, Logo } from "../stills/Cover";

// Hook format: the whole question is readable on frame one (that frame is the cover), the
// video is 6 seconds, and everything after frame one exists to pull the eye to the two choices.
export type HookProps = { q: Question; music?: { file: string; startSec: number } | null };

export const HOOK_FRAMES = 180; // 6 s at 30 fps
const W = 1080;
const H = 1920;
export const hookMap = { x: safe.side + 40, y: 880, w: W - 2 * safe.side - 80, h: 400 };

const sec = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const headlineSize = (h: string) => (h.length <= 24 ? 118 : h.length <= 30 ? 104 : h.length <= 36 ? 92 : 80);

export const HookReel: React.FC<HookProps> = ({ q, music }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scenario lines punch in during the first second; the question itself never waits.
  const lines = q.scenario.map((_, i) =>
    Math.min(1, spring({ frame: frame - sec(0.25) - i * 9, fps, config: { damping: 14, stiffness: 180 } })));
  // Blazes take turns pulsing from 1.5 s so the eye lands on the two choices.
  const beat = (frame - sec(1.5)) / 30;
  const pulseA = beat > 0 ? 1 + 0.07 * Math.max(0, Math.sin(beat * Math.PI)) : 1;
  const pulseB = beat > 0 ? 1 + 0.07 * Math.max(0, Math.sin(beat * Math.PI + Math.PI)) : 1;
  const dot = frame < sec(0.3) ? 0 : ((frame - sec(0.3)) % 24) / 24;
  // CTA swaps to the direct ask for the last two seconds.
  const swap = interpolate(frame, [sec(4.0), sec(4.3)], [0, 1], clamp);
  const ctaPulse = 1 + 0.04 * Math.max(0, Math.sin(((frame - sec(4.0)) / 30) * Math.PI * 2));

  return (
    <AbsoluteFill style={{ background: color.paper }}>
      <Terrain seed={q.map.seed} width={W} height={H} />
      <TrailMap q={q} box={hookMap} progress={{ trail: 1, hazards: 1, fork: 1, pulse: dot }} blazeScale={[pulseA, pulseB]} />
      <AbsoluteFill style={{ background: `linear-gradient(${color.paper} 0%, ${color.paper}F2 36%, ${color.paper}00 44%)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(${color.paper}00 72%, ${color.paper}F2 78%, ${color.paper} 100%)` }} />

      <div style={{ position: "absolute", top: safe.top + 10, left: safe.side, right: safe.side,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: color.ink,
          border: `3px solid ${color.ink}`, borderRadius: 40, padding: "8px 20px", textTransform: "uppercase" }}>
          {q.category}
        </div>
      </div>

      <div style={{ position: "absolute", top: safe.top + 100, left: safe.side, right: safe.side }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: headlineSize(q.headline), lineHeight: 0.92,
          color: color.ink, textTransform: "uppercase" }}>
          {q.headline}
        </div>
        <div style={{ marginTop: 20 }}>
          {q.scenario.map((line, i) => (
            <div key={i} style={{ fontFamily: font.body, fontWeight: 500, fontSize: 38, lineHeight: 1.22, color: color.ink,
              opacity: lines[i], transform: `translateX(${(1 - lines[i]) * -40}px)`, marginBottom: 6 }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* the ask: big, on screen from frame one */}
      <div style={{ position: "absolute", bottom: safe.bottom + 50, left: safe.side, right: safe.side,
        transform: `scale(${swap > 0 ? ctaPulse : 1})`, transformOrigin: "left bottom" }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 92, lineHeight: 0.95, color: color.ink,
          textTransform: "uppercase" }}>
          <span style={{ color: color.blaze }}>{q.choiceA.keyword}</span> or{" "}
          <span style={{ textDecoration: "underline", textDecorationThickness: 8, textUnderlineOffset: 10 }}>{q.choiceB.keyword}</span>?
        </div>
        <div style={{ marginTop: 14, fontFamily: font.body, fontWeight: 600, fontSize: 34, letterSpacing: 2, color: color.ink,
          textTransform: "uppercase" }}>
          <span style={{ opacity: 1 - swap, position: "absolute" }}>Comment your call</span>
          <span style={{ opacity: swap }}>Type it. One word.</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: safe.bottom + 8, left: safe.side }}>
        <Handle />
      </div>

      {music && (
        <Audio src={staticFile(`music/${music.file}`)} startFrom={Math.round(music.startSec * fps)}
          volume={(f) => interpolate(f, [0, 6, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], clamp)} />
      )}
    </AbsoluteFill>
  );
};
