export type QuestionField = "関係法令" | "労働衛生" | "労働生理";

export type OptionKey = "1" | "2" | "3" | "4" | "5";

export interface Question {
  id: string;
  year: number;
  month: number;
  exam_label: string;
  field: QuestionField;
  question_number: number;
  question_text: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string | null;
  key_point: string | null;
  created_at: string;
}
