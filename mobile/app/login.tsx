import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import api from "../src/lib/api";
import { saveToken, saveUser } from "../src/lib/storage";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await saveToken(data.access_token);
      await saveUser(data.user);
      router.replace("/(tabs)/dashboard");
    } catch {
      Alert.alert("Erro", "Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
        <Text style={styles.logo}>fluxo</Text>
        <Text style={styles.subtitle}>Controle seu dinheiro com clareza</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#6b7280" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#6b7280" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  logo: { fontSize: 40, fontWeight: "bold", color: "#818cf8", textAlign: "center", marginBottom: 8 },
  subtitle: { color: "#6b7280", textAlign: "center", marginBottom: 40 },
  input: { backgroundColor: "#111827", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: "#1f2937" },
  button: { backgroundColor: "#4f46e5", borderRadius: 12, padding: 16, marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16, textAlign: "center" },
  link: { color: "#818cf8", textAlign: "center", marginTop: 20 },
});
