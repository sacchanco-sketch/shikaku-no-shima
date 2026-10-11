import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList, TabKey } from "../navigation/types";
import TabBar from "../components/TabBar";
import HomeScreen from "./HomeScreen";
import PastExamsTab from "./PastExamsTab";
import StatsTab from "./StatsTab";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

/**
 * 下のタブバーを持つ「ホーム」「過去問」「成績」の入れ物。スタック上では "Home" として登録されている。
 * クイズ・結果画面はこの上に別画面として積まれるので、その間はタブバーが隠れる。
 * (タブ切り替えのための新しいライブラリは追加せず、既存のスタックの上に state で切り替えている)
 */
export default function MainScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<TabKey>("home");
  // 過去問タブで開いている回("2026-04"形式)。null なら一覧。タブを行き来しても保持する
  const [examKey, setExamKey] = useState<string | null>(null);

  // 結果画面などから「このタブを開いて」と指定されたとき
  const params = route.params;
  useEffect(() => {
    if (params?.tab) {
      setTab(params.tab);
      setExamKey(params.examKey ?? null);
    }
  }, [params]);

  const handleTabChange = (next: TabKey) => {
    // 過去問タブをもう一度押したら、一覧に戻る
    if (next === "exams" && tab === "exams") setExamKey(null);
    setTab(next);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {tab === "home" && <HomeScreen navigation={navigation} />}
        {tab === "exams" && (
          <PastExamsTab navigation={navigation} examKey={examKey} onSelectExam={setExamKey} />
        )}
        {tab === "stats" && <StatsTab navigation={navigation} />}
      </View>
      <TabBar current={tab} onChange={handleTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});
