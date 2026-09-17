import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { recordAnswer } from "../lib/progress";
import { colors, borderRadius } from "../theme";
import type { OptionKey, Question } from "../types/question";
import type { RootStackParamList, SetAnswerRecord } from "../navigation/types";
import AnswerOption, { type OptionStatus } from "../components/AnswerOption";

type Props = NativeStackScreenProps<RootStackParamList, "Quiz">;

const OPTION_KEYS: OptionKey[] = ["1", "2", "3", "4", "5"];
const SET_SIZE = 10;

// このアプリでは Database 型を生成していないため、フィルタの有無で分岐する
// クエリビルダーの型は any として扱う(内部ヘルパーに閉じているため実用上の影響はない)。
function applyScope(query: any, field?: string, reviewIds?: string[]) {
  if (reviewIds && reviewIds.length > 0) return query.in("id", reviewIds);
  if (field) return query.eq("field", field);
  return query;
}

/** Fisher-Yatesシャッフル(元配列は破壊しない) */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizScreen({ navigation, route }: Props) {
  const field = route.params?.field;
  const reviewIds = route.params?.reviewIds;
  const isReviewMode = !!reviewIds && reviewIds.length > 0;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [setRecords, setSetRecords] = useState<SetAnswerRecord[]>([]);

  const question = questions[currentIndex] ?? null;

  const fetchQuestionSet = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelected(null);
    setSetRecords([]);

    // このアプリの問題数(最大330件)は小さいため、対象範囲を一括取得してから
    // クライアント側でシャッフル・10件抽出する(往復回数を抑えるため)。
    const baseQuery = supabase.from("questions").select("*");
    const { data, error: fetchError } = await applyScope(baseQuery, field, reviewIds);

    if (fetchError || !data || data.length === 0) {
      setError(fetchError?.message ?? "問題が見つかりませんでした。");
      setLoading(false);
      return;
    }

    const picked = shuffle(data as Question[]).slice(0, SET_SIZE);
    setQuestions(picked);
    setLoading(false);
  }, [field, reviewIds]);

  useEffect(() => {
    fetchQuestionSet();
  }, [fetchQuestionSet]);

  const isAnswered = selected !== null;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelect = (key: OptionKey) => {
    if (isAnswered || !question) return;
    const correct = key === question.answer;

    setSelected(key);
    setSetRecords((prev) => [...prev, { field: question.field, correct }]);
    recordAnswer({
      questionId: question.id,
      field: question.field,
      isCorrect: correct,
      answeredAt: new Date().toISOString(),
    });

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      return;
    }
    navigation.replace("Result", { field, reviewIds, setRecords });
  };

  const getOptionStatus = (key: OptionKey): OptionStatus => {
    if (!isAnswered || !question) return "idle";
    if (key === question.answer) return "correct";
    if (key === selected) return "incorrect";
    return "muted";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← ホームへ</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {isReviewMode ? "苦手問題の復習" : (field ?? "今日の問題")}
          </Text>
          {questions.length > 0 && (
            <Text style={styles.headerProgress}>
              {currentIndex + 1}/{questions.length}問目
            </Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.vividBlue} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={fetchQuestionSet}>
              <Text style={styles.primaryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && question && (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{question.field}</Text>
              <Text style={styles.metaText}>
                {question.exam_label}　問{question.question_number}
              </Text>
            </View>

            <Text style={styles.questionText}>{question.question_text}</Text>

            <View style={styles.optionsContainer}>
              {OPTION_KEYS.map((key) => (
                <AnswerOption
                  key={key}
                  label={key}
                  text={question.options[key]}
                  status={getOptionStatus(key)}
                  disabled={isAnswered}
                  onPress={() => handleSelect(key)}
                />
              ))}
            </View>

            {isAnswered && (
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>
                  {selected === question.answer ? "◎ 正解！" : "✕ 不正解"}
                </Text>
                {question.key_point && <Text style={styles.keyPoint}>{question.key_point}</Text>}
                {question.explanation && (
                  <Text style={styles.explanation}>{question.explanation}</Text>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                  <Text style={styles.primaryButtonText}>
                    {isLastQuestion ? "結果を見る" : "次の問題へ"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.vividBlue,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: borderRadius,
    borderBottomRightRadius: borderRadius,
  },
  backLink: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
  headerProgress: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.9,
  },
  content: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    color: colors.black,
    fontSize: 15,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  questionText: {
    fontSize: 17,
    color: colors.black,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: colors.lavender,
    borderRadius: borderRadius,
    padding: 20,
    gap: 10,
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
  },
  keyPoint: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
  },
  explanation: {
    fontSize: 14,
    color: colors.black,
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.black,
    borderRadius: borderRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
