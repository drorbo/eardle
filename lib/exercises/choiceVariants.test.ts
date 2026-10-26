// Run with: npm run test:variants
import test from "node:test";
import assert from "node:assert/strict";
import { pickVariants, type VariantRow } from "./choiceVariants";

const rows: VariantRow[] = [
  { id: 5, answer: "Dorian", difficulty: "hard", config: { type: "dorian", topic: "a" } as never },
  { id: 9, answer: "Dorian", difficulty: "easy", config: { type: "dorian", topic: "b" } as never },
  { id: 2, answer: "Lydian", difficulty: "hard", config: { type: "lydian" } as never },
];
const own = { type: "major" } as never;

test("correct answer uses the exercise's own config", () => {
  const v = pickVariants(["Major", "Dorian"], rows, "easy", "Major", own);
  assert.equal(v["Major"], own);
});

test("prefers same difficulty, else lowest id", () => {
  assert.deepEqual(pickVariants(["Dorian"], rows, "easy", "X", own)["Dorian"], rows[1].config);
  assert.deepEqual(pickVariants(["Dorian"], rows, "jazz", "X", own)["Dorian"], rows[0].config);
});

test("labels without a matching exercise are omitted", () => {
  assert.equal("Locrian" in pickVariants(["Locrian"], rows, "easy", "X", own), false);
});

test("derives a missing Root Position choice from the 1st Inversion sibling", () => {
  const inv: VariantRow[] = [
    { id: 1, answer: "Major - 1st Inversion", difficulty: "medium", config: { type: "major", inversion: 1 } as never },
  ];
  const v = pickVariants(["Major - Root Position"], inv, "medium", "X", own);
  assert.deepEqual(v["Major - Root Position"], { type: "major", inversion: 0 });
});
