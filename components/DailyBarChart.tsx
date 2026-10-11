import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import type { DailyCount } from "../lib/progress";

const BAR_AREA_HEIGHT = 96;

type Props = {
  days: DailyCount[];
};

/** 直近7日の日ごとの解答数。黒の棒、今日だけライム。0問の日は細い線だけ出す */
export default function DailyBarChart({ days }: Props) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <View style={styles.row}>
      {days.map((d) => {
        const height = d.count === 0 ? 3 : Math.max(6, Math.round((d.count / max) * BAR_AREA_HEIGHT));
        return (
          <View key={d.dateKey} style={styles.column}>
            {/* 0問の日は数字を出さない(高さは保つので棒の位置はそろう) */}
            <Text style={[styles.count, d.count === 0 && styles.countHidden]}>{d.count}</Text>
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  { height },
                  d.isToday ? styles.barToday : d.count === 0 ? styles.barEmpty : styles.barNormal,
                ]}
              />
            </View>
            <Text style={[styles.weekday, d.isToday && styles.weekdayToday]}>
              {d.isToday ? "今日" : d.weekday}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  count: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
  },
  countHidden: {
    opacity: 0,
  },
  barArea: {
    height: BAR_AREA_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "70%",
    borderRadius: 6,
  },
  barNormal: {
    backgroundColor: colors.black,
  },
  barToday: {
    backgroundColor: colors.neonLime,
  },
  barEmpty: {
    backgroundColor: colors.lightBorder,
  },
  weekday: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  weekdayToday: {
    color: colors.black,
    fontWeight: "800",
  },
});
