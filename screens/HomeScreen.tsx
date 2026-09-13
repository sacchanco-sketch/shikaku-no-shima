import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, borderRadius } from "../theme";

type Props = {
  onStartQuiz: () => void;
};

export default function HomeScreen({ onStartQuiz }: Props) {
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
            ランダムに1問出題します。すきま時間にサクッと復習しましょう。
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onStartQuiz}>
            <Text style={styles.primaryButtonText}>今日の問題</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.lavenderCard]}>
          <Text style={styles.cardLabel}>出題範囲</Text>
          <Text style={styles.cardDescription}>関係法令・労働衛生・労働生理　全330問</Text>
        </View>
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
    gap: 16,
  },
  card: {
    borderRadius: borderRadius,
    padding: 20,
  },
  limeCard: {
    backgroundColor: colors.neonLime,
  },
  lavenderCard: {
    backgroundColor: colors.lavender,
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
