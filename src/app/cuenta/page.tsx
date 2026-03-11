"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PedidoAdmin } from "@/lib/airtable";

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

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

export default function CuentaPage() {
  const [telefono, setTelefono] = useState("");
  const [pedidos,  setPedidos]  = useState<PedidoAdmin[] | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    setLoading(true);
    const res  = await fetch(`/api/cuenta?telefono=${encodeURIComponent(telefono)}`);
    const data = await res.json();
    setPedidos(Array.isArray(data) ? data : []);
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

        {/* Título */}
        <div className="mb-8">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl leading-tight mt-1">
            MIS <span className="text-[#3AAA35]">PEDIDOS</span>
          </h1>
          <p className="text-[#999] mt-2">Ingresa tu número de teléfono para ver el historial de tus pedidos.</p>
        </div>

        {/* Buscador */}
        <form onSubmit={buscar} className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-2 block">📱 Tu teléfono</label>
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
              <p className="text-[#999] text-sm font-nunito mt-1">No encontramos pedidos con ese teléfono.</p>
              <Link href="/catalogo" className="inline-block mt-4 bg-[#F9C514] text-[#1A1A1A] font-nunito font-black px-6 py-2.5 rounded-full text-sm">
                Ver catálogo
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
              <div className="flex flex-col gap-3">
                {pedidos.map((p) => (
                  <div key={p.id} className="bg-white rounded-3xl shadow-sm p-5">
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
                  </div>
                ))}
              </div>
              {/* Código de referido */}
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

  const mensaje = `¡Hola! Compra frutas y verduras frescas del Valle de Aconcagua con Frescón 🌿 Usa mi código ${data.codigo} y ambos obtenemos 5% de descuento. Pide en frescon.cl`;

  // nombre se recibe pero no se usa aquí directamente (el mensaje ya incluye el código)
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
        Comparte tu código y ambos obtienen <strong className="text-[#3AAA35]">5% de descuento</strong> en el próximo pedido.
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
