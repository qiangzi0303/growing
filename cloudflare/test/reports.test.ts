import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport } from "../src/reports";
import rules from "../src/english-rules.json";
import type { Document } from "../src/database";
const doc = (key: string, value: unknown): Document => ({ key, value: JSON.stringify(value), revision: 1, updatedAt: "2026-10-22T00:00:00Z" });
test("reading and invalid AI grades do not become mastery", () => {
  const topics = Object.fromEntries([8, 7, 8.5, 9].map((score, i) => [i, { seen: true, bestQuiz: i === 3 ? 2 : 3, attempts: [{ score, feedback: "正确", criticalErrors: [] }] }]));
  const r = buildReport([doc("growing-math-lessons-v1", { topics })]).subjects[0];
  assert.equal(r.read, 4); assert.equal(r.mastered, 1);
});
test("seven correct recalls required and optional/unknown words are not counted as mastered", () => {
  const words = { friendship: { protocol: "seven-recalls", answers: Array(7).fill("friendship") }, honest: { protocol: "seven-recalls", answers: ["honest", "honest", "wrong", "honest", "honest", "honest", "honest"] }, madeUp: { protocol: "seven-recalls", answers: Array(7).fill("madeUp") } };
  const r = buildReport([doc("growing-english-course-v1:english-8a-01", { words })]).subjects[1];
  assert.equal(r.read, 3); assert.equal(r.mastered, 1);
});
test("activity preserves historical days and avoids counting old timers twice", () => {
  const r = buildReport([
    doc("growing-math-lessons-v1", { tools: { days: { "2026-10-21": { a: { ms: 60000 } }, "2026-10-22": { a: { ms: 600000 } } } } }),
    doc("growing-activity-v1:device1", { days: { "2026-10-22": { 数学: 120 } } }),
    doc("growing-activity-v1:device2", { days: { "2026-10-22": { 数学: 60, 英语: 60 } } }),
  ]);
  assert.equal(r.subjects[0].activeMinutes, 11); assert.equal(r.subjects[1].activeMinutes, 1);
});
test("legacy fraction and Unit 3 mastery stay visible", () => {
  const id = rules.__legacy.fractionTopics[0], word = rules.__legacy.words[0];
  const r = buildReport([
    doc("fraction-minute-v1", { topics: { [id]: { exams: [{}] } }, learning: { mastery: { [id]: null } }, activity: { days: { "2026-10-22": 60000 } } }),
    doc("wordops_8A_unit3", { seen: [word.id], mastered: { [word.id]: { protocol: "seven-recalls", answers: Array(7).fill(word.word) } }, best: { [rules.__legacy.tests[0]]: 80 }, learningTime: { days: { "2026-10-22": 120000 } } }),
  ]);
  assert.equal(r.subjects[0].mastered, 1); assert.equal(r.subjects[1].mastered, 2); assert.equal(r.subjects[1].activeMinutes, 2);
});
