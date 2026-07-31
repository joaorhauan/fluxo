// ===== frontend/src/app/(app)/dashboard/page.tsx =====
"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowLeftRight, AlertCircle, Calendar } from "lucide-react";
import api from "@/lib/api";
import { Account, Transaction, Category } from "@/lib/types";
import { format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import TransactionModal from "@/components/TransactionModal";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [upcoming, setUpcoming] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"expense" | "income" | "transfer">("expense");

  const fetchData = async () => {
    try {
      const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const [accRes, txRes, upRes, catRes] = await Promise.all([
        api.get("/accounts/"),
        api.get(`/transactions/?start=${start}&end=${end}`),
        api.get("/transactions/upcoming?days=7"),
        api.get("/categories/"),
      ]);
      setAccounts(accRes.data);
      setTransactions(txRes.data);
      setUpcoming(upRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error("Erro ao carregar o dashboard", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // 1. Dados para o Gráfico de Categorias (Donut)
  const byCategory = transactions
    .filter((t) => t.type === "expense" && t.category_id)
    .reduce((acc, t) => {
      const key = t.category_name || "Outros";
      if (!acc[key]) acc[key] = { name: key, value: 0, color: t.category_color || "#6b7280", icon: t.category_icon || "📦" };
      acc[key].value += Number(t.amount);
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string; icon: string }>);
  
  const pieData = Object.values(byCategory).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

  // 2. Dados para o Fluxo de Caixa Diário (BarChart)
  const groupedByDate = transactions
    .filter((t) => t.type !== "transfer")
    .reduce((acc, t) => {
      if (!acc[t.date]) acc[t.date] = [];
      acc[t.date].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);

  const flowData = Object.entries(groupedByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, txs]) => {
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      return {
        date: format(new Date(date + "T00:00:00"), "dd/MM"),
        Receitas: inc,
        Despesas: exp,
      };
    });

  // Tooltip customizado para os gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl shadow-2xl">
          {label && <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>}
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.payload.color }} className="text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.color }} />
              {entry.name}: {fmt(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-gray-400 capitalize mt-1 flex items-center gap-1.5">
            <Calendar size={14} />
            {format(new Date(), "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={18} className="text-indigo-400" />
              <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">Saldo Geral</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{fmt(totalBalance)}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Receitas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{fmt(income)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-400" />
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{fmt(expense)}</p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { setModalType("expense"); setShowModal(true); }}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <TrendingDown size={16} /> Lançar Despesa
        </button>
        <button
          onClick={() => { setModalType("income"); setShowModal(true); }}
          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <TrendingUp size={16} /> Lançar Receita
        </button>
        <button
          onClick={() => { setModalType("transfer"); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <ArrowLeftRight size={16} /> Transferência
        </button>
      </div>

      {/* Sessão de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Fluxo de Caixa (Ocupa 2 colunas) */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm text-gray-200">Fluxo Diário do Mês</h3>
          </div>
          {flowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937', opacity: 0.4 }} />
                <Bar dataKey="Receitas" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-500 text-sm">Sem movimentações no período.</div>
          )}
        </div>

        {/* Gráfico de Despesas por Categoria (Ocupa 1 coluna) */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-gray-200 mb-2">Despesas por Categoria</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs bg-gray-950/50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                      <span className="text-gray-300 font-medium">{c.icon} {c.name}</span>
                    </div>
                    <span className="text-gray-400">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm py-10">Sem despesas categorizadas.</div>
          )}
        </div>
      </div>

      {/* Próximos Vencimentos & Contas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Vencimentos */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-gray-200">Próximos Vencimentos (7 dias)</h3>
          </div>
          <div className="space-y-3">
            {upcoming.length > 0 ? upcoming.map((t) => {
               // Fallback: se não houver due_date, usamos o date da transação
               const targetDate = t.due_date || t.date;
               const days = differenceInDays(new Date(targetDate + "T00:00:00"), new Date());
               const isLate = days < 0;
               return (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${isLate ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{t.description}</p>
                      <p className={`text-xs ${isLate ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                        {isLate ? 'Atrasado' : `Vence em ${days} dia(s)`} • {format(new Date(targetDate + "T00:00:00"), "dd/MM")}
                      </p>
                    </div>
                  </div>
                  <span className="text-red-400 font-bold text-sm">{fmt(Number(t.amount))}</span>
                </div>
               );
            }) : (
              <div className="py-8 text-center text-gray-500 text-sm bg-gray-950/40 rounded-xl border border-dashed border-gray-800">
                Nenhuma conta próxima do vencimento 🎉
              </div>
            )}
          </div>
        </div>

        {/* Resumo de Contas */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="font-bold text-sm text-gray-200 mb-5">Saldos nas Contas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${a.color}20` }}>
                    <Wallet size={16} color={a.color} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{a.name}</p>
                    {a.type === "credit" && (
                      <p className="text-[10px] text-gray-500">Cartão de Crédito</p>
                    )}
                  </div>
                </div>
                <span className={`font-bold text-sm ${Number(a.balance) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(Number(a.balance))}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Botão Flutuante Fixado (FAB) */}
      <button
        onClick={() => { setModalType("expense"); setShowModal(true); }}
        className="fixed bottom-20 md:bottom-8 right-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-transform hover:scale-110 z-40"
        title="Nova Transação"
      >
        <Plus size={26} />
      </button>

      {/* Modal Reutilizável de Transação */}
      {showModal && (
        <TransactionModal
          accounts={accounts}
          defaultType={modalType}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
