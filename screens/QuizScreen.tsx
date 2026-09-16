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
import type { RootStackParamList } from "../navigation/types";
import AnswerOption, { type OptionStatus } from "../components/AnswerOption";

type Props = NativeStackScreenProps<RootStackParamList, "Quiz">;

const OPTION_KEYS: OptionKey[] = ["1", "2", "3", "4", "5"];

// このアプリでは Database 型を生成していないため、フィルタの有無で分岐する
// クエリビルダーの型は any として扱う(内部ヘルパーに閉じているため実用上の影響はない)。
function applyScope(query: any, field?: string, reviewIds?: string[]) {
  if (reviewIds && reviewIds.length > 0) return query.in("id", reviewIds);
  if (field) return query.eq("field", field);
  return query;
}

export default function QuizScreen({ navigation, route }: Props) {
  const field = route.params?.field;
  const reviewIds = route.params?.reviewIds;
  const isReviewMode = !!reviewIds && reviewIds.length > 0;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OptionKey | null>(null);

  const fetchRandomQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setQuestion(null);

    const countBase = supabase.from("questions").select("id", { count: "exact", head: true });
    const { count, error: countError } = await applyScope(countBase, field, reviewIds);

    if (countError || !count) {
      setError(countError?.message ?? "問題が見つかりませんでした。");
      setLoading(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * count);

    const dataBase = supabase.from("questions").select("*").order("id", { ascending: true });
    const { data, error: fetchError } = await applyScope(dataBase, field, reviewIds).range(
      randomIndex,
      randomIndex
    );

    if (fetchError || !data || data.length === 0) {
      setError(fetchError?.message ?? "問題の取得に失敗しました。");
      setLoading(false);
      return;
    }

    setQuestion(data[0] as Question);
    setLoading(false);
  }, [field, reviewIds]);

  useEffect(() => {
    fetchRandomQuestion();
  }, [fetchRandomQuestion]);

  const isAnswered = selected !== null;

  const handleSelect = (key: OptionKey) => {
    if (isAnswered || !question) return;
    const correct = key === question.answer;

    setSelected(key);
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
        <Text style={styles.headerTitle}>
          {isReviewMode ? "苦手問題の復習" : (field ?? "今日の問題")}
        </Text>
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
            <TouchableOpacity style={styles.primaryButton} onPress={fetchRandomQuestion}>
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

                <TouchableOpacity style={styles.primaryButton} onPress={fetchRandomQuestion}>
                  <Text style={styles.primaryButtonText}>次の問題へ</Text>
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
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
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
