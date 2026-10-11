/**
 * theme.ts
 *
 * アプリ全体で使うデザイントークン定義。
 * すべての画面のスタイリングはここから値を読み込んで使用する。
 *
 * v2(2026-10): 白基調+ネオンライム+黒の3色構成に刷新。
 * 鮮やかな青・ラベンダーは廃止(使わない)。背景にくすんだ色・ベージュ系は使わない。
 */

export const colors = {
  /** ポイントになる箇所だけに使う(円・下線・ピルの文字・ボタンのアクセント) */
  neonLime: '#D4F238',
  /** 文字とボタン */
  black: '#0F0F0F',
  /** 画面の基調色 */
  white: '#FFFFFF',
  /** 補助テキスト・非アクティブ要素 */
  textSecondary: '#8A8A8A',
  /** 境界線・バーの背景 */
  lightBorder: '#EDEDED',

  // --- 意味づけされたセマンティックカラー ---
  /** 正解・成功を示す色(neonLimeのエイリアス) */
  success: '#D4F238',
  /** 不正解・エラーを示す色 */
  error: '#FF6B6B',
  /** エラー系の背景色(errorより薄い) */
  errorBackground: '#FFE1E1',
} as const;

/** カード・ボタンの角丸 */
export const borderRadius = 16;

export const theme = {
  colors,
  borderRadius,
} as const;

export default theme;
