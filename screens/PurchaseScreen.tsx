import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import {
  SHOW_PURCHASE_DEBUG,
  loadPurchaseDebugInfo,
  purchase,
  refreshPrice,
  restore,
  usePriceLabel,
  type PurchaseResult,
} from "../lib/entitlements";
import { EXAMS } from "../lib/exams";
import { FREE_EXAM_KEYS } from "../lib/questionAccess";
import Mascot from "../components/Mascot";
import { CheckIcon, CloseIcon } from "../components/Icons";

type Props = NativeStackScreenProps<RootStackParamList, "Purchase">;

// 無料の範囲の比較(回数・問題数は、無料の回の定義と問題データから数える)
const FREE_EXAM_COUNT = FREE_EXAM_KEYS.length;
const FREE_QUESTION_COUNT = EXAMS.filter((e) => FREE_EXAM_KEYS.includes(e.key)).reduce(
  (sum, e) => sum + e.questionIds.length,
  0
);
const ALL_QUESTION_COUNT = EXAMS.reduce((sum, e) => sum + e.questionIds.length, 0);

const BENEFITS = [
  "全11回分の過去問330問、すべて解説つき",
  "これまでの間違えた問題を、まとめて解き直せる",
  "広告なし、買い切りで追加料金なし",
];

/** 購入画面(下から出るシート)。課金の実処理は lib/entitlements.ts にある */
export default function PurchaseScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // テスト中だけの診断表示(lib/entitlements.ts の SHOW_PURCHASE_DEBUG で消せる)
  const [detail, setDetail] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const reloadDebugInfo = () => {
    if (SHOW_PURCHASE_DEBUG) loadPurchaseDebugInfo().then(setDebugInfo);
  };
  // 価格は RevenueCat の Offering から取得する(取れるまでは「¥980」)。画面を開くたびに、未取得なら再取得する
  const priceLabel = usePriceLabel();
  useEffect(() => {
    refreshPrice();
    reloadDebugInfo();
  }, []);

  const run = async (action: () => Promise<PurchaseResult>) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setDetail(null);
    try {
      const result = await action();
      if (result.status === "success") navigation.goBack();
      else {
        setMessage(result.message ?? null);
        setDetail(result.detail ?? null);
        reloadDebugInfo();
      }
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

        <View style={styles.compare}>
          <View style={[styles.compareCell, styles.compareFree]}>
            <Text style={styles.compareLabel}>無料</Text>
            <Text style={styles.compareValue}>
              最新{FREE_EXAM_COUNT}回 {FREE_QUESTION_COUNT}問
            </Text>
          </View>
          <View style={[styles.compareCell, styles.comparePremium]}>
            <Text style={styles.compareLabel}>全問題</Text>
            <Text style={styles.compareValue}>
              {EXAMS.length}回 {ALL_QUESTION_COUNT}問
            </Text>
          </View>
        </View>

        {SHOW_PURCHASE_DEBUG && debugInfo && (
          <Text style={[styles.debugText, styles.debugInfo]} selectable>
            {debugInfo}
          </Text>
        )}
      </ScrollView>

      {/* 購入ボタンと復元は画面の下に固定する */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.buyButton, busy && styles.buyButtonBusy]}
          onPress={() => run(purchase)}
          disabled={busy}
          accessibilityRole="button"
        >
          <Text style={styles.buyButtonText}>{priceLabel}で全問題を使う</Text>
        </TouchableOpacity>

        {message && <Text style={styles.message}>{message}</Text>}
        {SHOW_PURCHASE_DEBUG && detail && (
          <Text style={styles.debugText} selectable>
            {detail}
          </Text>
        )}

        <TouchableOpacity onPress={() => run(restore)} disabled={busy} style={styles.restoreWrap}>
          <Text style={styles.restoreText}>購入を復元</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
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
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.black,
  },
  compare: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  compareCell: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: "center",
    gap: 2,
  },
  compareFree: {
    borderWidth: 1.5,
    borderColor: colors.lightBorder,
  },
  comparePremium: {
    borderWidth: 2.5,
    borderColor: colors.neonLime,
  },
  compareLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  compareValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.black,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },
  buyButton: {
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
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  debugText: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  debugInfo: {
    marginTop: 16,
  },
  restoreWrap: {
    marginTop: 6,
    alignItems: "center",
    paddingVertical: 6,
  },
  restoreText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
