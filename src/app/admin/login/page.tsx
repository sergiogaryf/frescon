"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push("/admin/pedidos");
    } else {
      setError("PIN incorrecto. Inténtalo de nuevo.");
      setPin("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#2A7A26] px-8 py-8 flex flex-col items-center gap-2">
            <Image src="/images/Logo.png" alt="Frescon" width={120} height={54} className="object-contain" />
            <p className="text-white/70 font-nunito text-sm">Panel Operativo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-5">
            <div>
              <h1 className="font-nunito font-black text-[#1A1A1A] text-2xl">Acceso Admin</h1>
              <p className="text-[#999] text-sm font-nunito mt-1">Ingresa tu PIN para continuar</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">PIN de acceso</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-lg text-center tracking-widest placeholder-[#bbb]"
              />
              {error && <p className="text-red-400 text-xs font-nunito">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black py-3.5 rounded-full transition-colors text-base"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
