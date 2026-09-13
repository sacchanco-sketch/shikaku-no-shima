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
import { supabase } from "../lib/supabase";
import { colors, borderRadius } from "../theme";
import type { OptionKey, Question } from "../types/question";

type Props = {
  onBack: () => void;
};

const OPTION_KEYS: OptionKey[] = ["1", "2", "3", "4", "5"];

// theme.ts にはまだ正誤表示用の色が定義されていないため、暫定でここに置く。
// theme.ts が正式に色を決めたら移動する。
const INCORRECT_BG = "#FFE1E1";
const INCORRECT_BORDER = "#FF6B6B";

export default function QuizScreen({ onBack }: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OptionKey | null>(null);

  const fetchRandomQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setQuestion(null);

    const { count, error: countError } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true });

    if (countError || !count) {
      setError(countError?.message ?? "問題が見つかりませんでした。");
      setLoading(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * count);

    const { data, error: fetchError } = await supabase
      .from("questions")
      .select("*")
      .order("id", { ascending: true })
      .range(randomIndex, randomIndex);

    if (fetchError || !data || data.length === 0) {
      setError(fetchError?.message ?? "問題の取得に失敗しました。");
      setLoading(false);
      return;
    }

    setQuestion(data[0] as Question);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRandomQuestion();
  }, [fetchRandomQuestion]);

  const isAnswered = selected !== null;

  const getOptionStyle = (key: OptionKey) => {
    if (!isAnswered || !question) return styles.optionButton;
    if (key === question.answer) {
      return [styles.optionButton, styles.optionCorrect];
    }
    if (key === selected) {
      return [styles.optionButton, styles.optionIncorrect];
    }
    return [styles.optionButton, styles.optionDisabled];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backLink}>← ホームへ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>今日の問題</Text>
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
                <TouchableOpacity
                  key={key}
                  style={getOptionStyle(key)}
                  disabled={isAnswered}
                  onPress={() => setSelected(key)}
                >
                  <Text style={styles.optionNumber}>{key}</Text>
                  <Text style={styles.optionText}>{question.options[key]}</Text>
                </TouchableOpacity>
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
  optionButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: borderRadius,
    padding: 16,
  },
  optionNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
    width: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
    lineHeight: 21,
  },
  optionCorrect: {
    backgroundColor: colors.neonLime,
    borderColor: colors.neonLime,
  },
  optionIncorrect: {
    backgroundColor: INCORRECT_BG,
    borderColor: INCORRECT_BORDER,
  },
  optionDisabled: {
    opacity: 0.5,
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
