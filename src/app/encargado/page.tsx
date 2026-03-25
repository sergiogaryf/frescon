"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EncargadoLoginPage() {
  const [pin,     setPin]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/encargado/auth", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push("/encargado/compras");
    } else {
      setError("PIN incorrecto");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Image src="/images/Logo.png" alt="Frescón" width={120} height={52} className="mb-4" />
          <h1 className="font-nunito font-black text-[#1A1A1A] text-xl">Encargado de Compras</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Ingresa tu PIN para acceder</p>
        </div>

        <form onSubmit={login} className="flex flex-col gap-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN de acceso"
            maxLength={10}
            className="px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-center text-lg tracking-widest"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs font-nunito text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pin}
            className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black py-3 rounded-2xl transition-colors"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
