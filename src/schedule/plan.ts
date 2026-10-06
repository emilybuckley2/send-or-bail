import type { Question } from "../schema";

export const REPO_RAW = "https://raw.githubusercontent.com/emilybuckley2/send-or-bail";
export const MEDIA_BRANCH = "claude/compassionate-hopper-xzvr52";
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
    firstComment: q.realityCheck,
    videoUrl: `${REPO_RAW}/${MEDIA_BRANCH}/media/${q.date}/prevote.mp4`,
    thumbnailOffsetMs: 8500, // fork + CTA fully on screen
  };
}
