// ===== frontend/src/app/(app)/goals/page.tsx =====
"use client";
import { useEffect, useState } from "react";
import { Target, Plus, Lightbulb, X, TrendingUp, Calendar } from "lucide-react";
import api from "@/lib/api";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  color: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [addAmount, setAddAmount] = useState("");

  const [form, setForm] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
    color: "#6366f1"
  });

  const fetchData = async () => {
    try {
      const [goalsRes, tipsRes] = await Promise.all([
        api.get("/goals/"),
        api.get("/reports/tips")
      ]);
      setGoals(goalsRes.data);
      setTips(tipsRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.target_amount || !form.deadline) {
      alert("Preencha nome, valor alvo e prazo.");
      return;
    }
    try {
      await api.post("/goals/", {
        name: form.name,
        target_amount: parseFloat(form.target_amount.replace(",", ".")),
        current_amount: parseFloat(form.current_amount.replace(",", ".") || "0"),
        deadline: form.deadline,
        color: form.color
      });
      setModalOpen(false);
      setForm({ name: "", target_amount: "", current_amount: "", deadline: "", color: "#6366f1" });
      fetchData();
    } catch (err) {
      alert("Erro ao salvar meta");
    }
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal || !addAmount) return;
    try {
      const amount = parseFloat(addAmount.replace(",", "."));
      await api.put(`/goals/${activeGoal.id}`, {
        ...activeGoal,
        current_amount: Number(activeGoal.current_amount) + amount
      });
      setAddMoneyModalOpen(false);
      setAddAmount("");
      setActiveGoal(null);
      fetchData();
    } catch (err) {
      alert("Erro ao adicionar valor");
    }
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Minhas Metas</h2>
          <p className="text-xs text-gray-400 mt-1">Acompanhe seus objetivos financeiros</p>
        </div>
      </div>

      {tips.length > 0 && (
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-amber-400" />
            <h3 className="font-semibold text-sm text-indigo-100">Dicas para alcançar suas metas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tips.map((tip, index) => (
              <div key={index} className="bg-[#111827] border border-gray-800 p-4 rounded-xl">
                <p className="text-xs text-gray-300 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {goals.map(goal => {
          const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
          const daysLeft = differenceInDays(new Date(goal.deadline + "T00:00:00"), new Date());
          
          return (
            <div key={goal.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                    <Target size={20} color={goal.color} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200">{goal.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> Vence em {format(new Date(goal.deadline + "T00:00:00"), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveGoal(goal); setAddMoneyModalOpen(true); }}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-colors"
                  title="Adicionar saldo à meta"
                >
                  <TrendingUp size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{fmt(Number(goal.current_amount))}</span>
                  <span className="text-gray-400">de {fmt(Number(goal.target_amount))}</span>
                </div>
                
                <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${progress}%`, backgroundColor: goal.color }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs mt-2">
                  <span style={{ color: goal.color }} className="font-bold">{progress.toFixed(1)}% concluído</span>
                  <span className={daysLeft < 30 ? "text-amber-400 font-medium" : "text-gray-500"}>
                    {daysLeft > 0 ? `Faltam ${daysLeft} dias` : 'Prazo encerrado'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-gray-700 rounded-2xl bg-gray-900/50">
            <Target size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">Você ainda não tem metas cadastradas.</p>
            <p className="text-xs text-gray-500 mt-1">Crie uma meta para começar a poupar.</p>
          </div>
        )}
      </div>

      {/* Botão Flutuante (FAB) */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all hover:scale-110 z-40"
      >
        <Plus size={24} />
      </button>

      {/* Modais */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-md rounded-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Criar Nova Meta</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome da Meta</label>
                <input 
                  type="text" placeholder="Ex: Viagem, Carro Novo..." value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Valor Alvo (R$)</label>
                  <input 
                    type="number" step="0.01" placeholder="5000,00" value={form.target_amount} 
                    onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                    className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Já guardado (Opcional)</label>
                  <input 
                    type="number" step="0.01" placeholder="0,00" value={form.current_amount} 
                    onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
                    className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Prazo / Data Limite</label>
                <input 
                  type="date" value={form.deadline} 
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium text-sm text-white transition-colors mt-2"
              >
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {addMoneyModalOpen && activeGoal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-sm rounded-2xl p-6 relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">Investir na Meta</h3>
              <button onClick={() => { setAddMoneyModalOpen(false); setAddAmount(""); }} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Adicionando saldo para: <strong className="text-white">{activeGoal.name}</strong></p>
            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Valor a adicionar (R$)</label>
                <input 
                  type="number" step="0.01" placeholder="Ex: 150,00" value={addAmount} 
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full bg-[#1f2937] border-0 rounded-lg p-3 text-sm text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-medium text-sm text-white transition-colors mt-2"
              >
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
