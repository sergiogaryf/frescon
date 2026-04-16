"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin/pedidos",        label: "Pedidos",        icon: "📦" },
  { href: "/admin/suscripciones",  label: "Suscripciones",  icon: "🔁" },
  { href: "/admin/compras",        label: "Compras",        icon: "🛒" },
  { href: "/admin/inventario", label: "Inventario", icon: "📊" },
  { href: "/admin/equipo",     label: "Equipo",     icon: "👥" },
  { href: "/admin/socios",    label: "Socios",     icon: "💰" },
  { href: "/admin/reportes",   label: "Reportes",   icon: "📈" },
  { href: "/admin/ia",         label: "IA",         icon: "🤖" },
  { href: "/admin/ia/sesiones", label: "Sesiones",   icon: "💬" },
  { href: "/admin/agente-ux",  label: "Agente UX",  icon: "⚡" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#f9fafb] flex">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-[#f0f0f0] flex-col fixed h-full z-20">
        <div className="bg-[#2A7A26] flex flex-col items-center justify-center px-5 py-6 border-b border-[#1A5C18]">
          <Image src="/images/Logo.png" alt="Frescon" width={130} height={58} className="object-contain" />
          <p className="text-white/60 text-[10px] font-nunito font-black mt-1.5 uppercase tracking-widest">Panel Admin</p>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl font-nunito font-black text-sm transition-all ${
                pathname.startsWith(item.href)
                  ? "bg-[#3AAA35] text-white"
                  : "text-[#666] hover:bg-[#f9fafb] hover:text-[#1A1A1A]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-[#f0f0f0]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-nunito font-black text-sm text-[#bbb] hover:bg-red-50 hover:text-red-400 transition-all"
          >
            🔒 Salir
          </button>
        </div>
      </aside>

      {/* ── Nav móvil ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20">
        {/* Barra superior: logo centrado sobre fondo verde */}
        <div className="bg-[#2A7A26] h-11 flex items-center justify-between px-4">
          <div className="w-8" />
          <Image src="/images/Logo.png" alt="Frescon" width={60} height={26} className="object-contain" />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menú"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Menú desplegable */}
        {menuOpen && (
          <div className="bg-white border-b border-[#f0f0f0] shadow-lg px-4 py-3 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl font-nunito font-black text-sm transition-all ${
                  pathname.startsWith(item.href)
                    ? "bg-[#3AAA35] text-white"
                    : "text-[#666] bg-[#f9fafb] hover:text-[#1A1A1A]"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl font-nunito font-black text-sm text-[#bbb] hover:bg-red-50 hover:text-red-400 transition-all"
            >
              🔒 Salir
            </button>
          </div>
        )}
      </header>

      {/* ── Contenido ── */}
      <main className="lg:ml-56 flex-1 min-h-screen pt-11 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
