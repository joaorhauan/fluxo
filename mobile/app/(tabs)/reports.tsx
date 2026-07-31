// ===== mobile/app/(tabs)/reports.tsx =====
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Download } from "lucide-react-native";
import api from "../../src/lib/api";
import { getToken } from "../../src/lib/storage";
import { format, subMonths, addMonths, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

interface ReportData {
  totals: { income: number; expense: number; balance: number; income_mom: number; expense_mom: number; };
  by_category: { name: string; icon: string; color: string; amount: number; mom_percent: number; }[];
  savings_rate: number;
}

export default function ReportsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await api.get(`/reports/summary?year=${year}&month=${month}`);
      setData(res.data);
    } catch (error) {
      console.error("Erro ao carregar relatórios", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(currentDate); }, [currentDate]);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleExport = async (type: "csv" | "excel") => {
    try {
      const token = await getToken();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const start = `${year}-${month}-01`;
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      
      const ext = type === "csv" ? "csv" : "xlsx";
      const localUri = `${FileSystem.documentDirectory}fluxo_relatorio_${year}_${month}.${ext}`;

      const downloadResult = await FileSystem.downloadAsync(
        `${api.defaults.baseURL}/reports/export/${type}?start=${start}&end=${end}`,
        localUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        // Tenta ler o erro retornado pelo backend se houver
        let errorMsg = "Falha ao gerar o arquivo.";
        try {
          const errorContent = await FileSystem.readAsStringAsync(downloadResult.uri);
          const parsed = JSON.parse(errorContent);
          if (parsed.detail) errorMsg = parsed.detail;
        } catch (e) {
          // Ignora se não for JSON
        }
        Alert.alert("Atenção", errorMsg);
      }
    } catch (err: any) {
      Alert.alert("Erro", "Falha de conexão ao exportar o relatório.");
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading && !data) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  if (!data) return <View style={styles.center}><Text style={{color: '#fff'}}>Erro ao carregar</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <View style={styles.exportRow}>
          <TouchableOpacity onPress={() => handleExport("csv")} style={styles.exportBtn}>
            <Download size={14} color="#d1d5db" />
            <Text style={styles.exportText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExport("excel")} style={[styles.exportBtn, { backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "rgba(16, 185, 129, 0.4)" }]}>
            <Download size={14} color="#34d399" />
            <Text style={[styles.exportText, { color: "#34d399" }]}>Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}><ChevronLeft size={20} color="#9ca3af" /></TouchableOpacity>
            <Text style={styles.monthText}>{format(currentDate, "MMMM yyyy", { locale: ptBR })}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}><ChevronRight size={20} color="#9ca3af" /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Receitas</Text>
            <Text style={[styles.cardValue, { color: "#34d399" }]}>{fmt(data.totals.income)}</Text>
            <View style={styles.momRow}>
              {data.totals.income_mom >= 0 ? <TrendingUp size={12} color="#34d399" /> : <TrendingDown size={12} color="#f87171" />}
              <Text style={[styles.momText, { color: data.totals.income_mom >= 0 ? "#34d399" : "#f87171" }]}>
                {data.totals.income_mom > 0 ? "+" : ""}{data.totals.income_mom.toFixed(1)}% vs anterior
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Despesas</Text>
            <Text style={[styles.cardValue, { color: "#f87171" }]}>{fmt(data.totals.expense)}</Text>
            <View style={styles.momRow}>
              {data.totals.expense_mom <= 0 ? <TrendingDown size={12} color="#34d399" /> : <TrendingUp size={12} color="#f87171" />}
              <Text style={[styles.momText, { color: data.totals.expense_mom <= 0 ? "#34d399" : "#f87171" }]}>
                {data.totals.expense_mom > 0 ? "+" : ""}{data.totals.expense_mom.toFixed(1)}% vs anterior
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo do Mês</Text>
          <Text style={[styles.balanceValue, { color: data.totals.balance >= 0 ? "#fff" : "#f87171" }]}>{fmt(data.totals.balance)}</Text>
          <Text style={styles.savingsText}>
            Taxa de poupança: <Text style={{ color: data.savings_rate >= 20 ? "#34d399" : "#fbbf24" }}>{data.savings_rate.toFixed(1)}%</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparativo de Despesas</Text>
          {data.by_category.map((cat, i) => (
            <View key={i} style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.catIcon, { backgroundColor: cat.color }]}>
                  <Text>{cat.icon}</Text>
                </View>
                <View>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catAmount}>{fmt(cat.amount)}</Text>
                </View>
              </View>
              <View style={[styles.badge, { backgroundColor: cat.mom_percent > 0 ? "rgba(248, 113, 113, 0.1)" : cat.mom_percent < 0 ? "rgba(52, 211, 153, 0.1)" : "#1f2937" }]}>
                {cat.mom_percent > 0 ? <TrendingUp size={12} color="#f87171" /> : cat.mom_percent < 0 ? <TrendingDown size={12} color="#34d399" /> : null}
                <Text style={[styles.badgeText, { color: cat.mom_percent > 0 ? "#f87171" : cat.mom_percent < 0 ? "#34d399" : "#9ca3af" }]}>
                  {cat.mom_percent > 0 ? "+" : ""}{cat.mom_percent.toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
          {data.by_category.length === 0 && <Text style={styles.emptyText}>Sem dados no período</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  center: { flex: 1, backgroundColor: "#030712", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 10 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  exportRow: { flexDirection: "row", gap: 8 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1f2937", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#374151" },
  exportText: { color: "#d1d5db", fontSize: 12, fontWeight: "600" },
  monthSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111827", padding: 8, borderRadius: 12, borderWidth: 1, borderColor: "#1f2937" },
  arrowBtn: { padding: 8 },
  monthText: { color: "#fff", fontSize: 16, fontWeight: "500", textTransform: "capitalize" },
  cardsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: "#111827", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#1f2937" },
  cardLabel: { color: "#9ca3af", fontSize: 12, marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  momRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  momText: { fontSize: 10 },
  balanceCard: { marginHorizontal: 20, backgroundColor: "#1e1b4b", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.3)", marginBottom: 24 },
  balanceLabel: { color: "#a5b4fc", fontSize: 12, marginBottom: 8 },
  balanceValue: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  savingsText: { color: "#c7d2fe", fontSize: 12 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 16 },
  catRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111827", padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#1f2937" },
  catLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  catName: { color: "#fff", fontSize: 14, fontWeight: "500" },
  catAmount: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  emptyText: { color: "#6b7280", textAlign: "center", marginTop: 20 },
});
