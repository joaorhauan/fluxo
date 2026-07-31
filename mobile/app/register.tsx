import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import api from "../src/lib/api";
import { saveToken, saveUser } from "../src/lib/storage";

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      await saveToken(data.access_token);
      await saveUser(data.user);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      Alert.alert("Erro", err.response?.data?.detail || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
        <Text style={styles.logo}>fluxo</Text>
        <Text style={styles.subtitle}>Crie sua conta</Text>
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#6b7280" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#6b7280" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#6b7280" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Criando..." : "Criar conta"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Já tem conta? Entrar</Text>
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
