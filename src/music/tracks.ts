import { z } from "zod";

export const Track = z.object({
  id: z.string(),
  file: z.string(),
  title: z.string(),
  artist: z.string(),
  source: z.string(),
  licenseRef: z.string().min(1, "track has no licenseRef"),
  bpm: z.number(),
  mood: z.string(),
  startSec: z.number().default(0),
});
export type Track = z.infer<typeof Track>;

// Explicit pick wins; otherwise seeded, and never the same track two days running.
export function pickTrack(tracks: Track[], seed: number, explicit?: string, previous?: string): Track {
  if (explicit) {
    const t = tracks.find((x) => x.id === explicit);
    if (!t) throw new Error(`musicTrack "${explicit}" not in tracks.json`);
    return t;
  }
  let i = Math.abs(seed) % tracks.length;
  if (tracks.length > 1 && tracks[i].id === previous) i = (i + 1) % tracks.length;
  return tracks[i];
}
