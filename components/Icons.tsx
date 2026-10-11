import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "../theme";

type IconProps = {
  size?: number;
  color?: string;
};

/** 鍵(南京錠)のアイコン。有料の機能・回に付ける */
export function LockIcon({ size = 18, color = colors.textSecondary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={11} width={14} height={10} rx={2.5} stroke={color} strokeWidth={2.2} fill="none" />
      <Path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke={color}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** チェックのアイコン */
export function CheckIcon({ size = 14, color = colors.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke={color}
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 閉じる(×)のアイコン */
export function CloseIcon({ size = 18, color = colors.black }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
