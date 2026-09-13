import type { QuestionField } from "../types/question";

export type RootStackParamList = {
  Home: undefined;
  // field: 分野を絞る場合に指定。reviewIds: 指定した問題IDの中からランダム出題する場合に指定(苦手問題の復習用)。
  // 両方指定された場合は reviewIds を優先する。
  Quiz: { field?: QuestionField; reviewIds?: string[] };
  Progress: undefined;
};
