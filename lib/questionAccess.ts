/**
 * lib/questionAccess.ts
 *
 * どの問題が無料で、どの問題が有料かを決めるファイル。
 * 有料かどうかの判定そのものは lib/entitlements.ts にある。
 */

/**
 * 無料で解ける回("YYYY-MM" 形式)。「新しい順に上から2回」ではなく、年月を明示する。
 * 新しい回が追加されても、無料の範囲は自動では変わらない(ここを書き換えたときだけ変わる)。
 */
export const FREE_EXAM_KEYS: readonly string[] = ["2026-04", "2025-10"];

/** 年月から回のキー("2026-04" など)を作る */
export function examKeyOf(year: number | string, month: number | string): string {
  return `${Number(year)}-${String(Number(month)).padStart(2, "0")}`;
}

export function isFreeExamKey(examKey: string): boolean {
  return FREE_EXAM_KEYS.includes(examKey);
}

/** 問題が無料の回に属するか(年月で判断する) */
export function isFreeQuestion(question: { year: number | string; month: number | string }): boolean {
  return isFreeExamKey(examKeyOf(question.year, question.month));
}

/** 有料なら全問題、無料なら無料の回の問題だけに絞り込む */
export function filterByEntitlement<T extends { year: number | string; month: number | string }>(
  questions: T[],
  isPremium: boolean
): T[] {
  return isPremium ? questions : questions.filter(isFreeQuestion);
}

/** その回を開けるか(有料なら全回、無料なら無料の回だけ) */
export function canOpenExam(examKey: string, isPremium: boolean): boolean {
  return isPremium || isFreeExamKey(examKey);
}
