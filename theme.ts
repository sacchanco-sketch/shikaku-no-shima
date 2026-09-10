/**
 * theme.ts
 *
 * アプリ全体で使うデザイントークン定義。
 * すべての画面のスタイリングはここから値を読み込んで使用する。
 *
 * ⚠️ 仮の配色、後日変更予定
 */

export const colors = {
  /** ヘッダー背景・アクセント */
  vividBlue: '#5B5FEF',
  /** カード背景・アクセント・強調色 */
  neonLime: '#D4F238',
  /** カード背景・アクセント */
  lavender: '#C9A6F5',
  /** テキスト・ボタン背景 */
  black: '#0F0F0F',
  /** 背景・テキスト */
  white: '#FFFFFF',
  /** 補助テキスト・非アクティブアイコン */
  textSecondary: '#A0A0A0',
  /** 区切り線 */
  lightBorder: '#F0F0F0',
} as const;

/** カード・ボタンの角丸 */
export const borderRadius = 16;

export const theme = {
  colors,
  borderRadius,
} as const;

export default theme;
