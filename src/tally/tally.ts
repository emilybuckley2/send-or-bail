import { brand } from "../brand";
import type { Comment, Question, Result } from "../schema";

const EMOJI = /\p{Extended_Pictographic}|️|‍/gu;
const ownHandle = brand.handle.replace(/^@/, "").toLowerCase();

// First keyword to appear in the comment wins; null when neither appears.
export function classify(text: string, q: Question): "A" | "B" | null {
  const find = (kw: string) => {
    const m = new RegExp(`(^|[^A-Za-z])${kw}(ing|ed|s|it)?([^A-Za-z]|$)`, "i").exec(text);
    return m ? m.index : -1;
  };
  const a = find(q.choiceA.keyword);
  const b = find(q.choiceB.keyword);
  if (a < 0 && b < 0) return null;
  if (b < 0 || (a >= 0 && a <= b)) return "A";
  return "B";
}

// On-screen comment text: no emoji, no em-dashes, single line, short.
export function cleanForScreen(text: string, max = 90): string {
  let t = text.replace(EMOJI, "").replace(/[–—]/g, ",").replace(/\s+/g, " ").trim();
  if (t.length > max) t = t.slice(0, max - 1).replace(/\s+\S*$/, "") + "...";
  return t;
}

export type Tally = { result: Result; unclearComments: Comment[]; bothKeywords: Comment[] };

// One vote per handle (their first comment that picks a side). Our own account never votes.
export function tally(q: Question, comments: Comment[], source: Result["source"], top?: string[]): Tally {
  const voted = new Map<string, { c: Comment; choice: "A" | "B" }>();
  const unclearComments: Comment[] = [];
  const bothKeywords: Comment[] = [];
  const has = (t: string, kw: string) => new RegExp(`(^|[^A-Za-z])${kw}(ing|ed|s|it)?([^A-Za-z]|$)`, "i").test(t);
  for (const c of comments) {
    const handle = c.handle.replace(/^@/, "").toLowerCase();
    if (handle === ownHandle) continue;
    const choice = classify(c.text, q);
    if (!choice) {
      unclearComments.push(c);
      continue;
    }
    if (has(c.text, q.choiceA.keyword) && has(c.text, q.choiceB.keyword)) bothKeywords.push(c);
    if (!voted.has(handle)) voted.set(handle, { c, choice });
  }
  const votes = [...voted.values()];
  const unclearHandles = new Set(unclearComments.map((c) => c.handle.replace(/^@/, "").toLowerCase()));
  for (const h of voted.keys()) unclearHandles.delete(h);

  // Standouts: explicit picks win. Otherwise most-liked, then the ones with the most to say,
  // with at least one from each side when both sides have votes.
  const score = (v: { c: Comment }) => (v.c.likes ?? 0) * 100 + Math.min(cleanForScreen(v.c.text).length, 80);
  let picks: typeof votes;
  if (top?.length) {
    picks = top.map((h) => {
      const v = voted.get(h.replace(/^@/, "").toLowerCase());
      if (!v) throw new Error(`top comment handle ${h} has no counted vote`);
      return v;
    });
  } else {
    const ranked = [...votes].filter((v) => cleanForScreen(v.c.text).length >= 6).sort((x, y) => score(y) - score(x));
    picks = ranked.slice(0, 3);
    for (const side of ["A", "B"] as const) {
      if (!picks.some((p) => p.choice === side)) {
        const best = ranked.find((v) => v.choice === side);
        if (best && picks.length === 3) picks[2] = best;
        else if (best) picks.push(best);
      }
    }
  }

  const result: Result = {
    questionId: q.id,
    countA: votes.filter((v) => v.choice === "A").length,
    countB: votes.filter((v) => v.choice === "B").length,
    unclear: unclearHandles.size,
    topComments: picks.map((p) => ({ handle: `@${p.c.handle.replace(/^@/, "")}`, text: cleanForScreen(p.c.text), choice: p.choice })),
    source,
    tallied_at: new Date().toISOString(),
  };
  return { result, unclearComments, bothKeywords };
}

// Accepts JSON [{handle,text,likes?}] or plain text, one comment per line as "handle: text".
export function parseComments(raw: string): Comment[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed.split(/\r?\n/).filter(Boolean).map((line) => {
    const m = line.match(/^@?([\w.]+)\s*[:\-]\s*(.*)$/);
    if (!m) throw new Error(`can't read comment line: "${line}" (use "handle: text")`);
    return { handle: m[1], text: m[2] };
  });
}
