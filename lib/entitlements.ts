/**
 * lib/entitlements.ts
 *
 * 「有料(買い切り)かどうか」の判定と、購入・復元の入口を1か所にまとめたファイル。
 * RevenueCat(react-native-purchases)につないでいる。画面側は useEntitlement() / purchase() /
 * restore() / usePriceLabel() だけを使う。
 *
 * RevenueCat 側の設定:
 *   - 権利(entitlement): premium
 *   - Offering: default(Current)、パッケージ: Lifetime($rc_lifetime)
 *   - 商品: com.sacchanco.kinjirodrill.fullaccess(買い切り・非消耗型)
 *
 * 課金が動かない環境(Expo Go / Webプレビュー / Androidのキー未設定)では、課金を無効にして落ちないようにし、
 * 開発中(__DEV__)だけ「購入すると有料になる」仮の動作にフォールバックする。
 *
 * 開発用の上書き(__DEV__ のみ): 成績タブの「開発用」切り替えで、本物の購入状態より優先して
 * 有料/無料を固定できる。製品版では __DEV__ が false なので、この上書きは読み込みも反映もされない。
 */
import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { CustomerInfo, PurchasesError, PurchasesPackage } from "react-native-purchases";

/** RevenueCat の権利ID */
const ENTITLEMENT_ID = "premium";
/** Lifetime パッケージの識別子(offerings.current.lifetime と同じもの) */
const LIFETIME_PACKAGE_ID = "$rc_lifetime";

/** Public SDK キー。コードには書かず、環境変数(.env / EAS の環境変数)から読む */
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

/** 価格を取得できていない間に出す表示(商品の priceString が取れたら、そちらに置き換わる) */
export const FALLBACK_PRICE_LABEL = "¥980";

/** 本物の課金を使えるか。Expo Go・Web・キー未設定(Androidなど)では使わない */
const BILLING_ENABLED = Platform.OS !== "web" && !isRunningInExpoGo() && !!API_KEY;

const DEV_OVERRIDE_KEY = "shikaku-no-shima:dev-premium-override:v1"; // "premium" | "free"(無ければ上書きなし)
const PREMIUM_CACHE_KEY = "shikaku-no-shima:premium-cache:v1"; // 最後に確認できた購入状態(通信できない起動用)
const LEGACY_STUB_KEY = "shikaku-no-shima:entitlement:v1"; // 仮実装が使っていたキー(もう読まない)

export type PurchaseResult = {
  status: "success" | "cancelled" | "unavailable" | "nothing-to-restore" | "error";
  /** 画面にそのまま出せる説明(成功・ユーザーが自分でキャンセルしたときは無し) */
  message?: string;
};

const MESSAGES = {
  notReady: "課金は準備中です",
  nothingToRestore: "復元できる購入は見つかりませんでした",
  network: "通信エラーが発生しました。ネットワークの接続を確認して、もう一度お試しください",
  store: "ストアに接続できませんでした。しばらくしてから、もう一度お試しください",
  notAllowed: "この端末では購入が許可されていません。端末の設定を確認してください",
  pending: "お支払いが保留中です。承認されると、自動で反映されます",
  alreadyPurchased: "すでに購入済みです。「購入を復元」をお試しください",
  noProduct: "購入できる商品を取得できませんでした。しばらくしてから、もう一度お試しください",
  notReflected: "購入は完了しましたが、反映を確認できませんでした。「購入を復元」をお試しください",
  purchaseFailed: "購入を完了できませんでした。しばらくしてから、もう一度お試しください",
  restoreFailed: "購入の復元に失敗しました。しばらくしてから、もう一度お試しください",
} as const;

type State = {
  /** 画面が見る最終的な状態(開発用の上書き > 本物の購入状態) */
  isPremium: boolean;
  /** 起動時の購入状態の確認が終わったか(false の間は、まだ判定できていない) */
  isLoaded: boolean;
  /** Offering から取得した価格の表示(例: ¥980)。取得できるまで null */
  priceLabel: string | null;
};

let realPremium = false; // RevenueCat から得た本物の状態
let devOverride: boolean | null = null; // __DEV__ のときだけ使う上書き(null=上書きなし)
let state: State = { isPremium: false, isLoaded: false, priceLabel: null };
const listeners = new Set<() => void>();

function publish(patch: Partial<State> = {}) {
  const effective = __DEV__ && devOverride !== null ? devOverride : realPremium;
  state = { ...state, ...patch, isPremium: effective };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// --- RevenueCat ---------------------------------------------------------------------------

type PurchasesModule = typeof import("react-native-purchases").default;
let purchasesModule: PurchasesModule | null = null;

/** ネイティブモジュールは、課金を使える環境でだけ読み込む(Expo Go・Webでは読み込まない) */
function getPurchases(): PurchasesModule | null {
  if (!BILLING_ENABLED) return null;
  if (!purchasesModule) {
    try {
      purchasesModule = (require("react-native-purchases") as { default: PurchasesModule }).default;
    } catch {
      return null;
    }
  }
  return purchasesModule;
}

function hasPremium(info: CustomerInfo): boolean {
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

function applyCustomerInfo(info: CustomerInfo) {
  realPremium = hasPremium(info);
  AsyncStorage.setItem(PREMIUM_CACHE_KEY, realPremium ? "1" : "0").catch(() => {});
  publish({ isLoaded: true });
}

function lifetimeOf(offerings: Awaited<ReturnType<PurchasesModule["getOfferings"]>>): PurchasesPackage | null {
  const current = offerings.current;
  return (
    current?.lifetime ??
    current?.availablePackages.find((p) => p.identifier === LIFETIME_PACKAGE_ID) ??
    null
  );
}

let priceRequest: Promise<void> | null = null;

/** Offering から価格の表示を取得する。失敗しても落ちない(取得できるまで FALLBACK_PRICE_LABEL を使う) */
export function refreshPrice(): Promise<void> {
  const Purchases = getPurchases();
  if (!Purchases || state.priceLabel) return Promise.resolve();
  if (!priceRequest) {
    priceRequest = Purchases.getOfferings()
      .then((offerings) => {
        const label = lifetimeOf(offerings)?.product.priceString;
        if (label) publish({ priceLabel: label });
      })
      .catch(() => {})
      .finally(() => {
        priceRequest = null;
      });
  }
  return priceRequest;
}

async function readCache(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREMIUM_CACHE_KEY)) === "1";
  } catch {
    return false;
  }
}

let started = false;

/** アプリ起動時に1回だけ実行する(このファイルが最初に読み込まれたときに自動で呼ばれる) */
async function initEntitlements() {
  if (started) return;
  started = true;

  if (__DEV__) {
    try {
      const stored = await AsyncStorage.getItem(DEV_OVERRIDE_KEY);
      devOverride = stored === "premium" ? true : stored === "free" ? false : null;
      AsyncStorage.removeItem(LEGACY_STUB_KEY).catch(() => {});
    } catch {
      devOverride = null;
    }
  }

  const Purchases = getPurchases();
  if (!Purchases) {
    // 課金を使えない環境。本物の購入状態は無い(開発中は、上の上書きだけで有料/無料を切り替える)
    publish({ isLoaded: true });
    return;
  }

  try {
    if (__DEV__) Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: API_KEY as string });
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  } catch {
    // 設定に失敗しても、アプリは落とさず無料として動かす
    publish({ isLoaded: true });
    return;
  }

  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {
    // 通信できないときは、最後に確認できた購入状態を使う(購入済みなのに無料に戻らないように)
    realPremium = await readCache();
    publish({ isLoaded: true });
  }
  refreshPrice();
}

initEntitlements();

// --- 画面から使う入口 ---------------------------------------------------------------------

/** 有料かどうか。isLoaded が false の間(起動直後)は、まだ購入状態を確認し終えていない */
export function useEntitlement(): Pick<State, "isPremium" | "isLoaded"> {
  return useSyncExternalStore(subscribe, () => state);
}

/** 購入ボタンなどに出す価格の表示。Offering から取得できるまでは「¥980」 */
export function usePriceLabel(): string {
  const { priceLabel } = useSyncExternalStore(subscribe, () => state);
  return priceLabel ?? FALLBACK_PRICE_LABEL;
}

function describeError(error: unknown, fallback: string, Purchases: PurchasesModule): string {
  const code = (error as PurchasesError | undefined)?.code;
  const C = Purchases.PURCHASES_ERROR_CODE;
  switch (code) {
    case C.NETWORK_ERROR:
    case C.OFFLINE_CONNECTION_ERROR:
    case C.API_ENDPOINT_BLOCKED:
      return MESSAGES.network;
    case C.STORE_PROBLEM_ERROR:
    case C.PRODUCT_REQUEST_TIMED_OUT_ERROR:
      return MESSAGES.store;
    case C.PURCHASE_NOT_ALLOWED_ERROR:
      return MESSAGES.notAllowed;
    case C.PAYMENT_PENDING_ERROR:
      return MESSAGES.pending;
    case C.PRODUCT_ALREADY_PURCHASED_ERROR:
      return MESSAGES.alreadyPurchased;
    case C.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return MESSAGES.noProduct;
    default:
      return fallback;
  }
}

/**
 * 購入する。課金を使えない環境では、開発中(__DEV__)だけ「購入すると有料になる」仮の動作、
 * それ以外は「課金は準備中です」を返すだけ。
 */
export async function purchase(): Promise<PurchaseResult> {
  const Purchases = getPurchases();
  if (!Purchases) {
    if (__DEV__) {
      await setPremiumForDev(true);
      return { status: "success" };
    }
    return { status: "unavailable", message: MESSAGES.notReady };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const lifetime = lifetimeOf(offerings);
    if (!lifetime) return { status: "error", message: MESSAGES.noProduct };

    const { customerInfo } = await Purchases.purchasePackage(lifetime);
    applyCustomerInfo(customerInfo);
    return hasPremium(customerInfo)
      ? { status: "success" }
      : { status: "error", message: MESSAGES.notReflected };
  } catch (error) {
    // ユーザーが自分でキャンセルしたときは、エラーとして表示しない
    if ((error as PurchasesError | undefined)?.userCancelled) return { status: "cancelled" };
    return { status: "error", message: describeError(error, MESSAGES.purchaseFailed, Purchases) };
  }
}

/** 購入を復元する。課金を使えない環境では、開発中だけ「開発用の上書きが有料なら復元できた」扱い */
export async function restore(): Promise<PurchaseResult> {
  const Purchases = getPurchases();
  if (!Purchases) {
    if (__DEV__) {
      return devOverride === true
        ? { status: "success" }
        : { status: "nothing-to-restore", message: MESSAGES.nothingToRestore };
    }
    return { status: "unavailable", message: MESSAGES.notReady };
  }

  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return hasPremium(info)
      ? { status: "success" }
      : { status: "nothing-to-restore", message: MESSAGES.nothingToRestore };
  } catch (error) {
    if ((error as PurchasesError | undefined)?.userCancelled) return { status: "cancelled" };
    return { status: "error", message: describeError(error, MESSAGES.restoreFailed, Purchases) };
  }
}

// --- 開発用の上書き(__DEV__ のみ) ----------------------------------------------------------

/** 開発用: 有料/無料を固定する(本物の購入状態より優先)。null で上書きを解除。製品版では何もしない */
export async function setPremiumForDev(value: boolean | null): Promise<void> {
  if (!__DEV__) return;
  devOverride = value;
  try {
    if (value === null) await AsyncStorage.removeItem(DEV_OVERRIDE_KEY);
    else await AsyncStorage.setItem(DEV_OVERRIDE_KEY, value ? "premium" : "free");
  } catch {
    // 保存に失敗しても、このセッションの間は上書きを保持する
  }
  publish();
}

/** 開発用の現在の上書き状態(true=有料に固定, false=無料に固定, null=本物の購入状態に従う) */
export function useDevOverride(): boolean | null {
  useSyncExternalStore(subscribe, () => state);
  return __DEV__ ? devOverride : null;
}
