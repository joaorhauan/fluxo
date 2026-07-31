// ===== frontend/src/app/(app)/reports/page.tsx =====
"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Download } from "lucide-react";
import api from "@/lib/api";
import { format, subMonths, addMonths, endOfMonth } from "date-fns";

interface ReportData {
  totals: { income: number; expense: number; balance: number; income_mom: number; expense_mom: number; };
  by_category: { name: string; icon: string; color: string; amount: number; mom_percent: number; }[];
  savings_rate: number;
}

export default function ReportsPage() {
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
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const start = `${year}-${month}-01`;
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");

      const response = await api.get(`/reports/export/${type}?start=${start}&end=${end}`, {
        responseType: 'blob'
      });

      const fileURL = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `relatorio_${year}_${month}.${type === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (error) {
      alert("Erro ao exportar o relatório. Verifique se há transações no período.");
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading && !data) return <div className="text-center py-20 text-gray-500">Carregando relatórios...</div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Erro ao carregar dados.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Relatórios Mensais</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 transition-colors"
          >
            <Download size={14} /> CSV
          </button>
          <button 
            onClick={() => handleExport("excel")}
            className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 transition-colors"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-sm capitalize text-gray-200">
          {format(currentDate, "MMMM yyyy", { locale: require("date-fns/locale").ptBR })}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <span className="text-xs text-gray-400">Receitas</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(data.totals.income)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {data.totals.income_mom >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
            <span className={data.totals.income_mom >= 0 ? "text-emerald-400" : "text-red-400"}>
              {data.totals.income_mom > 0 ? "+" : ""}{data.totals.income_mom.toFixed(1)}% vs mês anterior
            </span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <span className="text-xs text-gray-400">Despesas</span>
          <p className="text-2xl font-bold text-red-400 mt-1">{fmt(data.totals.expense)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {data.totals.expense_mom <= 0 ? <TrendingDown size={14} className="text-emerald-400" /> : <TrendingUp size={14} className="text-red-400" />}
            <span className={data.totals.expense_mom <= 0 ? "text-emerald-400" : "text-red-400"}>
              {data.totals.expense_mom > 0 ? "+" : ""}{data.totals.expense_mom.toFixed(1)}% vs mês anterior
            </span>
          </div>
        </div>
      </div>

      {/* Balance & Savings Rate */}
      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6">
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Saldo do Mês</span>
        <p className="text-3xl font-bold text-white mt-2">{fmt(data.totals.balance)}</p>
        <p className="text-xs text-indigo-200/70 mt-2">
          Taxa de poupança: <span className={data.savings_rate >= 20 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{data.savings_rate.toFixed(1)}%</span>
        </p>
      </div>

      {/* Category breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-gray-200 mb-4">Comparativo de Despesas por Categoria</h3>
        <div className="space-y-3">
          {data.by_category.map((cat, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-950/40 border border-gray-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${cat.color}20` }}>
                  {cat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">{cat.name}</p>
                  <p className="text-xs text-gray-500">{fmt(cat.amount)}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${cat.mom_percent > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {cat.mom_percent > 0 ? "+" : ""}{cat.mom_percent.toFixed(0)}%
              </span>
            </div>
          ))}
          {data.by_category.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">Sem despesas registradas neste período.</p>
          )}
        </div>
      </div>
    </div>
  );
}
