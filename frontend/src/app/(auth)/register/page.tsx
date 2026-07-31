"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-400">fluxo</h1>
          <p className="text-gray-400 mt-2">Crie sua conta</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-4 border border-gray-800">
          {["name", "email", "password"].map((field) => (
            <div key={field}>
              <label className="text-sm text-gray-400 capitalize">
                {field === "name" ? "Nome" : field === "email" ? "Email" : "Senha"}
              </label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full mt-1 bg-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          ))}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
          <p className="text-center text-gray-400 text-sm">
            Já tem conta?{" "}
            <a href="/login" className="text-indigo-400 hover:underline">Entrar</a>
          </p>
        </form>
      </div>
    </div>
  );
}
