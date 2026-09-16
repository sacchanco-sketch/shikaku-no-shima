import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

type Props = {
  size?: number;
  strokeWidth?: number;
  /** 0〜1の正答率 */
  progress: number;
  /** リングの色(分野ごとに指定) */
  color: string;
  label: string;
  /** falseの場合、まだ一度も解いていない分野として控えめな表示にする */
  attempted: boolean;
};

export default function ProgressRing({
  size = 64,
  strokeWidth = 7,
  progress,
  color,
  label,
  attempted,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={[styles.wrapper, !attempted && styles.wrapperMuted]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.lightBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {attempted && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              // 12時の位置から描き始める
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.centerLabel]}>
          <Text style={styles.percentText}>{attempted ? `${Math.round(clamped * 100)}%` : "–"}</Text>
        </View>
      </View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.captionText}>{attempted ? " " : "まだ手つかず"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 4,
  },
  wrapperMuted: {
    opacity: 0.55,
  },
  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
  },
  captionText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
