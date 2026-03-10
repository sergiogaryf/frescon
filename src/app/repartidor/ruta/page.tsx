"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PedidoAdmin } from "@/lib/airtable";

function buildMsgEntregado(nombre: string) {
  return encodeURIComponent(`¡Hola ${nombre}! 🌿 Tu pedido Frescón fue entregado. ¡Buen provecho! Si tienes alguna consulta, responde este mensaje.`);
}

function buildMsgEnCamino(nombre: string, telefono: string) {
  return `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${nombre}! 🚗 Tu pedido Frescón está en camino, llegamos en aproximadamente 20 minutos. ¡Nos vemos pronto!`)}`;
}

function buildMapsUrl(direccion: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion + ", Concón, Chile")}`;
}

export default function RepartidorRutaPage() {
  const [pedidos,  setPedidos]  = useState<PedidoAdmin[]>([]);
  const [actual,   setActual]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [marcando, setMarcando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/repartidor/ruta")
      .then((r) => r.json())
      .then((data) => {
        setPedidos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/repartidor/auth", { method: "DELETE" });
    router.push("/repartidor");
  }

  async function marcarEstado(nuevoEstado: string) {
    if (!pedidos[actual]) return;
    setMarcando(true);
    await fetch("/api/repartidor/ruta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pedidos[actual].id, estado: nuevoEstado }),
    });
    // Actualizar en local
    setPedidos((prev) =>
      prev.map((p, i) => i === actual ? { ...p, estado: nuevoEstado } : p)
    );
    setMarcando(false);
    if (nuevoEstado === "Entregado") {
      // Avanzar al siguiente automáticamente
      setTimeout(() => setActual((a) => Math.min(a + 1, pedidos.length)), 600);
    }
  }

  const entregados = pedidos.filter((p) => p.estado === "Entregado").length;
  const progreso   = pedidos.length > 0 ? Math.round((entregados / pedidos.length) * 100) : 0;
  const pedidoActual = pedidos[actual];
  const todoTerminado = pedidos.length > 0 && entregados === pedidos.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2A7A26] flex items-center justify-center">
        <p className="text-white font-nunito font-black text-lg">Cargando ruta…</p>
      </div>
    );
  }

  /* ── Pantalla final ── */
  if (todoTerminado) {
    return (
      <div className="min-h-screen bg-[#2A7A26] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="font-nunito font-black text-white text-3xl mb-2">¡Misión cumplida!</h1>
        <p className="text-white/70 font-nunito text-lg mb-1">{pedidos.length} entregas completadas hoy</p>
        <p className="text-[#F9C514] font-nunito font-black text-xl mb-8">
          ${pedidos.reduce((s, p) => s + p.total, 0).toLocaleString("es-CL")} entregados
        </p>
        <button
          onClick={logout}
          className="bg-white text-[#2A7A26] font-nunito font-black px-8 py-3 rounded-full text-base"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  /* ── Sin pedidos ── */
  if (pedidos.length === 0) {
    return (
      <div className="min-h-screen bg-[#2A7A26] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h1 className="font-nunito font-black text-white text-2xl mb-2">Sin entregas hoy</h1>
        <p className="text-white/60 font-nunito mb-8">No hay pedidos confirmados para hoy.</p>
        <button onClick={logout} className="bg-white text-[#2A7A26] font-nunito font-black px-8 py-3 rounded-full">
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2A7A26] flex flex-col">

      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/60 font-nunito text-sm">Frescon Delivery</p>
            <p className="text-white font-nunito font-black text-lg">
              Entrega {actual + 1} de {pedidos.length}
            </p>
          </div>
          <button onClick={logout} className="text-white/40 font-nunito text-xs px-3 py-1.5 rounded-full border border-white/20">
            Salir
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="bg-white/20 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#F9C514] h-full rounded-full transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <p className="text-white/50 font-nunito text-xs mt-1.5 text-right">
          {entregados} entregados · {progreso}%
        </p>
      </div>

      {/* Card principal */}
      <div className="flex-1 px-4 pb-6">
        {pedidoActual ? (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Status badge */}
            <div className={`px-5 py-2.5 text-center font-nunito font-black text-sm ${
              pedidoActual.estado === "Entregado" ? "bg-[#3AAA35] text-white" :
              pedidoActual.estado === "En camino" ? "bg-orange-500 text-white" :
              "bg-[#F9C514] text-[#7A5F00]"
            }`}>
              {pedidoActual.estado === "Entregado" ? "✅ Entregado" :
               pedidoActual.estado === "En camino" ? "🚗 En camino" :
               "🟡 Pendiente de entrega"}
            </div>

            {/* Cliente */}
            <div className="px-5 py-5 border-b border-[#f0f0f0]">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-2xl">{pedidoActual.nombre_cliente}</h2>
              <a
                href={`tel:${pedidoActual.telefono}`}
                className="flex items-center gap-2 mt-1 text-[#3AAA35] font-nunito font-black"
              >
                📱 {pedidoActual.telefono}
              </a>
            </div>

            {/* Productos */}
            <div className="px-5 py-4 border-b border-[#f0f0f0]">
              <p className="font-nunito font-black text-[#999] text-xs mb-2">📦 PEDIDO</p>
              {pedidoActual.detalle_pedido.split("\n").map((linea, i) => (
                <p key={i} className="font-nunito text-[#1A1A1A] text-sm py-0.5">{linea}</p>
              ))}
              <p className="font-nunito font-black text-[#3AAA35] text-lg mt-2">
                ${pedidoActual.total.toLocaleString("es-CL")}
              </p>
            </div>

            {/* Dirección */}
            <div className="px-5 py-4 border-b border-[#f0f0f0]">
              <p className="font-nunito font-black text-[#999] text-xs mb-1">📍 DIRECCIÓN</p>
              <p className="font-nunito text-[#1A1A1A] text-base font-black">{pedidoActual.direccion}</p>
              {pedidoActual.notas && (
                <p className="text-[#F9C514] font-nunito font-black text-sm mt-1.5 bg-[#F9C514]/10 px-3 py-1.5 rounded-xl">
                  📝 {pedidoActual.notas}
                </p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="px-4 py-4 flex flex-col gap-2.5">
              <a
                href={buildMapsUrl(pedidoActual.direccion)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] text-white font-nunito font-black py-4 rounded-full text-base"
              >
                🗺️ NAVEGAR
              </a>
              <a
                href={buildMsgEnCamino(pedidoActual.nombre_cliente, pedidoActual.telefono)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#f9fafb] text-[#1A1A1A] border-2 border-[#e5e5e5] font-nunito font-black py-3.5 rounded-full text-sm"
              >
                📞 Avisar que voy en camino
              </a>
              {pedidoActual.estado !== "Entregado" ? (
                <button
                  disabled={marcando}
                  onClick={() => marcarEstado("Entregado")}
                  className="w-full flex items-center justify-center gap-2 bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-60 text-white font-nunito font-black py-5 rounded-full text-xl transition-colors shadow-lg"
                >
                  {marcando ? "Guardando…" : "✅ ENTREGADO"}
                </button>
              ) : (
                <a
                  href={`https://wa.me/${pedidoActual.telefono.replace(/\D/g, "")}?text=${buildMsgEntregado(pedidoActual.nombre_cliente)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#3AAA35]/20 text-[#2A7A26] font-nunito font-black py-3.5 rounded-full text-sm"
                >
                  📱 Enviar mensaje de entrega
                </a>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Navegación entre pedidos */}
      <div className="px-4 pb-8 flex items-center justify-between gap-3">
        <button
          onClick={() => setActual((a) => Math.max(0, a - 1))}
          disabled={actual === 0}
          className="flex-1 bg-white/20 disabled:opacity-30 text-white font-nunito font-black py-3 rounded-full text-sm transition-all"
        >
          ← Anterior
        </button>
        <div className="flex gap-1">
          {pedidos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActual(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === actual ? "bg-[#F9C514] w-4" :
                pedidos[i]?.estado === "Entregado" ? "bg-white/50" : "bg-white/20"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setActual((a) => Math.min(pedidos.length - 1, a + 1))}
          disabled={actual === pedidos.length - 1}
          className="flex-1 bg-white/20 disabled:opacity-30 text-white font-nunito font-black py-3 rounded-full text-sm transition-all"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
