"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "@/lib/api";
import { Account, Category } from "@/lib/types";
import { format } from "date-fns";

interface Props {
  accounts: Account[];
  defaultType?: "expense" | "income" | "transfer";
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionModal({ accounts, defaultType = "expense", onClose, onSuccess }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    type: defaultType,
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    account_id: accounts[0]?.id?.toString() || "",
    destination_account_id: "",
    category_id: "",
    installments: "1",
    is_paid: true,
    due_date: "",
    notes: "",
    recurrence: "none",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/categories/").then((r) => setCategories(r.data)); }, []);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.type === "expense" && !form.category_id) {
      setError("Categoria é obrigatória para despesas");
      return;
    }
    
    if (form.type === "transfer" && !form.destination_account_id) {
      setError("Conta de destino é obrigatória para transferências");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await api.post("/transactions/", {
        ...form,
        amount: parseFloat(form.amount),
        account_id: Number(form.account_id),
        // Garante que destination_account_id só é enviado em transferências, prevenindo erros na API
        destination_account_id: form.type === "transfer" ? Number(form.destination_account_id) : null,
        category_id: form.type === "transfer" ? null : (form.category_id ? Number(form.category_id) : null),
        installments: Number(form.installments),
        due_date: form.due_date || null,
        notes: form.notes || null,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">Nova transação</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="flex gap-2">
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button key={t} type="button" onClick={() => set("type", t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  form.type === t
                    ? t === "income" ? "bg-emerald-600 text-white"
                    : t === "expense" ? "bg-red-600 text-white"
                    : "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400"
                }`}>
                {t === "expense" ? "Despesa" : t === "income" ? "Receita" : "Transferência"}
              </button>
            ))}
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs text-gray-400">Valor *</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
              className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0,00" required />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs text-gray-400">Descrição *</label>
            <input type="text" value={form.description} onChange={(e) => set("description", e.target.value)}
              className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Data */}
            <div>
              <label className="text-xs text-gray-400">Data *</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required />
            </div>

            {/* Vencimento — apenas para despesas */}
            {form.type === "expense" && (
              <div>
                <label className="text-xs text-gray-400">Vencimento</label>
                <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)}
                  className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            )}
          </div>

          {/* Conta origem */}
          <div>
            <label className="text-xs text-gray-400">{form.type === "transfer" ? "Conta origem *" : "Conta *"}</label>
            <select value={form.account_id} onChange={(e) => set("account_id", e.target.value)}
              className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Conta destino — apenas transferência */}
          {form.type === "transfer" && (
            <div>
              <label className="text-xs text-gray-400">Conta destino *</label>
              <select value={form.destination_account_id} onChange={(e) => set("destination_account_id", e.target.value)}
                className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required>
                <option value="">Selecione</option>
                {accounts.filter((a) => a.id.toString() !== form.account_id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          {/* Categoria — apenas receita e despesa */}
          {form.type !== "transfer" && (
            <div>
              <label className="text-xs text-gray-400">Categoria {form.type === "expense" ? "*" : ""}</label>
              <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}
                className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required={form.type === "expense"}>
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          )}

          {/* Parcelas e recorrência — apenas receita e despesa */}
          {form.type !== "transfer" && (
            <div className="grid grid-cols-2 gap-3">
              {form.type === "expense" && (
                <div>
                  <label className="text-xs text-gray-400">Parcelas</label>
                  <input type="number" min="1" max="360" value={form.installments} onChange={(e) => set("installments", e.target.value)}
                    className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400">Recorrência</label>
                <select value={form.recurrence} onChange={(e) => set("recurrence", e.target.value)}
                  className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="none">Única</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>
          )}

          {/* Pago */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_paid" checked={form.is_paid} onChange={(e) => set("is_paid", e.target.checked)}
              className="w-4 h-4 accent-indigo-500" />
            <label htmlFor="is_paid" className="text-sm text-gray-300">Já pago/recebido</label>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs text-gray-400">Observações</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
              className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors text-sm">
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}
