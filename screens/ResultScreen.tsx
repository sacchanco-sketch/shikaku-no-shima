import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, borderRadius } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import type { QuestionField } from "../types/question";
import ProgressRing from "../components/ProgressRing";
import Mascot from "../components/Mascot";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

const ALL_FIELDS: QuestionField[] = ["関係法令", "労働衛生", "労働生理"];

function resultMessage(accuracy: number): string {
  if (accuracy === 1) return "パーフェクト！";
  if (accuracy >= 0.8) return "よくできました！";
  if (accuracy >= 0.5) return "あと一歩！";
  return "次はもっといけるはず";
}

export default function ResultScreen({ navigation, route }: Props) {
  const { field, reviewIds, questionIds, title, setRecords } = route.params;
  // 過去問から入った場合(出題数が固定)は「もう10問」の代わりに「一覧に戻る」を出す
  const isFromExam = !!questionIds && questionIds.length > 0;

  const total = setRecords.length;
  const correctCount = setRecords.filter((r) => r.correct).length;
  const accuracy = total > 0 ? correctCount / total : 0;

  const byField = ALL_FIELDS.map((f) => {
    const records = setRecords.filter((r) => r.field === f);
    const correct = records.filter((r) => r.correct).length;
    return {
      field: f,
      total: records.length,
      correct,
      accuracy: records.length > 0 ? correct / records.length : 0,
    };
  });

  // 出題範囲にある分野だけ表示する。分野指定ならその分野、全分野から出したときは3分野すべて、
  // 過去問・復習のように範囲が問題の組み合わせで決まる場合は、実際に出題された分野だけ
  const visibleFields =
    field && !reviewIds && !isFromExam
      ? byField.filter((f) => f.field === field)
      : isFromExam || (reviewIds && reviewIds.length > 0)
        ? byField.filter((f) => f.total > 0)
        : byField;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>今回の結果</Text>
        {title && <Text style={styles.headerSubtitle}>{title}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.limeCard]}>
          <View style={styles.limeCardText}>
            <Text style={styles.cardLabel}>正答率</Text>
            <Text style={styles.bigNumber}>{Math.round(accuracy * 100)}%</Text>
            <Text style={styles.cardDescription}>
              {total}問中 {correctCount}問正解 ・ {resultMessage(accuracy)}
            </Text>
          </View>
          {/* 10問完了のごほうび: 拳を上げるポーズ */}
          <Mascot pose="fistpump" height={120} />
        </View>

        <View>
          <Text style={styles.sectionTitle}>分野別の内訳</Text>
          <View style={styles.ringsRow}>
            {visibleFields.map((f) => (
              <ProgressRing
                key={f.field}
                size={64}
                progress={f.accuracy}
                color={colors.black}
                label={f.field}
                attempted={f.total > 0}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.popTo("Home", { tab: "home", nonce: Date.now() })}
          >
            <Text style={styles.secondaryButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
          {isFromExam ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.popTo("Home", { tab: "exams", examKey: null, nonce: Date.now() })}
            >
              <Text style={styles.primaryButtonText}>一覧に戻る</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.replace("Quiz", { field, reviewIds })}
            >
              <Text style={styles.primaryButtonText}>もう10問解く</Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: colors.black,
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    padding: 20,
    gap: 20,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 10,
  },
  card: {
    borderRadius: borderRadius,
    padding: 20,
  },
  limeCard: {
    backgroundColor: colors.neonLime,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    overflow: "hidden",
    paddingBottom: 0,
  },
  limeCardText: {
    flex: 1,
    paddingBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 4,
    letterSpacing: 1,
    opacity: 0.6,
  },
  bigNumber: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
  },
  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
    borderRadius: borderRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.black,
    borderRadius: borderRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
