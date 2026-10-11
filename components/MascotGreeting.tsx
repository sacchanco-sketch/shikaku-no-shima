import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Props = {
  message: string;
};

/** 銅像の頭上に置く吹き出し。メッセージの判定ロジックは lib/mascot.ts の useMascotGreeting */
export default function MascotGreeting({ message }: Props) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.black,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    color: colors.black,
  },
});
