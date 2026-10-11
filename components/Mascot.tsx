import { Image, type StyleProp, type ImageStyle } from "react-native";
import { MASCOT_IMAGES, type MascotPose } from "../lib/mascot";

type Props = {
  pose: MascotPose;
  /** 表示する高さ(px)。幅はポーズ画像の縦横比(約0.5〜0.58)に収まるよう高さの0.6倍の枠を取る */
  height: number;
  style?: StyleProp<ImageStyle>;
};

export default function Mascot({ pose, height, style }: Props) {
  return (
    <Image
      source={MASCOT_IMAGES[pose]}
      accessibilityLabel="二宮金次郎の銅像"
      style={[{ width: height * 0.6, height }, style]}
      resizeMode="contain"
    />
  );
}
