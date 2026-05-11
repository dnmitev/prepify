import { readFileSync } from "node:fs";
import path from "node:path";

export type ParsedPracticeQuestion = {
  number: number;
  stem: string;
  options: { letter: string; text: string }[];
};

/** Map Q1–Q9 → SECURE, Q10–Q17 → RESILIENT, Q18–Q24 → PERF, Q25–Q30 → COST */
export function domainCodeForPracticeQuestion(qNum: number): string {
  if (qNum >= 1 && qNum <= 9) return "SECURE";
  if (qNum >= 10 && qNum <= 17) return "RESILIENT";
  if (qNum >= 18 && qNum <= 24) return "PERF";
  if (qNum >= 25 && qNum <= 30) return "COST";
  return "SECURE";
}

/**
 * Parse `SAA-C03-Practice-Questions.md` — blocks look like:
 * ### Q1
 * Stem paragraph(s)
 * - A. ...
 * - D. ...
 */
export function parsePracticeQuestionsMarkdown(markdown: string): Map<number, ParsedPracticeQuestion> {
  const lines = markdown.split(/\r?\n/);
  const map = new Map<number, ParsedPracticeQuestion>();
  let i = 0;

  while (i < lines.length) {
    const header = lines[i]?.match(/^### Q(\d+)\s*$/);
    if (!header) {
      i += 1;
      continue;
    }
    const qNum = Number(header[1]);
    i += 1;
    const stemLines: string[] = [];
    const options: { letter: string; text: string }[] = [];

    while (i < lines.length) {
      const line = lines[i] ?? "";
      const optMatch = line.match(/^- ([A-E])\.\s*(.*)$/);
      if (optMatch) {
        options.push({ letter: optMatch[1]!, text: optMatch[2]!.trim() });
        i += 1;
        continue;
      }
      const nextHeader = /^### Q\d+\s*$/.test(line);
      if (nextHeader || line.startsWith("## ") || line === "---") {
        break;
      }
      if (line.trim().length > 0 && !line.startsWith("#")) {
        stemLines.push(line.trim());
      }
      i += 1;
    }

    if (stemLines.length > 0 && options.length >= 2) {
      map.set(qNum, {
        number: qNum,
        stem: stemLines.join("\n"),
        options,
      });
    }

    if (lines[i] === "---") {
      i += 1;
    }
  }

  return map;
}

/** Parse `### Q1 — Answer: **B**` style lines */
export function parsePracticeAnswersMarkdown(markdown: string): Map<number, string> {
  const map = new Map<number, string>();
  const re = /^### Q(\d+)\s+—\s+Answer:\s+\*\*([A-E])\*\*/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    map.set(Number(m[1]), m[2]!);
  }
  return map;
}

export function letterToPosition(letter: string): number {
  const upper = letter.toUpperCase();
  const code = upper.charCodeAt(0) - "A".charCodeAt(0);
  if (code < 0 || code > 4) {
    throw new Error(`Invalid answer letter: ${letter}`);
  }
  return code;
}

export function loadPracticeBankFromRepo(repoRoot: string): {
  questions: Map<number, ParsedPracticeQuestion>;
  answers: Map<number, string>;
} {
  const qPath = path.join(repoRoot, "SAA-C003/SAA-C03-Practice-Questions.md");
  const aPath = path.join(repoRoot, "SAA-C003/SAA-C03-Practice-Answers.md");
  const questions = parsePracticeQuestionsMarkdown(readFileSync(qPath, "utf8"));
  const answers = parsePracticeAnswersMarkdown(readFileSync(aPath, "utf8"));
  return { questions, answers };
}

/** Expand 30 canonical practice items to `targetCount` rows with unique stems for exam sampling */
export function expandPracticeBank(
  canonical: Map<number, ParsedPracticeQuestion>,
  answers: Map<number, string>,
  targetCount: number,
): {
  stem: string;
  format: "single" | "multiple";
  correctPositions: number[];
  practiceNumber: number;
  passTag: number;
}[] {
  const nums = [...canonical.keys()].sort((a, b) => a - b);
  if (nums.length === 0) {
    throw new Error("No practice questions parsed");
  }

  const out: {
    stem: string;
    format: "single" | "multiple";
    correctPositions: number[];
    practiceNumber: number;
    passTag: number;
  }[] = [];

  for (let idx = 0; idx < targetCount; idx += 1) {
    const n = nums[idx % nums.length]!;
    const pq = canonical.get(n);
    if (!pq) throw new Error(`Missing Q${n}`);
    const letter = answers.get(n);
    if (!letter) throw new Error(`Missing answer for Q${n}`);

    const pass = Math.floor(idx / nums.length);
    const stemSuffix =
      pass === 0 ? "" : `\n\n_(Practice bank cycle ${pass + 1} — same item pool.)_`;

    const correctPos = letterToPosition(letter);
    out.push({
      stem: pq.stem + stemSuffix,
      format: "single",
      correctPositions: [correctPos],
      practiceNumber: n,
      passTag: pass,
    });
  }

  return out;
}
