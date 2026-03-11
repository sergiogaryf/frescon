"use client";

import { useEffect, useRef, useState } from "react";
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

function buildMsgSeguimiento(nombre: string, telefono: string) {
  const tel = telefono.replace(/\D/g, "");
  return `https://wa.me/${tel}?text=${encodeURIComponent(`¡Hola ${nombre}! 🚗 Sigue tu pedido Frescón en tiempo real: https://frescon.cl/seguimiento`)}`;
}

interface ChatMsg {
  role: "admin" | "repartidor";
  texto: string;
  hora: string;
}

export default function RepartidorRutaPage() {
  const [pedidos,  setPedidos]  = useState<PedidoAdmin[]>([]);
  const [actual,   setActual]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [marcando, setMarcando] = useState(false);
  const router = useRouter();

  // Feature: foto de entrega
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Feature: chat
  const [chatAbierto,    setChatAbierto]    = useState(false);
  const [mensajesChat,   setMensajesChat]   = useState<ChatMsg[]>([]);
  const [msgChat,        setMsgChat]        = useState("");
  const [mensajesNuevos, setMensajesNuevos] = useState(0);

  useEffect(() => {
    fetch("/api/repartidor/ruta")
      .then((r) => r.json())
      .then((data) => {
        setPedidos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Polling chat cada 10s cuando está abierto
  useEffect(() => {
    if (!chatAbierto) return;
    cargarChat();
    const interval = setInterval(cargarChat, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatAbierto]);

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
    setPedidos((prev) =>
      prev.map((p, i) => i === actual ? { ...p, estado: nuevoEstado } : p)
    );
    setMarcando(false);
    if (nuevoEstado === "Entregado") {
      setFotoPreview(null);
      setTimeout(() => setActual((a) => Math.min(a + 1, pedidos.length)), 600);
    }
  }

  function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPreview(URL.createObjectURL(file));
    }
  }

  async function cargarChat() {
    const res = await fetch("/api/repartidor/chat");
    const data = await res.json();
    setMensajesChat(data.mensajes ?? []);
  }

  async function enviarChat() {
    if (!msgChat.trim()) return;
    await fetch("/api/repartidor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: msgChat, role: "repartidor" }),
    });
    setMsgChat("");
    cargarChat();
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

        {/* Barra de progreso mejorada */}
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#F9C514] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <p className="text-white/50 font-nunito text-xs mt-1.5">
          {entregados} de {pedidos.length} entregas completadas · {progreso}%
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

              {/* Botón link de seguimiento para cliente */}
              <a
                href={buildMsgSeguimiento(pedidoActual.nombre_cliente, pedidoActual.telefono)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#f9fafb] text-[#1A1A1A] border-2 border-[#e5e5e5] font-nunito font-black py-3.5 rounded-full text-sm"
              >
                📍 Enviar link de seguimiento
              </a>

              {pedidoActual.estado !== "Entregado" ? (
                <>
                  {/* Input de cámara oculto */}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={onFotoChange}
                  />

                  {/* Vista previa foto o botón cámara */}
                  {fotoPreview ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={fotoPreview} alt="foto" className="w-12 h-12 rounded-xl object-cover border-2 border-[#3AAA35]" />
                      <p className="font-nunito text-xs text-[#3AAA35]">Foto lista ✓</p>
                      <button
                        onClick={() => setFotoPreview(null)}
                        className="text-xs text-[#999] underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full mt-1 py-2 rounded-xl border-2 border-dashed border-[#3AAA35]/40 text-[#3AAA35] font-nunito font-black text-xs hover:border-[#3AAA35] transition-colors"
                    >
                      📸 Tomar foto de entrega
                    </button>
                  )}

                  {/* Botón marcar entregado */}
                  <button
                    disabled={marcando}
                    onClick={() => marcarEstado("Entregado")}
                    className="w-full flex items-center justify-center gap-2 bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-60 text-white font-nunito font-black py-5 rounded-full text-xl transition-colors shadow-lg"
                  >
                    {marcando ? "Guardando…" : fotoPreview ? "📸 Confirmar entrega con foto" : "✅ ENTREGADO"}
                  </button>
                </>
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

      {/* Panel de chat */}
      {chatAbierto && (
        <div
          className="fixed bottom-0 left-0 z-50 w-72 bg-white shadow-2xl rounded-tr-3xl border border-[#f0f0f0] flex flex-col"
          style={{ maxHeight: "60vh" }}
        >
          <div className="bg-[#3AAA35] px-4 py-3 flex items-center justify-between rounded-tr-3xl">
            <p className="font-nunito font-black text-white text-sm">💬 Chat con Admin</p>
            <button onClick={() => setChatAbierto(false)} className="text-white/70 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 bg-[#f9fafb]">
            {mensajesChat.length === 0 && (
              <p className="font-nunito text-xs text-[#bbb] text-center mt-4">Sin mensajes aún</p>
            )}
            {mensajesChat.map((m, i) => (
              <div key={i} className={`flex ${m.role === "repartidor" ? "justify-end" : "justify-start"}`}>
                <div className={`px-3 py-1.5 rounded-2xl max-w-[80%] font-nunito text-xs ${
                  m.role === "repartidor"
                    ? "bg-[#3AAA35] text-white rounded-tr-sm"
                    : "bg-white text-[#1A1A1A] rounded-tl-sm shadow-sm"
                }`}>
                  {m.texto}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t flex gap-2">
            <input
              value={msgChat}
              onChange={(e) => setMsgChat(e.target.value)}
              placeholder="Escribe…"
              className="flex-1 px-3 py-1.5 rounded-xl border border-[#e5e5e5] text-xs font-nunito focus:outline-none focus:border-[#3AAA35]"
              onKeyDown={(e) => e.key === "Enter" && enviarChat()}
            />
            <button
              onClick={enviarChat}
              className="bg-[#3AAA35] text-white px-3 py-1.5 rounded-xl text-xs font-black"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante chat */}
      {!chatAbierto && (
        <button
          onClick={() => { setChatAbierto(true); setMensajesNuevos(0); }}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-[#3AAA35] text-white shadow-xl flex items-center justify-center hover:bg-[#2A7A26] transition-colors"
        >
          <span className="text-xl">💬</span>
          {mensajesNuevos > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center">
              {mensajesNuevos}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
