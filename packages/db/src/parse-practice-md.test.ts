import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  expandPracticeBank,
  letterToPosition,
  loadPracticeBankFromRepo,
  parsePracticeAnswersMarkdown,
  parsePracticeQuestionsMarkdown,
} from "./parse-practice-md.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

describe("parsePracticeQuestionsMarkdown", () => {
  it("parses Q1 stem and four options from the repo practice file", () => {
    const file = path.join(repoRoot, "SAA-C003/SAA-C03-Practice-Questions.md");
    if (!existsSync(file)) {
      throw new Error("Missing practice questions fixture");
    }
    const md = readFileSync(file, "utf8");
    const map = parsePracticeQuestionsMarkdown(md);
    expect(map.size).toBe(30);
    const q1 = map.get(1);
    expect(q1).toBeDefined();
    expect(q1!.stem).toContain("multi-account");
    expect(q1!.stem).toContain("Organizations");
    expect(q1!.options).toHaveLength(4);
    expect(q1!.options.map((o) => o.letter).sort().join("")).toBe("ABCD");
    expect(q1!.options.find((o) => o.letter === "B")!.text).toContain("service control policy");
  });
});

describe("parsePracticeAnswersMarkdown", () => {
  it("parses answer letters", () => {
    const file = path.join(repoRoot, "SAA-C003/SAA-C03-Practice-Answers.md");
    const md = readFileSync(file, "utf8");
    const map = parsePracticeAnswersMarkdown(md);
    expect(map.size).toBe(30);
    expect(map.get(1)).toBe("B");
    expect(map.get(2)).toBe("C");
  });
});

describe("expandPracticeBank", () => {
  it("builds 65 rows whose option indices align with answer letters", () => {
    const { questions, answers } = loadPracticeBankFromRepo(repoRoot);
    const expanded = expandPracticeBank(questions, answers, 65);
    expect(expanded).toHaveLength(65);
    const first = expanded[0]!;
    expect(first.correctPositions).toEqual([letterToPosition(answers.get(first.practiceNumber)!)]);

    const pq = questions.get(first.practiceNumber)!;
    const sortedLetters = [...pq.options].map((o) => o.letter).sort();
    expect(sortedLetters.join("")).toBe("ABCD");
  });
});
