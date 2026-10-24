import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import {
  getDailyCounts,
  loadProgress,
  summarize,
  type DailyCount,
  type OverallStats,
} from "../lib/progress";
import ProgressRing from "../components/ProgressRing";
import DailyBarChart from "../components/DailyBarChart";
import { LockIcon } from "../components/Icons";
import { setPremiumForDev, useDevOverride, useEntitlement } from "../lib/entitlements";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

export default function StatsTab({ navigation }: Props) {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [daily, setDaily] = useState<DailyCount[]>([]);
  const { isPremium } = useEntitlement();
  const devOverride = useDevOverride();

  // 演習から戻ってくるたびに最新の記録を読み直す
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadProgress().then((progress) => {
        if (!isActive) return;
        setStats(summarize(progress));
        setDaily(getDailyCounts(progress.records, 7));
      });
      return () => {
        isActive = false;
      };
    }, [])
  );

  const hasRecords = (stats?.total ?? 0) > 0;
  const incorrectIds = stats?.latestIncorrectQuestionIds ?? [];
  const hasIncorrect = incorrectIds.length > 0;
  // 「間違えた問題を解く」は有料の機能。無料のときは鍵を付け、押すと購入画面を開く
  const canReview = isPremium ? hasIncorrect : true;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>成績</Text>

        {!stats ? null : !hasRecords ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>まだ記録がありません。1問解いてみましょう。</Text>
          </View>
        ) : (
          <>
            <View style={styles.overall}>
              <Text style={styles.overallLabel}>全体の正答率</Text>
              <View style={styles.overallNumberRow}>
                <View>
                  <View style={styles.overallUnderline} />
                  <Text style={styles.overallNumber}>{Math.round(stats.accuracy * 100)}</Text>
                </View>
                <Text style={styles.overallUnit}>%</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statCaption}>解答した問題数</Text>
                <Text style={styles.statValue}>
                  {stats.total}
                  <Text style={styles.statUnit}> 問</Text>
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCaption}>連続学習日数</Text>
                <Text style={styles.statValue}>
                  {stats.streakDays}
                  <Text style={styles.statUnit}> 日</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>分野別の正答率</Text>
            <View style={styles.ringsRow}>
              {stats.byField.map((f) => (
                <ProgressRing
                  key={f.field}
                  size={72}
                  progress={f.accuracy}
                  color={colors.black}
                  label={f.field}
                  attempted={f.total > 0}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>直近7日の解答数</Text>
            <DailyBarChart days={daily} />
          </>
        )}

        {/* 開発用: 本番ビルドには出さない */}
        {__DEV__ && (
          <TouchableOpacity
            // 本物の購入状態に従う → 有料に固定 → 無料に固定 → 本物に従う … と切り替える
            onPress={() => setPremiumForDev(devOverride === null ? true : devOverride ? false : null)}
            style={styles.devToggle}
            accessibilityRole="button"
          >
            <Text style={styles.devToggleText}>
              開発用: {devOverride === null ? `本物の購入状態に従う(現在: ${isPremium ? "有料" : "無料"})` : devOverride ? "有料に固定" : "無料に固定"} ・ タップで切り替え
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isPremium && !hasIncorrect && stats && (
          <Text style={styles.noIncorrectText}>間違えた問題はありません</Text>
        )}
        <TouchableOpacity
          style={[styles.reviewButton, !canReview && styles.reviewButtonDisabled]}
          disabled={!canReview}
          onPress={() =>
            isPremium ? navigation.navigate("Quiz", { reviewIds: incorrectIds }) : navigation.navigate("Purchase")
          }
          accessibilityState={{ disabled: !canReview }}
        >
          <Text style={styles.reviewButtonText}>
            {isPremium && hasIncorrect
              ? `間違えた問題を解く(${incorrectIds.length}問)`
              : "間違えた問題を解く"}
          </Text>
          <View style={styles.reviewArrow}>
            {isPremium ? (
              <Text style={styles.reviewArrowText}>→</Text>
            ) : (
              <LockIcon size={16} color={colors.black} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    // 一番下までスクロールしたとき、最後の要素が下のボタンに詰まって見えないように余白を取る
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.black,
  },
  emptyCard: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    color: colors.black,
    lineHeight: 22,
  },
  overall: {
    marginTop: 16,
  },
  overallLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  overallNumberRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  overallUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    height: 24,
    backgroundColor: colors.neonLime,
  },
  overallNumber: {
    fontSize: 80,
    lineHeight: 88,
    fontWeight: "900",
    letterSpacing: -3,
    color: colors.black,
  },
  overallUnit: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.black,
    marginLeft: 4,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
    borderRadius: 16,
    padding: 12,
  },
  statCaption: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.black,
    marginTop: 2,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
    marginTop: 24,
    marginBottom: 12,
  },
  ringsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  devToggle: {
    marginTop: 28,
    alignSelf: "center",
    paddingVertical: 6,
  },
  devToggleText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
    backgroundColor: colors.white,
    gap: 8,
  },
  noIncorrectText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  reviewButton: {
    backgroundColor: colors.black,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewButtonDisabled: {
    opacity: 0.35,
  },
  reviewButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  reviewArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewArrowText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },
});
