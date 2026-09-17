import { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, borderRadius } from "../theme";
import { loadProgress, summarize, type OverallStats } from "../lib/progress";
import type { QuestionField } from "../types/question";
import ProgressRing from "./ProgressRing";
import TurtleIcon from "./TurtleIcon";

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

  const showEmpty = !stats || stats.total === 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>学習の記録</Text>
        <TurtleIcon size={28} />
      </View>

      {showEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>今日の1問から始めよう</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>🔥 連続学習</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statNumber}>{stats.streakDays}</Text>
                <Text style={styles.statUnit}>日</Text>
              </View>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>直近7日</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statNumber}>{stats.last7DaysCount}</Text>
                <Text style={styles.statUnit}>問</Text>
              </View>
            </View>
          </View>

          <View style={styles.ringsRow}>
            {stats.byField.map((f) => (
              <ProgressRing
                key={f.field}
                size={52}
                progress={f.accuracy}
                color={FIELD_COLORS[f.field]}
                label={f.field}
                attempted={f.total > 0}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const CARD_BACKGROUND = "#F3ECFC"; // lavenderの薄い色調

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius,
    backgroundColor: CARD_BACKGROUND,
    padding: 20,
    gap: 18,
    // 軽いドロップシャドウ(iOS/Webはshadow*、Androidはelevationで表現)
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 12px rgba(15, 15, 15, 0.08)",
      },
      default: {
        shadowColor: "#0F0F0F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
    opacity: 0.6,
    letterSpacing: 1,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
  },
  statBlock: {
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
    opacity: 0.7,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    alignSelf: "flex-start",
    backgroundColor: colors.neonLime,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  statNumber: {
    fontSize: 38, // 従来のテキスト(15px)からおおむね2.5倍
    fontWeight: "800",
    color: colors.black,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.black,
    marginLeft: 2,
  },
  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
