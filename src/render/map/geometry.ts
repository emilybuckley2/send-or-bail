import seedrandom from "seedrandom";

export type Pt = { x: number; y: number };

// Catmull-Rom through points, as a smooth cubic SVG path.
export function smoothPath(pts: Pt[]): string {
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// Wobbly waypoints between two points so trails look hand-walked.
function wander(rng: () => number, a: Pt, b: Pt, n: number, amp: number): Pt[] {
  const pts: Pt[] = [a];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const off = (rng() - 0.5) * 2 * amp * Math.sin(Math.PI * t);
    pts.push({ x: a.x + dx * t + nx * off, y: a.y + dy * t + ny * off });
  }
  pts.push(b);
  return pts;
}

export type TrailLayout = {
  start: Pt;
  you: Pt;
  goal: Pt; // end of branch A
  exit: Pt; // end of branch B
  hazard: Pt;
  approach: string; // start -> you
  branchA: string; // you -> goal
  branchB: string; // you -> exit
};

// Layout inside a map box. Mirrors left/right by seed for variety.
export function trailLayout(seed: number, box: { x: number; y: number; w: number; h: number }): TrailLayout {
  const rng = seedrandom(`trail-${seed}`);
  const flip = rng() < 0.5;
  const j = (v: number) => v + (rng() - 0.5) * 60;
  const at = (fx: number, fy: number): Pt => ({
    x: box.x + (flip ? 1 - fx : fx) * box.w,
    y: box.y + fy * box.h,
  });
  const start = at(0.32, 1.0);
  const you = { ...at(0.48, 0.56), x: j(at(0.48, 0.56).x) };
  const goal = at(0.8, 0.1);
  const exit = at(0.02, 0.9); // branch B heads back down and away
  const hazard = at(0.16, 0.1);
  const approach = smoothPath(wander(rng, start, you, 4, 70));
  const branchA = smoothPath(wander(rng, you, goal, 3, 50));
  const branchB = smoothPath(wander(rng, you, exit, 3, 50));
  return { start, you, goal, exit, hazard, approach, branchA, branchB };
}

// Simple elevation profile for the strip.
export function profile(seed: number, n = 40): number[] {
  const rng = seedrandom(`profile-${seed}`);
  let wobble = 0;
  return Array.from({ length: n }, (_, i) => {
    wobble = wobble * 0.7 + (rng() - 0.5) * 0.12;
    const t = i / (n - 1);
    const trend = t * t * (3 - 2 * t); // ease in, climb, top out
    return Math.min(1, Math.max(0, 0.08 + trend * 0.84 + wobble));
  });
}
