import type { Question } from "../schema";

// Em-dashes are banned everywhere. En-dashes too, except between numbers (ranges).
const EM = /—/;
const EN_AS_DASH = /–(?!\d)|(?<!\d)–/;
const EMOJI = /\p{Extended_Pictographic}/gu;

export function lintQuestion(q: Question): string[] {
  const errors: string[] = [];
  const onScreen = [q.headline, ...q.scenario, q.choiceA.label, q.choiceB.label, q.map.window ?? "", q.map.goalLabel ?? "", q.category];
  const all = [...onScreen, q.caption, q.realityCheck ?? ""];
  for (const s of all) {
    if (EM.test(s)) errors.push(`${q.id}: em-dash in "${s}"`);
    if (EN_AS_DASH.test(s)) errors.push(`${q.id}: en-dash used as a dash in "${s}"`);
  }
  for (const s of onScreen) if (s.match(EMOJI)) errors.push(`${q.id}: emoji in on-screen text "${s}"`);
  if ((q.caption.match(EMOJI) ?? []).length > 1) errors.push(`${q.id}: more than one emoji in caption`);
  const cta = `Comment ${q.choiceA.keyword} or ${q.choiceB.keyword}.`;
  if (!q.caption.endsWith(cta)) errors.push(`${q.id}: caption must end with "${cta}"`);
  const risky = q.map.hazards.some((h) => ["storm", "avalanche", "whiteout", "heat", "creek", "snowfield"].includes(h));
  if (risky && !q.realityCheck && q.map.hazards.some((h) => h !== "creek")) errors.push(`${q.id}: risky hazard needs a realityCheck`);
  return errors;
}
