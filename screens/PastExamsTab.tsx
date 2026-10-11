import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { EXAMS, FIELDS, getExam, type Exam } from "../lib/exams";
import { loadProgress, summarizeIds, type QuestionRecord } from "../lib/progress";
import ExamProgressCard from "../components/ExamProgressCard";
import { useEntitlement } from "../lib/entitlements";
import { canOpenExam } from "../lib/questionAccess";

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
  const { isPremium } = useEntitlement();
  const exam = getExam(examKey);

  // 有料の回の詳細は、購入済みでなければ開けない(一覧に戻す)
  if (exam && canOpenExam(exam.key, isPremium)) {
    return (
      <ExamDetail
        exam={exam}
        records={records}
        navigation={navigation}
        onBack={() => onSelectExam(null)}
      />
    );
  }
  return (
    <ExamList
      records={records}
      isPremium={isPremium}
      onSelectExam={onSelectExam}
      onLocked={() => navigation.navigate("Purchase")}
    />
  );
}

function ExamList({
  records,
  isPremium,
  onSelectExam,
  onLocked,
}: {
  records: QuestionRecord[];
  isPremium: boolean;
  onSelectExam: (key: string) => void;
  onLocked: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>過去問</Text>
      <Text style={styles.subtitle}>回を選んで、まるごと解く</Text>

      <View style={styles.list}>
        {EXAMS.map((exam) => {
          const s = summarizeIds(records, exam.questionIds);
          const locked = !canOpenExam(exam.key, isPremium);
          return (
            <ExamProgressCard
              key={exam.key}
              title={exam.label}
              answered={s.answered}
              total={exam.questionIds.length}
              accuracy={s.accuracy}
              locked={locked}
              onPress={() => (locked ? onLocked() : onSelectExam(exam.key))}
              accessibilityLabel={locked ? `${exam.label}(有料)` : `${exam.label}を開く`}
            />
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
    navigation.navigate("Quiz", { questionIds: exam.questionIds, title: exam.label, fromExam: true });

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
            <ExamProgressCard
              key={field}
              title={field}
              answered={s.answered}
              total={ids.length}
              accuracy={s.accuracy}
              onPress={() =>
                navigation.navigate("Quiz", {
                  questionIds: ids,
                  title: `${exam.label} ${field}`,
                  fromExam: true,
                })
              }
              accessibilityLabel={`${field}を解く`}
            />
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
    // 一番下までスクロールしたとき、最後の行がタブバーに詰まって見えないように余白を取る
    paddingBottom: 40,
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
