import fs from "node:fs";
import { Question } from "./schema";
import { lintQuestion } from "./lint/text";
import { renderQuestion } from "./render/run";

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

const [cmd, arg] = process.argv.slice(2);
const commands: Record<string, () => Promise<void>> = {
  render: () => render(arg ?? "week1"),
};
if (!commands[cmd]) {
  console.error(`usage: npm run cli -- <${Object.keys(commands).join("|")}> [arg]`);
  process.exit(1);
}
await commands[cmd]();
