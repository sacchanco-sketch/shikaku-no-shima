/**
 * lib/exams.ts
 *
 * questions.json から、過去問の「回」(year + month)ごとの問題ID一覧を作る。
 * 一覧に必要なのは ID・分野・問題番号だけ。問題文などの本体は、出題時に Supabase から取得する。
 */
import questionsData from "../questions.json";
import type { QuestionField } from "../types/question";

export const FIELDS: QuestionField[] = ["関係法令", "労働衛生", "労働生理"];

interface RawQuestion {
  id: string;
  year: number | string;
  month: number | string;
  field: QuestionField;
  questionNumber: number | string;
}

export interface Exam {
  /** "2026-04" の形式(IDの先頭部分と同じ) */
  key: string;
  year: number;
  month: number;
  /** 例: 2026年4月公表 */
  label: string;
  /** 全問題IDを問題番号順に並べたもの */
  questionIds: string[];
  /** 分野ごとの問題IDを問題番号順に並べたもの */
  idsByField: Record<QuestionField, string[]>;
}

function buildExams(): Exam[] {
  const groups = new Map<string, { year: number; month: number; items: RawQuestion[] }>();
  for (const q of questionsData as RawQuestion[]) {
    const year = Number(q.year);
    const month = Number(q.month);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const group = groups.get(key) ?? { year, month, items: [] };
    group.items.push(q);
    groups.set(key, group);
  }

  const exams: Exam[] = [];
  for (const [key, { year, month, items }] of groups) {
    const sorted = [...items].sort((a, b) => Number(a.questionNumber) - Number(b.questionNumber));
    const idsByField = { 関係法令: [], 労働衛生: [], 労働生理: [] } as Record<QuestionField, string[]>;
    for (const q of sorted) idsByField[q.field].push(q.id);
    exams.push({
      key,
      year,
      month,
      label: `${year}年${month}月公表`,
      questionIds: sorted.map((q) => q.id),
      idsByField,
    });
  }
  // 新しい回が先頭
  return exams.sort((a, b) => b.year - a.year || b.month - a.month);
}

export const EXAMS: Exam[] = buildExams();

export function getExam(key: string | null | undefined): Exam | null {
  return EXAMS.find((e) => e.key === key) ?? null;
}
