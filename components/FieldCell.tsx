import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "../theme";

const PRESS_SCALE = 0.97;

type Props = {
  field: string;
  /** まだ一度も解いていない分野は false(%の代わりに「–」を出す) */
  attempted: boolean;
  /** 0〜1の正答率 */
  accuracy: number;
  onPress: () => void;
};

/** ホームの分野セル。押している間だけ少し縮む(AnswerOptionと同じ reanimated の withTiming) */
export default function FieldCell({ field, attempted, accuracy, onPress }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const percent = Math.round(accuracy * 100);

  return (
    <Animated.View style={[styles.cell, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(PRESS_SCALE, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`${field}の問題へ`}
      >
        <Text style={styles.chevron}>›</Text>
        <Text style={styles.name}>{field}</Text>
        <Text style={styles.caption}>正答率</Text>
        <Text style={[styles.percent, !attempted && styles.percentMuted]}>
          {attempted ? `${percent}%` : "–"}
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${attempted ? percent : 0}%` }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
    borderRadius: 16,
  },
  pressable: {
    padding: 10,
  },
  chevron: {
    position: "absolute",
    top: 4,
    right: 9,
    fontSize: 20,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 4,
  },
  percent: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 6,
  },
  percentMuted: {
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
});
