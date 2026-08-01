"use client";
import { useEffect, useState } from "react";
import { Wallet, CreditCard, Landmark, TrendingUp, Plus, X, RefreshCw, AlertCircle, Pencil, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Account } from "@/lib/types";

const EMPTY_FORM = { name: "", type: "checking", balance: "", creditLimit: "", closingDay: "", dueDay: "", color: "#6366f1" };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAccounts = async () => {
    const res = await api.get("/accounts/");
    setAccounts(res.data);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const openCreate = () => { setEditingAccount(null); setForm(EMPTY_FORM); setModalOpen(true); };

  const openEdit = (acc: Account) => {
    setEditingAccount(acc);
    setForm({
      name: acc.name, type: acc.type, balance: String(acc.balance), color: acc.color,
      creditLimit: acc.credit_limit ? String(acc.credit_limit) : "",
      closingDay: acc.closing_day ? String(acc.closing_day) : "",
      dueDay: acc.due_day ? String(acc.due_day) : "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta conta? As transações associadas serão removidas.")) return;
    await api.delete(`/accounts/${id}`);
    fetchAccounts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, type: form.type, color: form.color,
      balance: form.type !== "credit" ? parseFloat(form.balance.replace(",", ".") || "0") : 0,
      credit_limit: form.type === "credit" ? parseFloat(form.creditLimit.replace(",", ".") || "0") : null,
      closing_day: form.type === "credit" ? parseInt(form.closingDay || "1") : null,
      due_day: form.type === "credit" ? parseInt(form.dueDay || "1") : null,
    };
    try {
      if (editingAccount) {
        await api.patch(`/accounts/${editingAccount.id}`, { name: form.name, color: form.color, credit_limit: payload.credit_limit, closing_day: payload.closing_day, due_day: payload.due_day });
      } else {
        await api.post("/accounts/", payload);
      }
      setModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao salvar conta");
    }
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalPatrimony = accounts.filter(a => a.type !== "credit").reduce((acc, curr) => acc + Number(curr.balance), 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Minhas Contas</h2>
          <p className="text-xs text-gray-400 mt-1">Gerencie suas contas bancárias e cartões de crédito</p>
        </div>
        <button onClick={() => { api.post("/accounts/process-invoices").catch(() => {}); setIsProcessing(true); setTimeout(() => { fetchAccounts(); setIsProcessing(false); }, 1000); }}
          disabled={isProcessing}
          className="flex items-center gap-2 bg-[#1f2937] border border-gray-700 hover:bg-gray-800 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={isProcessing ? "animate-spin" : ""} /> Atualizar Faturas
        </button>
      </div>

      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Patrimônio Total</span>
        <h3 className="text-3xl font-bold mt-2 text-white">{fmt(totalPatrimony)}</h3>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-200/70">
          <AlertCircle size={14} /><span>Não inclui limites de crédito disponíveis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: acc.color }} />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                  {acc.type === 'credit' ? <CreditCard size={20} style={{ color: acc.color }} /> :
                   acc.type === 'investment' ? <TrendingUp size={20} style={{ color: acc.color }} /> :
                   acc.type === 'cash' ? <Landmark size={20} style={{ color: acc.color }} /> :
                   <Wallet size={20} style={{ color: acc.color }} />}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-200 text-sm">{acc.name}</h4>
                  <span className="text-[11px] text-gray-500 capitalize">{acc.type === 'credit' ? 'Cartão de Crédito' : acc.type === 'savings' ? 'Poupança' : acc.type === 'cash' ? 'Dinheiro' : acc.type === 'investment' ? 'Investimento' : 'Conta Corrente'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
            {acc.type === 'credit' ? (
              <div className="space-y-3 mt-2">
                <div>
                  <span className="text-xs text-gray-500">Fatura Atual</span>
                  <p className="text-lg font-bold text-red-400">{fmt(Number(acc.balance))}</p>
                </div>
                <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
                  <span>Limite: {fmt(Number(acc.credit_limit))}</span>
                  <span>Vence dia {acc.due_day}</span>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Saldo Disponível</span>
                <p className={`text-lg font-bold ${Number(acc.balance) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(Number(acc.balance))}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={openCreate}
        className="fixed bottom-20 md:bottom-8 right-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all hover:scale-110 z-40">
        <Plus size={24} />
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-md rounded-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editingAccount ? "Editar Conta" : "Nova Conta"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome da Conta</label>
                <input type="text" placeholder="Ex: Nubank, Carteira..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              {!editingAccount && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="credit">Cartão de Crédito</option>
                    <option value="cash">Dinheiro em Espécie</option>
                    <option value="investment">Investimento</option>
                  </select>
                </div>
              )}
              {form.type !== "credit" && !editingAccount && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Saldo Inicial</label>
                  <input type="number" step="0.01" placeholder="0.00" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    className="w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              )}
              {(form.type === "credit" || editingAccount?.type === "credit") && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Limite do Cartão</label>
                    <input type="number" step="0.01" placeholder="1000.00" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                      className="w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Dia Fechamento</label>
                      <input type="number" placeholder="Ex: 5" value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
                        className="w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Dia Vencimento</label>
                      <input type="number" placeholder="Ex: 10" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                        className="w-full bg-[#1f2937] rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-400">Cor</label>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg bg-gray-800 cursor-pointer" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium text-sm text-white transition-colors mt-2">
                {editingAccount ? "Salvar Alterações" : "Criar Conta"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
