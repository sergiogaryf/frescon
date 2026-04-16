"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function RecuperarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9fafb]" />}>
      <RecuperarContent />
    </Suspense>
  );
}

function RecuperarContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (token) {
    return <ResetForm token={token} />;
  }

  return <SolicitarReset />;
}

function SolicitarReset() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al enviar correo");
        setLoading(false);
        return;
      }

      setEnviado(true);
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="bg-[#2A7A26] px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={120} height={54} className="object-contain" />
        </Link>
        <Link href="/cuenta/login" className="text-white/60 hover:text-white font-nunito text-sm transition-colors">
          Volver al login
        </Link>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="mb-8">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl leading-tight mt-1">
            RECUPERAR <span className="text-[#3AAA35]">CLAVE</span>
          </h1>
          <p className="text-[#999] mt-2 text-sm">
            Te enviaremos un correo con un enlace para crear una nueva clave.
          </p>
        </div>

        {enviado ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
            <p className="text-4xl mb-3">📧</p>
            <p className="font-nunito font-black text-[#1A1A1A] text-lg">Correo enviado</p>
            <p className="text-[#999] text-sm font-nunito mt-2">
              Si existe una cuenta con <strong>{email}</strong>, recibiras un enlace para crear una nueva clave.
            </p>
            <p className="text-[#999] text-xs font-nunito mt-3">
              Revisa tu bandeja de spam si no lo ves en unos minutos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Tu correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
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
              {loading ? "Enviando..." : "Enviar enlace de recuperacion"}
            </button>

            <Link href="/cuenta/login" className="text-center text-xs font-nunito text-[#3AAA35] hover:text-[#2A7A26] font-bold transition-colors">
              Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Las claves no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La clave debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al cambiar clave");
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
      <div className="bg-[#2A7A26] px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={120} height={54} className="object-contain" />
        </Link>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="mb-8">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl leading-tight mt-1">
            NUEVA <span className="text-[#3AAA35]">CLAVE</span>
          </h1>
          <p className="text-[#999] mt-2 text-sm">
            Ingresa tu nueva clave para acceder a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Nueva clave</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
          </div>

          <div>
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Repetir clave</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Repite tu clave"
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
            {loading ? "Guardando..." : "Guardar nueva clave"}
          </button>
        </form>
      </div>
    </div>
  );
}
