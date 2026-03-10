"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RepartidorLogin() {
  const [pin,     setPin]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/repartidor/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push("/repartidor/ruta");
    } else {
      setError("PIN incorrecto.");
      setPin("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#2A7A26] flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/Logo.png" alt="Frescon" width={140} height={62} className="object-contain" />
          <p className="text-white/60 font-nunito text-sm mt-2">App Repartidor</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-7 py-8 flex flex-col gap-5">
            <div className="text-center">
              <p className="text-4xl mb-2">🚗</p>
              <h1 className="font-nunito font-black text-[#1A1A1A] text-2xl">Hola!</h1>
              <p className="text-[#999] text-sm font-nunito mt-1">Ingresa tu PIN para ver las entregas de hoy</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                autoFocus
                className="w-full px-4 py-4 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito font-black text-[#1A1A1A] text-3xl text-center tracking-widest placeholder-[#bbb]"
              />
              {error && <p className="text-red-400 text-sm font-nunito text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading || !pin}
                className="w-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black py-4 rounded-full transition-colors text-lg"
              >
                {loading ? "…" : "Entrar →"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
