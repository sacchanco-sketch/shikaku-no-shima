import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors, borderRadius } from "../theme";

export type OptionStatus =
  | "idle" // 未回答
  | "correct" // 回答後、この選択肢が正解
  | "incorrect" // 回答後、これがユーザーが選んで外れた選択肢
  | "muted"; // 回答後、選ばれなかった不正解の選択肢(薄く表示)

type Props = {
  label: string;
  text: string;
  status: OptionStatus;
  disabled: boolean;
  onPress: () => void;
};

const COLOR_TRANSITION_MS = 200;
const PRESS_SCALE = 0.95;

function colorsForStatus(status: OptionStatus) {
  switch (status) {
    case "correct":
      return { background: colors.success, border: colors.success, opacity: 1 };
    case "incorrect":
      return { background: colors.errorBackground, border: colors.error, opacity: 1 };
    case "muted":
      return { background: colors.white, border: colors.lightBorder, opacity: 0.5 };
    default:
      return { background: colors.white, border: colors.lightBorder, opacity: 1 };
  }
}

export default function AnswerOption({ label, text, status, disabled, onPress }: Props) {
  const scale = useSharedValue(1);
  const background = useSharedValue<string>(colors.white);
  const border = useSharedValue<string>(colors.lightBorder);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const target = colorsForStatus(status);
    background.value = withTiming(target.background, { duration: COLOR_TRANSITION_MS });
    border.value = withTiming(target.border, { duration: COLOR_TRANSITION_MS });
    opacity.value = withTiming(target.opacity, { duration: COLOR_TRANSITION_MS });
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: background.value,
    borderColor: border.value,
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(PRESS_SCALE, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  return (
    <Animated.View style={[styles.option, animatedStyle]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Text style={styles.optionNumber}>{label}</Text>
        <Text style={styles.optionText}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 1,
    borderRadius: borderRadius,
  },
  pressable: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  optionNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
    width: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
    lineHeight: 21,
  },
});
