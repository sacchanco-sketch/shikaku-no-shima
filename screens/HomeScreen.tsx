import { useCallback, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, type LayoutChangeEvent } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { loadProgress, summarize, type OverallStats } from "../lib/progress";
import { useMascotGreeting } from "../lib/mascot";
import Mascot from "../components/Mascot";
import MascotGreeting from "../components/MascotGreeting";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// モック(360x740)の寸法が基準(円230px・銅像240px)。ヒーロー領域は残りの縦スペースを使い切るので、
// 背の高い端末では最大1.3倍まで拡大し、低い端末では BUBBLE_ZONE を確保できる範囲まで縮める。
const BUBBLE_ZONE = 68; // 吹き出し(最大2行)のために銅像の上に空けておく高さ
const STATUE_MAX = 312;
const STATUE_MIN = 150;
const CIRCLE_MAX = 300;

export default function HomeScreen({ navigation }: Props) {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [heroHeight, setHeroHeight] = useState(335);
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

  const onHeroLayout = (e: LayoutChangeEvent) => {
    setHeroHeight(Math.round(e.nativeEvent.layout.height));
  };

  // ヒーロー領域の高さに合わせて銅像と円の大きさを決める(吹き出しの分は必ず上に空ける)
  const statueHeight = Math.max(STATUE_MIN, Math.min(STATUE_MAX, heroHeight - BUBBLE_ZONE - 6));
  const circleSize = Math.min(CIRCLE_MAX, Math.round(statueHeight * 0.96));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>第二種衛生管理者</Text>
        </View>
      </View>

      <View style={styles.hero} onLayout={onHeroLayout}>
        <View
          style={[
            styles.circle,
            { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
          ]}
        />
        {greeting && <Mascot pose={greeting.pose} height={statueHeight} style={styles.statue} />}
        <View style={styles.bubbleWrap}>
          {greeting && <MascotGreeting message={greeting.message} />}
        </View>
      </View>

      <View style={styles.statsRow}>
        <BigStat value={stats?.streakDays ?? 0} unit="日" caption="連続学習" />
        <BigStat value={stats?.last7DaysCount ?? 0} unit="問" caption="直近7日" />
      </View>

      <View style={styles.fieldsRow}>
        {(stats?.byField ?? EMPTY_FIELDS).map((f) => {
          const attempted = f.total > 0;
          const percent = Math.round(f.accuracy * 100);
          return (
            <TouchableOpacity
              key={f.field}
              style={styles.fieldCell}
              onPress={() => navigation.navigate("Quiz", { field: f.field })}
            >
              <Text style={styles.fieldName}>{f.field}</Text>
              <Text style={[styles.fieldPercent, !attempted && styles.fieldPercentMuted]}>
                {attempted ? `${percent}%` : "–"}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${attempted ? percent : 0}%` }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate("Quiz", {})}>
          <Text style={styles.ctaText}>今日の問題を解く</Text>
          <View style={styles.ctaArrow}>
            <Text style={styles.ctaArrowText}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingTop: 20,
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
  // 残りの縦スペースをすべて使う(スクロールを出さないため)。吹き出しは上、銅像と円は下寄せ
  hero: {
    flex: 1,
    marginTop: 6,
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
  bubbleWrap: {
    position: "absolute",
    top: 4,
    left: 22,
    right: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 6,
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
  fieldsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  fieldCell: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
    borderRadius: 16,
    padding: 10,
  },
  fieldName: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  fieldPercent: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.black,
    marginTop: 2,
    marginBottom: 6,
  },
  fieldPercentMuted: {
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
  ctaWrap: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
  },
  cta: {
    backgroundColor: colors.black,
    borderRadius: 18,
    paddingVertical: 18,
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
