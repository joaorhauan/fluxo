"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.access_token, data.user);
      router.push("/dashboard");
    } catch {
      setError("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-400">fluxo</h1>
          <p className="text-gray-400 mt-2">Controle seu dinheiro com clareza</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-4 border border-gray-800">
          <div>
            <label className="text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-center text-gray-400 text-sm">
            Não tem conta?{" "}
            <a href="/register" className="text-indigo-400 hover:underline">Cadastre-se</a>
          </p>
        </form>
      </div>
    </div>
  );
}
