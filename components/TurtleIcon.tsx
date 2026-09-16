import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { colors } from "../theme";

type Props = {
  size?: number;
};

/**
 * 「資格の島」のマスコット的な亀アイコン。
 * 専用デザインアセットがまだ無いため、簡易的な幾何学図形で構成した仮アイコン。
 * 正式なイラストが用意でき次第、このコンポーネントを画像コンポーネントに差し替える想定。
 */
export default function TurtleIcon({ size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* 脚 */}
      <Circle cx="7" cy="23" r="2.6" fill={colors.black} />
      <Circle cx="25" cy="23" r="2.6" fill={colors.black} />
      <Circle cx="5.5" cy="13" r="2.6" fill={colors.black} />
      <Circle cx="26.5" cy="13" r="2.6" fill={colors.black} />
      {/* 頭 */}
      <Circle cx="16" cy="6" r="3.6" fill={colors.black} />
      {/* 甲羅 */}
      <Ellipse
        cx="16"
        cy="17"
        rx="12"
        ry="10"
        fill={colors.neonLime}
        stroke={colors.black}
        strokeWidth={1.5}
      />
      {/* 甲羅の模様 */}
      <Path
        d="M16 8 V26 M5 17 H27 M9 10 L23 24 M23 10 L9 24"
        stroke={colors.black}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.3}
      />
    </Svg>
  );
}
