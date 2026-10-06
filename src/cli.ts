import fs from "node:fs";
import { Question } from "./schema";
import { lintQuestion } from "./lint/text";
import { renderQuestion, renderResults } from "./render/run";
import { Result } from "./schema";
import { parseComments, tally } from "./tally/tally";
import { nextDay, planPrevote, planResults } from "./schedule/plan";

const QUESTIONS = "data/questions.json";
const WEEK_ONE = ["si-0001", "si-0003", "si-0008", "si-0006", "si-0015", "si-0010", "si-0016"];

function load(): Question[] {
  return Question.array().parse(JSON.parse(fs.readFileSync(QUESTIONS, "utf8")));
}

async function render(target: string) {
  const all = load();
  const ids = target === "week1" ? WEEK_ONE : target.split(",");
  let previous: string | undefined;
  for (const id of ids) {
    const q = all.find((x) => x.id === id);
    if (!q) throw new Error(`no question ${id}`);
    const errors = lintQuestion(q);
    if (errors.length) throw new Error(errors.join("\n"));
    const dir = `out/${q.date ?? q.id}`;
    const t0 = Date.now();
    previous = await renderQuestion(q, dir, previous);
    console.log(`${id} -> ${dir} (music: ${previous ?? "none"}, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
}

// Writes the Buffer payloads for every scheduled question from a start date; a Claude
// session posts them through the Buffer connector.
function schedule(from: string) {
  const posts = load()
    .filter((q) => q.status === "scheduled" && q.date && q.date >= from)
    .sort((a, b) => a.date!.localeCompare(b.date!))
    .map((q) => planPrevote(q));
  fs.mkdirSync("out/schedule", { recursive: true });
  const file = `out/schedule/${from}.json`;
  fs.writeFileSync(file, JSON.stringify(posts, null, 2) + "\n");
  console.log(`${posts.length} posts -> ${file}`);
}

// plan-batch <candidates.json>: validates new scenarios, assigns ids and consecutive dates after the
// last scheduled one, appends them to questions.json as scheduled, renders them, stages media/<date>/.
async function planBatch(file: string) {
  const all = load();
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<Question>[];
  if (raw.length < 1 || raw.length > 40) throw new Error(`need 1 to 40 candidates, got ${raw.length}`);
  let nextNum = Math.max(...all.map((q) => Number(q.id.slice(3)))) + 1;
  let date = all.filter((q) => q.date).map((q) => q.date!).sort().at(-1) ?? new Date().toISOString().slice(0, 10);
  const seen = new Set(all.map((q) => q.headline.toLowerCase()));
  const added: Question[] = [];
  for (const c of raw) {
    date = nextDay(date);
    const q = Question.parse({ ...c, id: `si-${String(nextNum++).padStart(4, "0")}`, date, status: "scheduled",
      map: { ...c.map, seed: c.map?.seed ?? Math.floor(Math.random() * 9000) + 1000 } });
    const errors = lintQuestion(q);
    if (seen.has(q.headline.toLowerCase())) errors.push(`${q.id}: headline repeats an existing question`);
    if (errors.length) throw new Error(errors.join("\n"));
    added.push(q);
  }
  fs.writeFileSync(QUESTIONS, JSON.stringify([...all, ...added], null, 1) + "\n");
  console.log(`added ${added.map((q) => `${q.id} (${q.date})`).join(", ")}`);
  let previous: string | undefined;
  for (const q of added) {
    previous = await renderQuestion(q, `out/${q.date}`, previous);
    fs.mkdirSync(`media/${q.date}`, { recursive: true });
    for (const f of ["prevote.mp4", "cover.png"]) fs.copyFileSync(`out/${q.date}/${f}`, `media/${q.date}/${f}`);
    console.log(`${q.id} rendered -> media/${q.date}`);
  }
}

function getQuestion(id: string): Question {
  const q = load().find((x) => x.id === id);
  if (!q) throw new Error(`no question ${id}`);
  return q;
}

// tally <id> <comments file> [--top h1,h2,h3]   or   tally <id> --manual <countA> <countB>
function runTally(id: string, rest: string[]) {
  const q = getQuestion(id);
  let result: Result;
  if (rest[0] === "--manual") {
    result = { questionId: id, countA: Number(rest[1]), countB: Number(rest[2]), unclear: 0, topComments: [],
      source: "manual", tallied_at: new Date().toISOString() };
  } else {
    const topIdx = rest.indexOf("--top");
    const top = topIdx >= 0 ? rest[topIdx + 1].split(",") : undefined;
    const t = tally(q, parseComments(fs.readFileSync(rest[0], "utf8")), "paste", top);
    result = t.result;
    if (t.bothKeywords.length) {
      console.log(`${t.bothKeywords.length} comments name both sides (counted by first keyword, check these):`);
      for (const c of t.bothKeywords) console.log(`  @${c.handle}: ${c.text}`);
    }
    if (t.unclearComments.length) {
      console.log(`${t.unclearComments.length} comments picked neither side:`);
      for (const c of t.unclearComments) console.log(`  @${c.handle}: ${c.text}`);
    }
  }
  Result.parse(result);
  fs.mkdirSync("data/results", { recursive: true });
  fs.writeFileSync(`data/results/${id}.json`, JSON.stringify(result, null, 2) + "\n");
  const total = result.countA + result.countB;
  console.log(`${id}: ${q.choiceA.keyword} ${result.countA} / ${q.choiceB.keyword} ${result.countB} (${total} votes, ${result.unclear} unclear)`);
  for (const c of result.topComments) console.log(`  [${c.choice}] ${c.handle}: ${c.text}`);
}

async function runRenderResults(id: string) {
  const q = getQuestion(id);
  const r = Result.parse(JSON.parse(fs.readFileSync(`data/results/${id}.json`, "utf8")));
  const date = q.date ? nextDay(q.date) : id;
  const dir = `out/${date}/results`;
  const track = await renderResults(q, r, dir);
  const post = q.date ? planResults(q, r) : undefined;
  if (post) fs.writeFileSync(`${dir}/post.json`, JSON.stringify(post, null, 2) + "\n");
  console.log(`${id} results -> ${dir} (music: ${track ?? "none"})`);
}

const [cmd, arg, ...rest] = process.argv.slice(2);
const commands: Record<string, () => Promise<void>> = {
  render: () => render(arg ?? "week1"),
  schedule: async () => schedule(arg ?? new Date().toISOString().slice(0, 10)),
  "plan-batch": () => planBatch(arg),
  tally: async () => runTally(arg, rest),
  "render-results": () => runRenderResults(arg),
};
if (!commands[cmd]) {
  console.error(`usage: npm run cli -- <${Object.keys(commands).join("|")}> [arg]`);
  process.exit(1);
}
await commands[cmd]();
