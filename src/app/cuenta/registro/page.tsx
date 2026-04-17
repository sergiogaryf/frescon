"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const COMUNAS = ["Concon", "Renaca", "Jardin del Mar", "Vina del Mar", "Quilpue"];

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    comuna: "Concon",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          direccion: form.direccion,
          comuna: form.comuna,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear cuenta");
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
            CREAR <span className="text-[#3AAA35]">CUENTA</span>
          </h1>
          <p className="text-[#999] mt-2 text-sm">
            Registrate para guardar tus datos y comprar mas rapido.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Nombre completo *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              placeholder="Juan Perez"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
          </div>

          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Correo *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="tu@correo.cl"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
          </div>

          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Telefono *</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => update("telefono", e.target.value)}
              placeholder="+56 9 1234 5678"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
          </div>

          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Direccion (calle y numero)</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => update("direccion", e.target.value)}
              placeholder="Av. Borgono 1234"
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
          </div>

          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Comuna</label>
            <select
              value={form.comuna}
              onChange={(e) => update("comuna", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm bg-white"
            >
              {COMUNAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-nunito font-bold text-center bg-red-50 rounded-2xl py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black text-sm transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-xs font-nunito text-[#999]">
            Ya tienes cuenta?{" "}
            <Link href="/cuenta/login" className="text-[#3AAA35] hover:text-[#2A7A26] font-bold transition-colors">
              Iniciar sesion
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
