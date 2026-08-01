"use client";
import { useEffect, useState } from "react";
import { Plus, Paperclip, Upload, CheckSquare, Square, ChevronLeft, ChevronRight, X, Tag, Pencil, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Transaction, Category, Account } from "@/lib/types";

const EMPTY_TX = {
  type: "expense", amount: "", description: "", date: new Date().toISOString().slice(0, 10),
  due_date: "", account_id: "", category_id: "", installments: "1", recurrence: "none", is_paid: true, notes: ""
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<number[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeTxId, setActiveTxId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txForm, setTxForm] = useState(EMPTY_TX);
  const [quickCategoryModalOpen, setQuickCategoryModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", icon: "🏷️", color: "#6366f1" });

  const fetchTransactions = async () => {
    let query = `/transactions/?skip=${(page - 1) * 20}&limit=20`;
    if (startDate) query += `&start=${startDate}`;
    if (endDate) query += `&end=${endDate}`;
    const res = await api.get(query);
    setTransactions(res.data);
  };

  const fetchMetadata = async () => {
    const [catRes, accRes] = await Promise.all([api.get("/categories/"), api.get("/accounts/")]);
    setCategories(catRes.data);
    setAccounts(accRes.data);
    if (accRes.data.length > 0) setTxForm(prev => ({ ...prev, account_id: String(accRes.data[0].id) }));
  };

  useEffect(() => { fetchMetadata(); }, []);
  useEffect(() => { fetchTransactions(); }, [page, startDate, endDate]);

  const openCreate = () => { setEditingTx(null); setTxForm(EMPTY_TX); setModalOpen(true); };

  const openEdit = (t: Transaction) => {
    setEditingTx(t);
    setTxForm({
      type: t.type, amount: String(t.amount), description: t.description,
      date: t.date, due_date: t.due_date || "", account_id: String(t.account_id),
      category_id: t.category_id ? String(t.category_id) : "",
      installments: "1", recurrence: t.recurrence || "none",
      is_paid: t.is_paid, notes: t.notes || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta transação?")) return;
    await api.delete(`/transactions/${id}`);
    fetchTransactions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.description || !txForm.account_id) { alert("Preencha o valor, descrição e conta."); return; }
    try {
      const payload = {
        type: txForm.type, amount: parseFloat(txForm.amount.replace(",", ".")),
        description: txForm.description, date: txForm.date,
        due_date: txForm.due_date || null, account_id: Number(txForm.account_id),
        category_id: txForm.category_id ? Number(txForm.category_id) : null,
        installments: parseInt(txForm.installments || "1"),
        recurrence: txForm.recurrence, is_paid: txForm.is_paid, notes: txForm.notes || null,
      };
      if (editingTx) {
        await api.patch(`/transactions/${editingTx.id}`, {
          amount: payload.amount, description: payload.description,
          date: payload.date, category_id: payload.category_id,
          is_paid: payload.is_paid, notes: payload.notes,
        });
      } else {
        await api.post("/transactions/", payload);
      }
      setModalOpen(false);
      fetchTransactions();
    } catch (err: any) { alert(err.response?.data?.detail || "Erro ao salvar transação"); }
  };

  const handleBulkCategorize = async () => {
    if (!bulkCategoryId || selectedTxIds.length === 0) return;
    await api.post("/transactions/bulk-categorize", { category_id: Number(bulkCategoryId), transaction_ids: selectedTxIds });
    setIsBulkMode(false); setSelectedTxIds([]); setBulkCategoryId(""); fetchTransactions();
  };

  const handleOpenReceipt = async (txId: number) => {
    try {
      const response = await api.get(`/transactions/${txId}/attachment`, { responseType: 'blob' });
      const fileURL = URL.createObjectURL(response.data);
      window.open(fileURL, '_blank');
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch { alert("Não foi possível carregar o anexo."); }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !activeTxId) return;
    const formData = new FormData(); formData.append("file", selectedFile);
    await api.post(`/transactions/${activeTxId}/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    setUploadModalOpen(false); setSelectedFile(null); setActiveTxId(null); fetchTransactions();
  };

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/categories/", { name: catForm.name, type: txForm.type, icon: catForm.icon || "🏷️", color: catForm.color });
    setCategories(prev => [...prev, res.data]);
    setTxForm(prev => ({ ...prev, category_id: String(res.data.id) }));
    setQuickCategoryModalOpen(false);
    setCatForm({ name: "", icon: "🏷️", color: "#6366f1" });
  };

  const toggleSelection = (id: number) => setSelectedTxIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const inputCls = "w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl md:text-2xl font-bold">Transações</h2>
        <button onClick={() => { setIsBulkMode(!isBulkMode); setSelectedTxIds([]); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${isBulkMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'}`}>
          {isBulkMode ? "Cancelar Seleção" : "Múltipla Seleção"}
        </button>
      </div>

      {isBulkMode && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-indigo-300">{selectedTxIds.length} selecionada(s)</span>
            <select value={bulkCategoryId} onChange={(e) => setBulkCategoryId(e.target.value)} className="bg-[#1f2937] rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none">
              <option value="">Selecione a Categoria...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <button onClick={handleBulkCategorize} disabled={!bulkCategoryId || selectedTxIds.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium text-white">
            Aplicar Categoria
          </button>
        </div>
      )}

      <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">De:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#1f2937] rounded-lg px-3 py-1.5 text-xs text-gray-200 outline-none [color-scheme:dark]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Até:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[#1f2937] rounded-lg px-3 py-1.5 text-xs text-gray-200 outline-none [color-scheme:dark]" />
        </div>
        {(startDate || endDate) && <button onClick={() => { setStartDate(""); setEndDate(""); }} className="text-xs text-indigo-400 hover:underline">Limpar</button>}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="divide-y divide-gray-800">
          {transactions.map(t => (
            <div key={t.id} className={`p-4 flex items-center justify-between transition-colors ${selectedTxIds.includes(t.id) ? 'bg-indigo-950/20' : 'hover:bg-gray-800/30'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isBulkMode && (
                  <button onClick={() => toggleSelection(t.id)} className="text-indigo-400 flex-shrink-0">
                    {selectedTxIds.includes(t.id) ? <CheckSquare size={20} /> : <Square size={20} className="text-gray-600" />}
                  </button>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-200 truncate">{t.description}</p>
                    {t.attachment_url && (
                      <button onClick={() => handleOpenReceipt(t.id)} className="text-indigo-400 hover:text-indigo-300 flex-shrink-0"><Paperclip size={14} /></button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">{t.date}</span>
                    {t.category_name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: t.category_color ? `${t.category_color}20` : undefined, color: t.category_color ?? undefined }}>
                        {t.category_icon} {t.category_name}
                      </span>
                    )}
                    {!t.is_paid && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">Pendente</span>}
                    {t.installment_total && <span className="text-[10px] text-gray-500">{t.installment_current}/{t.installment_total}x</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : t.type === 'transfer' ? 'text-indigo-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : t.type === 'transfer' ? '↔' : '-'}{fmt(Number(t.amount))}
                </span>
                {!isBulkMode && (
                  <>
                    <button onClick={() => openEdit(t)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 bg-gray-800 hover:bg-red-400/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    <button onClick={() => { setActiveTxId(t.id); setUploadModalOpen(true); }} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"><Upload size={13} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {transactions.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">Nenhuma transação encontrada.</div>}
        </div>
        <div className="p-4 bg-gray-950/50 border-t border-gray-800 flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /> Anterior</button>
          <span className="text-xs text-gray-500">Página {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={transactions.length < 20} className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white disabled:opacity-30">Próxima <ChevronRight size={16} /></button>
        </div>
      </div>

      <button onClick={openCreate}
        className="fixed bottom-20 md:bottom-8 right-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all hover:scale-110 z-40">
        <Plus size={24} />
      </button>

      {/* Modal criar/editar transação */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-lg rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editingTx ? "Editar Transação" : "Nova Transação"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingTx && (
                <div className="grid grid-cols-3 gap-2">
                  {(["expense", "income", "transfer"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTxForm({ ...txForm, type: t, category_id: "" })}
                      className={`py-2 text-sm font-semibold rounded-lg transition-colors ${txForm.type === t ? t === 'income' ? 'bg-emerald-600 text-white' : t === 'expense' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white' : 'bg-[#1f2937] text-gray-400 hover:text-white'}`}>
                      {t === 'expense' ? 'Despesa' : t === 'income' ? 'Receita' : 'Transferência'}
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Valor *</label>
                <input type="number" step="0.01" placeholder="0,00" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Descrição *</label>
                <input type="text" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data *</label>
                  <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className={inputCls + " [color-scheme:dark]"} required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Vencimento</label>
                  <input type="date" value={txForm.due_date} onChange={(e) => setTxForm({ ...txForm, due_date: e.target.value })} className={inputCls + " [color-scheme:dark]"} />
                </div>
              </div>
              {!editingTx && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Conta *</label>
                  <select value={txForm.account_id} onChange={(e) => setTxForm({ ...txForm, account_id: e.target.value })} className={inputCls} required>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
              )}
              {txForm.type !== "transfer" && (
                <div className="bg-[#1f2937]/50 border border-gray-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5"><Tag size={14} className="text-indigo-400" /> Categoria</label>
                    <button type="button" onClick={() => setQuickCategoryModalOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"><Plus size={12} /> Nova</button>
                  </div>
                  <select value={txForm.category_id} onChange={(e) => setTxForm({ ...txForm, category_id: e.target.value })} className={inputCls}>
                    <option value="">Sem Categoria</option>
                    {categories.filter(c => c.type === txForm.type).map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </div>
              )}
              {!editingTx && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Parcelas</label>
                    <input type="number" min="1" value={txForm.installments} onChange={(e) => setTxForm({ ...txForm, installments: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Recorrência</label>
                    <select value={txForm.recurrence} onChange={(e) => setTxForm({ ...txForm, recurrence: e.target.value })} className={inputCls}>
                      <option value="none">Única</option><option value="monthly">Mensal</option><option value="yearly">Anual</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_paid" checked={txForm.is_paid} onChange={(e) => setTxForm({ ...txForm, is_paid: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                <label htmlFor="is_paid" className="text-sm text-gray-200 font-medium">Já pago / recebido</label>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Observações</label>
                <textarea rows={2} value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} className={inputCls + " resize-none"} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium text-sm text-white transition-colors">
                {editingTx ? "Salvar Alterações" : "Salvar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {quickCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nova Categoria</h3>
              <button onClick={() => setQuickCategoryModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleQuickCreateCategory} className="space-y-4">
              <input type="text" placeholder="Nome" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className={inputCls} required />
              <input type="text" placeholder="Ícone (Emoji)" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} className={inputCls} />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium text-sm text-white">Criar e Selecionar</button>
            </form>
          </div>
        </div>
      )}

      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Enviar Comprovante</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500" />
              <button type="submit" disabled={!selectedFile} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-lg font-medium text-sm text-white">Enviar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
