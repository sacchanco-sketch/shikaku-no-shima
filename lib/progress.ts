/**
 * lib/progress.ts
 *
 * 学習記録(解答履歴)の保存・集計。
 *
 * ⚠️ これは端末内(AsyncStorage)保存の一時的な実装です。
 * 将来的にSupabaseのユーザーテーブルに移行予定(ログイン機能の導入後、
 * 端末をまたいだ同期や複数端末での閲覧に対応するため)。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuestionField } from "../types/question";

const STORAGE_KEY = "shikaku-no-shima:progress:v2";

export interface QuestionRecord {
  questionId: string;
  field: QuestionField;
  isCorrect: boolean;
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
  // 直近の解答で不正解だった問題ID一覧(新しい順、重複除去)
  recentIncorrectQuestionIds: string[];
  // 直近7日間(過去168時間)に解いた問題数
  last7DaysCount: number;
  // 連続学習日数。今日分がまだ無い場合は「昨日までの連続日数」を返す
  // (その日のうちに演習すれば継続扱いにするため、日をまたぐまではリセットしない)
  streakDays: number;
}

const ALL_FIELDS: QuestionField[] = ["関係法令", "労働衛生", "労働生理"];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** ローカルタイムゾーンでの日付部分だけを "YYYY-MM-DD" として取り出す */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calculateStreakDays(records: QuestionRecord[]): number {
  if (records.length === 0) return 0;

  const practicedDays = new Set(records.map((r) => toLocalDateKey(new Date(r.answeredAt))));

  const cursor = new Date();
  // 今日まだ演習していない場合は、streakが今日の時点で「まだ途切れていない」とみなし
  // 昨日を起点にカウントする(日付が変わって初めてリセット扱いにする)。
  if (!practicedDays.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (practicedDays.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function summarize(progress: ProgressData): OverallStats {
  const { records } = progress;

  const byField: FieldStats[] = ALL_FIELDS.map((field) => {
    const fieldRecords = records.filter((r) => r.field === field);
    const correct = fieldRecords.filter((r) => r.isCorrect).length;
    const total = fieldRecords.length;
    return {
      field,
      total,
      correct,
      accuracy: total > 0 ? correct / total : 0,
    };
  });

  const total = records.length;
  const correct = records.filter((r) => r.isCorrect).length;

  const recentIncorrectQuestionIds: string[] = [];
  const seen = new Set<string>();
  for (let i = records.length - 1; i >= 0; i -= 1) {
    const r = records[i];
    if (!r.isCorrect && !seen.has(r.questionId)) {
      seen.add(r.questionId);
      recentIncorrectQuestionIds.push(r.questionId);
    }
  }

  const now = Date.now();
  const last7DaysCount = records.filter(
    (r) => now - new Date(r.answeredAt).getTime() <= SEVEN_DAYS_MS
  ).length;

  return {
    total,
    correct,
    accuracy: total > 0 ? correct / total : 0,
    byField,
    recentIncorrectQuestionIds,
    last7DaysCount,
    streakDays: calculateStreakDays(records),
  };
}
