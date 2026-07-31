// ===== mobile/app/(tabs)/dashboard.tsx =====
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, TrendingUp, TrendingDown, Wallet, X } from "lucide-react-native";
import api from "../../src/lib/api";
import { Account, Transaction, Category } from "../../src/lib/types";
import { getUser, removeToken, removeUser } from "../../src/lib/storage";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userName, setUserName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [form, setForm] = useState({ type: "expense", amount: "", description: "", date: new Date().toISOString().slice(0, 10), account_id: "", category_id: "" });
  const [catForm, setCatForm] = useState({ name: "", icon: "🏷️", color: "#6366f1" });
  
  const router = useRouter();

  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const end = now.toISOString().slice(0, 10);

  const fetchData = async () => {
    try {
      const [accRes, txRes, catRes] = await Promise.all([
        api.get("/accounts/"),
        api.get(`/transactions/?start=${start}&end=${end}`),
        api.get("/categories/"),
      ]);
      setAccounts(accRes.data);
      setTransactions(txRes.data);
      setCategories(catRes.data);
      if (!form.account_id && accRes.data.length > 0) {
        setForm((f) => ({ ...f, account_id: String(accRes.data[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getUser().then((u) => { if (u) setUserName(u.name); });
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await removeToken();
    await removeUser();
    router.replace("/login");
  };

  const handleCloseModal = () => {
    Keyboard.dismiss();
    setShowModal(false);
    setIsCreatingCategory(false);
  };

  const handleSave = async () => {
    if (!form.amount || !form.description || !form.account_id) {
      Alert.alert("Atenção", "Preencha valor, descrição e conta");
      return;
    }
    try {
      await api.post("/transactions/", {
        type: form.type, amount: parseFloat(form.amount.replace(',', '.')),
        description: form.description, date: form.date,
        account_id: Number(form.account_id),
        category_id: form.category_id ? Number(form.category_id) : null,
        installments: 1,
      });
      handleCloseModal();
      setForm({ type: "expense", amount: "", description: "", date: end, account_id: String(accounts[0]?.id || ""), category_id: "" });
      fetchData();
    } catch (err: any) {
      Alert.alert("Erro", err.response?.data?.detail || "Erro ao salvar");
    }
  };

  const handleCreateCategory = async () => {
    if (!catForm.name) {
      Alert.alert("Atenção", "Preencha o nome da categoria");
      return;
    }
    try {
      const res = await api.post("/categories/", {
        name: catForm.name,
        type: form.type,
        icon: catForm.icon || "🏷️",
        color: catForm.color
      });
      const updatedCategories = [...categories, res.data];
      setCategories(updatedCategories);
      setForm({ ...form, category_id: String(res.data.id) });
      setIsCreatingCategory(false);
      setCatForm({ name: "", icon: "🏷️", color: "#6366f1" });
    } catch (err) {
      Alert.alert("Erro", "Falha ao criar categoria");
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const grouped = transactions.reduce((acc, t) => { if (!acc[t.date]) acc[t.date] = []; acc[t.date].push(t); return acc; }, {} as Record<string, Transaction[]>);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {userName.split(" ")[0]} 👋</Text>
            <Text style={styles.month}>{now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={{ color: "#6b7280", fontSize: 12 }}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo total</Text>
          <Text style={[styles.balanceValue, { color: totalBalance >= 0 ? "#34d399" : "#f87171" }]}>{fmt(totalBalance)}</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 8 }]}>
            <TrendingUp size={18} color="#34d399" />
            <Text style={styles.cardLabel}>Receitas</Text>
            <Text style={[styles.cardValue, { color: "#34d399" }]}>{fmt(income)}</Text>
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <TrendingDown size={18} color="#f87171" />
            <Text style={styles.cardLabel}>Despesas</Text>
            <Text style={[styles.cardValue, { color: "#f87171" }]}>{fmt(expense)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Contas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {accounts.map((a) => (
            <View key={a.id} style={[styles.accountCard, { borderLeftColor: a.color }]}>
              <Wallet size={16} color={a.color} />
              <Text style={styles.accountName}>{a.name}</Text>
              <Text style={[styles.accountBalance, { color: Number(a.balance) >= 0 ? "#34d399" : "#f87171" }]}>{fmt(Number(a.balance))}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Transações do mês</Text>
        {Object.entries(grouped).map(([date, txs]) => (
          <View key={date} style={{ marginBottom: 16 }}>
            <Text style={styles.dateLabel}>{new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</Text>
            {txs.map((t) => (
              <View key={t.id} style={styles.txRow}>
                <Text style={styles.txDesc}>{t.description}</Text>
                <Text style={[styles.txAmount, { color: t.type === "income" ? "#34d399" : "#f87171" }]}>
                  {t.type === "income" ? "+" : "-"}{fmt(Number(t.amount))}
                </Text>
              </View>
            ))}
          </View>
        ))}
        {Object.keys(grouped).length === 0 && <Text style={styles.empty}>Nenhuma transação este mês</Text>}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          {isCreatingCategory ? (
            <View style={[styles.modalContent, { paddingBottom: 40 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={styles.modalTitle}>Criar Categoria</Text>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setIsCreatingCategory(false); }}><X size={24} color="#6b7280" /></TouchableOpacity>
              </View>
              <TextInput style={styles.modalInput} placeholder="Nome da categoria" placeholderTextColor="#6b7280" value={catForm.name} onChangeText={(v) => setCatForm({ ...catForm, name: v })} />
              <TextInput style={styles.modalInput} placeholder="Ícone (Emoji, ex: 🍔)" placeholderTextColor="#6b7280" value={catForm.icon} onChangeText={(v) => setCatForm({ ...catForm, icon: v })} />
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCategory}>
                <Text style={styles.saveBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={styles.modalTitle}>Nova transação</Text>
                <TouchableOpacity onPress={handleCloseModal}><X size={24} color="#6b7280" /></TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.typeRow}>
                  {["expense", "income"].map((t) => (
                    <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && { backgroundColor: t === "income" ? "#059669" : "#dc2626" }]} onPress={() => setForm({ ...form, type: t, category_id: "" })}>
                      <Text style={styles.typeBtnText}>{t === "income" ? "Receita" : "Despesa"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TextInput style={styles.modalInput} placeholder="Valor" placeholderTextColor="#6b7280" keyboardType="numeric" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} />
                <TextInput style={styles.modalInput} placeholder="Descrição" placeholderTextColor="#6b7280" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
                
                <Text style={styles.modalLabel}>Conta</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {accounts.map((a) => (
                    <TouchableOpacity key={a.id} style={[styles.chipBtn, String(a.id) === form.account_id && { backgroundColor: "#4f46e5" }]} onPress={() => setForm({ ...form, account_id: String(a.id) })}>
                      <Text style={styles.chipText}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <Text style={styles.modalLabel}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {categories.filter((c) => c.type === form.type).map((c) => (
                    <TouchableOpacity key={c.id} style={[styles.chipBtn, String(c.id) === form.category_id && { backgroundColor: c.color }]} onPress={() => setForm({ ...form, category_id: String(c.id) })}>
                      <Text style={styles.chipText}>{c.icon} {c.name}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.chipBtn, { backgroundColor: "#1f2937", borderStyle: "dashed", borderWidth: 1, borderColor: "#4b5563" }]} onPress={() => { Keyboard.dismiss(); setIsCreatingCategory(true); }}>
                    <Text style={styles.chipText}>+ Nova</Text>
                  </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { flex: 1, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#f9fafb" },
  month: { color: "#6b7280", fontSize: 13, marginTop: 2, textTransform: "capitalize" },
  balanceCard: { backgroundColor: "#111827", borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: "#1f2937" },
  balanceLabel: { color: "#9ca3af", fontSize: 13, marginBottom: 6 },
  balanceValue: { fontSize: 34, fontWeight: "bold" },
  row: { flexDirection: "row", marginBottom: 24 },
  card: { backgroundColor: "#111827", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1f2937" },
  cardLabel: { color: "#9ca3af", fontSize: 12, marginTop: 6, marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: "bold" },
  sectionTitle: { color: "#9ca3af", fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  accountCard: { backgroundColor: "#111827", borderRadius: 16, padding: 16, marginRight: 12, borderLeftWidth: 3, minWidth: 140, borderWidth: 1, borderColor: "#1f2937" },
  accountName: { color: "#d1d5db", fontSize: 13, marginTop: 8, marginBottom: 4 },
  accountBalance: { fontSize: 16, fontWeight: "bold" },
  dateLabel: { color: "#6b7280", fontSize: 12, marginBottom: 8, textTransform: "capitalize" },
  txRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: "#1f2937" },
  txDesc: { color: "#d1d5db", fontSize: 14, flex: 1, marginRight: 8 },
  txAmount: { fontSize: 14, fontWeight: "bold" },
  empty: { color: "#4b5563", textAlign: "center", marginTop: 40 },
  fab: { position: "absolute", bottom: 20, right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: "#4f46e5", justifyContent: "center", alignItems: "center", elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#111827", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalTitle: { color: "#f9fafb", fontSize: 18, fontWeight: "bold" },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, backgroundColor: "#1f2937", borderRadius: 10, padding: 12, alignItems: "center" },
  typeBtnText: { color: "#fff", fontWeight: "600" },
  modalInput: { backgroundColor: "#1f2937", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 12, fontSize: 15 },
  modalLabel: { color: "#9ca3af", fontSize: 12, marginBottom: 8 },
  chipBtn: { backgroundColor: "#1f2937", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 10 },
  chipText: { color: "#d1d5db", fontSize: 13 },
  saveBtn: { backgroundColor: "#4f46e5", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, marginBottom: 20 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
