import type { ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type Props = {
  onPress: () => void;
  children: ReactNode;
  /** 外側(縮む対象)のスタイル。枠線・角丸・余白など */
  style?: StyleProp<ViewStyle>;
  scale?: number;
  accessibilityLabel?: string;
};

/** 押している間だけ少し縮むボタン(AnswerOption・FieldCellと同じ withTiming の動き) */
export default function PressableScale({
  onPress,
  children,
  style,
  scale: pressedScale = 0.97,
  accessibilityLabel,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(pressedScale, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
