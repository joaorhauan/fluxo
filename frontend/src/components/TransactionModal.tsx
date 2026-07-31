// ===== frontend/src/components/TransactionModal.tsx =====
"use client";
import { useState, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";
import api from "@/lib/api";
import { Account, Category } from "@/lib/types";

interface TransactionModalProps {
  accounts: Account[];
  defaultType: "expense" | "income" | "transfer";
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionModal({ accounts, defaultType, onClose, onSuccess }: TransactionModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Modal de criar categoria rápida
  const [quickCategoryModalOpen, setQuickCategoryModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", icon: "🏷️", color: "#6366f1" });

  const [form, setForm] = useState({
    type: defaultType,
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    due_date: "",
    account_id: accounts.length > 0 ? String(accounts[0].id) : "",
    category_id: "",
    installments: "1",
    recurrence: "none",
    is_paid: true,
    notes: ""
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/");
        setCategories(res.data);
      } catch (err) {
        console.error("Erro ao carregar categorias", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.account_id) {
      alert("Preencha valor, descrição e conta");
      return;
    }
    try {
      await api.post("/transactions/", {
        type: form.type,
        amount: parseFloat(form.amount.replace(",", ".")),
        description: form.description,
        date: form.date,
        due_date: form.due_date || null,
        account_id: Number(form.account_id),
        category_id: form.category_id ? Number(form.category_id) : null,
        installments: parseInt(form.installments || "1"),
        recurrence: form.recurrence,
        is_paid: form.is_paid,
        notes: form.notes || null,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao salvar transação");
    }
  };

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) {
      alert("Preencha o nome da categoria");
      return;
    }
    try {
      const res = await api.post("/categories/", {
        name: catForm.name,
        type: form.type,
        icon: catForm.icon || "🏷️",
        color: catForm.color
      });
      setCategories((prev) => [...prev, res.data]);
      setForm((prev) => ({ ...prev, category_id: String(res.data.id) }));
      setQuickCategoryModalOpen(false);
      setCatForm({ name: "", icon: "🏷️", color: "#6366f1" });
    } catch (err) {
      alert("Falha ao criar categoria");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-800 w-full max-w-lg rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Nova transação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "expense", category_id: "" })}
              className={`py-2 text-sm font-semibold rounded-lg transition-colors ${form.type === "expense" ? "bg-red-600 text-white" : "bg-[#1f2937] text-gray-400 hover:text-white"}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "income", category_id: "" })}
              className={`py-2 text-sm font-semibold rounded-lg transition-colors ${form.type === "income" ? "bg-emerald-600 text-white" : "bg-[#1f2937] text-gray-400 hover:text-white"}`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "transfer", category_id: "" })}
              className={`py-2 text-sm font-semibold rounded-lg transition-colors ${form.type === "transfer" ? "bg-[#374151] text-white" : "bg-[#1f2937] text-gray-400 hover:text-white"}`}
            >
              Transferência
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Valor *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrição *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vencimento</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Conta *</label>
            <select
              value={form.account_id}
              onChange={(e) => setForm({ ...form, account_id: e.target.value })}
              className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {/* O BOTÃO DE NOVA CATEGORIA INJETADO AQUI */}
          <div className="bg-[#1f2937]/50 border border-gray-800 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-400" /> Categoria *
              </label>
              <button
                type="button"
                onClick={() => setQuickCategoryModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={12} /> Nova Categoria
              </button>
            </div>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sem categoria</option>
              {categories.filter((c) => c.type === form.type).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Parcelas</label>
              <input
                type="number"
                min="1"
                value={form.installments}
                onChange={(e) => setForm({ ...form, installments: e.target.value })}
                className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Recorrência</label>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="none">Única</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_paid"
              checked={form.is_paid}
              onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded bg-[#1f2937] border-0"
            />
            <label htmlFor="is_paid" className="text-sm text-gray-200">Já pago/recebido</label>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Observações</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium text-sm text-white transition-colors mt-2"
          >
            Salvar
          </button>
        </form>
      </div>

      {/* MODAL SOBREPOSTO: CRIAR CATEGORIA */}
      {quickCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nova Categoria</h3>
              <button onClick={() => setQuickCategoryModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleQuickCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome</label>
                <input 
                  type="text" 
                  placeholder="Ex: Lazer, Streaming..." 
                  value={catForm.name} 
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Ícone (Emoji)</label>
                <input 
                  type="text" 
                  placeholder="🎮" 
                  value={catForm.icon} 
                  onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                  className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium text-sm text-white transition-colors mt-2"
              >
                Criar e Selecionar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
