// ===== mobile/app/(tabs)/transactions.tsx =====
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../src/lib/api";
import { getToken } from "../../src/lib/storage";
import { Transaction, Category } from "../../src/lib/types";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { CheckSquare, Square, Paperclip, UploadCloud, Camera, Image as ImageIcon, FileText, X } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const FILTERS = [
  { label: "Hoje", start: () => format(new Date(), "yyyy-MM-dd"), end: () => format(new Date(), "yyyy-MM-dd") },
  { label: "7 dias", start: () => format(subDays(new Date(), 7), "yyyy-MM-dd"), end: () => format(new Date(), "yyyy-MM-dd") },
  { label: "Mês", start: () => format(startOfMonth(new Date()), "yyyy-MM-dd"), end: () => format(endOfMonth(new Date()), "yyyy-MM-dd") },
];

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFilter, setActiveFilter] = useState(2);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<number[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState("");

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [txIdForUpload, setTxIdForUpload] = useState<number | null>(null);

  const fetchData = async () => {
    const f = FILTERS[activeFilter];
    const [txRes, catRes] = await Promise.all([
      api.get(`/transactions/?start=${f.start()}&end=${f.end()}`),
      api.get("/categories/")
    ]);
    setTransactions(txRes.data);
    setCategories(catRes.data);
  };

  useEffect(() => { fetchData(); }, [activeFilter]);

  const onRefresh = useCallback(async () => { 
    setRefreshing(true); 
    await fetchData(); 
    setRefreshing(false); 
  }, [activeFilter]);

  const toggleSelection = (id: number) => {
    setSelectedTxIds((prev) => 
      prev.includes(id) ? prev.filter((txId) => txId !== id) : [...prev, id]
    );
  };

  const handleBulkCategorize = async () => {
    if (!bulkCategoryId || selectedTxIds.length === 0) return;
    try {
      await api.post("/transactions/bulk-categorize", {
        category_id: Number(bulkCategoryId),
        transaction_ids: selectedTxIds,
      });
      setIsBulkMode(false);
      setSelectedTxIds([]);
      setBulkCategoryId("");
      fetchData();
    } catch (err) {
      Alert.alert("Erro", "Falha ao categorizar transações");
    }
  };

  const openUploadModal = (id: number) => {
    setTxIdForUpload(id);
    setUploadModalVisible(true);
  };

  const processUpload = async (uri: string, name: string, mimeType: string) => {
    if (!txIdForUpload) return;
    try {
      const formData = new FormData();
      formData.append("file", { uri, name, type: mimeType } as any);

      await api.post(`/transactions/${txIdForUpload}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setUploadModalVisible(false);
      setTxIdForUpload(null);
      fetchData();
    } catch (err) {
      Alert.alert("Erro", "Falha ao enviar o anexo");
    }
  };

  const handleDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        const file = result.assets[0];
        await processUpload(file.uri, file.name, file.mimeType || "application/octet-stream");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao selecionar documento");
    }
  };

  const handleGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled) {
        const file = result.assets[0];
        const name = file.fileName || file.uri.split('/').pop() || "image.jpg";
        await processUpload(file.uri, name, file.mimeType || "image/jpeg");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao abrir a galeria");
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão negada", "Precisamos de acesso à câmera para tirar fotos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled) {
        const file = result.assets[0];
        const name = file.fileName || file.uri.split('/').pop() || "photo.jpg";
        await processUpload(file.uri, name, file.mimeType || "image/jpeg");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao abrir a câmera");
    }
  };

  const handleOpenReceipt = async (txId: number, url: string) => {
    try {
      const token = await getToken();
      const fileExt = url.split('.').pop() || 'pdf'; 
      const localUri = `${FileSystem.cacheDirectory}anexo_${txId}.${fileExt}`;

      const downloadResult = await FileSystem.downloadAsync(
        `${api.defaults.baseURL}/transactions/${txId}/attachment`,
        localUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert("Acesso Negado", "Você não tem permissão para ver este anexo.");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao visualizar o anexo.");
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const grouped = transactions.reduce((acc, t) => { if (!acc[t.date]) acc[t.date] = []; acc[t.date].push(t); return acc; }, {} as Record<string, Transaction[]>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={[styles.bulkToggleBtn, isBulkMode && styles.bulkToggleActive]} 
          onPress={() => { setIsBulkMode(!isBulkMode); setSelectedTxIds([]); }}
        >
          <Text style={[styles.bulkToggleText, isBulkMode && { color: "#fff" }]}>
            {isBulkMode ? "Cancelar Seleção" : "Múltipla Seleção"}
          </Text>
        </TouchableOpacity>
      </View>

      {isBulkMode && (
        <View style={styles.bulkActionContainer}>
          <Text style={styles.bulkCountText}>{selectedTxIds.length} selecionada(s)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bulkCategoryScroll}>
            {categories.map((c) => (
              <TouchableOpacity 
                key={c.id} 
                style={[styles.chipBtn, String(c.id) === bulkCategoryId && { backgroundColor: c.color }]} 
                onPress={() => setBulkCategoryId(String(c.id))}
              >
                <Text style={styles.chipText}>{c.icon} {c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={[styles.bulkApplyBtn, (!bulkCategoryId || selectedTxIds.length === 0) && { opacity: 0.5 }]} 
            disabled={!bulkCategoryId || selectedTxIds.length === 0}
            onPress={handleBulkCategorize}
          >
            <Text style={styles.bulkApplyText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}>
        <View style={styles.filters}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity key={f.label} style={[styles.filterBtn, activeFilter === i && styles.filterBtnActive]} onPress={() => setActiveFilter(i)}>
              <Text style={[styles.filterText, activeFilter === i && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Entradas</Text>
            <Text style={[styles.summaryValue, { color: "#34d399" }]}>{fmt(income)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saídas</Text>
            <Text style={[styles.summaryValue, { color: "#f87171" }]}>{fmt(expense)}</Text>
          </View>
        </View>

        <View style={{ padding: 20, paddingBottom: 100 }}>
          {Object.entries(grouped).map(([date, txs]) => (
            <View key={date} style={{ marginBottom: 20 }}>
              <Text style={styles.dateLabel}>{new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</Text>
              {txs.map((t) => (
                <TouchableOpacity 
                  key={t.id} 
                  activeOpacity={0.7}
                  onPress={() => isBulkMode ? toggleSelection(t.id) : null}
                  onLongPress={() => {
                    if (!isBulkMode) {
                      setIsBulkMode(true);
                      setSelectedTxIds([t.id]);
                    }
                  }}
                  style={[styles.txRow, isBulkMode && selectedTxIds.includes(t.id) && styles.txRowSelected]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    {isBulkMode && (
                      <View style={{ marginRight: 12 }}>
                        {selectedTxIds.includes(t.id) ? (
                          <CheckSquare size={20} color="#6366f1" />
                        ) : (
                          <Square size={20} color="#4b5563" />
                        )}
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                        {t.attachment_url && (
                          <TouchableOpacity onPress={() => handleOpenReceipt(t.id, t.attachment_url!)} style={{ padding: 4 }}>
                            <Paperclip size={14} color="#818cf8" />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        {t.category_name && (
                          <View style={[styles.badge, { backgroundColor: (t.category_color || "#6366f1") + "33" }]}>
                            <Text style={[styles.badgeText, { color: t.category_color || "#818cf8" }]}>{t.category_name}</Text>
                          </View>
                        )}
                        {!t.is_paid && (
                          <View style={[styles.badge, { backgroundColor: "rgba(250, 204, 21, 0.1)" }]}>
                            <Text style={[styles.badgeText, { color: "#facc15" }]}>Pendente</Text>
                          </View>
                        )}
                        {t.installment_total && <Text style={styles.txSub}>{t.installment_current}/{t.installment_total}x</Text>}
                      </View>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {!isBulkMode && (
                      <TouchableOpacity onPress={() => openUploadModal(t.id)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                        <UploadCloud size={20} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.txAmount, { color: t.type === "income" ? "#34d399" : t.type === "transfer" ? "#818cf8" : "#f87171" }]}>
                      {t.type === "income" ? "+" : t.type === "transfer" ? "↔" : "-"}{fmt(Number(t.amount))}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {Object.keys(grouped).length === 0 && <Text style={styles.empty}>Nenhuma transação no período</Text>}
        </View>
      </ScrollView>

      <Modal visible={uploadModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModalContent}>
            <View style={styles.uploadHeader}>
              <Text style={styles.uploadTitle}>Anexar Recibo</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleCamera}>
              <View style={styles.uploadIconWrap}><Camera size={22} color="#818cf8" /></View>
              <Text style={styles.uploadOptionText}>Tirar foto na hora</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleGallery}>
              <View style={styles.uploadIconWrap}><ImageIcon size={22} color="#34d399" /></View>
              <Text style={styles.uploadOptionText}>Escolher da galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleDocument}>
              <View style={styles.uploadIconWrap}><FileText size={22} color="#fbbf24" /></View>
              <Text style={styles.uploadOptionText}>Procurar documento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  headerRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16, paddingTop: 16 },
  bulkToggleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "transparent", borderWidth: 1, borderColor: "#1f2937" },
  bulkToggleActive: { backgroundColor: "#1f2937" },
  bulkToggleText: { color: "#9ca3af", fontSize: 12, fontWeight: "600" },
  bulkActionContainer: { backgroundColor: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.3)", borderWidth: 1, margin: 16, padding: 12, borderRadius: 16 },
  bulkCountText: { color: "#818cf8", fontWeight: "bold", marginBottom: 8 },
  bulkCategoryScroll: { marginBottom: 12 },
  chipBtn: { backgroundColor: "#1f2937", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipText: { color: "#d1d5db", fontSize: 12 },
  bulkApplyBtn: { backgroundColor: "#4f46e5", padding: 12, borderRadius: 10, alignItems: "center" },
  bulkApplyText: { color: "#fff", fontWeight: "bold" },
  filters: { flexDirection: "row", padding: 16, gap: 8 },
  filterBtn: { flex: 1, backgroundColor: "#111827", borderRadius: 10, padding: 10, alignItems: "center" },
  filterBtnActive: { backgroundColor: "#4f46e5" },
  filterText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  summary: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: "#111827", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1f2937" },
  summaryLabel: { color: "#9ca3af", fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "bold" },
  dateLabel: { color: "#6b7280", fontSize: 12, marginBottom: 8, textTransform: "capitalize" },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111827", borderRadius: 12, paddingLeft: 14, paddingRight: 10, paddingVertical: 14, marginBottom: 6, borderWidth: 1, borderColor: "#1f2937" },
  txRowSelected: { borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.1)" },
  txDesc: { color: "#d1d5db", fontSize: 14 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginRight: 6 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  txSub: { color: "#6b7280", fontSize: 11 },
  txAmount: { fontSize: 14, fontWeight: "bold", marginLeft: 4 },
  empty: { color: "#4b5563", textAlign: "center", marginTop: 60, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  uploadModalContent: { backgroundColor: "#111827", width: "100%", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#1f2937" },
  uploadHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  uploadTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  uploadOptionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1f2937", padding: 16, borderRadius: 12, marginBottom: 12 },
  uploadIconWrap: { width: 40, alignItems: "center" },
  uploadOptionText: { color: "#fff", fontSize: 16, fontWeight: "500" },
});
