"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface Msg { role: "user" | "assistant"; content: string }

const INITIAL: Msg = {
  role: "assistant",
  content: "¡Hola! 🐱 Soy Celia, la asistente de Frescón.\n¿En qué te puedo ayudar? Puedo informarte sobre productos, precios, zonas de entrega o el estado de tu pedido.",
};

export default function ChatWidget() {
  const pathname = usePathname();
  const isAdmin  = pathname?.startsWith("/admin") || pathname?.startsWith("/repartidor");

  const [open,     setOpen]     = useState(false);
  const [mensajes, setMensajes] = useState<Msg[]>([INITIAL]);
  const [input,    setInput]    = useState("");
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── Drag (posicionado desde bottom-right) ── */
  const [pos,     setPos]     = useState({ x: 24, y: 24 });
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    dragging.current  = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.mx; // positivo = mueve derecha → right disminuye
    const dy = e.clientY - dragStart.current.my;
    const newX = Math.max(8, Math.min(window.innerWidth  - 64, dragStart.current.bx - dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 64, dragStart.current.by - dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const moved = Math.abs(e.clientX - dragStart.current.mx) + Math.abs(e.clientY - dragStart.current.my);
    dragging.current = false;
    if (moved < 6) setOpen((o) => !o);
  }, []);

  /* ── Scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando, open]);

  /* ── Chat ── */
  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim();
    if (!msg || cargando) return;
    setInput("");
    const nuevosMensajes: Msg[] = [...mensajes, { role: "user", content: msg }];
    setMensajes(nuevosMensajes);
    setCargando(true);
    try {
      const res = await fetch("/api/ia/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: nuevosMensajes, context: "cliente" }),
      });
      const data = await res.json();
      setMensajes((prev) => [...prev, { role: "assistant", content: data.response ?? data.error ?? "Error al responder." }]);
    } catch {
      setMensajes((prev) => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    }
    setCargando(false);
  }

  if (isAdmin) return null;

  return (
    <>
      {/* Burbuja flotante — bottom-right, arrastrable */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="Abrir asistente Celia"
        style={{ right: pos.x, bottom: pos.y, touchAction: "none" }}
        className="fixed z-50 w-14 h-14 bg-[#3AAA35] hover:bg-[#2A7A26] rounded-full shadow-lg flex items-center justify-center transition-colors select-none cursor-grab active:cursor-grabbing"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <span className="text-2xl">🐱</span>
        )}
      </button>

      {/* Panel de chat — se abre hacia arriba y hacia la izquierda */}
      {open && (
        <div
          className="fixed z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#f0f0f0]"
          style={{ right: pos.x, bottom: pos.y + 64, maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="bg-[#3AAA35] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🐱
            </div>
            <div>
              <p className="font-nunito font-black text-white text-sm">Celia</p>
              <p className="font-nunito text-white/70 text-xs">Asistente Frescón · en línea</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-[#f9fafb]">
            {mensajes.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} className="flex gap-2 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-[#3AAA35] flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                    🐱
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                    <p className="font-nunito text-[#1A1A1A] text-xs leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="bg-[#3AAA35] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                    <p className="font-nunito text-white text-xs leading-relaxed">{m.content}</p>
                  </div>
                </div>
              )
            )}
            {cargando && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-[#3AAA35] flex items-center justify-center flex-shrink-0 text-xs">🐱</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3AAA35] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-3 bg-white border-t border-[#f0f0f0]">
            <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta…"
                disabled={cargando}
                className="flex-1 px-3 py-2 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs text-[#1A1A1A] placeholder-[#bbb]"
              />
              <button
                type="submit"
                disabled={cargando || !input.trim()}
                className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-40 text-white font-nunito font-black px-3 py-2 rounded-2xl text-xs transition-colors"
              >
                →
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
