// Render sample cover stills for visual review.
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { Question } from "../schema";

const ids = process.argv.slice(2);
const all = Question.array().parse(JSON.parse(fs.readFileSync("data/questions.json", "utf8")));
const pick = ids.length ? all.filter((q) => ids.includes(q.id)) : all.slice(0, 1);
const browserExecutable = process.env.REMOTION_BROWSER ?? undefined;

const serveUrl = await bundle({ entryPoint: path.resolve("src/render/index.ts") });
fs.mkdirSync("out/sample", { recursive: true });
for (const q of pick) {
  const comp = await selectComposition({ serveUrl, id: "Cover", inputProps: { q }, browserExecutable });
  const output = `out/sample/${q.id}_cover.png`;
  await renderStill({ composition: comp, serveUrl, output, inputProps: { q }, browserExecutable });
  console.log("wrote", output);
}
