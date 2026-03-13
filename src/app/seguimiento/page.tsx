"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface PedidoTracking {
  id: string;
  estado: string;
  fecha_entrega: string;
  detalle_pedido: string;
  total: number;
  nombre_cliente: string;
}

const ESTADOS_ORDEN = ["Pendiente", "Confirmado", "En camino", "Entregado"];

const ESTADO_INFO: Record<string, { emoji: string; texto: string; color: string }> = {
  "Pendiente":  { emoji: "📋", texto: "Pedido recibido, confirmando pronto", color: "text-yellow-600" },
  "Confirmado": { emoji: "✅", texto: "¡Confirmado! Lo preparamos para el jueves", color: "text-blue-600" },
  "En camino":  { emoji: "🚗", texto: "¡En camino! Llegamos pronto entre 10:00 y 13:00", color: "text-orange-600" },
  "Entregado":  { emoji: "🌿", texto: "¡Entregado! Buen provecho", color: "text-[#3AAA35]" },
  "Cancelado":  { emoji: "❌", texto: "Pedido cancelado", color: "text-red-500" },
};

function SeguimientoContent() {
  const searchParams = useSearchParams();
  const [telefono, setTelefono] = useState("");
  const [pedidos, setPedidos]   = useState<PedidoTracking[] | null>(null);
  const [cargando, setCargando] = useState(false);

  async function fetchPedidos(tel: string) {
    setCargando(true);
    const res  = await fetch(`/api/cuenta?telefono=${encodeURIComponent(tel)}`);
    const data = await res.json();
    setPedidos(Array.isArray(data) ? data : []);
    setCargando(false);
  }

  useEffect(() => {
    const tel = searchParams.get("tel");
    if (tel) {
      setTelefono(tel);
      fetchPedidos(tel);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    fetchPedidos(telefono);
  }

  // Auto-refresh cada 30s si hay pedido "En camino"
  useEffect(() => {
    const enCamino = pedidos?.some((p) => p.estado === "En camino");
    if (!enCamino) return;
    const interval = setInterval(() => {
      if (telefono) {
        fetch(`/api/cuenta?telefono=${encodeURIComponent(telefono)}`)
          .then((r) => r.json())
          .then((d) => setPedidos(Array.isArray(d) ? d : []));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [pedidos, telefono]);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header verde */}
      <div className="bg-[#2A7A26] px-6 py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={100} height={45} className="object-contain" />
        </Link>
        <p className="font-nunito font-black text-white text-sm">🚗 Seguir mi pedido</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-10">
        <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl mb-2">¿Dónde está mi pedido?</h1>
        <p className="font-nunito text-[#999] text-sm mb-8">Ingresa tu teléfono para ver el estado en tiempo real</p>

        <form onSubmit={buscar} className="flex gap-3 mb-8">
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+56 9 1234 5678"
            type="tel"
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A]"
          />
          <button
            type="submit"
            disabled={cargando || !telefono.trim()}
            className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-40 text-white font-nunito font-black px-5 py-3 rounded-2xl transition-colors"
          >
            {cargando ? "…" : "Ver →"}
          </button>
        </form>

        {pedidos !== null && pedidos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-nunito text-[#999] text-sm">No encontramos pedidos con ese número</p>
          </div>
        )}

        {pedidos !== null && pedidos.length > 0 && (
          <div className="flex flex-col gap-4">
            {pedidos.slice(0, 3).map((p) => {
              const estadoInfo = ESTADO_INFO[p.estado] ?? ESTADO_INFO["Pendiente"];
              const idxEstado  = ESTADOS_ORDEN.indexOf(p.estado);
              return (
                <div key={p.id} className="bg-white rounded-3xl shadow-sm p-5 border border-[#f0f0f0]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-nunito font-black text-[#1A1A1A]">{p.nombre_cliente}</p>
                      <p className="font-nunito text-xs text-[#999]">
                        Entrega:{" "}
                        {new Date(p.fecha_entrega + "T12:00:00").toLocaleDateString("es-CL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <span className={`font-nunito font-black text-sm ${estadoInfo.color}`}>
                      {estadoInfo.emoji} {p.estado}
                    </span>
                  </div>

                  {/* Barra de progreso por pasos */}
                  {p.estado !== "Cancelado" && (
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        {ESTADOS_ORDEN.map((s, i) => (
                          <div key={s} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                i <= idxEstado ? "bg-[#3AAA35] text-white" : "bg-[#f0f0f0] text-[#bbb]"
                              }`}
                            >
                              {i < idxEstado ? "✓" : i === idxEstado ? "●" : "○"}
                            </div>
                            <p className="font-nunito text-[10px] text-[#999] text-center leading-tight">{s}</p>
                          </div>
                        ))}
                      </div>
                      <p className={`font-nunito text-sm text-center mt-2 font-black ${estadoInfo.color}`}>
                        {estadoInfo.texto}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-[#f5f5f5] pt-3 mt-3">
                    <p className="font-nunito text-xs text-[#999] whitespace-pre-line line-clamp-3">
                      {p.detalle_pedido}
                    </p>
                    <p className="font-nunito font-black text-[#3AAA35] text-sm mt-2">
                      Total: ${p.total.toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeguimientoPage() {
  return (
    <Suspense>
      <SeguimientoContent />
    </Suspense>
  );
}
