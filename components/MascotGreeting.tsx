import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Props = {
  message: string;
  /** しっぽの位置。吹き出しの中心から横にずらす量(px、左が負)。銅像の頭の真上に合わせる */
  tailOffset?: number;
};

/**
 * 銅像の頭上に置く吹き出し。下辺中央の小さな三角のしっぽが銅像を指す。
 * メッセージの判定ロジックは lib/mascot.ts の useMascotGreeting
 */
export default function MascotGreeting({ message, tailOffset = 0 }: Props) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{message}</Text>
      <View style={[styles.tail, { transform: [{ translateX: tailOffset }, { rotate: "45deg" }] }]} />
    </View>
  );
}

const TAIL_SIZE = 12;

const styles = StyleSheet.create({
  bubble: {
    alignSelf: "center",
    maxWidth: "100%",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.black,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    color: colors.black,
    textAlign: "center",
  },
  // 45度回した正方形の右下の角だけ枠線を残して下向きの三角にする(白塗りで吹き出し枠線の継ぎ目を隠す)
  tail: {
    position: "absolute",
    bottom: -TAIL_SIZE / 2 - 1,
    left: "50%",
    marginLeft: -TAIL_SIZE / 2,
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    backgroundColor: colors.white,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.black,
  },
});
