"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PedidoAdmin } from "@/lib/airtable";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

const ESTADO_STYLE: Record<string, string> = {
  Pendiente:   "bg-[#F9C514]/20 text-[#7A5F00]",
  Confirmado:  "bg-blue-50 text-blue-600",
  "En camino": "bg-orange-50 text-orange-600",
  Entregado:   "bg-[#3AAA35]/10 text-[#1A6A18]",
  Cancelado:   "bg-red-50 text-red-500",
};
const ESTADO_EMOJI: Record<string, string> = {
  Pendiente: "🟡", Confirmado: "🔵", "En camino": "🚗", Entregado: "✅", Cancelado: "❌",
};

interface LineaItem {
  cantidad: number;
  nombre: string;
  unidad: string;
  precioUnitario: number;
}

/** Parsea "2x Lechuga (kg) — $2.000" */
function parsearLinea(linea: string): LineaItem | null {
  const m = linea.match(/^(\d+)x\s+(.+?)\s+\(([^)]+)\)\s+—\s+\$([0-9.,]+)$/);
  if (!m) return null;
  const cantidad = parseInt(m[1], 10);
  const subtotal = parseInt(m[4].replace(/\./g, "").replace(",", ""), 10);
  return {
    cantidad,
    nombre: m[2],
    unidad: m[3],
    precioUnitario: Math.round(subtotal / cantidad),
  };
}

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

interface PerfilInfo {
  encontrado: boolean;
  nombre?: string;
  zona?: string;
  preferencias?: string;
  dieta?: string;
  productos_favoritos?: string;
  total_pedidos?: number;
}

export default function CuentaPage() {
  const [telefono, setTelefono] = useState("");
  const [pedidos,  setPedidos]  = useState<PedidoAdmin[] | null>(null);
  const [perfil,   setPerfil]   = useState<PerfilInfo | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    setLoading(true);
    const [resP, resPerfil] = await Promise.all([
      fetch(`/api/cuenta?telefono=${encodeURIComponent(telefono)}`),
      fetch(`/api/cliente/perfil?telefono=${encodeURIComponent(telefono)}`),
    ]);
    const data = await resP.json();
    const perfilData = await resPerfil.json();
    setPedidos(Array.isArray(data) ? data : []);
    setPerfil(perfilData?.encontrado ? perfilData : null);
    setLoading(false);
  }

  const nombre = pedidos?.[0]?.nombre_cliente ?? "";

  return (
    <div className="min-h-screen bg-[#f9fafb]">

      {/* Header */}
      <div className="bg-[#2A7A26] px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={120} height={54} className="object-contain" />
        </Link>
        <Link href="/" className="text-white/60 hover:text-white font-nunito text-sm transition-colors">
          ← Volver al inicio
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Titulo */}
        <div className="mb-8">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl leading-tight mt-1">
            MIS <span className="text-[#3AAA35]">PEDIDOS</span>
          </h1>
          <p className="text-[#999] mt-2">Ingresa tu numero de telefono para ver el historial de tus pedidos.</p>
        </div>

        {/* Buscador */}
        <form onSubmit={buscar} className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-2 block">📱 Tu telefono</label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
            />
            <button
              type="submit"
              disabled={loading || !telefono.trim()}
              className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black px-6 py-3 rounded-2xl text-sm transition-colors"
            >
              {loading ? "…" : "Buscar"}
            </button>
          </div>
        </form>

        {/* Resultados */}
        {pedidos !== null && (
          pedidos.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin pedidos</p>
              <p className="text-[#999] text-sm font-nunito mt-1">No encontramos pedidos con ese telefono.</p>
              <Link href="/catalogo" className="inline-block mt-4 bg-[#F9C514] text-[#1A1A1A] font-nunito font-black px-6 py-2.5 rounded-full text-sm">
                Ver catalogo
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <p className="font-nunito font-black text-[#1A1A1A]">
                  {nombre && `Hola, ${nombre.split(" ")[0]}! `}
                  {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} encontrado{pedidos.length !== 1 ? "s" : ""}
                </p>
                <Link
                  href="/seguimiento"
                  className="bg-[#3AAA35]/10 text-[#2A7A26] font-nunito font-black text-xs px-4 py-2 rounded-full hover:bg-[#3AAA35]/20 transition-colors flex-shrink-0"
                >
                  🚗 Ver estado en tiempo real
                </Link>
              </div>

              {/* Perfil personalizado */}
              {perfil && (
                <div className="bg-gradient-to-br from-[#F9C514]/10 to-[#3AAA35]/5 rounded-3xl p-5 mb-4 border border-[#F9C514]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🐱</span>
                    <h3 className="font-nunito font-black text-[#1A1A1A] text-sm">Tu perfil Frescón</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {perfil.zona && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        📍 {perfil.zona}
                      </span>
                    )}
                    {perfil.dieta && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        🥗 {perfil.dieta}
                      </span>
                    )}
                    {(perfil.total_pedidos ?? 0) > 0 && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        📦 {perfil.total_pedidos} pedido{(perfil.total_pedidos ?? 0) > 1 ? "s" : ""}
                      </span>
                    )}
                    {perfil.preferencias && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        ❤️ {perfil.preferencias}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/catalogo?tel=${encodeURIComponent(telefono)}`}
                    className="inline-flex items-center gap-2 bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black text-xs px-5 py-2.5 rounded-full transition-colors"
                  >
                    🛒 Ver catálogo personalizado
                  </Link>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {pedidos.map((p) => (
                  <PedidoCard key={p.id} pedido={p} />
                ))}
              </div>
              {/* Codigo de referido */}
              <ReferidosSection telefono={telefono} nombre={nombre} />

              <div className="mt-6 text-center">
                <Link href="/catalogo" className="bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-8 py-3 rounded-full text-sm inline-block transition-colors">
                  + Hacer nuevo pedido
                </Link>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

/* ── Pedido Card ── */

function PedidoCard({ pedido: p }: { pedido: PedidoAdmin }) {
  const [cargandoReorder, setCargandoReorder] = useState(false);
  const [reorderError, setReorderError] = useState("");
  const reorderItems = useCartStore((s) => s.reorderItems);
  const setPedidoBase = useCartStore((s) => s.setPedidoBase);
  const router = useRouter();

  async function volverAPedir() {
    setCargandoReorder(true);
    setReorderError("");
    try {
      const res = await fetch("/api/productos");
      const catalogo: Product[] = await res.json();
      if (!Array.isArray(catalogo)) throw new Error();

      const lineas = p.detalle_pedido.split("\n").filter(Boolean);
      const parsed = lineas.map(parsearLinea).filter((x): x is LineaItem => x !== null);

      const cartItems = parsed
        .map((item) => {
          const prod = catalogo.find(
            (pr) => pr.nombre.toLowerCase() === item.nombre.toLowerCase()
          );
          if (!prod) return null;
          return { product: prod, cantidad: item.cantidad };
        })
        .filter((x): x is { product: Product; cantidad: number } => x !== null);

      if (cartItems.length === 0) {
        setReorderError("Los productos de este pedido ya no estan disponibles.");
        setCargandoReorder(false);
        return;
      }

      reorderItems(cartItems);

      if (cartItems.length < parsed.length) {
        const noDisponibles = parsed
          .filter((item) => !catalogo.some((pr) => pr.nombre.toLowerCase() === item.nombre.toLowerCase()))
          .map((i) => i.nombre);
        setReorderError(`Algunos productos ya no estan disponibles: ${noDisponibles.join(", ")}. Se agregaron los demas al carrito.`);
        setTimeout(() => router.push("/checkout"), 2000);
      } else {
        router.push("/checkout");
      }
    } catch {
      setReorderError("Error al cargar los productos. Intenta de nuevo.");
    }
    setCargandoReorder(false);
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className={`text-xs font-nunito font-black px-2.5 py-1 rounded-full ${ESTADO_STYLE[p.estado] ?? ""}`}>
            {ESTADO_EMOJI[p.estado]} {p.estado}
          </span>
          <p className="font-nunito text-[#999] text-xs mt-1.5">
            📅 Entrega: {formatFecha(p.fecha_entrega)}
          </p>
        </div>
        <p className="font-nunito font-black text-[#3AAA35] text-lg flex-shrink-0">
          ${p.total.toLocaleString("es-CL")}
        </p>
      </div>

      <div className="bg-[#f9fafb] rounded-2xl p-3">
        {p.detalle_pedido.split("\n").map((linea, i) => (
          <p key={i} className="font-nunito text-[#666] text-xs">{linea}</p>
        ))}
      </div>
      {p.notas && (
        <p className="text-[#999] text-xs font-nunito mt-2">📝 {p.notas}</p>
      )}
      <button
        onClick={volverAPedir}
        disabled={cargandoReorder}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#F9C514] hover:bg-[#E0B010] disabled:opacity-50 text-[#1A1A1A] font-nunito font-black text-xs transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M21 21v-5h-5"/>
        </svg>
        {cargandoReorder ? "Cargando..." : "Volver a pedir"}
      </button>
      {reorderError && (
        <p className="mt-2 text-xs font-nunito text-orange-600 text-center">{reorderError}</p>
      )}
      {(p.estado === "Pendiente" || p.estado === "Confirmado") && (
        <button
          onClick={() => {
            setPedidoBase(p.id, p.fecha_entrega, p.detalle_pedido, p.total);
            router.push("/catalogo");
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-[#3AAA35] hover:bg-[#3AAA35]/5 text-[#3AAA35] font-nunito font-black text-xs transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
          </svg>
          Agregar productos a este envio
        </button>
      )}
    </div>
  );
}

/* ── Referidos ── */

function ReferidosSection({ telefono, nombre }: { telefono: string; nombre: string }) {
  const [data, setData] = useState<{ codigo: string; total_referidos: number } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!telefono) return;
    fetch(`/api/referidos?telefono=${encodeURIComponent(telefono)}`)
      .then(r => r.json())
      .then(d => setData(d));
  }, [telefono]);

  if (!data) return null;

  const mensaje = `¡Hola! Compra frutas y verduras frescas del Valle de Aconcagua con Frescon 🌿 Usa mi codigo ${data.codigo} y ambos obtenemos 5% de descuento. Pide en frescon.cl`;

  void nombre;

  function copiar() {
    navigator.clipboard.writeText(data!.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function compartir() {
    if (navigator.share) {
      navigator.share({ text: mensaje });
    } else {
      navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#3AAA35]/10 to-[#2A7A26]/5 rounded-3xl p-6 border border-[#3AAA35]/20 mt-6">
      <h3 className="font-nunito font-black text-[#1A1A1A] text-lg mb-1">🎁 Invita a tus amigos</h3>
      <p className="font-nunito text-[#666] text-sm mb-4">
        Comparte tu codigo y ambos obtienen <strong className="text-[#3AAA35]">5% de descuento</strong> en el proximo pedido.
      </p>
      <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between mb-3 border border-[#e5e5e5]">
        <span className="font-nunito font-black text-[#1A1A1A] text-lg tracking-wider">{data.codigo}</span>
        <button onClick={copiar} className="text-xs font-nunito font-black text-[#3AAA35] hover:text-[#2A7A26] transition-colors">
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      {data.total_referidos > 0 && (
        <p className="font-nunito text-xs text-[#999] mb-3">
          Ya referiste a <strong>{data.total_referidos}</strong> persona{data.total_referidos > 1 ? "s" : ""} 🎉
        </p>
      )}
      <button
        onClick={compartir}
        className="w-full bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black text-sm py-3 rounded-2xl transition-colors"
      >
        📤 Compartir con amigos
      </button>
    </div>
  );
}
