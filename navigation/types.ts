import type { QuestionField } from "../types/question";

/** 1セット(10問)の中で、1問答えるたびに積み上げていく簡易記録。ResultScreenの集計に使う。 */
export type SetAnswerRecord = {
  field: QuestionField;
  correct: boolean;
};

export type RootStackParamList = {
  Home: undefined;
  // field: 分野を絞る場合に指定。reviewIds: 指定した問題IDの中からランダム出題する場合に指定(苦手問題の復習用)。
  // 両方指定された場合は reviewIds を優先する。
  Quiz: { field?: QuestionField; reviewIds?: string[] };
  Progress: undefined;
  // 10問セット終了後の結果画面。field/reviewIdsは「もう10問解く」で同じ出題範囲を引き継ぐために保持する。
  Result: {
    field?: QuestionField;
    reviewIds?: string[];
    setRecords: SetAnswerRecord[];
  };
};
