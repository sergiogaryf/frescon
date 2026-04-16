"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesion");
        setLoading(false);
        return;
      }

      router.push("/cuenta");
    } catch {
      setError("Error de conexion");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-[#2A7A26] px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={120} height={54} className="object-contain" />
        </Link>
        <Link href="/" className="text-white/60 hover:text-white font-nunito text-sm transition-colors">
          Volver al inicio
        </Link>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="mb-8">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl leading-tight mt-1">
            INICIAR <span className="text-[#3AAA35]">SESION</span>
          </h1>
          <p className="text-[#999] mt-2 text-sm">
            Ingresa con tu cuenta para comprar mas rapido.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.cl"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
          </div>

          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Clave</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu clave"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-nunito font-bold text-center bg-red-50 rounded-2xl py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black text-sm transition-colors"
          >
            {loading ? "Entrando..." : "Iniciar sesion"}
          </button>

          <div className="flex items-center justify-between text-xs font-nunito">
            <Link href="/cuenta/recuperar" className="text-[#3AAA35] hover:text-[#2A7A26] font-bold transition-colors">
              Olvide mi clave
            </Link>
            <Link href="/cuenta/registro" className="text-[#666] hover:text-[#1A1A1A] transition-colors">
              Crear cuenta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
