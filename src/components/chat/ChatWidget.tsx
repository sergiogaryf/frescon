"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
  productos?: Product[];
  pedido?: { id?: string; total?: number; fecha_entrega?: string };
}

const INITIAL: Msg = {
  role: "assistant",
  content: "¡Hola! 🐱 Soy Celia, la asistente de Frescón.\n¿En qué te puedo ayudar? Puedo informarte sobre productos, precios, zonas de entrega o el estado de tu pedido.",
};

export default function ChatWidget() {
  const pathname = usePathname();
  const isAdmin  = pathname?.startsWith("/admin") || pathname?.startsWith("/repartidor");

  const addItem   = useCartStore((s) => s.addItem);
  const items     = useCartStore((s) => s.items);
  const getTotal  = useCartStore((s) => s.total);
  const [agregados,     setAgregados]     = useState<Record<string, boolean>>({});
  const [agregadosTodos, setAgregadosTodos] = useState<Record<number, boolean>>({});

  const [open,     setOpen]     = useState(false);
  const [mensajes, setMensajes] = useState<Msg[]>([INITIAL]);
  const [input,    setInput]    = useState("");
  const [cargando, setCargando] = useState(false);  // muestra dots de escritura
  const [enviando, setEnviando] = useState(false);  // deshabilita input mientras llega respuesta
  const bottomRef = useRef<HTMLDivElement>(null);
  const sesionId  = useRef(`cli_${Date.now()}_${Math.random().toString(36).slice(2,7)}`);

  /* ── Globo proactivo a los 30s ── */
  const [mostrarGlobo, setMostrarGlobo] = useState(false);

  useEffect(() => {
    const yaSeVio = sessionStorage.getItem("celia_globo_visto");
    if (yaSeVio) return;
    const timer = setTimeout(() => {
      if (!open) {
        setMostrarGlobo(true);
        sessionStorage.setItem("celia_globo_visto", "1");
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Encuesta de satisfacción ── */
  const [mostrarEncuesta,  setMostrarEncuesta]  = useState(false);
  const [encuestaEnviada,  setEncuestaEnviada]  = useState(false);
  const [feedbackEncuesta, setFeedbackEncuesta] = useState(false);

  const handleAgregarTodos = (productos: Product[], msgIndex: number) => {
    productos.forEach((p) => addItem(p));
    setAgregadosTodos((prev) => ({ ...prev, [msgIndex]: true }));
    setTimeout(() => setAgregadosTodos((prev) => ({ ...prev, [msgIndex]: false })), 2000);
  };

  const handleCerrarChat = () => {
    const yaSeVio = sessionStorage.getItem("celia_encuesta_vista");
    if (!yaSeVio && mensajes.length > 2) {
      setMostrarEncuesta(true);
    } else {
      setOpen(false);
    }
  };

  const handlePuntuacion = async (puntuacion: number) => {
    sessionStorage.setItem("celia_encuesta_vista", "1");
    setEncuestaEnviada(true);
    setFeedbackEncuesta(true);
    try {
      await fetch("/api/ia/encuesta", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sesion_id: sesionId.current, puntuacion }),
      });
    } catch { /* silencioso */ }
    setTimeout(() => {
      setMostrarEncuesta(false);
      setFeedbackEncuesta(false);
      setEncuestaEnviada(false);
      setOpen(false);
    }, 1200);
  };

  const handleSaltarEncuesta = () => {
    sessionStorage.setItem("celia_encuesta_vista", "1");
    setMostrarEncuesta(false);
    setOpen(false);
  };

  /* ── Drag ── */
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
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const newX = Math.max(8, Math.min(window.innerWidth  - 64, dragStart.current.bx - dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 64, dragStart.current.by - dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const moved = Math.abs(e.clientX - dragStart.current.mx) + Math.abs(e.clientY - dragStart.current.my);
    dragging.current = false;
    if (moved < 6) {
      setOpen((o) => !o);
      setMostrarGlobo(false);
    }
  }, []);

  /* ── Scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando, open]);

  /* ── Feature 1: Enviar con streaming real ── */
  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim();
    if (!msg || enviando) return;
    setInput("");

    const nuevosMensajes: Msg[] = [...mensajes, { role: "user", content: msg }];
    setMensajes(nuevosMensajes);
    setEnviando(true);
    setCargando(true); // muestra dots mientras llega primer chunk

    try {
      const res = await fetch("/api/ia/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages:  nuevosMensajes,
          context:   "cliente",
          sesion_id: sesionId.current,
          carrito:   items.map((i) => ({
            id:      i.product.id,
            nombre:  i.product.nombre,
            precio:  i.product.precio,
            unidad:  i.product.unidad,
            cantidad: i.cantidad,
          })),
        }),
      });

      if (!res.body) throw new Error("No stream");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer      = "";
      let streamText  = "";
      let msgAdded    = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as { type: string; content?: string; data?: { productos?: Product[]; pedido?: { ok: boolean; id?: string; total?: number; fecha_entrega?: string } }; message?: string };

            if (event.type === "text" && event.content) {
              if (!msgAdded) {
                // Primer chunk: agregar mensaje y ocultar dots
                msgAdded   = true;
                streamText = event.content;
                setCargando(false);
                setMensajes((prev) => [...prev, { role: "assistant", content: streamText, productos: [] }]);
              } else {
                streamText += event.content;
                setMensajes((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: streamText };
                  return updated;
                });
              }
            } else if (event.type === "done") {
              const productos = event.data?.productos ?? [];
              const pedido    = event.data?.pedido ?? null;
              setMensajes((prev) => {
                const updated = [...prev];
                const last = { ...updated[updated.length - 1] };
                if (productos.length > 0) last.productos = productos;
                if (pedido?.ok) last.pedido = pedido;
                updated[updated.length - 1] = last;
                return updated;
              });
            } else if (event.type === "error") {
              if (!msgAdded) {
                setMensajes((prev) => [...prev, { role: "assistant", content: "Error al responder. Intenta de nuevo." }]);
              }
            }
          } catch { /* ignorar JSON malformado */ }
        }
      }

      // Si nunca llegó texto (solo tools sin respuesta)
      if (!msgAdded) {
        setMensajes((prev) => [...prev, { role: "assistant", content: "Disculpa, no pude procesar eso. Intenta de nuevo." }]);
      }

    } catch {
      setMensajes((prev) => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    }

    setCargando(false);
    setEnviando(false);
  }

  if (isAdmin) return null;

  return (
    <>
      {/* Globo proactivo */}
      {mostrarGlobo && !open && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-xl px-3 py-2 border border-[#e5e5e5] flex items-center gap-2 max-w-[200px]"
          style={{ right: pos.x + 4, bottom: pos.y + 100 }}
        >
          <p className="font-nunito text-xs text-[#1A1A1A] leading-snug">¡Hola! 🐱 ¿Te ayudo a elegir?</p>
          <button
            onClick={() => setMostrarGlobo(false)}
            className="flex-shrink-0 text-[#999] hover:text-[#333] transition-colors"
            aria-label="Cerrar globo"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div
            className="absolute"
            style={{
              bottom: -7, right: 20, width: 0, height: 0,
              borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
              borderTop: "7px solid white",
            }}
          />
        </div>
      )}

      {/* Botón flotante de Celia */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="Abrir asistente Celia"
        style={{ right: pos.x, bottom: pos.y, touchAction: "none" }}
        className="fixed z-50 w-24 h-24 flex items-center justify-center select-none cursor-grab active:cursor-grabbing drop-shadow-xl transition-transform duration-300 ease-out hover:scale-110 hover:drop-shadow-2xl"
      >
        <Image src="/images/celia.png" alt="Celia" width={96} height={96} className="w-full h-full object-contain" />
      </button>

      {/* Panel de chat */}
      {open && (
        <div
          className="fixed z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#f0f0f0]"
          style={{ right: pos.x, bottom: pos.y + 96, maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="bg-[#3AAA35] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex-shrink-0">
              <Image src="/images/celia.png" alt="Celia" width={40} height={40} className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
            </div>
            <div className="flex-1">
              <p className="font-nunito font-black text-white text-sm">Celia</p>
              <p className="font-nunito text-white/70 text-xs">
                {enviando ? "escribiendo…" : "Asistente Frescón · en línea"}
              </p>
            </div>
            <button onClick={handleCerrarChat} className="text-white/70 hover:text-white transition-colors p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Encuesta de satisfacción */}
          {mostrarEncuesta && (
            <div className="absolute inset-0 z-10 bg-white/95 flex flex-col items-center justify-center gap-4 px-6 py-8 rounded-3xl">
              {feedbackEncuesta ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">🐱</span>
                  <p className="font-nunito font-black text-[#3AAA35] text-base text-center">¡Gracias por tu opinión!</p>
                </div>
              ) : (
                <>
                  <p className="font-nunito font-black text-[#1A1A1A] text-sm text-center">¿Qué tal fue mi ayuda hoy? 🐱</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => handlePuntuacion(n)}
                        disabled={encuestaEnviada}
                        className="text-2xl hover:scale-125 transition-transform"
                        aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSaltarEncuesta}
                    className="font-nunito text-xs text-[#999] hover:text-[#555] transition-colors underline"
                  >
                    Saltar
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-[#f9fafb]">
            {mensajes.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} className="flex gap-2 max-w-[90%]">
                  <div className="w-7 h-7 rounded-full bg-white overflow-hidden flex-shrink-0 mt-0.5 border border-[#e5e5e5]">
                    <Image src="/images/celia.png" alt="Celia" width={28} height={28} className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                      <p className="font-nunito text-[#1A1A1A] text-xs leading-relaxed whitespace-pre-wrap">
                        {m.content}
                        {/* Cursor parpadeante mientras llega el texto */}
                        {enviando && i === mensajes.length - 1 && m.content && (
                          <span className="inline-block w-0.5 h-3 bg-[#3AAA35] ml-0.5 animate-pulse" />
                        )}
                      </p>
                    </div>
                    {m.pedido && (
                      <div className="bg-[#f0fdf4] border border-[#86efac] rounded-2xl px-3 py-3 flex flex-col gap-1">
                        <p className="font-nunito font-black text-[#166534] text-xs">✅ ¡Pedido confirmado!</p>
                        {m.pedido.total && <p className="font-nunito text-[#166534] text-xs">Total: ${m.pedido.total.toLocaleString("es-CL")}</p>}
                        {m.pedido.fecha_entrega && <p className="font-nunito text-[#166534] text-xs">Entrega: jueves {m.pedido.fecha_entrega}</p>}
                        <p className="font-nunito text-[#166534] text-[10px] mt-1 opacity-80">Te enviamos la confirmación por WhatsApp. El pago es por transferencia.</p>
                      </div>
                    )}
                    {m.productos && m.productos.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {m.productos.map((p) => (
                          <div key={p.id} className="bg-white rounded-2xl shadow-sm px-3 py-2 flex items-center gap-2 border border-[#f0f0f0]">
                            {p.imagen && (
                              <Image src={p.imagen} alt={p.nombre} width={36} height={36} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" unoptimized />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-nunito font-black text-[#1A1A1A] text-xs truncate">{p.nombre}</p>
                              <p className="font-nunito text-[#3AAA35] text-xs font-black">${p.precio.toLocaleString("es-CL")} / {p.unidad}</p>
                            </div>
                            <button
                              onClick={() => {
                                addItem(p);
                                setAgregados((a) => ({ ...a, [p.id]: true }));
                                setTimeout(() => setAgregados((a) => ({ ...a, [p.id]: false })), 1500);
                              }}
                              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-black transition-all ${
                                agregados[p.id] ? "bg-[#2A7A26] scale-90" : "bg-[#3AAA35] hover:bg-[#2A7A26] hover:scale-110"
                              }`}
                            >
                              {agregados[p.id] ? "✓" : "+"}
                            </button>
                          </div>
                        ))}
                        {m.productos.length > 1 && (
                          <button
                            onClick={() => handleAgregarTodos(m.productos!, i)}
                            className={`w-full rounded-2xl py-2 px-3 font-nunito font-black text-xs transition-all ${
                              agregadosTodos[i]
                                ? "bg-[#2A7A26] text-white scale-95"
                                : "bg-[#3AAA35] hover:bg-[#2A7A26] text-white hover:scale-[1.02]"
                            }`}
                          >
                            {agregadosTodos[i]
                              ? `¡Todos agregados! ✓`
                              : `🛒 Agregar todo (${m.productos.length} productos)`}
                          </button>
                        )}
                      </div>
                    )}
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
            {/* Dots de escritura: solo cuando cargando=true (esperando primer chunk) */}
            {cargando && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-white overflow-hidden flex-shrink-0 border border-[#e5e5e5]">
                  <Image src="/images/celia.png" alt="Celia" width={28} height={28} className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3AAA35] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Mini carrito */}
          {items.length > 0 && !enviando && (
            <div className="flex-shrink-0 px-3 py-2 bg-[#f0fdf4] border-t border-[#d1fae5] flex items-center gap-2">
              <span className="text-sm">🛒</span>
              <span className="font-nunito text-xs text-[#166534] font-black">{items.length} producto{items.length > 1 ? "s" : ""}</span>
              <span className="font-nunito text-xs text-[#166534]">· ${getTotal().toLocaleString("es-CL")}</span>
              <button
                onClick={() => enviar("Quiero confirmar mi pedido con lo que tengo en el carrito")}
                className="ml-auto bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black text-xs px-3 py-1 rounded-xl transition-colors"
              >
                Pedir →
              </button>
            </div>
          )}

          {/* Quick replies */}
          {mensajes.length <= 2 && !enviando && (
            <div className="flex-shrink-0 px-3 pb-1 bg-white flex gap-1.5 flex-wrap">
              {["¿Qué hay esta semana? 🥦", "¿Llegan a mi zona?", "Ver mis pedidos"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => enviar(chip)}
                  className="font-nunito text-[10px] text-[#3AAA35] border border-[#3AAA35] rounded-full px-2.5 py-1 hover:bg-[#f0fdf4] transition-colors whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-3 bg-white border-t border-[#f0f0f0]">
            <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta…"
                disabled={enviando}
                className="flex-1 px-3 py-2 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs text-[#1A1A1A] placeholder-[#bbb] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={enviando || !input.trim()}
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
