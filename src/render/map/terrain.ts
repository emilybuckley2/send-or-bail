import seedrandom from "seedrandom";
import { createNoise2D } from "simplex-noise";
import { contours } from "d3-contour";

export type ContourPath = { d: string; index: boolean };

const CELL = 12; // px per grid cell

// Smoothed noise field -> contour lines. Same seed, same terrain.
export function terrain(seed: number, width: number, height: number, levels = 12): ContourPath[] {
  const noise = createNoise2D(seedrandom(`terrain-${seed}`));
  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 1;
  const values = new Array<number>(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const nx = x / cols;
      const ny = y / rows;
      // Three octaves, scaled so peaks land a couple of times per frame.
      const v =
        noise(nx * 1.6, ny * 2.4) * 1.0 +
        noise(nx * 3.6, ny * 5.2) * 0.35 +
        noise(nx * 8.0, ny * 11.0) * 0.08;
      values[y * cols + x] = v;
    }
  }
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const step = (hi - lo) / (levels + 1);
  const thresholds = Array.from({ length: levels }, (_, i) => lo + step * (i + 1));
  return contours()
    .size([cols, rows])
    .thresholds(thresholds)(values)
    .map((c, i) => ({
      index: i % 4 === 3,
      d: c.coordinates
        .flat()
        .map(
          (ring) =>
            "M" +
            ring.map(([x, y]) => `${(x * CELL).toFixed(1)},${(y * CELL).toFixed(1)}`).join("L") +
            "Z",
        )
        .join(""),
    }));
}
