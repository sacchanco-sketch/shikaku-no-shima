import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, borderRadius } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import type { QuestionField } from "../types/question";
import ProgressRing from "../components/ProgressRing";
import Mascot from "../components/Mascot";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

const ALL_FIELDS: QuestionField[] = ["関係法令", "労働衛生", "労働生理"];
const CELLS_PER_ROW = 6;
const RETRY_TITLE = "間違えた問題の解き直し";

function resultMessage(accuracy: number): string {
  if (accuracy === 1) return "パーフェクト！";
  if (accuracy >= 0.8) return "よくできました！";
  if (accuracy >= 0.5) return "あと一歩！";
  return "次はもっといけるはず";
}

export default function ResultScreen({ navigation, route }: Props) {
  const { field, reviewIds, questionIds, title, fromExam, setRecords } = route.params;
  const isFixedList = !!questionIds && questionIds.length > 0;

  const total = setRecords.length;
  const correctCount = setRecords.filter((r) => r.correct).length;
  const accuracy = total > 0 ? correctCount / total : 0;
  // 今回の出題で不正解だった問題(出題順)
  const incorrectIds = setRecords.filter((r) => !r.correct).map((r) => r.questionId);

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
  // 過去問・復習・解き直しのように範囲が問題の組み合わせで決まる場合は、実際に出題された分野だけ
  const visibleFields = isFixedList
    ? byField.filter((f) => f.total > 0)
    : reviewIds && reviewIds.length > 0
      ? byField.filter((f) => f.total > 0)
      : field
        ? byField.filter((f) => f.field === field)
        : byField;

  // 問題番号のセルを1行に6個ずつ並べる(最後の行は空きセルで幅をそろえる)
  const rows: (typeof setRecords)[] = [];
  for (let i = 0; i < setRecords.length; i += CELLS_PER_ROW) {
    rows.push(setRecords.slice(i, i + CELLS_PER_ROW));
  }

  const retryIncorrect = () =>
    navigation.replace("Quiz", {
      // 結果画面から結果画面へ。「もう10問」や「一覧に戻る」の行き先は元の出題のまま引き継ぐ
      field,
      reviewIds,
      fromExam,
      questionIds: incorrectIds,
      title: RETRY_TITLE,
    });

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

        <View>
          <Text style={[styles.sectionTitle, styles.sectionTitleTight]}>問題ごとの結果</Text>
          {/* 凡例。色だけに頼らないよう、丸の中にも ○ / × を添えている */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.cellCorrect]} />
              <Text style={styles.legendText}>正解</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.cellIncorrect]} />
              <Text style={styles.legendText}>不正解</Text>
            </View>
          </View>
          <View style={styles.cellRows}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.cellRow}>
                {Array.from({ length: CELLS_PER_ROW }, (_, col) => {
                  const record = row[col];
                  if (!record) return <View key={col} style={styles.cellSpacer} />;
                  const number = rowIndex * CELLS_PER_ROW + col + 1;
                  return (
                    <View
                      key={col}
                      style={[styles.cell, record.correct ? styles.cellCorrect : styles.cellIncorrect]}
                      accessibilityLabel={`${number}問目 ${record.correct ? "正解" : "不正解"}`}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          { color: record.correct ? colors.black : colors.white },
                        ]}
                      >
                        {number}
                      </Text>
                      <Text
                        style={[
                          styles.cellMark,
                          { color: record.correct ? colors.black : colors.white },
                        ]}
                      >
                        {record.correct ? "○" : "×"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomArea}>
          {incorrectIds.length > 0 ? (
            <TouchableOpacity style={styles.retryButton} onPress={retryIncorrect}>
              <Text style={styles.retryButtonText}>
                間違えた問題だけ解き直す({incorrectIds.length}問)
              </Text>
              <View style={styles.retryArrow}>
                <Text style={styles.retryArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.allCorrectText}>全問正解です</Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.popTo("Home", { tab: "home", nonce: Date.now() })}
            >
              <Text style={styles.secondaryButtonText}>ホームに戻る</Text>
            </TouchableOpacity>
            {fromExam ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  navigation.popTo("Home", { tab: "exams", examKey: null, nonce: Date.now() })
                }
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_SIZE = 40;

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
  cellRows: {
    gap: 8,
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cellSpacer: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  // 正解: ライムの塗り+黒い数字 / 不正解: 黒の塗り+白い数字
  cellCorrect: {
    backgroundColor: colors.neonLime,
  },
  cellIncorrect: {
    backgroundColor: colors.black,
  },
  cellText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "800",
  },
  cellMark: {
    fontSize: 11,
    lineHeight: 12,
    fontWeight: "700",
  },
  sectionTitleTight: {
    marginBottom: 6,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bottomArea: {
    marginTop: "auto",
    gap: 12,
    paddingTop: 8,
  },
  retryButton: {
    backgroundColor: colors.black,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  retryArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
  },
  retryArrowText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },
  allCorrectText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
    textAlign: "center",
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
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
