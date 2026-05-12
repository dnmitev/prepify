import type { QuestionFormat } from "./question-validation.js";
import { validateQuestionStructure } from "./question-validation.js";

/** Domain codes used by SAA-C03 seed — generation must pick one. */
export const GENERATION_DOMAIN_CODES = ["SECURE", "RESILIENT", "PERF", "COST"] as const;
export type GenerationDomainCode = (typeof GENERATION_DOMAIN_CODES)[number];

export type GeneratedQuestionOptionInput = {
  position: number;
  text: string;
  isCorrect: boolean;
  /** Required on correct option(s): reasoning why that answer is right (exam-style rationale). */
  explanation?: string | null;
};

export type GeneratedQuestionPayload = {
  stem: string;
  format: QuestionFormat;
  /** Domain code from the exam catalog (validated against allowed codes when provided). */
  domainCode: string;
  options: GeneratedQuestionOptionInput[];
};

export type ValidateGeneratedQuestionOptions = {
  /** When set, `domainCode` must be one of these (defaults to SAA-style GENERATION_DOMAIN_CODES). */
  allowedDomainCodes?: readonly string[];
};

export type GeneratedQuestionCanonicalTextInput = {
  examTypeCode: string;
  domainCode: string;
  stem: string;
  format: QuestionFormat;
  options: {
    position: number;
    text: string;
  }[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeTextForEmbedding(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Canonical assessment text used for semantic duplicate detection.
 * Explanations are intentionally excluded so shared rationale wording does not
 * make distinct questions look more similar than they are.
 */
export function buildGeneratedQuestionCanonicalText(
  input: GeneratedQuestionCanonicalTextInput,
): string {
  const optionLines = [...input.options]
    .sort((a, b) => a.position - b.position)
    .map((o) => `Option ${String(o.position)}: ${normalizeTextForEmbedding(o.text)}`)
    .join("\n");

  return [
    `Exam: ${normalizeTextForEmbedding(input.examTypeCode)}`,
    `Domain: ${normalizeTextForEmbedding(input.domainCode)}`,
    `Format: ${input.format}`,
    `Stem: ${normalizeTextForEmbedding(input.stem)}`,
    "Options:",
    optionLines,
  ].join("\n");
}

/** Derive select mode from answer keys — models often mismatch `format` vs `isCorrect` counts. */
function formatInferredFromCorrectFlags(correctCount: number): QuestionFormat {
  return correctCount >= 2 ? "multiple" : "single";
}

/** Validates JSON-shaped LLM output before persistence. */
export function validateGeneratedQuestionPayload(
  raw: unknown,
  validationOptions?: ValidateGeneratedQuestionOptions,
): {
  ok: true;
  value: GeneratedQuestionPayload;
} | {
  ok: false;
  errors: string[];
} {
  const allowedDomainCodes = validationOptions?.allowedDomainCodes ?? GENERATION_DOMAIN_CODES;
  const errors: string[] = [];
  if (!isRecord(raw)) {
    return { ok: false, errors: ["Payload must be a JSON object."] };
  }

  const stem = raw["stem"];
  if (typeof stem !== "string" || stem.trim().length < 40) {
    errors.push("stem must be a non-empty scenario string (at least 40 characters).");
  }

  const format = raw["format"];
  if (format !== "single" && format !== "multiple") {
    errors.push('format must be "single" or "multiple".');
  }

  const domainCode = raw["domainCode"];
  if (typeof domainCode !== "string" || !(allowedDomainCodes as readonly string[]).includes(domainCode)) {
    errors.push(`domainCode must be one of: ${allowedDomainCodes.join(", ")}.`);
  }

  const optsRaw = raw["options"];
  if (!Array.isArray(optsRaw)) {
    errors.push("options must be an array.");
    return { ok: false, errors };
  }

  const parsedOptions: GeneratedQuestionOptionInput[] = [];
  for (const item of optsRaw) {
    if (!isRecord(item)) {
      errors.push("Each option must be an object.");
      continue;
    }
    const position = item["position"];
    const text = item["text"];
    const isCorrect = item["isCorrect"];
    const explanation = item["explanation"];
    if (typeof position !== "number" || !Number.isInteger(position) || position < 0) {
      errors.push("Each option needs a non-negative integer position.");
      continue;
    }
    if (typeof text !== "string" || text.trim().length < 4) {
      errors.push("Each option needs option text.");
      continue;
    }
    if (typeof isCorrect !== "boolean") {
      errors.push("Each option needs isCorrect boolean.");
      continue;
    }
    if (
      explanation !== undefined &&
      explanation !== null &&
      typeof explanation !== "string"
    ) {
      errors.push("explanation must be a string when present.");
      continue;
    }
    parsedOptions.push({
      position,
      text: text.trim(),
      isCorrect,
      explanation: typeof explanation === "string" ? explanation : null,
    });
  }

  const correctCount = parsedOptions.filter((o) => o.isCorrect).length;
  const effectiveFormat = formatInferredFromCorrectFlags(correctCount);

  if (errors.length === 0 && (format === "single" || format === "multiple")) {
    const structureResult = validateQuestionStructure({
      format: effectiveFormat,
      options: parsedOptions.map((o) => ({ position: o.position, isCorrect: o.isCorrect })),
    });
    if (!structureResult.ok) {
      errors.push(...structureResult.errors);
    }
  }

  const correct = parsedOptions.filter((o) => o.isCorrect);
  for (const c of correct) {
    const ex = c.explanation?.trim() ?? "";
    if (ex.length < 20) {
      errors.push(
        "Each correct option must include explanation (≥20 chars) describing why it is correct.",
      );
      break;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      stem: (stem as string).trim(),
      format: effectiveFormat,
      domainCode: domainCode as string,
      options: parsedOptions,
    },
  };
}
