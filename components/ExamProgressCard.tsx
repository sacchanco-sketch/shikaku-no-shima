import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../theme";
import PressableScale from "./PressableScale";

type Props = {
  title: string;
  /** 解答済み(1回以上解いた)の問題数 */
  answered: number;
  /** 出題数(回なら30、分野なら10) */
  total: number;
  /** 解いた問題だけの正答率(0〜1)。未回答の問題は含めない */
  accuracy: number;
  onPress: () => void;
  accessibilityLabel: string;
};

/**
 * 過去問の「回」や「分野」の行。
 * バー=進み具合(解答済み÷出題数)、正答率=文字だけ、未着手は「未着手」とだけ出す。
 * 全問解いたら、右端のシェブロンの代わりにライムの丸+チェック。
 */
export default function ExamProgressCard({
  title,
  answered,
  total,
  accuracy,
  onPress,
  accessibilityLabel,
}: Props) {
  const notStarted = answered === 0;
  const completed = answered >= total;

  return (
    <PressableScale style={styles.card} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <View style={styles.inner}>
        <View style={styles.main}>
          <View style={styles.topRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.status}>
              <Text style={styles.statusText}>
                {notStarted ? "未着手" : `${answered}/${total}問 解答済み`}
              </Text>
              {!notStarted && (
                <Text style={styles.statusText}>正答率 {Math.round(accuracy * 100)}%</Text>
              )}
            </View>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.min(100, (answered / total) * 100)}%` }]} />
          </View>
        </View>
        {completed ? (
          <View style={styles.check}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke={colors.black}
                strokeWidth={3.2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
    borderRadius: 16,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
  },
  main: {
    flex: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
  },
  status: {
    alignItems: "flex-end",
    gap: 1,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  barTrack: {
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
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    width: 24,
    textAlign: "center",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
  },
});
