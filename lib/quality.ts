import type { Draft, QualityReport } from "./types";

const BANNED = [
  "revolutionize", "revolutionise", "cutting-edge", "cutting edge", "game-changer", "game changer",
  "leading provider", "seamless", "synergy", "leverage", "unlock", "empower", "best-in-class",
  "hope this finds you well", "hope you're well", "just following up", "quick question",
  "i came across", "i noticed", "touch base", "circle back", "ai-powered", "digital transformation",
  "i'd love to", "according to linkedin", "our data shows",
];

function syllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Strip greeting and sign-off lines so we measure the message itself. */
function coreBody(body: string) {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length && /^(hi|hey|hello|dear)\b/i.test(lines[0])) lines.shift();
  if (lines.length && lines[lines.length - 1].split(/\s+/).length <= 3) lines.pop();
  return lines.join(" ");
}

export function checkDraft(
  draft: Draft,
  opts: { maxWords: number; allowedSources: string[]; neverSay: string[] }
): QualityReport {
  const text = coreBody(draft.body);
  const words = text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) || []).length);
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const grade = words.length ? 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59 : 0;
  const lower = (draft.subject + " " + draft.body).toLowerCase();
  const bannedFound = [...BANNED, ...opts.neverSay.map((s) => s.toLowerCase())].filter((b) => lower.includes(b));
  const youCount = (text.match(/\b(you|your|you're|yours)\b/gi) || []).length;
  const iCount = (text.match(/\b(i|i'm|i've|we|we're|our|us|my)\b/gi) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const unsupportedClaims = draft.claims
    .filter((c) => !opts.allowedSources.includes(c.source_id) || !draft.body.includes(c.text))
    .map((c) => c.text);
  const hasDash = /[—–]| - /.test(draft.body);

  const issues: string[] = [];
  if (words.length > opts.maxWords) issues.push(`Too long: ${words.length} words (max ${opts.maxWords})`);
  if (grade > 8) issues.push(`Reading grade ${grade.toFixed(1)} is too high (aim for 6 or below)`);
  if (questions === 0) issues.push("No question for the reader to answer");
  if (bannedFound.length) issues.push(`Banned phrases: ${bannedFound.join(", ")}`);
  if (unsupportedClaims.length) issues.push(`Claims without a valid source: ${unsupportedClaims.join("; ")}`);
  if (hasDash) issues.push("Contains a dash");
  if (iCount > youCount + 1) issues.push("More about us than about them");

  const hard = words.length > opts.maxWords + 8 || bannedFound.length > 0 || unsupportedClaims.length > 0 || hasDash;
  let score = 100;
  score -= Math.max(0, words.length - opts.maxWords) * 2;
  score -= Math.max(0, grade - 6) * 5;
  score -= questions === 0 ? 15 : 0;
  score -= bannedFound.length * 15;
  score -= unsupportedClaims.length * 20;
  score -= hasDash ? 5 : 0;
  score -= iCount > youCount + 1 ? 8 : 0;

  return {
    words: words.length,
    sentences,
    grade: Math.round(grade * 10) / 10,
    questions,
    youCount,
    iCount,
    bannedFound,
    unsupportedClaims,
    maxWords: opts.maxWords,
    score: Math.max(0, Math.min(100, Math.round(score))),
    passes: !hard,
    issues,
  };
}
