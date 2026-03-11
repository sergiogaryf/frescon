"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Msg { role: "user" | "assistant"; content: string }

const ACCIONES_RAPIDAS = [
  "¿Qué necesito comprar esta semana?",
  "¿Cuántos pedidos tengo para el próximo jueves?",
  "¿Qué productos son los más vendidos?",
  "Analiza el sobrante del último reparto",
  "¿Cuál es el ingreso estimado de esta semana?",
];

function BubbleAsistente({ texto }: { texto: string }) {
  return (
    <div className="flex gap-3 max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex-shrink-0 mt-0.5 border border-[#e5e5e5]">
        <Image src="/images/celia.png" alt="Celia" width={32} height={32} className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <p className="font-nunito text-[#1A1A1A] text-sm leading-relaxed whitespace-pre-wrap">{texto}</p>
      </div>
    </div>
  );
}

function BubbleUsuario({ texto }: { texto: string }) {
  return (
    <div className="flex justify-end">
      <div className="bg-[#3AAA35] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
        <p className="font-nunito text-white text-sm leading-relaxed">{texto}</p>
      </div>
    </div>
  );
}

export default function AdminIAPage() {
  const [mensajes,  setMensajes]  = useState<Msg[]>([
    { role: "assistant", content: "¡Hola! Soy Celia 🐱, tu asistente de operaciones Frescón.\n\nPuedo ayudarte a analizar pedidos, calcular qué comprar en Quillota, revisar inventario y responder cualquier pregunta sobre el negocio.\n\n¿En qué te ayudo hoy?" },
  ]);
  const [input,     setInput]     = useState("");
  const [cargando,  setCargando]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sesionId  = useRef(`adm_${Date.now()}_${Math.random().toString(36).slice(2,7)}`);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

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
        body:    JSON.stringify({ messages: nuevosMensajes, context: "admin", sesion_id: sesionId.current }),
      });
      const data = await res.json();
      setMensajes((prev) => [...prev, { role: "assistant", content: data.response ?? data.error ?? "Error al responder." }]);
    } catch {
      setMensajes((prev) => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    }
    setCargando(false);
  }

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-0px)] p-0">
      <div className="px-6 lg:px-8 py-5 border-b border-[#f0f0f0] bg-white flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-2xl">🐱 Celia — Asistente IA</h1>
          <p className="text-[#999] font-nunito text-sm mt-0.5">Tu gata asistente, experta en operaciones Frescón</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/ia/memoria"
            className="text-xs font-nunito font-black px-4 py-2 rounded-full border border-[#e5e5e5] text-[#666] hover:border-[#3AAA35]/40 transition-all"
          >
            🧠 Ver memoria
          </Link>
          <Link
            href="/admin/ia/insights"
            className="text-xs font-nunito font-black px-4 py-2 rounded-full bg-[#3AAA35] text-white hover:bg-[#2A7A26] transition-all"
          >
            💡 Insights
          </Link>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="px-6 py-3 border-b border-[#f0f0f0] bg-[#fafafa] flex-shrink-0">
        <div className="flex gap-2 flex-wrap">
          {ACCIONES_RAPIDAS.map((a) => (
            <button
              key={a}
              onClick={() => enviar(a)}
              disabled={cargando}
              className="text-xs font-nunito font-black px-3 py-1.5 rounded-full bg-white border border-[#e5e5e5] hover:border-[#3AAA35]/50 text-[#666] transition-all disabled:opacity-40"
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {mensajes.map((m, i) =>
          m.role === "assistant"
            ? <BubbleAsistente key={i} texto={m.content} />
            : <BubbleUsuario   key={i} texto={m.content} />
        )}
        {cargando && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex-shrink-0 border border-[#e5e5e5]">
              <Image src="/images/celia.png" alt="Celia" width={32} height={32} className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#3AAA35] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-[#f0f0f0] bg-white">
        <form
          onSubmit={(e) => { e.preventDefault(); enviar(); }}
          className="flex gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta algo sobre el negocio…"
            disabled={cargando}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm text-[#1A1A1A] placeholder-[#bbb]"
          />
          <button
            type="submit"
            disabled={cargando || !input.trim()}
            className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-40 text-white font-nunito font-black px-5 py-3 rounded-2xl text-sm transition-colors"
          >
            Enviar →
          </button>
        </form>
      </div>
    </div>
  );
}
