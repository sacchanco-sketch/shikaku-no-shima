import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "../theme";
import type { TabKey } from "../navigation/types";

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "ホーム" },
  { key: "exams", label: "過去問" },
  { key: "stats", label: "成績" },
];

// @expo/vector-icons はこのプロジェクトに入っていないため、react-native-svg で描いた線画アイコンを使う
function TabIcon({ tab, color }: { tab: TabKey; color: string }) {
  const common = { stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {tab === "home" && <Path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...common} />}
      {tab === "exams" && (
        <>
          <Path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...common} />
          <Path d="M9 13h6M9 17h6" {...common} />
        </>
      )}
      {tab === "stats" && (
        <>
          <Rect x={4} y={12} width={4} height={8} rx={1} {...common} />
          <Rect x={10} y={5} width={4} height={15} rx={1} {...common} />
          <Rect x={16} y={9} width={4} height={11} rx={1} {...common} />
        </>
      )}
    </Svg>
  );
}

type Props = {
  current: TabKey;
  onChange: (tab: TabKey) => void;
};

/** 下のタブバー。選択中は黒の太字とアイコン背面のライムの丸、未選択は補助色 */
export default function TabBar({ current, onChange }: Props) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ key, label }) => {
        const selected = key === current;
        const color = selected ? colors.black : colors.textSecondary;
        return (
          <Pressable
            key={key}
            style={styles.tab}
            onPress={() => onChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <TabIcon tab={key} color={color} />
            </View>
            <Text style={[styles.label, { color }, selected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
    paddingTop: 6,
    paddingBottom: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: colors.neonLime,
  },
  label: {
    fontSize: 10,
  },
  labelSelected: {
    fontWeight: "800",
  },
});
