/**
 * theme.ts
 *
 * アプリ全体で使うデザイントークン定義。
 * すべての画面のスタイリングはここから値を読み込んで使用する。
 *
 * v1確定版(2026-09)。ブランドカラー(vividBlue/neonLime/lavender)は
 * ホーム・演習・成績の3画面で使用実績あり。今後変更する場合はここを更新すれば全画面に反映される。
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
