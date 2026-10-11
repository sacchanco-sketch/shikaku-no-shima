import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { PRICE_LABEL, purchase, restore, type PurchaseResult } from "../lib/entitlements";
import Mascot from "../components/Mascot";
import { CheckIcon, CloseIcon } from "../components/Icons";

type Props = NativeStackScreenProps<RootStackParamList, "Purchase">;

const BENEFITS = [
  "全11回分の過去問330問、すべて解説つき",
  "これまでの間違えた問題を、まとめて解き直せる",
  "広告なし、買い切りで追加料金なし",
];

/** 購入画面(下から出るシート)。課金の実処理は lib/entitlements.ts にある */
export default function PurchaseScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (action: () => Promise<PurchaseResult>) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await action();
      if (result.status === "success") navigation.goBack();
      else setMessage(result.message ?? null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        >
          <CloseIcon size={16} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.hero}>
          <View style={styles.circle} />
          <Mascot pose="thumbsup" height={132} style={styles.statue} />
        </View>

        <Text style={styles.heading}>全330問を、ずっと解ける</Text>

        <View style={styles.benefits}>
          {BENEFITS.map((text) => (
            <View key={text} style={styles.benefitRow}>
              <View style={styles.checkCircle}>
                <CheckIcon size={13} />
              </View>
              <Text style={styles.benefitText}>{text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.buyButton, busy && styles.buyButtonBusy]}
          onPress={() => run(purchase)}
          disabled={busy}
          accessibilityRole="button"
        >
          <Text style={styles.buyButtonText}>{PRICE_LABEL}で全問題を使う</Text>
        </TouchableOpacity>

        {message && <Text style={styles.message}>{message}</Text>}

        <TouchableOpacity onPress={() => run(restore)} disabled={busy} style={styles.restoreWrap}>
          <Text style={styles.restoreText}>購入を復元</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CIRCLE = 124;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
    alignItems: "stretch",
  },
  hero: {
    height: 146,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  circle: {
    position: "absolute",
    bottom: 6,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.neonLime,
  },
  statue: {
    marginBottom: 0,
  },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.black,
    textAlign: "center",
    marginTop: 18,
  },
  benefits: {
    marginTop: 22,
    gap: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.black,
  },
  buyButton: {
    marginTop: 28,
    backgroundColor: colors.black,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
  },
  buyButtonBusy: {
    opacity: 0.6,
  },
  buyButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },
  message: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  restoreWrap: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 6,
  },
  restoreText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
