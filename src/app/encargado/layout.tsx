"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function EncargadoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  // Si es la página de login, no mostrar header
  if (pathname === "/encargado") return <>{children}</>;

  async function logout() {
    await fetch("/api/encargado/auth", { method: "DELETE" });
    router.push("/encargado");
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <header className="bg-[#2A7A26] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Image src="/images/Logo.png" alt="Frescón" width={80} height={36} className="object-contain" />
          <div>
            <p className="text-white font-nunito font-black text-sm">Panel de Compras</p>
            <p className="text-white/60 font-nunito text-[10px]">Encargado</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-white/70 hover:text-white font-nunito font-black text-xs px-3 py-1.5 rounded-full border border-white/20 hover:border-white/50 transition-all"
        >
          🔒 Salir
        </button>
      </header>
      {children}
    </div>
  );
}
