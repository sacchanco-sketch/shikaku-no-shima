import { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, borderRadius } from "../theme";
import { loadProgress, summarize, type OverallStats } from "../lib/progress";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Progress">;

function formatPercent(accuracy: number): string {
  return `${Math.round(accuracy * 100)}%`;
}

export default function ProgressScreen({ navigation }: Props) {
  const [stats, setStats] = useState<OverallStats | null>(null);

  // ホーム/演習画面から戻ってくるたびに最新の記録を読み直す
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadProgress().then((progress) => {
        if (isActive) setStats(summarize(progress));
      });
      return () => {
        isActive = false;
      };
    }, [])
  );

  const hasIncorrect = (stats?.recentIncorrectQuestionIds.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← ホームへ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>成績</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!stats || stats.total === 0 ? (
          <View style={[styles.card, styles.outlineCard]}>
            <Text style={styles.cardDescription}>
              まだ演習記録がありません。問題を解くとここに成績が表示されます。
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, styles.limeCard]}>
              <Text style={styles.cardLabel}>総合正答率</Text>
              <Text style={styles.bigNumber}>{formatPercent(stats.accuracy)}</Text>
              <Text style={styles.cardDescription}>
                {stats.total}問中 {stats.correct}問正解
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>分野別の正答率</Text>
              <View style={styles.fieldList}>
                {stats.byField.map((f) => (
                  <View key={f.field} style={[styles.card, styles.outlineCard, styles.fieldRow]}>
                    <View style={styles.fieldRowHeader}>
                      <Text style={styles.fieldName}>{f.field}</Text>
                      <Text style={styles.fieldAccuracy}>
                        {f.total > 0 ? formatPercent(f.accuracy) : "-"}
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.round(f.accuracy * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.fieldCount}>
                      {f.total > 0 ? `${f.total}問中 ${f.correct}問正解` : "未挑戦"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.card, styles.lavenderCard]}>
              <Text style={styles.cardLabel}>苦手問題</Text>
              <Text style={styles.cardDescription}>
                {hasIncorrect
                  ? `直近で間違えた問題が ${stats.recentIncorrectQuestionIds.length} 問あります。`
                  : "直近で間違えた問題はありません。"}
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, !hasIncorrect && styles.primaryButtonDisabled]}
                disabled={!hasIncorrect}
                onPress={() =>
                  navigation.navigate("Quiz", { reviewIds: stats.recentIncorrectQuestionIds })
                }
              >
                <Text style={styles.primaryButtonText}>苦手問題を復習する</Text>
              </TouchableOpacity>
            </View>
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
    gap: 20,
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
  },
  lavenderCard: {
    backgroundColor: colors.lavender,
  },
  outlineCard: {
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 8,
    letterSpacing: 1,
    opacity: 0.6,
  },
  cardDescription: {
    fontSize: 15,
    color: colors.black,
    lineHeight: 21,
  },
  bigNumber: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 4,
  },
  fieldList: {
    gap: 10,
  },
  fieldRow: {
    padding: 16,
  },
  fieldRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  fieldAccuracy: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightBorder,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.vividBlue,
    borderRadius: 4,
  },
  fieldCount: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: colors.black,
    borderRadius: borderRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
