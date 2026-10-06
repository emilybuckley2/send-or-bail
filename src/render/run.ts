// Node-side rendering: bundles once, renders Reels and stills for questions.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import type { Question } from "../schema";
import { Track, pickTrack } from "../music/tracks";

const browserExecutable = process.env.REMOTION_BROWSER || undefined;
let serveUrl: string | undefined;

async function getBundle() {
  serveUrl ??= await bundle({ entryPoint: path.resolve("src/render/index.ts"), publicDir: path.resolve("assets") });
  return serveUrl;
}

export function loadTracks(): Track[] {
  const file = "assets/music/tracks.json";
  if (!fs.existsSync(file)) return [];
  return Track.array().parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

async function still(id: string, q: Question, output: string) {
  const url = await getBundle();
  const composition = await selectComposition({ serveUrl: url, id, inputProps: { q }, browserExecutable });
  await renderStill({ composition, serveUrl: url, output, inputProps: { q }, browserExecutable });
}

// Renders everything for one question into outDir. Returns the track used.
export async function renderQuestion(q: Question, outDir: string, previousTrack?: string): Promise<string | undefined> {
  fs.mkdirSync(outDir, { recursive: true });
  const tracks = loadTracks();
  const track = tracks.length ? pickTrack(tracks, q.map.seed, q.musicTrack, previousTrack) : undefined;
  const inputProps = { q, music: track ? { file: track.file, startSec: track.startSec } : null };
  const url = await getBundle();
  const composition = await selectComposition({ serveUrl: url, id: "PreVote", inputProps, browserExecutable });
  const raw = path.join(outDir, "prevote_raw.mp4");
  await renderMedia({ composition, serveUrl: url, codec: "h264", audioCodec: "aac", outputLocation: raw, inputProps, browserExecutable });
  const final = path.join(outDir, "prevote.mp4");
  if (track) {
    // Final loudness pass so every Reel lands near -14 LUFS.
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", final]);
  } else {
    fs.copyFileSync(raw, final);
  }
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-c:v", "copy", "-an", path.join(outDir, "prevote_silent.mp4")]);
  fs.rmSync(raw);
  await still("Cover", q, path.join(outDir, "cover.png"));
  await still("Feed", q, path.join(outDir, "feed.png"));
  fs.writeFileSync(path.join(outDir, "caption.txt"), q.caption + "\n");
  if (q.realityCheck) fs.writeFileSync(path.join(outDir, "first_comment.txt"), q.realityCheck + "\n");
  return track?.id;
}
