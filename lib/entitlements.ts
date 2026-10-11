/**
 * lib/entitlements.ts
 *
 * 「有料(買い切り)かどうか」の判定と、購入・復元の入口を1か所にまとめたファイル。
 *
 * ★ ここを RevenueCat に差し替える ★
 * いまは実際の課金につないでいない仮の実装で、購入済みかどうかは端末内(AsyncStorage)に
 * 保存しているだけ。RevenueCat を導入するときは、このファイルだけを書き換える。
 *   - isPremium の元: AsyncStorage の値 → Purchases.getCustomerInfo() の entitlements.active
 *     (変化は addCustomerInfoUpdateListener で受け取り、下の setState 相当に流す)
 *   - purchase(): 開発用の即時付与 → Purchases.purchasePackage(買い切りの package)
 *   - restore(): 保存値の読み直し → Purchases.restorePurchases()
 *   - PRICE_YEN / PRICE_LABEL: 固定値 → 取得した product.priceString
 * 画面側は useEntitlement() / purchase() / restore() / PRICE_LABEL だけを使っているので、
 * これらの形を保てば、画面のコードは変えなくてよい。
 */
import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "shikaku-no-shima:entitlement:v1";

/** 買い切りの価格(円)。RevenueCat の商品情報の価格に置き換える */
export const PRICE_YEN = 980;
/** 購入ボタンなどに出す価格の表記 */
export const PRICE_LABEL = `${PRICE_YEN}円`;

export type PurchaseResult = {
  status: "success" | "unavailable" | "nothing-to-restore";
  /** 画面にそのまま出せる説明(成功時は無し) */
  message?: string;
};

const BILLING_NOT_READY: PurchaseResult = {
  status: "unavailable",
  message: "課金は準備中です",
};

type State = { isPremium: boolean; isLoaded: boolean };

let state: State = { isPremium: false, isLoaded: false };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function readStored(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === "1";
  } catch {
    return false;
  }
}

async function persist(isPremium: boolean): Promise<void> {
  try {
    if (isPremium) await AsyncStorage.setItem(STORAGE_KEY, "1");
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // 保存に失敗しても、このセッションの間は状態を保持する
  }
}

// アプリ起動時に保存済みの購入状態を読み込む
readStored().then((isPremium) => setState({ isPremium, isLoaded: true }));

/** 有料かどうか。isLoaded が false の間(起動直後)は、まだ保存値を読み終えていない */
export function useEntitlement(): State {
  return useSyncExternalStore(subscribe, () => state);
}

/** 購入する。いまは仮実装: 開発中は即座に有料にし、本番ビルドでは「準備中」を返すだけ */
export async function purchase(): Promise<PurchaseResult> {
  if (__DEV__) {
    await persist(true);
    setState({ ...state, isPremium: true });
    return { status: "success" };
  }
  return BILLING_NOT_READY;
}

/** 購入を復元する。いまは仮実装: 開発中は保存済みの購入状態を読み直し、本番ビルドでは「準備中」を返すだけ */
export async function restore(): Promise<PurchaseResult> {
  if (__DEV__) {
    const isPremium = await readStored();
    setState({ ...state, isPremium });
    return isPremium
      ? { status: "success" }
      : { status: "nothing-to-restore", message: "復元できる購入は見つかりませんでした" };
  }
  return BILLING_NOT_READY;
}

/** 開発用: 有料/無料を直接切り替える(成績タブの「開発用」切り替えから使う。本番ビルドでは何もしない) */
export async function setPremiumForDev(isPremium: boolean): Promise<void> {
  if (!__DEV__) return;
  await persist(isPremium);
  setState({ ...state, isPremium });
}
