import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, borderRadius } from "../theme";
import { getPracticedDateKeys, loadProgress, summarize, toLocalDateKey } from "../lib/progress";
import TurtleIcon from "./TurtleIcon";

const MESSAGES_NO_RECORD = [
  "はじめまして！ここから、少しずつ進めていこう。",
  "ようこそ！今日は1問だけでも、始めてみよう。",
  "はじめまして！あなたのペースで大丈夫だよ。",
];

const MESSAGES_COMEBACK = [
  "おかえり！今日の分、始めようか。",
  "また会えたね！今日はここから始めよう。",
  "おかえり！無理のないところから、で大丈夫。",
];

const MESSAGES_STREAK = [
  "{days}日目だね！ここまで続けてきたね。",
  "{days}日連続！積み重ねてきたものは、ちゃんとある。",
  "続いてるね！今日で{days}日目。",
];

const MESSAGES_STRONG_FIELD = [
  "{field}、得意になってきたね！",
  "{field}は安定してるよ！この調子で。",
  "{field}、いい感じだね！",
];

const MESSAGES_NORMAL = [
  "今日も来たね！1問、始めようか。",
  "さて、今日はどこからいく？",
  "のんびりでいいよ！今日の分、始めよう。",
];

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * セッション中(アプリを開いている間)は同じメッセージを保持するため、
 * モジュールスコープにキャッシュする。Home画面を何度再訪しても再抽選されず、
 * アプリを再起動すればまた新しく判定される(モジュールが再読み込みされるため)。
 */
let cachedMessage: string | null = null;

async function decideMessage(): Promise<string> {
  const progress = await loadProgress();
  const stats = summarize(progress);

  // 1. 記録が一件もない(初回起動)
  if (stats.total === 0) {
    return pickRandom(MESSAGES_NO_RECORD);
  }

  // 2. 昨日は記録があるが、一昨日以前は途切れていた(サボった後の復帰)
  const practicedDays = getPracticedDateKeys(progress.records);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBeforeYesterday = new Date();
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

  const practicedYesterday = practicedDays.has(toLocalDateKey(yesterday));
  const practicedDayBeforeYesterday = practicedDays.has(toLocalDateKey(dayBeforeYesterday));

  if (practicedYesterday && !practicedDayBeforeYesterday) {
    return pickRandom(MESSAGES_COMEBACK);
  }

  // 3. 連続学習日数が3日以上
  if (stats.streakDays >= 3) {
    return pickRandom(MESSAGES_STREAK).replace("{days}", String(stats.streakDays));
  }

  // 4. いずれかの分野の正答率が80%以上(出題順で最初に該当したもの)
  const strongField = stats.byField.find((f) => f.total > 0 && f.accuracy >= 0.8);
  if (strongField) {
    return pickRandom(MESSAGES_STRONG_FIELD).replace("{field}", strongField.field);
  }

  // 5. 通常時
  return pickRandom(MESSAGES_NORMAL);
}

export default function MascotGreeting() {
  const [message, setMessage] = useState<string | null>(cachedMessage);

  useEffect(() => {
    if (cachedMessage) return; // このセッションで既に決定済みなら再判定しない

    let isActive = true;
    decideMessage().then((text) => {
      cachedMessage = text;
      if (isActive) setMessage(text);
    });
    return () => {
      isActive = false;
    };
  }, []);

  // 判定が終わるまでは何も表示しない(一瞬だけ別メッセージが見えるチラつきを防ぐ)
  if (!message) return null;

  return (
    <View style={styles.bubble}>
      <TurtleIcon size={20} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.lightBorder,
    borderRadius: borderRadius,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: colors.black,
    lineHeight: 18,
  },
});
