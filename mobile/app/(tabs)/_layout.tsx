import { Tabs } from "expo-router";
import { LayoutDashboard, ArrowRightLeft, Target, PieChart, Wallet } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: "#1f2937",
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#818cf8",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transações",
          tabBarIcon: ({ color }) => <ArrowRightLeft size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Contas",
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Metas",
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
