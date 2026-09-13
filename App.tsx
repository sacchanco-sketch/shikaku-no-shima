import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./screens/HomeScreen";
import QuizScreen from "./screens/QuizScreen";

type Screen = "home" | "quiz";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <>
      {screen === "home" && <HomeScreen onStartQuiz={() => setScreen("quiz")} />}
      {screen === "quiz" && <QuizScreen onBack={() => setScreen("home")} />}
      <StatusBar style="auto" />
    </>
  );
}
