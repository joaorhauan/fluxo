import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getToken } from "../src/lib/storage";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    getToken().then((token) => {
      router.replace(token ? "/(tabs)/dashboard" : "/login");
    });
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#030712" }}>
      <ActivityIndicator color="#6366f1" />
    </View>
  );
}
