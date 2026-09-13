import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, borderRadius } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import type { QuestionField } from "../types/question";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const FIELDS: { field: QuestionField; color: string; textColor: string }[] = [
  { field: "関係法令", color: colors.lavender, textColor: colors.black },
  { field: "労働衛生", color: colors.neonLime, textColor: colors.black },
  { field: "労働生理", color: colors.vividBlue, textColor: colors.white },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>資格の島</Text>
        <Text style={styles.headerSubtitle}>第二種衛生管理者 試験対策</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.limeCard]}>
          <Text style={styles.cardLabel}>TODAY'S QUESTION</Text>
          <Text style={styles.cardDescription}>
            全330問からランダムに1問出題します。すきま時間にサクッと復習しましょう。
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Quiz", {})}
          >
            <Text style={styles.primaryButtonText}>今日の問題</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={styles.sectionTitle}>分野を選んで演習</Text>
          <View style={styles.fieldGrid}>
            {FIELDS.map(({ field, color, textColor }) => (
              <TouchableOpacity
                key={field}
                style={[styles.fieldCard, { backgroundColor: color }]}
                onPress={() => navigation.navigate("Quiz", { field })}
              >
                <Text style={[styles.fieldCardText, { color: textColor }]}>{field}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, styles.outlineCard]}>
          <Text style={styles.cardLabel}>出題範囲</Text>
          <Text style={styles.cardDescription}>関係法令・労働衛生・労働生理　全330問</Text>
        </View>

        <TouchableOpacity
          style={[styles.card, styles.outlineCard, styles.progressLink]}
          onPress={() => navigation.navigate("Progress")}
        >
          <Text style={styles.progressLinkText}>成績を見る</Text>
          <Text style={styles.progressLinkArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.vividBlue,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: borderRadius,
    borderBottomRightRadius: borderRadius,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: colors.white,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 10,
  },
  fieldGrid: {
    flexDirection: "row",
    gap: 10,
  },
  fieldCard: {
    flex: 1,
    borderRadius: borderRadius,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldCardText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    borderRadius: borderRadius,
    padding: 20,
  },
  limeCard: {
    backgroundColor: colors.neonLime,
  },
  outlineCard: {
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 8,
    letterSpacing: 1,
    opacity: 0.6,
  },
  cardDescription: {
    fontSize: 16,
    color: colors.black,
    lineHeight: 22,
  },
  progressLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLinkText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  progressLinkArrow: {
    fontSize: 16,
    color: colors.black,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: colors.black,
    borderRadius: borderRadius,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
