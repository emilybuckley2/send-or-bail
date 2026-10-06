import fs from "node:fs";
import { Question } from "../schema";
import { lintQuestion } from "../lint/text";

const raw = JSON.parse(fs.readFileSync("data/questions.json", "utf8"));
const parsed = Question.array().safeParse(raw);
if (!parsed.success) {
  console.error(parsed.error.issues);
  process.exit(1);
}
const ids = new Set<string>();
const errors = parsed.data.flatMap((q) => {
  const e = lintQuestion(q);
  if (ids.has(q.id)) e.push(`${q.id}: duplicate id`);
  ids.add(q.id);
  return e;
});
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`${parsed.data.length} questions valid, lint clean`);
