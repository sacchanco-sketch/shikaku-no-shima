/**
 * lib/progress.ts
 *
 * 学習記録(解答履歴)の保存・集計。
 *
 * ⚠️ これは端末内(AsyncStorage)保存の一時的な実装です。
 * 将来的にSupabaseのユーザーテーブルに移行予定(ログイン機能の導入後、
 * 端末をまたいだ同期や複数端末での閲覧に対応するため)。
 */
import { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
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

// --- 記録の置き場(アプリ全体で1つ) ------------------------------------------------------------
// 画面ごとにストレージを読み直すのではなく、メモリ上の1つの記録を全画面が見る。
// 解答を記録した瞬間に、ホーム・成績・過去問の数字が同じ値で更新される(画面の戻り方や
// 読み込みのタイミングで、画面同士の数字がずれないようにするため)。ストレージには順番に保存する。

type Store = { data: ProgressData | null; version: number };

let store: Store = { data: null, version: 0 };
let loading: Promise<ProgressData> | null = null;
let writeChain: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function setStore(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function readFromStorage(): Promise<ProgressData> {
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

/** 記録を返す。最初の1回だけストレージから読み、以後はメモリ上の記録を返す */
export async function loadProgress(): Promise<ProgressData> {
  if (store.data) return store.data;
  if (!loading) {
    loading = readFromStorage().then((data) => {
      // 読み込み中に解答が記録されていた場合は、そちらを優先する
      if (!store.data) setStore({ data });
      loading = null;
      return store.data as ProgressData;
    });
  }
  return loading;
}

/** 解答を1件記録する。メモリ上の記録は即座に更新し、ストレージへは順番に保存する */
export async function recordAnswer(record: QuestionRecord): Promise<void> {
  await loadProgress();
  // await のあとの最新の記録に追加する(続けて呼ばれても、取りこぼさない)
  const next: ProgressData = { records: [...(store.data as ProgressData).records, record] };
  setStore({ data: next });
  writeChain = writeChain
    .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)))
    .catch(() => {
      // 端末ストレージへの保存に失敗しても、演習自体は継続できるようにする
    });
  return writeChain;
}

export async function clearProgress(): Promise<void> {
  setStore({ data: EMPTY_PROGRESS });
  writeChain = writeChain.then(() => AsyncStorage.removeItem(STORAGE_KEY)).catch(() => {});
  return writeChain;
}

// アプリが前面に戻ったときは、日付をまたいでいる場合に備えて、表示を計算し直す
AppState.addEventListener("change", (status) => {
  if (status === "active" && store.data) setStore({ version: store.version + 1 });
});

/**
 * 画面から記録を使うためのフック。data は読み込みが終わるまで null。
 * version は、記録が変わっていなくても、前面に戻ったときに変わる(日付に依存する集計の再計算用)。
 */
export function useProgress(): Store {
  const current = useSyncExternalStore(subscribe, () => store);
  useEffect(() => {
    if (!store.data) loadProgress();
  }, []);
  return current;
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
  // 「最新の結果が不正解」の問題ID一覧(新しい順)。同じ問題を何度も解いている場合は最新の1回だけで判定する
  latestIncorrectQuestionIds: string[];
  // 直近7日間(今日を含む暦の7日。成績タブの棒グラフと同じ数え方)に解いた問題数
  last7DaysCount: number;
  // 連続学習日数。今日分がまだ無い場合は「昨日までの連続日数」を返す
  // (その日のうちに演習すれば継続扱いにするため、日をまたぐまではリセットしない)
  streakDays: number;
}

const ALL_FIELDS: QuestionField[] = ["関係法令", "労働衛生", "労働生理"];

/** ローカルタイムゾーンでの日付部分だけを "YYYY-MM-DD" として取り出す */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 解答記録から「演習した日」の集合(YYYY-MM-DD)を作る。マスコットの挨拶判定などで使う。 */
export function getPracticedDateKeys(records: QuestionRecord[]): Set<string> {
  return new Set(records.map((r) => toLocalDateKey(new Date(r.answeredAt))));
}

/**
 * 問題ごとの「最新の解答」。同じ問題を何度解いていても1問につき1件(最後に解いた結果)になる。
 * 返す Map は、最新の解答が古い順に並ぶ(records は時系列で追記されている前提)。
 */
export function getLatestResults(records: QuestionRecord[]): Map<string, QuestionRecord> {
  const latest = new Map<string, QuestionRecord>();
  for (const r of records) {
    latest.delete(r.questionId); // 後から入れ直して、Mapの順序=最新解答の古い順に保つ
    latest.set(r.questionId, r);
  }
  return latest;
}

export interface IdsStats {
  /** 範囲内の問題のうち、1回以上解いた問題数 */
  answered: number;
  correct: number;
  /** 解いた問題だけが対象(未回答は含めない)。最新の結果で判定。0〜1 */
  accuracy: number;
}

/** 指定した問題ID群(過去問の1回分・1分野など)の解答済み数と正答率 */
export function summarizeIds(records: QuestionRecord[], ids: string[]): IdsStats {
  const latest = getLatestResults(records);
  let answered = 0;
  let correct = 0;
  for (const id of ids) {
    const r = latest.get(id);
    if (!r) continue;
    answered += 1;
    if (r.isCorrect) correct += 1;
  }
  return { answered, correct, accuracy: answered > 0 ? correct / answered : 0 };
}

export interface DailyCount {
  dateKey: string;
  /** 曜日(日〜土) */
  weekday: string;
  count: number;
  isToday: boolean;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 今日を含む直近 days 日分の、日ごとの解答数(古い日→今日の順) */
export function getDailyCounts(records: QuestionRecord[], days = 7): DailyCount[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const key = toLocalDateKey(new Date(r.answeredAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const result: DailyCount[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    result.push({ dateKey: key, weekday: WEEKDAYS[d.getDay()], count: counts.get(key) ?? 0, isToday: i === 0 });
  }
  return result;
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

  const latestIncorrectQuestionIds = [...getLatestResults(records).values()]
    .filter((r) => !r.isCorrect)
    .reverse()
    .map((r) => r.questionId);

  // 成績タブの棒グラフ(getDailyCounts)と同じ「今日を含む暦の7日」で数える。ホームと成績で数字がずれないように、
  // 「過去168時間」ではなく、日付(端末のローカル日付)で区切る
  const last7DaysCount = getDailyCounts(records, 7).reduce((sum, d) => sum + d.count, 0);

  return {
    total,
    correct,
    accuracy: total > 0 ? correct / total : 0,
    byField,
    latestIncorrectQuestionIds,
    last7DaysCount,
    streakDays: calculateStreakDays(records),
  };
}
