"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, BarChart2, LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reports", label: "Relatórios", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-indigo-400">fluxo</h1>
        <p className="text-gray-400 text-sm mt-1 truncate">{user?.name}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              pathname === href
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}
