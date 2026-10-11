import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { EXAMS, FIELDS, getExam, type Exam } from "../lib/exams";
import { loadProgress, summarizeIds, type QuestionRecord } from "../lib/progress";
import PressableScale from "../components/PressableScale";

type Navigation = NativeStackNavigationProp<RootStackParamList, "Home">;

type Props = {
  navigation: Navigation;
  examKey: string | null;
  onSelectExam: (key: string | null) => void;
};

function useRecords(): QuestionRecord[] {
  const [records, setRecords] = useState<QuestionRecord[]>([]);
  // 演習から戻ってくるたびに最新の記録を読み直す
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadProgress().then((p) => {
        if (isActive) setRecords(p.records);
      });
      return () => {
        isActive = false;
      };
    }, [])
  );
  return records;
}

export default function PastExamsTab({ navigation, examKey, onSelectExam }: Props) {
  const records = useRecords();
  const exam = getExam(examKey);

  if (exam) {
    return (
      <ExamDetail
        exam={exam}
        records={records}
        navigation={navigation}
        onBack={() => onSelectExam(null)}
      />
    );
  }
  return <ExamList records={records} onSelectExam={onSelectExam} />;
}

/** 正答率のバー+%(未回答は空のバーと「–」。未回答の問題は正答率に含めない) */
function AccuracyBar({ answered, accuracy }: { answered: number; accuracy: number }) {
  const percent = Math.round(accuracy * 100);
  return (
    <View style={styles.accuracyRow}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${answered > 0 ? percent : 0}%` }]} />
      </View>
      <Text style={styles.accuracyText}>{answered > 0 ? `正答率 ${percent}%` : "正答率 –"}</Text>
    </View>
  );
}

function ExamList({
  records,
  onSelectExam,
}: {
  records: QuestionRecord[];
  onSelectExam: (key: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>過去問</Text>
      <Text style={styles.subtitle}>回を選んで、まるごと解く</Text>

      <View style={styles.list}>
        {EXAMS.map((exam) => {
          const s = summarizeIds(records, exam.questionIds);
          return (
            <PressableScale
              key={exam.key}
              style={styles.card}
              onPress={() => onSelectExam(exam.key)}
              accessibilityLabel={`${exam.label}を開く`}
            >
              <View style={styles.cardInner}>
                <View style={styles.cardMain}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle}>{exam.label}</Text>
                    <Text style={styles.cardCount}>
                      {s.answered}/{exam.questionIds.length}問 解答済み
                    </Text>
                  </View>
                  <AccuracyBar answered={s.answered} accuracy={s.accuracy} />
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ExamDetail({
  exam,
  records,
  navigation,
  onBack,
}: {
  exam: Exam;
  records: QuestionRecord[];
  navigation: Navigation;
  onBack: () => void;
}) {
  const startAll = () =>
    navigation.navigate("Quiz", { questionIds: exam.questionIds, title: exam.label });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="過去問の一覧へ戻る"
      >
        <Text style={styles.backLink}>‹ 過去問</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{exam.label}</Text>

      <TouchableOpacity style={styles.bigButton} onPress={startAll}>
        <Text style={styles.bigButtonText}>{exam.questionIds.length}問をすべて解く</Text>
        <View style={styles.bigButtonArrow}>
          <Text style={styles.bigButtonArrowText}>→</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>分野を選んで解く</Text>
      <View style={styles.list}>
        {FIELDS.map((field) => {
          const ids = exam.idsByField[field];
          const s = summarizeIds(records, ids);
          return (
            <PressableScale
              key={field}
              style={styles.card}
              onPress={() =>
                navigation.navigate("Quiz", { questionIds: ids, title: `${exam.label} ${field}` })
              }
              accessibilityLabel={`${field}を解く`}
            >
              <View style={styles.cardInner}>
                <View style={styles.cardMain}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle}>{field}</Text>
                    <Text style={styles.cardCount}>
                      {ids.length}問・{s.answered}問 解答済み
                    </Text>
                  </View>
                  <AccuracyBar answered={s.answered} accuracy={s.accuracy} />
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.black,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  backLink: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
    marginTop: 24,
  },
  list: {
    gap: 10,
    marginTop: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
    borderRadius: 16,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
  },
  cardMain: {
    flex: 1,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    flexWrap: "wrap",
    columnGap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
  },
  cardCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 9,
    backgroundColor: colors.lightBorder,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 9,
    backgroundColor: colors.black,
  },
  accuracyText: {
    fontSize: 11,
    color: colors.textSecondary,
    minWidth: 66,
    textAlign: "right",
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  bigButton: {
    marginTop: 20,
    backgroundColor: colors.black,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bigButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },
  bigButtonArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
  },
  bigButtonArrowText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },
});
