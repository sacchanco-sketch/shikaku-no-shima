import { useCallback, useEffect, useRef, useState } from "react";
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
import Mascot from "../components/Mascot";

type Props = NativeStackScreenProps<RootStackParamList, "Quiz">;

const OPTION_KEYS: OptionKey[] = ["1", "2", "3", "4", "5"];
const SET_SIZE = 10;
const CELEBRATE_MS = 1500; // 正解時に fistpump を出しておく時間

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
  const questionIds = route.params?.questionIds;
  const title = route.params?.title;
  const fromExam = route.params?.fromExam;
  const isReviewMode = !!reviewIds && reviewIds.length > 0;
  // 過去問など「この問題を、この順番で」と渡された場合。ランダム化も10問への絞り込みもしない
  const isFixedList = !!questionIds && questionIds.length > 0;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [setRecords, setSetRecords] = useState<SetAnswerRecord[]>([]);
  // 画面の隅のマスコット。普段は reading、正解した瞬間だけ短く fistpump に切り替える
  const [celebrating, setCelebrating] = useState(false);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    };
  }, []);

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
    const scoped = isFixedList ? baseQuery.in("id", questionIds) : applyScope(baseQuery, field, reviewIds);
    const { data, error: fetchError } = await scoped;

    if (fetchError || !data || data.length === 0) {
      setError(fetchError?.message ?? "問題が見つかりませんでした。");
      setLoading(false);
      return;
    }

    if (isFixedList) {
      // 渡された順(問題番号順)に並べ直す。取得結果の順序はDB任せなので、IDの並びを正とする
      const order = new Map(questionIds.map((id, i) => [id, i]));
      const sorted = [...(data as Question[])].sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
      );
      setQuestions(sorted);
    } else {
      setQuestions(shuffle(data as Question[]).slice(0, SET_SIZE));
    }
    setLoading(false);
  }, [field, reviewIds, questionIds, isFixedList]);

  useEffect(() => {
    fetchQuestionSet();
  }, [fetchQuestionSet]);

  const isAnswered = selected !== null;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelect = (key: OptionKey) => {
    if (isAnswered || !question) return;
    const correct = key === question.answer;

    setSelected(key);
    setSetRecords((prev) => [...prev, { questionId: question.id, field: question.field, correct }]);
    recordAnswer({
      questionId: question.id,
      field: question.field,
      isCorrect: correct,
      answeredAt: new Date().toISOString(),
    });

    if (correct) {
      setCelebrating(true);
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      celebrateTimer.current = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleNext = () => {
    setCelebrating(false);
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      return;
    }
    navigation.replace("Result", { field, reviewIds, questionIds, title, fromExam, setRecords });
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
        <View style={styles.headerText}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>{fromExam ? "← 過去問へ" : "← ホームへ"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {title ?? (isReviewMode ? "苦手問題の復習" : (field ?? "今日の問題"))}
          </Text>
          {questions.length > 0 && (
            <Text style={styles.headerProgress}>
              {currentIndex + 1}/{questions.length}問目
            </Text>
          )}
        </View>
        {/* 画面の隅に小さく置くマスコット(問題文の上には重ならない) */}
        <Mascot pose={celebrating ? "fistpump" : "reading"} height={84} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.black} />
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
                {question.year}年{question.month}月 過去問　問{question.question_number}
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
    backgroundColor: colors.white,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.lightBorder,
  },
  headerText: {
    flex: 1,
    paddingBottom: 8,
  },
  backLink: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  headerTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "800",
  },
  headerProgress: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: colors.neonLime,
    color: colors.black,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: "hidden",
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
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
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
