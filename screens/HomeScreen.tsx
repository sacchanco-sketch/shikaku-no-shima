import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, type LayoutChangeEvent } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { loadProgress, summarize, type OverallStats } from "../lib/progress";
import { mascotHeadOffset, useMascotGreeting } from "../lib/mascot";
import Mascot from "../components/Mascot";
import MascotGreeting from "../components/MascotGreeting";
import FieldCell from "../components/FieldCell";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Home"> };

// 銅像は最大230px・円は最大220px。画面が低い端末では、下の要素(数字・分野セル)を確保した残りに収まるよう縮める。
const BUBBLE_AREA = 58; // 吹き出し(最大2行)の置き場の高さ。吹き出しは下揃えで、銅像の頭の BUBBLE_GAP 上に来る
const BUBBLE_GAP = 12;
const STATUE_MAX = 230;
const STATUE_MIN = 120;
const CIRCLE_MAX = 220;
const GROUP_TO_STATS = 24; // 銅像グループと数字の間
// 銅像そのもの以外の、銅像グループ〜分野セルの固定の高さ(吹き出し置き場+隙間+銅像下端のオフセット
// +数字との間隔+数字ブロック+余白の最小値+見出し+セル)。bodyの高さからこれを引いた残りが銅像に使える高さ。
const FIXED_BELOW_STATUE = BUBBLE_AREA + BUBBLE_GAP + 6 + GROUP_TO_STATS + 82 + 8 + 32 + 93 + 4;

export default function HomeScreen({ navigation }: Props) {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [bodyHeight, setBodyHeight] = useState(480);
  const greeting = useMascotGreeting();

  // 演習から戻ってくるたびに最新の記録を読み直す
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadProgress().then((progress) => {
        if (isActive) setStats(summarize(progress));
      });
      return () => {
        isActive = false;
      };
    }, [])
  );

  const onBodyLayout = (e: LayoutChangeEvent) => {
    setBodyHeight(Math.round(e.nativeEvent.layout.height));
  };

  const statueHeight = Math.max(
    STATUE_MIN,
    Math.min(STATUE_MAX, bodyHeight - FIXED_BELOW_STATUE)
  );
  const circleSize = Math.min(CIRCLE_MAX, Math.round(statueHeight * 0.96));

  return (
    <View style={styles.safeArea}>
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>第二種衛生管理者</Text>
        </View>
      </View>

      <View style={styles.body} onLayout={onBodyLayout}>
        {/* 吹き出し+銅像+円を1つのまとまりにして、画面の上寄りに置く */}
        <View style={styles.group}>
          <View style={styles.bubbleArea}>
            {greeting && (
              <MascotGreeting
                message={greeting.message}
                // しっぽの先を銅像の頭の中心の真上に合わせる。吹き出しの幅は文言で変わるが、吹き出しは
                // 画面中央(=銅像の画像の中心)に置かれるので、画像の中心から頭までのずれを基準にする
                tailOffset={mascotHeadOffset(greeting.pose, statueHeight)}
              />
            )}
          </View>
          <View style={{ height: statueHeight + 6, marginTop: BUBBLE_GAP }}>
            <View
              style={[
                styles.circle,
                { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
              ]}
            />
            {greeting && (
              <Mascot pose={greeting.pose} height={statueHeight} style={styles.statue} />
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <BigStat value={stats?.streakDays ?? 0} unit="日" caption="連続学習" />
          <BigStat value={stats?.last7DaysCount ?? 0} unit="問" caption="直近7日" />
        </View>

        {/* 余った高さは、数字の下・分野セルの下に均等に配分する */}
        <View style={styles.flexSpacerTop} />

        <Text style={styles.sectionLabel}>分野を選んで演習</Text>
        <View style={styles.fieldsRow}>
          {(stats?.byField ?? EMPTY_FIELDS).map((f) => (
            <FieldCell
              key={f.field}
              field={f.field}
              attempted={f.total > 0}
              accuracy={f.accuracy}
              onPress={() => navigation.navigate("Quiz", { field: f.field })}
            />
          ))}
        </View>

        <View style={styles.flexSpacerBottom} />
      </View>

      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate("Quiz", {})}>
          <Text style={styles.ctaText}>今日の問題を解く</Text>
          <View style={styles.ctaArrow}>
            <Text style={styles.ctaArrowText}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const EMPTY_FIELDS = (["関係法令", "労働衛生", "労働生理"] as const).map((field) => ({
  field,
  total: 0,
  correct: 0,
  accuracy: 0,
}));

function BigStat({ value, unit, caption }: { value: number; unit: string; caption: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statNumberRow}>
        <View style={styles.statNumberWrap}>
          {/* 数字の下3割にライムの下線 */}
          <View style={styles.statUnderline} />
          <Text style={styles.statNumber}>{value}</Text>
        </View>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
      <Text style={styles.statCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topRow: {
    paddingTop: 12,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  pill: {
    backgroundColor: colors.black,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.neonLime,
    fontSize: 11,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    // 中身の高さより小さくなれるようにする(Webでは flex:1 の最小高さが中身で決まり、残り高さを測れなくなるため)
    minHeight: 0,
    marginTop: 8,
  },
  group: {
    marginBottom: GROUP_TO_STATS,
  },
  bubbleArea: {
    height: BUBBLE_AREA,
    justifyContent: "flex-end",
    paddingHorizontal: 22,
  },
  circle: {
    position: "absolute",
    alignSelf: "center",
    bottom: 13,
    backgroundColor: colors.neonLime,
  },
  statue: {
    position: "absolute",
    alignSelf: "center",
    bottom: 6,
  },
  flexSpacerTop: {
    flex: 1,
    minHeight: 8,
  },
  flexSpacerBottom: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 22,
  },
  stat: {
    flex: 1,
  },
  statNumberRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  statNumberWrap: {
    justifyContent: "flex-end",
  },
  statUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 4,
    height: 17,
    backgroundColor: colors.neonLime,
  },
  statNumber: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: "900",
    letterSpacing: -2,
    color: colors.black,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.black,
    marginLeft: 2,
    marginBottom: 8,
  },
  statCaption: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
  },
  ctaWrap: {
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 12,
  },
  cta: {
    backgroundColor: colors.black,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  ctaArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaArrowText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },
});
