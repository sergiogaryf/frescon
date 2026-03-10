"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/pedidos",   label: "Pedidos",   icon: "📦" },
  { href: "/admin/compras",   label: "Compras",   icon: "🛒" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#f9fafb] flex">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-[#f0f0f0] flex-col fixed h-full z-20">
        <div className="px-5 py-5 border-b border-[#f0f0f0]">
          <Image src="/images/Logo.png" alt="Frescon" width={90} height={40} className="object-contain" />
          <p className="text-[#bbb] text-[10px] font-nunito font-black mt-1 uppercase tracking-widest">Panel Admin</p>
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
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#f0f0f0] z-20 px-4 py-3 flex items-center justify-between">
        <Image src="/images/Logo.png" alt="Frescon" width={72} height={32} className="object-contain" />
        <div className="flex items-center gap-1.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-xl font-nunito font-black text-xs transition-all ${
                pathname.startsWith(item.href)
                  ? "bg-[#3AAA35] text-white"
                  : "text-[#666] bg-[#f9fafb]"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="ml-1 text-[#bbb] text-xs font-nunito px-2 py-1.5 hover:text-red-400 transition-colors"
          >
            🔒
          </button>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="lg:ml-56 flex-1 min-h-screen pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
