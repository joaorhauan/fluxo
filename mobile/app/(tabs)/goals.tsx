// ===== mobile/app/(tabs)/goals.tsx =====
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Target, X, Trash2 } from "lucide-react-native";
import api from "../../src/lib/api";

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  const [form, setForm] = useState({ name: "", target_amount: "", deadline: "", color: "#10b981" });
  const [depositAmount, setDepositAmount] = useState("");

  const fetchData = async () => {
    try {
      const res = await api.get("/goals/");
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.target_amount) {
      Alert.alert("Atenção", "Preencha o nome e o valor alvo");
      return;
    }
    try {
      await api.post("/goals/", {
        name: form.name,
        target_amount: parseFloat(form.target_amount.replace(',', '.')),
        deadline: form.deadline || null,
        color: form.color,
      });
      setShowModal(false);
      setForm({ name: "", target_amount: "", deadline: "", color: "#10b981" });
      fetchData();
    } catch (err) {
      Alert.alert("Erro", "Falha ao criar meta");
    }
  };

  const handleDeposit = async () => {
    if (!selectedGoal || !depositAmount) return;
    try {
      const newAmount = Number(selectedGoal.current_amount) + parseFloat(depositAmount.replace(',', '.'));
      await api.patch(`/goals/${selectedGoal.id}`, { current_amount: newAmount });
      setShowDepositModal(false);
      setDepositAmount("");
      setSelectedGoal(null);
      fetchData();
    } catch (err) {
      Alert.alert("Erro", "Falha ao adicionar valor");
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Deletar", "Tem certeza que deseja apagar esta meta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/goals/${id}`);
            fetchData();
          } catch (err) {
            Alert.alert("Erro", "Falha ao apagar");
          }
      }}
    ]);
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Metas</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {goals.map((g) => {
          const progress = Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) || 0;
          return (
            <View key={g.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 10 }}>
                  <View style={[styles.iconWrap, { backgroundColor: g.color + "33" }]}>
                    <Target size={20} color={g.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName} numberOfLines={1}>{g.name}</Text>
                    <Text style={styles.goalTarget}>Alvo: {fmt(Number(g.target_amount))}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(g.id)} style={{ padding: 8 }}>
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.progressRow}>
                <Text style={styles.currentAmount}>{fmt(Number(g.current_amount))}</Text>
                <Text style={styles.percentText}>{progress.toFixed(1)}%</Text>
              </View>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { backgroundColor: g.color, width: `${progress}%` }]} />
              </View>

              <TouchableOpacity 
                style={styles.addBtn}
                onPress={() => { setSelectedGoal(g); setShowDepositModal(true); }}
              >
                <Plus size={16} color="#d1d5db" />
                <Text style={styles.addBtnText}>Adicionar Valor</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        {goals.length === 0 && <Text style={styles.empty}>Nenhuma meta criada</Text>}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal Nova Meta */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Meta</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Nome da meta (ex: Viagem)" placeholderTextColor="#6b7280" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <TextInput style={styles.input} placeholder="Valor Alvo" placeholderTextColor="#6b7280" keyboardType="numeric" value={form.target_amount} onChangeText={(v) => setForm({ ...form, target_amount: v })} />
            <TextInput style={styles.input} placeholder="Data limite (YYYY-MM-DD) opcional" placeholderTextColor="#6b7280" value={form.deadline} onChangeText={(v) => setForm({ ...form, deadline: v })} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Criar Meta</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Adicionar Valor */}
      <Modal visible={showDepositModal} animationType="fade" transparent onRequestClose={() => setShowDepositModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guardar Dinheiro</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            <Text style={{ color: "#9ca3af", marginBottom: 16 }}>Meta: {selectedGoal?.name}</Text>
            <TextInput style={styles.input} placeholder="Valor a adicionar" placeholderTextColor="#6b7280" keyboardType="numeric" value={depositAmount} onChangeText={setDepositAmount} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleDeposit}>
              <Text style={styles.saveBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  header: { padding: 20, paddingBottom: 10 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  card: { backgroundColor: "#111827", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#1f2937" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  goalName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  goalTarget: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 },
  currentAmount: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  percentText: { color: "#6b7280", fontSize: 12, fontWeight: "600" },
  progressBarBg: { height: 8, backgroundColor: "#1f2937", borderRadius: 4, width: "100%", marginBottom: 16 },
  progressBarFill: { height: 8, borderRadius: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", paddingVertical: 10, borderRadius: 10, gap: 8 },
  addBtnText: { color: "#d1d5db", fontSize: 14, fontWeight: "600" },
  empty: { color: "#4b5563", textAlign: "center", marginTop: 40, fontSize: 14 },
  fab: { position: "absolute", bottom: 20, right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: "#4f46e5", justifyContent: "center", alignItems: "center", elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#111827", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "#f9fafb", fontSize: 18, fontWeight: "bold" },
  input: { backgroundColor: "#1f2937", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 12, fontSize: 15 },
  saveBtn: { backgroundColor: "#4f46e5", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
