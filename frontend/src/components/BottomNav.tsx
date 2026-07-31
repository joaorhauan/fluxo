"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, BarChart2 } from "lucide-react";

const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transações" },
  { href: "/accounts", icon: Wallet, label: "Contas" },
  { href: "/goals", icon: Target, label: "Metas" },
  { href: "/reports", icon: BarChart2, label: "Relatórios" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex md:hidden z-50">
      {links.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${pathname === href ? "text-indigo-400" : "text-gray-500"}`}>
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
