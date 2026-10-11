/**
 * lib/mascot.ts
 *
 * マスコット(二宮金次郎像)のポーズ画像と、ホーム画面の挨拶メッセージ/ポーズの判定。
 * 画像は scripts/cut_mascot.py で assets/source/statue-sheet.jpg から切り出したもの。
 */
import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { getPracticedDateKeys, loadProgress, summarize, toLocalDateKey } from "./progress";

export type MascotPose = "wave" | "reading" | "bow" | "fistpump" | "thumbsup" | "walking";

export const MASCOT_IMAGES: Record<MascotPose, ImageSourcePropType> = {
  wave: require("../assets/mascot/wave.png"),
  reading: require("../assets/mascot/reading.png"),
  bow: require("../assets/mascot/bow.png"),
  fistpump: require("../assets/mascot/fistpump.png"),
  thumbsup: require("../assets/mascot/thumbsup.png"),
  walking: require("../assets/mascot/walking.png"),
};

/** 画像(縦600px基準)の横幅/高さ。表示幅の計算に使う */
const MASCOT_ASPECT: Record<MascotPose, number> = {
  wave: 347 / 600,
  reading: 308 / 600,
  bow: 328 / 600,
  fistpump: 285 / 600,
  thumbsup: 252 / 600,
  walking: 334 / 600,
};

/**
 * 画像の横方向で、頭の中心がどこにあるか(画像の幅に対する割合。0.5が中央)。
 * 切り出したPNGに0.1刻みの目盛りを重ねて、髪の左端〜耳の右端の中央を目で読み取った値。
 * (お辞儀は頭が大きく左に出るので、中央から約0.3も左にずれる)
 */
const MASCOT_HEAD_X: Record<MascotPose, number> = {
  wave: 0.42,
  reading: 0.33,
  bow: 0.2,
  fistpump: 0.4,
  thumbsup: 0.53,
  walking: 0.4,
};

/** 高さ height で表示したときの、画像の中心から頭までの横ずれ(px。左が負) */
export function mascotHeadOffset(pose: MascotPose, height: number): number {
  return (MASCOT_HEAD_X[pose] - 0.5) * MASCOT_ASPECT[pose] * height;
}

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

export interface MascotGreeting {
  message: string;
  /** ホームで表示するポーズ(久しぶり=bow / 連続3日以上=thumbsup / それ以外=wave) */
  pose: MascotPose;
}

/**
 * セッション中(アプリを開いている間)は同じメッセージ・ポーズを保持するため、
 * モジュールスコープにキャッシュする。Home画面を何度再訪しても再抽選されず、
 * アプリを再起動すればまた新しく判定される(モジュールが再読み込みされるため)。
 */
let cachedGreeting: MascotGreeting | null = null;

function dayKeyOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toLocalDateKey(d);
}

async function decideGreeting(): Promise<MascotGreeting> {
  const progress = await loadProgress();
  const stats = summarize(progress);

  // 1. 記録が一件もない(初回起動)
  if (stats.total === 0) {
    return { message: pickRandom(MESSAGES_NO_RECORD), pose: "wave" };
  }

  // 2. 昨日は記録があるが、一昨日以前は途切れていた(サボった後の復帰)
  const practicedDays = getPracticedDateKeys(progress.records);
  const practicedToday = practicedDays.has(dayKeyOffset(0));
  const practicedYesterday = practicedDays.has(dayKeyOffset(1));
  const practicedDayBeforeYesterday = practicedDays.has(dayKeyOffset(2));

  // 「久しぶり」のポーズ: 昨日・今日とも記録がない(2日以上空いた)場合も含める
  const longAbsence = !practicedToday && !practicedYesterday;

  if (practicedYesterday && !practicedDayBeforeYesterday) {
    return { message: pickRandom(MESSAGES_COMEBACK), pose: "bow" };
  }

  // 3. 連続学習日数が3日以上
  if (stats.streakDays >= 3) {
    return {
      message: pickRandom(MESSAGES_STREAK).replace("{days}", String(stats.streakDays)),
      pose: "thumbsup",
    };
  }

  const pose: MascotPose = longAbsence ? "bow" : "wave";

  // 4. いずれかの分野の正答率が80%以上(出題順で最初に該当したもの)
  const strongField = stats.byField.find((f) => f.total > 0 && f.accuracy >= 0.8);
  if (strongField) {
    return {
      message: pickRandom(MESSAGES_STRONG_FIELD).replace("{field}", strongField.field),
      pose,
    };
  }

  // 5. 通常時
  return { message: pickRandom(MESSAGES_NORMAL), pose };
}

/** 判定が終わるまでは null を返す(一瞬だけ別メッセージが見えるチラつきを防ぐ) */
export function useMascotGreeting(): MascotGreeting | null {
  const [greeting, setGreeting] = useState<MascotGreeting | null>(cachedGreeting);

  useEffect(() => {
    if (cachedGreeting) return; // このセッションで既に決定済みなら再判定しない

    let isActive = true;
    decideGreeting().then((result) => {
      cachedGreeting = result;
      if (isActive) setGreeting(result);
    });
    return () => {
      isActive = false;
    };
  }, []);

  return greeting;
}
