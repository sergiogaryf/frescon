"use client";

import { useEffect, useState, useCallback } from "react";
import { PedidoAdmin } from "@/lib/airtable";

const ESTADOS = ["Todos", "Pendiente", "Confirmado", "En camino", "Entregado", "Cancelado"];

const ESTADO_STYLE: Record<string, string> = {
  Pendiente:   "bg-[#F9C514]/20 text-[#7A5F00] border border-[#F9C514]/40",
  Confirmado:  "bg-blue-50 text-blue-600 border border-blue-200",
  "En camino": "bg-orange-50 text-orange-600 border border-orange-200",
  Entregado:   "bg-[#3AAA35]/10 text-[#1A6A18] border border-[#3AAA35]/30",
  Cancelado:   "bg-red-50 text-red-500 border border-red-200",
};

const ESTADO_EMOJI: Record<string, string> = {
  Pendiente: "🟡", Confirmado: "🔵", "En camino": "🟠", Entregado: "✅", Cancelado: "❌",
};

const TRANSICIONES: Record<string, string[]> = {
  Pendiente:   ["Confirmado", "Cancelado"],
  Confirmado:  ["En camino", "Cancelado"],
  "En camino": ["Entregado", "Cancelado"],
  Entregado:   [],
  Cancelado:   ["Pendiente"],
};

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

function formatMonto(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export default function AdminPedidosPage() {
  const [pedidos,    setPedidos]    = useState<PedidoAdmin[]>([]);
  const [filtro,     setFiltro]     = useState("Todos");
  const [loading,    setLoading]    = useState(true);
  const [expandido,  setExpandido]  = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const qs = filtro !== "Todos" ? `?estado=${encodeURIComponent(filtro)}` : "";
    const res = await fetch(`/api/admin/pedidos${qs}`);
    const data = await res.json();
    setPedidos(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filtro]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setActualizando(id);
    await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: nuevoEstado }),
    });
    await fetchPedidos();
    setActualizando(null);
  }

  const totales = {
    count: pedidos.length,
    monto: pedidos.reduce((s, p) => s + p.total, 0),
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">📦 Pedidos</h1>
        {!loading && (
          <p className="text-[#999] font-nunito text-sm mt-1">
            {totales.count} pedido{totales.count !== 1 ? "s" : ""} · Total: {formatMonto(totales.monto)}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`px-4 py-1.5 rounded-full font-nunito font-black text-sm transition-all ${
              filtro === e
                ? "bg-[#3AAA35] text-white"
                : "bg-white text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
            }`}
          >
            {ESTADO_EMOJI[e] ?? ""} {e}
          </button>
        ))}
        <button
          onClick={fetchPedidos}
          className="ml-auto px-4 py-1.5 rounded-full font-nunito font-black text-sm bg-white text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40 transition-all"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#bbb] font-nunito">Cargando pedidos…</div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">No hay pedidos</p>
          <p className="text-[#999] text-sm font-nunito mt-1">en el estado seleccionado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">

              {/* Card header */}
              <div
                className="px-5 py-4 flex items-start gap-4 cursor-pointer hover:bg-[#f9fafb] transition-colors"
                onClick={() => setExpandido(expandido === p.id ? null : p.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-nunito font-black px-2.5 py-1 rounded-full ${ESTADO_STYLE[p.estado] ?? ""}`}>
                      {ESTADO_EMOJI[p.estado]} {p.estado}
                    </span>
                    <span className="text-[#999] text-xs font-nunito">📅 {formatFecha(p.fecha_entrega)}</span>
                  </div>
                  <p className="font-nunito font-black text-[#1A1A1A] text-base">{p.nombre_cliente}</p>
                  <p className="text-[#999] text-xs font-nunito truncate">📍 {p.direccion}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-nunito font-black text-[#3AAA35] text-lg">{formatMonto(p.total)}</p>
                  <p className="text-[#bbb] text-xs font-nunito">{expandido === p.id ? "▲ ocultar" : "▼ detalle"}</p>
                </div>
              </div>

              {/* Detalle expandido */}
              {expandido === p.id && (
                <div className="border-t border-[#f0f0f0] px-5 py-4 bg-[#fafafa]">

                  {/* Info contacto */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm font-nunito">
                    <a href={`tel:${p.telefono}`} className="text-[#3AAA35] font-black hover:underline">
                      📱 {p.telefono}
                    </a>
                    {p.notas && (
                      <span className="text-[#666]">📝 {p.notas}</span>
                    )}
                  </div>

                  {/* Detalle pedido */}
                  <div className="bg-white rounded-2xl p-4 mb-4">
                    <p className="font-nunito font-black text-[#1A1A1A] text-xs mb-2">🧺 Productos</p>
                    {p.detalle_pedido.split("\n").map((linea, i) => (
                      <p key={i} className="text-[#666] text-sm font-nunito">{linea}</p>
                    ))}
                    <p className="font-nunito font-black text-[#3AAA35] text-sm mt-2 pt-2 border-t border-[#f0f0f0]">
                      Total: {formatMonto(p.total)}
                    </p>
                  </div>

                  {/* Botones de estado */}
                  {TRANSICIONES[p.estado] && TRANSICIONES[p.estado].length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {TRANSICIONES[p.estado].map((nuevoEstado) => (
                        <button
                          key={nuevoEstado}
                          disabled={actualizando === p.id}
                          onClick={() => cambiarEstado(p.id, nuevoEstado)}
                          className={`px-4 py-2 rounded-full font-nunito font-black text-sm transition-all disabled:opacity-50 ${
                            nuevoEstado === "Cancelado"
                              ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                              : nuevoEstado === "Entregado"
                              ? "bg-[#3AAA35] text-white hover:bg-[#2A7A26]"
                              : "bg-[#1A1A1A] text-white hover:bg-[#333]"
                          }`}
                        >
                          {actualizando === p.id ? "Guardando…" : `${ESTADO_EMOJI[nuevoEstado]} Marcar ${nuevoEstado}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
