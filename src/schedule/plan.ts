import type { Question, Result } from "../schema";

import { execFileSync } from "node:child_process";

export const REPO_RAW = "https://raw.githubusercontent.com/emilybuckley2/send-or-bail";
// Media links are pinned to a commit, so they keep working whatever branch a week was made on.
export const mediaRef = (): string => process.env.MEDIA_REF ?? execFileSync("git", ["rev-parse", "HEAD"]).toString().trim();
export const POST_TIME = { prevote: "07:30", results: "18:30" };
export const TIMEZONE = "America/New_York";

export const CHANNELS = {
  instagram: "6ac510396a5c39ccb6311648",
  tiktok: "6ac51d4a6a5c39ccb631d113",
  youtube: "6ac51c236a5c39ccb631aa11",
} as const;
export type Platform = keyof typeof CHANNELS;

export type PlannedPost = {
  questionId: string;
  kind: "prevote" | "results";
  platform: Platform;
  channelId: string;
  title?: string; // YouTube and TikTok
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

// Extra discovery tags for platforms that reward more than Instagram's five.
const EXTRA_TAGS = ["#trail", "#adventure", "#wouldyou", "#outdoorlife", "#explore"];

export function postText(q: Question, platform: Platform = "instagram"): string {
  const tags = q.hashtags ?? [];
  if (platform === "instagram") return tags.length ? `${q.caption}\n\n${tags.join(" ")}` : q.caption;
  if (platform === "tiktok") {
    const all = [...tags.filter((t) => t !== "#sendorbail"), ...EXTRA_TAGS.filter((t) => !tags.includes(t)), "#sendorbail"];
    return `${q.caption}\n\n${all.join(" ")}`;
  }
  // YouTube: description carries the question and #Shorts so it lands on the Shorts shelf.
  return `${q.scenario.join(" ")}\n\n${q.caption}\n\n#Shorts ${tags.join(" ")}`;
}

export function planPrevote(q: Question, platform: Platform = "instagram", time = POST_TIME.prevote): PlannedPost {
  if (!q.date) throw new Error(`${q.id} has no date`);
  return {
    questionId: q.id,
    kind: "prevote",
    platform,
    channelId: CHANNELS[platform],
    title: platform === "instagram" ? undefined : `${q.headline} Send or Bail?`.slice(0, 100),
    dueAt: `${q.date}T${time}:00${etOffset(q.date, time)}`,
    text: postText(q, platform),
    // No first comment: a pinned reality check reads as the answer and kills the vote.
    videoUrl: `${REPO_RAW}/${mediaRef()}/media/${q.date}/prevote.mp4`,
    thumbnailOffsetMs: 8500, // fork + CTA fully on screen
  };
}

export const PLATFORMS: Platform[] = ["instagram", "tiktok", "youtube"];

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
    platform: "instagram",
    channelId: CHANNELS.instagram,
    dueAt: `${date}T${POST_TIME.results}:00${etOffset(date, POST_TIME.results)}`,
    text: q.hashtags?.length ? `${caption}\n\n${q.hashtags.join(" ")}` : caption,
    firstComment: q.realityCheck,
    videoUrl: `${REPO_RAW}/${mediaRef()}/media/${date}/results.mp4`,
    thumbnailOffsetMs: 6000,
  };
}
