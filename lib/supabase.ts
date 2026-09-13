import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabaseの接続情報が設定されていません。.env に EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください（.env.example を参照）。"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // このアプリは今のところ認証不要（読み取り専用の問題データ取得のみ）のため
    // セッションの自動永続化・リフレッシュは無効化しておく
    persistSession: false,
    autoRefreshToken: false,
  },
});
