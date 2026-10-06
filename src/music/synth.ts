// Generates royalty-free instrumental beds in code (no samples, no third-party audio).
// Plucked strings via Karplus-Strong, sine bass and bell, noise shaker, soft kick.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import seedrandom from "seedrandom";

const SR = 44100;

type TrackSpec = { id: string; title: string; bpm: number; root: number; prog: number[][]; seed: number; mood: string };

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function pluck(out: Float32Array, start: number, freq: number, amp: number, rng: () => number, bright = 0.5) {
  const period = Math.round(SR / freq);
  const buf = new Float32Array(period).map(() => (rng() * 2 - 1));
  const len = Math.min(out.length - start, SR * 2);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % period;
    const v = buf[idx];
    buf[idx] = 0.996 * ((1 - bright) * v + bright * (v + buf[next]) * 0.5);
    out[start + i] += v * amp;
    idx = next;
  }
}

function sine(out: Float32Array, start: number, freq: number, amp: number, dur: number, decay: number, harm = 0) {
  const len = Math.min(out.length - start, Math.floor(dur * SR));
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * decay) * Math.min(1, t * 400);
    out[start + i] += amp * env * (Math.sin(2 * Math.PI * freq * t) + harm * Math.sin(4 * Math.PI * freq * t));
  }
}

function kick(out: Float32Array, start: number, amp: number) {
  let phase = 0;
  for (let i = 0; i < SR * 0.25 && start + i < out.length; i++) {
    const t = i / SR;
    phase += (2 * Math.PI * (45 + 90 * Math.exp(-t * 30))) / SR;
    out[start + i] += amp * Math.exp(-t * 14) * Math.sin(phase);
  }
}

function shaker(out: Float32Array, start: number, amp: number, rng: () => number) {
  let hp = 0, prev = 0;
  for (let i = 0; i < SR * 0.06 && start + i < out.length; i++) {
    const n = rng() * 2 - 1;
    hp = 0.85 * (hp + n - prev); // crude high-pass
    prev = n;
    out[start + i] += amp * hp * Math.exp(-(i / SR) * 70);
  }
}

export function renderTrack(spec: TrackSpec, seconds = 20): Float32Array[] {
  const rng = seedrandom(`music-${spec.seed}`);
  const L = new Float32Array(SR * seconds);
  const R = new Float32Array(SR * seconds);
  const beat = 60 / spec.bpm;
  const bars = Math.ceil(seconds / (beat * 4));
  const pent = [0, 2, 4, 7, 9, 12, 14, 16];
  const strum = [1, 0, 0.6, 0.8, 0, 0.7, 0.9, 0.6]; // eighth-note strum accents
  for (let bar = 0; bar < bars; bar++) {
    const chord = spec.prog[bar % spec.prog.length].map((n) => spec.root + n);
    for (let e = 0; e < 8; e++) {
      const t = (bar * 4 + e / 2) * beat;
      const s = Math.floor(t * SR);
      if (s >= L.length) break;
      // guitar strum: alternate down/up, notes spread a few ms apart
      if (strum[e] > 0) {
        const notes = e % 2 === 0 ? chord : [...chord].reverse();
        notes.forEach((n, k) => {
          const off = s + Math.floor(k * 0.012 * SR);
          if (off < L.length) {
            pluck(k % 2 ? L : R, off, midi(n + 12), 0.11 * strum[e], rng, 0.45);
            pluck(k % 2 ? R : L, off, midi(n + 12), 0.06 * strum[e], rng, 0.45);
          }
        });
      }
      // shaker on every eighth, accent off-beats
      shaker(L, s, e % 2 ? 0.05 : 0.025, rng);
      shaker(R, s + 200, e % 2 ? 0.045 : 0.02, rng);
      // light kick on 1 and 3, bass on quarters
      if (e % 4 === 0) { kick(L, s, 0.45); kick(R, s, 0.45); }
      if (e % 2 === 0) {
        sine(L, s, midi(chord[0] - 12), 0.16, beat * 0.9, 4);
        sine(R, s, midi(chord[0] - 12), 0.16, beat * 0.9, 4);
      }
      // bell motif, sparse, pentatonic over the root
      if (bar % 2 === 1 && rng() < 0.35) {
        const n = spec.root + 24 + pent[Math.floor(rng() * pent.length)];
        sine(e % 2 ? L : R, s, midi(n), 0.05, 1.2, 3.5, 0.3);
      }
    }
  }
  return [L, R];
}

function writeWav(path: string, ch: Float32Array[]) {
  const n = ch[0].length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  const peak = Math.max(...ch.map((c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), 0)));
  for (let i = 0; i < n; i++)
    for (let c = 0; c < 2; c++) buf.writeInt16LE(Math.round((ch[c][i] / peak) * 0.9 * 32767), 44 + i * 4 + c * 2);
  fs.writeFileSync(path, buf);
}

// Short SFX: countdown tick and fork whoosh.
function sfx() {
  const tick = new Float32Array(SR * 0.08);
  sine(tick, 0, 1800, 0.6, 0.08, 60);
  const rng = seedrandom("whoosh");
  const whoosh = new Float32Array(SR * 0.5);
  let lp = 0;
  for (let i = 0; i < whoosh.length; i++) {
    const t = i / whoosh.length;
    const a = 0.6 + 0.35 * t; // filter opens as it moves
    lp = a * lp + (1 - a) * (rng() * 2 - 1);
    whoosh[i] = lp * Math.sin(Math.PI * t) * 1.5;
  }
  return { tick, whoosh };
}

const tracks: TrackSpec[] = [
  { id: "trailhead", title: "Trailhead", bpm: 112, root: 55, seed: 1, mood: "bright",
    prog: [[0, 4, 7, 12], [7, 11, 14, 19], [9, 12, 16, 21], [5, 9, 12, 17]] },
  { id: "switchback", title: "Switchback", bpm: 120, root: 50, seed: 2, mood: "driving",
    prog: [[0, 4, 7, 12], [5, 9, 12, 17], [9, 12, 16, 21], [7, 11, 14, 19]] },
  { id: "ridgeline", title: "Ridgeline", bpm: 104, root: 57, seed: 3, mood: "easy",
    prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
];

const dir = "assets/music";
fs.mkdirSync(dir, { recursive: true });
const manifest = [];
for (const t of tracks) {
  const raw = `${dir}/${t.id}.raw.wav`;
  writeWav(raw, renderTrack(t));
  // Normalize to about -14 LUFS for Instagram.
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "192k", `${dir}/${t.id}.mp3`]);
  fs.rmSync(raw);
  manifest.push({ id: t.id, file: `${t.id}.mp3`, title: t.title, artist: "Send or Bail? (generated in code)",
    source: "generated", licenseRef: "original-generated-src/music/synth.ts", bpm: t.bpm, mood: t.mood, startSec: 0 });
  console.log("wrote", t.id);
}
const { tick, whoosh } = sfx();
writeWav(`${dir}/sfx_tick.wav`, [tick, tick]);
writeWav(`${dir}/sfx_whoosh.wav`, [whoosh, whoosh]);
fs.writeFileSync(`${dir}/tracks.json`, JSON.stringify(manifest, null, 2) + "\n");
