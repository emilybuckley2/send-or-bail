import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Question } from "../../schema";
import { color, font, safe } from "../theme";
import { Terrain, TrailMap } from "../map/TrailMap";
import { trailLayout } from "../map/geometry";
import { Handle, Logo, Profile } from "../stills/Cover";

export type PreVoteProps = { q: Question; music?: { file: string; startSec: number } | null };

export const PREVOTE_FRAMES = 270; // 9 s at 30 fps
const W = 1080;
const H = 1920;
export const reelMap = { x: safe.side + 40, y: 880, w: W - 2 * safe.side - 80, h: 420 };

// Long headlines step down so headline + scenario never reach the map.
const headlineSize = (h: string) => (h.length <= 28 ? 100 : h.length <= 36 ? 90 : 80);

const sec = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// "90 min" style windows tick down during the scenario beat.
function countdown(window: string | undefined, frame: number): string | undefined {
  const m = window?.match(/^(\d+)\s*min$/i);
  if (!m) return window;
  const n = Number(m[1]);
  const ticks = Math.max(0, Math.min(3, Math.floor((frame - sec(3.6)) / 15)));
  return `${n - ticks} min`;
}
const countdownTicks = (window?: string) =>
  /^(\d+)\s*min$/i.test(window ?? "") ? [1, 2, 3].map((k) => sec(3.6) + k * 15) : [];

export const PreVoteReel: React.FC<PreVoteProps> = ({ q, music }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const logoIn = interpolate(frame, [0, sec(0.8)], [0, 1], clamp);
  const trail = interpolate(frame, [sec(0.8), sec(3.0)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const hazards = interpolate(frame, [sec(3.2), sec(3.8)], [0, 1], clamp);
  const fork = Math.min(1, spring({ frame: frame - sec(5.8), fps, config: { damping: 12, stiffness: 140 } }));
  const pulse = frame < sec(0.8) ? 0 : ((frame - sec(0.8)) % 30) / 30;
  const zoom = interpolate(frame, [sec(5.5), sec(7.0)], [1, 1.12], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cta = Math.min(1, spring({ frame: frame - sec(7.0), fps, config: { damping: 14 } }));

  const you = trailLayout(q.map.seed, reelMap).you;
  const shown = { ...q, map: { ...q.map, window: countdown(q.map.window, frame) } };

  return (
    <AbsoluteFill style={{ background: color.paper }}>
      {/* map layer: eases toward the fork */}
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${you.x}px ${you.y}px` }}>
        <Terrain seed={q.map.seed} width={W} height={H} />
        <TrailMap q={shown} box={reelMap} progress={{ trail, hazards, fork, pulse }} />
      </AbsoluteFill>
      {q.map.gainFt && (
        <AbsoluteFill style={{ opacity: interpolate(frame, [sec(2.6), sec(3.2)], [0, 1], clamp) }}>
          <Profile seed={q.map.seed} gainFt={q.map.gainFt} x={safe.side} y={1350} w={W - 2 * safe.side} h={70} />
        </AbsoluteFill>
      )}
      {/* wash behind the header so text never fights the contours */}
      <AbsoluteFill style={{ background: `linear-gradient(${color.paper} 0%, ${color.paper}F2 36%, ${color.paper}00 44%)` }} />

      <div style={{ position: "absolute", top: safe.top + 10, left: safe.side, right: safe.side, opacity: logoIn,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo />
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: color.ink,
          border: `3px solid ${color.ink}`, borderRadius: 40, padding: "8px 20px", textTransform: "uppercase" }}>
          {q.category}
        </div>
      </div>

      <div style={{ position: "absolute", top: safe.top + 100, left: safe.side, right: safe.side }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: headlineSize(q.headline), lineHeight: 0.94, color: color.ink,
          textTransform: "uppercase" }}>
          {q.headline}
        </div>
        <div style={{ marginTop: 22 }}>
          {q.scenario.map((line, i) => {
            const t = interpolate(frame, [sec(3.0) + i * 20, sec(3.0) + i * 20 + 10], [0, 1], clamp);
            return (
              <div key={i} style={{ fontFamily: font.body, fontWeight: 500, fontSize: 36, lineHeight: 1.25, color: color.ink,
                opacity: t, transform: `translateY(${(1 - t) * 20}px)`, marginBottom: 8 }}>
                {line}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: safe.bottom + 64, left: safe.side, right: safe.side,
        fontFamily: font.display, fontWeight: 800, fontSize: 64, color: color.ink, textTransform: "uppercase", lineHeight: 1,
        opacity: cta, transform: `translateY(${(1 - cta) * 30}px)` }}>
        Comment <span style={{ color: color.blaze }}>{q.choiceA.keyword}</span> or{" "}
        <span style={{ textDecoration: "underline", textDecorationThickness: 6, textUnderlineOffset: 8 }}>{q.choiceB.keyword}</span>
      </div>
      <div style={{ position: "absolute", bottom: safe.bottom + 8, left: safe.side }}>
        <Handle />
      </div>

      {music && (
        <Audio src={staticFile(`music/${music.file}`)} startFrom={Math.round(music.startSec * fps)}
          volume={(f) => interpolate(f, [0, 9, durationInFrames - 24, durationInFrames], [0, 1, 1, 0], clamp)} />
      )}
      {music && countdownTicks(q.map.window).map((f) => (
        <Sequence key={f} from={f} durationInFrames={6}>
          <Audio src={staticFile("music/sfx_tick.wav")} volume={0.12} />
        </Sequence>
      ))}
      {music && (
        <Sequence from={sec(5.6)} durationInFrames={15}>
          <Audio src={staticFile("music/sfx_whoosh.wav")} volume={0.18} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
