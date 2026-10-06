// Run: npx tsx test/tally.test.ts
import fs from "node:fs";
import assert from "node:assert/strict";
import { Question } from "../src/schema";
import { classify, parseComments, tally } from "../src/tally/tally";

const q = Question.array().parse(JSON.parse(fs.readFileSync("data/questions.json", "utf8"))).find((x) => x.id === "si-0001")!;
const comments = parseComments(fs.readFileSync("test/fixtures/comments_si-0001.txt", "utf8"));
assert.equal(comments.length, 50);

assert.equal(classify("SEND IT 🔥", q), "A");
assert.equal(classify("bailing, obviously", q), "B");
assert.equal(classify("I'd send but my mom follows this account so bail", q), "A"); // first match wins
assert.equal(classify("who's bringing snacks", q), null);

const { result, unclearComments } = tally(q, comments, "paste");
// 50 lines: 1 own-account reply, 1 repeat voter (kara.runs counts once, as bail), 4 pick neither side.
assert.equal(result.countA + result.countB, 44);
assert.equal(result.countA, 19);
assert.equal(result.countB, 25);
assert.equal(result.unclear, 4);
assert.equal(unclearComments.length, 4);
assert.equal(result.topComments.length, 3);
assert.ok(result.topComments.some((c) => c.choice === "A") && result.topComments.some((c) => c.choice === "B"));
assert.ok(result.topComments.every((c) => !/\p{Extended_Pictographic}/u.test(c.text)));
console.log("tally test passed", result.countA, result.countB, result.topComments);
