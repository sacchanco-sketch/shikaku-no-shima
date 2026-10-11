import type { QuestionField } from "../types/question";

/** 1セット(10問/30問)の中で、1問答えるたびに積み上げていく簡易記録。ResultScreenの集計に使う。 */
export type SetAnswerRecord = {
  questionId: string;
  field: QuestionField;
  correct: boolean;
};

/** 下のタブバーで切り替える3つのタブ */
export type TabKey = "home" | "exams" | "stats";

/** 出題の指定。QuizScreen が受け取り、ResultScreen が「もう10問」「一覧に戻る」のために保持する */
export type QuizScope = {
  // field: 分野を絞る場合に指定。reviewIds: 指定した問題IDの中からランダムに最大10問出題する場合に指定(苦手問題の復習用)。
  // 両方指定された場合は reviewIds を優先する。
  field?: QuestionField;
  reviewIds?: string[];
  // 過去問: 出題する問題IDを「出題したい順」に並べて渡す(ランダムにしない)。title は画面見出し。
  // questionIds が無ければ従来どおり(ランダム10問)。
  questionIds?: string[];
  title?: string;
  // 過去問タブから始めた出題。結果画面で「もう10問」の代わりに「一覧に戻る」を出す。
  // 結果画面から始める「間違えた問題の解き直し」にも引き継ぐ。
  fromExam?: boolean;
};

export type RootStackParamList = {
  // tab: 開くタブ。examKey: 過去問タブで開く回("2026-04"形式)。null/省略なら一覧。nonce: 同じ指定でも再反映させるための値
  Home: { tab?: TabKey; examKey?: string | null; nonce?: number } | undefined;
  Quiz: QuizScope;
  Result: QuizScope & { setRecords: SetAnswerRecord[] };
  // 購入画面(下から出るシート)
  Purchase: undefined;
};
