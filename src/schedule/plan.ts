import type { Question, Result } from "../schema";

import { execFileSync } from "node:child_process";

export const REPO_RAW = "https://raw.githubusercontent.com/emilybuckley2/send-or-bail";
// Media links are pinned to a commit, so they keep working whatever branch a week was made on.
export const mediaRef = (): string => process.env.MEDIA_REF ?? execFileSync("git", ["rev-parse", "HEAD"]).toString().trim();
export const POST_TIME = { prevote: "07:30", results: "18:30" };
export const TIMEZONE = "America/New_York";

export type PlannedPost = {
  questionId: string;
  kind: "prevote" | "results";
  dueAt: string; // ISO with ET offset
  text: string;
  firstComment?: string;
  videoUrl: string;
  thumbnailOffsetMs: number;
};

// UTC offset for America/New_York on a given date, e.g. "-04:00".
export function etOffset(date: string, time: string): string {
  const probe = new Date(`${date}T${time}:00Z`);
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, timeZoneName: "shortOffset" })
    .formatToParts(probe).find((p) => p.type === "timeZoneName")!.value; // "GMT-4"
  const h = Number(name.replace("GMT", "") || 0);
  return `${h < 0 ? "-" : "+"}${String(Math.abs(h)).padStart(2, "0")}:00`;
}

export function postText(q: Question): string {
  return q.hashtags?.length ? `${q.caption}\n\n${q.hashtags.join(" ")}` : q.caption;
}

export function planPrevote(q: Question, time = POST_TIME.prevote): PlannedPost {
  if (!q.date) throw new Error(`${q.id} has no date`);
  return {
    questionId: q.id,
    kind: "prevote",
    dueAt: `${q.date}T${time}:00${etOffset(q.date, time)}`,
    text: postText(q),
    // No first comment: a pinned reality check reads as the answer and kills the vote.
    videoUrl: `${REPO_RAW}/${mediaRef()}/media/${q.date}/prevote.mp4`,
    thumbnailOffsetMs: 8500, // fork + CTA fully on screen
  };
}

export function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function resultsCaption(q: Question, r: Result): string {
  const total = r.countA + r.countB;
  const pctA = total ? Math.round((r.countA / total) * 100) : 50;
  const lead = `Yesterday's call: ${pctA}% ${q.choiceA.keyword}, ${100 - pctA}% ${q.choiceB.keyword}.`;
  return `${lead}\nWould you change your answer? Tell us below.\n\nNew call tomorrow, 7:30am ET.`;
}

export function planResults(q: Question, r: Result): PlannedPost {
  if (!q.date) throw new Error(`${q.id} has no date`);
  const date = nextDay(q.date);
  const caption = resultsCaption(q, r);
  return {
    questionId: q.id,
    kind: "results",
    dueAt: `${date}T${POST_TIME.results}:00${etOffset(date, POST_TIME.results)}`,
    text: q.hashtags?.length ? `${caption}\n\n${q.hashtags.join(" ")}` : caption,
    firstComment: q.realityCheck,
    videoUrl: `${REPO_RAW}/${mediaRef()}/media/${date}/results.mp4`,
    thumbnailOffsetMs: 6000,
  };
}
