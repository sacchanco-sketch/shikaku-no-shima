import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuestionField } from "../types/question";

const STORAGE_KEY = "shikaku-no-shima:progress:v1";

export interface QuestionRecord {
  questionId: string;
  field: QuestionField;
  correct: boolean;
  answeredAt: string; // ISO文字列
}

export interface ProgressData {
  records: QuestionRecord[];
}

const EMPTY_PROGRESS: ProgressData = { records: [] };

export async function loadProgress(): Promise<ProgressData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as ProgressData;
    if (!Array.isArray(parsed.records)) return EMPTY_PROGRESS;
    return parsed;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function recordAnswer(record: QuestionRecord): Promise<void> {
  const current = await loadProgress();
  const next: ProgressData = { records: [...current.records, record] };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 端末ストレージへの保存に失敗しても、演習自体は継続できるようにする
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

export interface FieldStats {
  field: QuestionField;
  total: number;
  correct: number;
  accuracy: number; // 0〜1
}

export interface OverallStats {
  total: number;
  correct: number;
  accuracy: number;
  byField: FieldStats[];
  // 直近の解答で不正解だった問題ID一覧（新しい順、重複除去）
  recentIncorrectQuestionIds: string[];
}

const ALL_FIELDS: QuestionField[] = ["関係法令", "労働衛生", "労働生理"];

export function summarize(progress: ProgressData): OverallStats {
  const { records } = progress;

  const byField: FieldStats[] = ALL_FIELDS.map((field) => {
    const fieldRecords = records.filter((r) => r.field === field);
    const correct = fieldRecords.filter((r) => r.correct).length;
    const total = fieldRecords.length;
    return {
      field,
      total,
      correct,
      accuracy: total > 0 ? correct / total : 0,
    };
  });

  const total = records.length;
  const correct = records.filter((r) => r.correct).length;

  const recentIncorrectQuestionIds: string[] = [];
  const seen = new Set<string>();
  for (let i = records.length - 1; i >= 0; i -= 1) {
    const r = records[i];
    if (!r.correct && !seen.has(r.questionId)) {
      seen.add(r.questionId);
      recentIncorrectQuestionIds.push(r.questionId);
    }
  }

  return {
    total,
    correct,
    accuracy: total > 0 ? correct / total : 0,
    byField,
    recentIncorrectQuestionIds,
  };
}
