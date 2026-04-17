"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

type Mode = "choose" | "setup" | "login";
type SetupStep = "phone" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");

  // Setup (primera vez)
  const [setupStep, setSetupStep] = useState<SetupStep>("phone");
  const [telefono, setTelefono] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [emailSetup, setEmailSetup] = useState("");
  const [tieneEmail, setTieneEmail] = useState(false);

  // Login (ya tiene cuenta)
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Setup: Paso 1 — buscar por teléfono ──
  async function handleSetupPhone(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono }),
      });
      const data = await res.json();

      if (!data.encontrado) {
        setError("No encontramos una cuenta con ese telefono. Puedes crear una cuenta nueva.");
        setLoading(false);
        return;
      }

      setNombreCliente(data.nombre || "");
      if (data.tieneEmail && data.email) {
        setEmailSetup(data.email);
        setTieneEmail(true);
      }
      setSetupStep("email");
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  }

  // ── Setup: Paso 2 — vincular email ──
  async function handleSetupEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, email: emailSetup }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al vincular correo");
        setLoading(false);
        return;
      }

      router.push("/cuenta");
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  }

  // ── Login: email + pin o password ──
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = { email };
      if (usePassword) {
        body.password = password;
      } else {
        body.pin = pin;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesion");
        setLoading(false);
        return;
      }

      if (data.needsPassword) {
        router.push("/cuenta?setup=password");
      } else {
        router.push("/cuenta");
      }
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
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
            {mode === "choose" && "Elige como quieres ingresar a tu cuenta."}
            {mode === "setup" && setupStep === "phone" && "Ingresa tu telefono para encontrar tu cuenta."}
            {mode === "setup" && setupStep === "email" && `Hola ${nombreCliente.split(" ")[0]}! Vincula tu correo para futuras compras.`}
            {mode === "login" && "Ingresa con tu correo y los ultimos 6 digitos de tu telefono."}
          </p>
        </div>

        {/* ── Modo: Elegir ── */}
        {mode === "choose" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode("setup")}
              className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4 hover:border-[#3AAA35] border-2 border-transparent transition-all text-left"
            >
              <span className="text-3xl">📱</span>
              <div>
                <p className="font-nunito font-black text-[#1A1A1A] text-sm">Primera vez aqui</p>
                <p className="font-nunito text-[#999] text-xs mt-0.5">Ya compre por WhatsApp y quiero activar mi cuenta</p>
              </div>
            </button>

            <button
              onClick={() => setMode("login")}
              className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4 hover:border-[#3AAA35] border-2 border-transparent transition-all text-left"
            >
              <span className="text-3xl">🔑</span>
              <div>
                <p className="font-nunito font-black text-[#1A1A1A] text-sm">Ya tengo cuenta</p>
                <p className="font-nunito text-[#999] text-xs mt-0.5">Ingresar con correo y telefono</p>
              </div>
            </button>

            {/* Google Sign-In */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <GoogleSignInButton
                onError={(msg) => setError(msg)}
                onLoading={(l) => setLoading(l)}
              />
              {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <p className="text-[#999] text-xs font-nunito text-center mt-2">
                  Google Sign-In disponible pronto
                </p>
              )}
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e5e5e5]"></div></div>
              <div className="relative flex justify-center"><span className="bg-[#f9fafb] px-3 text-xs text-[#999] font-nunito">o</span></div>
            </div>

            <Link
              href="/cuenta/registro"
              className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4 hover:border-[#F9C514] border-2 border-transparent transition-all"
            >
              <span className="text-3xl">✨</span>
              <div>
                <p className="font-nunito font-black text-[#1A1A1A] text-sm">Soy nuevo</p>
                <p className="font-nunito text-[#999] text-xs mt-0.5">Crear cuenta nueva</p>
              </div>
            </Link>
          </div>
        )}

        {/* ── Modo: Setup (primera vez) — Paso 1: Teléfono ── */}
        {mode === "setup" && setupStep === "phone" && (
          <form onSubmit={handleSetupPhone} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Tu telefono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
              />
              <p className="text-[#999] text-xs font-nunito mt-1.5">El mismo telefono con el que nos escribes por WhatsApp</p>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-nunito font-bold text-center bg-red-50 rounded-2xl py-2">
                <p>{error}</p>
                {error.includes("crear una cuenta") && (
                  <Link href="/cuenta/registro" className="text-[#3AAA35] hover:text-[#2A7A26] underline text-xs mt-1 inline-block">
                    Crear cuenta nueva
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black text-sm transition-colors"
            >
              {loading ? "Buscando..." : "Buscar mi cuenta"}
            </button>

            <button
              type="button"
              onClick={() => { setMode("choose"); setError(""); }}
              className="text-center text-xs font-nunito text-[#999] hover:text-[#666] transition-colors"
            >
              Volver
            </button>
          </form>
        )}

        {/* ── Modo: Setup (primera vez) — Paso 2: Email ── */}
        {mode === "setup" && setupStep === "email" && (
          <form onSubmit={handleSetupEmail} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="bg-[#3AAA35]/10 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <p className="font-nunito font-black text-[#1A1A1A] text-sm">
                  {nombreCliente || "Cliente encontrado"}
                </p>
                <p className="font-nunito text-[#666] text-xs">Cuenta encontrada con {telefono}</p>
              </div>
            </div>

            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">
                {tieneEmail ? "Tu correo" : "Agrega tu correo"}
              </label>
              <input
                type="email"
                value={emailSetup}
                onChange={(e) => setEmailSetup(e.target.value)}
                placeholder="tu@correo.cl"
                required
                autoFocus={!tieneEmail}
                readOnly={tieneEmail}
                className={`w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm ${tieneEmail ? "bg-[#f9fafb]" : ""}`}
              />
              <p className="text-[#999] text-xs font-nunito mt-1.5">
                {tieneEmail
                  ? "Este es el correo que tenemos registrado"
                  : "Lo usaras para ingresar en el futuro"}
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-nunito font-bold text-center bg-red-50 rounded-2xl py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black text-sm transition-colors"
            >
              {loading ? "Entrando..." : "Activar mi cuenta"}
            </button>

            <button
              type="button"
              onClick={() => { setSetupStep("phone"); setError(""); }}
              className="text-center text-xs font-nunito text-[#999] hover:text-[#666] transition-colors"
            >
              Usar otro telefono
            </button>
          </form>
        )}

        {/* ── Modo: Login (ya tiene cuenta) ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
              />
            </div>

            {!usePassword ? (
              <div>
                <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-1.5 block">
                  Ultimos 6 digitos de tu telefono
                </label>
                <input
                  type="tel"
                  value={pin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPin(v);
                  }}
                  placeholder="123456"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm tracking-[0.3em] text-center text-lg"
                />
                <button
                  type="button"
                  onClick={() => setUsePassword(true)}
                  className="text-[#3AAA35] hover:text-[#2A7A26] text-xs font-nunito font-bold mt-1.5 transition-colors"
                >
                  Usar clave en vez de telefono
                </button>
              </div>
            ) : (
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
                <button
                  type="button"
                  onClick={() => setUsePassword(false)}
                  className="text-[#3AAA35] hover:text-[#2A7A26] text-xs font-nunito font-bold mt-1.5 transition-colors"
                >
                  Usar ultimos 6 digitos del telefono
                </button>
              </div>
            )}

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
              <button
                type="button"
                onClick={() => { setMode("choose"); setError(""); }}
                className="text-[#999] hover:text-[#666] transition-colors"
              >
                Volver
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
