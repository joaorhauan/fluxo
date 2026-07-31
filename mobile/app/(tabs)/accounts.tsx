// ===== mobile/app/(tabs)/accounts.tsx =====
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreditCard, Wallet, Landmark, TrendingUp, AlertCircle, RefreshCw, Plus, X } from "lucide-react-native";
import api from "../../src/lib/api";
import { Account } from "../../src/lib/types";

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({ name: "", type: "checking", balance: "", credit_limit: "", closing_day: "", due_day: "", color: "#6366f1" });

  const fetchData = async () => {
    const res = await api.get("/accounts/");
    setAccounts(res.data);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleProcessInvoices = async () => {
    setIsProcessing(true);
    try {
      await api.post("/accounts/process-invoices");
      await fetchData();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert("Atenção", "O nome da conta é obrigatório");
      return;
    }
    try {
      await api.post("/accounts/", {
        name: form.name,
        type: form.type,
        balance: form.type !== "credit" ? parseFloat(form.balance || "0") : 0,
        credit_limit: form.type === "credit" ? parseFloat(form.credit_limit || "0") : null,
        closing_day: form.type === "credit" ? parseInt(form.closing_day || "1") : null,
        due_day: form.type === "credit" ? parseInt(form.due_day || "1") : null,
        color: form.color
      });
      setShowModal(false);
      setForm({ name: "", type: "checking", balance: "", credit_limit: "", closing_day: "", due_day: "", color: "#6366f1" });
      fetchData();
    } catch (err) {
      Alert.alert("Erro", "Falha ao criar conta");
    }
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const totalPatrimony = accounts
    .filter(a => a.type !== "credit")
    .reduce((acc, curr) => acc + Number(curr.balance), 0);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "open": return { bg: "rgba(52, 211, 153, 0.1)", text: "#34d399" };
      case "closed": return { bg: "rgba(250, 204, 21, 0.1)", text: "#facc15" };
      case "overdue": return { bg: "rgba(248, 113, 113, 0.1)", text: "#f87171" };
      default: return { bg: "#1f2937", text: "#9ca3af" };
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "open": return "Fatura Aberta";
      case "closed": return "Fatura Fechada";
      case "overdue": return "Fatura Atrasada";
      default: return "Desconhecido";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Minhas Contas</Text>
          <TouchableOpacity onPress={handleProcessInvoices} disabled={isProcessing} style={[styles.processBtn, isProcessing && { opacity: 0.5 }]}>
            <RefreshCw size={14} color="#d1d5db" />
            <Text style={styles.processBtnText}>Atualizar Faturas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.patrimonyCard}>
          <Text style={styles.patrimonyLabel}>Patrimônio Total</Text>
          <Text style={styles.patrimonyValue}>{fmt(totalPatrimony)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <AlertCircle size={14} color="#a5b4fc" style={{ marginRight: 4 }} />
            <Text style={styles.patrimonyHint}>Não inclui limites de crédito</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {accounts.map(acc => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={[styles.cardBorder, { backgroundColor: acc.color }]} />
              
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  {acc.type === 'credit' ? <CreditCard size={20} color={acc.color} /> : 
                   acc.type === 'investment' ? <TrendingUp size={20} color={acc.color} /> : 
                   acc.type === 'cash' ? <Landmark size={20} color={acc.color} /> : <Wallet size={20} color={acc.color} />}
                </View>
                <View>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountType}>{acc.type === 'credit' ? 'Cartão de Crédito' : 'Conta Corrente'}</Text>
                </View>
              </View>

              {acc.type === 'credit' ? (
                <View style={styles.creditInfo}>
                  <Text style={styles.balanceLabel}>Fatura Atual</Text>
                  <Text style={[styles.balanceValue, { color: "#f87171" }]}>{fmt(Number(acc.balance))}</Text>
                  
                  <View style={styles.limitRow}>
                    <Text style={styles.limitText}>Limite: {fmt(Number(acc.credit_limit))}</Text>
                    <Text style={styles.limitText}>Vence dia {acc.due_day}</Text>
                  </View>
                  
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min((Number(acc.balance) / Number(acc.credit_limit)) * 100, 100)}%` }]} />
                  </View>
                  
                  <View style={{ marginTop: 12, alignSelf: "flex-start" }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(acc.invoice_status).bg }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(acc.invoice_status).text }]}>
                        {getStatusText(acc.invoice_status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.debitInfo}>
                  <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                  <Text style={[styles.balanceValue, { color: Number(acc.balance) >= 0 ? "#34d399" : "#f87171" }]}>
                    {fmt(Number(acc.balance))}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nova Conta</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
              </View>
              
              <TextInput style={styles.input} placeholder="Nome (ex: Nubank)" placeholderTextColor="#6b7280" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
              
              <Text style={styles.label}>Tipo de Conta</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {[
                  { id: "checking", name: "Corrente" },
                  { id: "savings", name: "Poupança" },
                  { id: "credit", name: "Cartão de Crédito" },
                  { id: "cash", name: "Dinheiro" },
                  { id: "investment", name: "Investimento" },
                ].map((t) => (
                  <TouchableOpacity key={t.id} style={[styles.chipBtn, form.type === t.id && { backgroundColor: "#4f46e5" }]} onPress={() => setForm({ ...form, type: t.id })}>
                    <Text style={styles.chipText}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {form.type !== "credit" && (
                <TextInput style={styles.input} placeholder="Saldo Inicial" placeholderTextColor="#6b7280" keyboardType="numeric" value={form.balance} onChangeText={(v) => setForm({ ...form, balance: v })} />
              )}

              {form.type === "credit" && (
                <>
                  <TextInput style={styles.input} placeholder="Limite do Cartão" placeholderTextColor="#6b7280" keyboardType="numeric" value={form.credit_limit} onChangeText={(v) => setForm({ ...form, credit_limit: v })} />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Dia Fechamento" placeholderTextColor="#6b7280" keyboardType="numeric" value={form.closing_day} onChangeText={(v) => setForm({ ...form, closing_day: v })} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Dia Vencimento" placeholderTextColor="#6b7280" keyboardType="numeric" value={form.due_day} onChangeText={(v) => setForm({ ...form, due_day: v })} />
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Salvar Conta</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 10 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  processBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1f2937", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  processBtnText: { color: "#d1d5db", fontSize: 12, fontWeight: "600" },
  patrimonyCard: { marginHorizontal: 20, backgroundColor: "#1e1b4b", padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.3)", marginBottom: 20 },
  patrimonyLabel: { color: "#a5b4fc", fontSize: 13, marginBottom: 8, fontWeight: "500" },
  patrimonyValue: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  patrimonyHint: { color: "#a5b4fc", fontSize: 11 },
  accountCard: { backgroundColor: "#111827", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#1f2937", overflow: "hidden" },
  cardBorder: { position: "absolute", top: 0, left: 0, width: 4, height: "150%" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1f2937", justifyContent: "center", alignItems: "center", marginRight: 12 },
  accountName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  accountType: { color: "#9ca3af", fontSize: 12, textTransform: "capitalize", marginTop: 2 },
  creditInfo: {},
  debitInfo: {},
  balanceLabel: { color: "#9ca3af", fontSize: 12, marginBottom: 4 },
  balanceValue: { fontSize: 22, fontWeight: "bold" },
  limitRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 6 },
  limitText: { color: "#6b7280", fontSize: 12 },
  progressBarBg: { height: 6, backgroundColor: "#1f2937", borderRadius: 3, width: "100%" },
  progressBarFill: { height: 6, backgroundColor: "#6366f1", borderRadius: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "bold" },
  fab: { position: "absolute", bottom: 20, right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: "#4f46e5", justifyContent: "center", alignItems: "center", elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  modalContent: { backgroundColor: "#111827", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "#f9fafb", fontSize: 18, fontWeight: "bold" },
  input: { backgroundColor: "#1f2937", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 12, fontSize: 15 },
  label: { color: "#9ca3af", fontSize: 12, marginBottom: 8 },
  chipBtn: { backgroundColor: "#1f2937", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 10 },
  chipText: { color: "#d1d5db", fontSize: 13 },
  saveBtn: { backgroundColor: "#4f46e5", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
