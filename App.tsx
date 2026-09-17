import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./screens/HomeScreen";
import QuizScreen from "./screens/QuizScreen";
import ProgressScreen from "./screens/ProgressScreen";
import ResultScreen from "./screens/ResultScreen";
import type { RootStackParamList } from "./navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Progress" component={ProgressScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
