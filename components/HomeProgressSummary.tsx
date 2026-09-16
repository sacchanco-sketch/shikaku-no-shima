import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, borderRadius } from "../theme";
import { loadProgress, summarize, type OverallStats } from "../lib/progress";
import type { QuestionField } from "../types/question";

// 分野選択カード(HomeScreen)と同じ色分けに合わせている
const FIELD_COLORS: Record<QuestionField, string> = {
  関係法令: colors.lavender,
  労働衛生: colors.neonLime,
  労働生理: colors.vividBlue,
};

export default function HomeProgressSummary() {
  const [stats, setStats] = useState<OverallStats | null>(null);

  // Quiz画面から戻ってくるたびに最新の記録を読み直す
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

  if (!stats || stats.total === 0) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.emptyText}>今日の1問から始めよう</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.streakText}>
          {stats.streakDays > 0 ? `🔥 連続学習 ${stats.streakDays}日` : "🔥 連続学習を始めよう"}
        </Text>
        <Text style={styles.last7Text}>直近7日 {stats.last7DaysCount}問</Text>
      </View>

      <View style={styles.barsContainer}>
        {stats.byField.map((f) => (
          <View key={f.field} style={styles.barRow}>
            <Text style={styles.barLabel}>{f.field}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.round(f.accuracy * 100)}%`,
                    backgroundColor: FIELD_COLORS[f.field],
                  },
                ]}
              />
            </View>
            <Text style={styles.barPercent}>{f.total > 0 ? `${Math.round(f.accuracy * 100)}%` : "-"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    padding: 20,
    gap: 16,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  last7Text: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  barsContainer: {
    gap: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barLabel: {
    width: 66,
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightBorder,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  barPercent: {
    width: 36,
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
    textAlign: "right",
  },
});
