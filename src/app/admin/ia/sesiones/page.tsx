"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Mensaje {
  pregunta: string;
  respuesta: string;
  categoria: string;
  fecha: string;
  herramientas: string;
}

interface Sesion {
  sesion_id: string;
  contexto: string;
  fecha_inicio: string;
  fecha_fin: string;
  mensajes: Mensaje[];
  perfil?: string;
  dieta?: string;
}

export default function SesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState<Sesion | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "admin" | "cliente">("todos");

  useEffect(() => {
    fetch("/api/admin/celia-sesiones")
      .then((r) => r.json())
      .then((d) => {
        setSesiones(d.sesiones ?? []);
        setCargando(false);
      });
  }, []);

  const filtradas = sesiones.filter((s) =>
    filtro === "todos" ? true : s.contexto === filtro
  );

  const formatFecha = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        timeZone: "America/Santiago",
      }).format(new Date(iso));
    } catch { return iso.slice(0, 16); }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Lista de sesiones */}
      <div className="w-80 flex-shrink-0 border-r border-[#f0f0f0] flex flex-col">
        <div className="px-5 py-4 border-b border-[#f0f0f0] bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-nunito font-black text-[#1A1A1A] text-lg">💬 Sesiones</h1>
            <Link
              href="/admin/ia"
              className="text-xs font-nunito text-[#999] hover:text-[#555] transition-colors"
            >
              ← Volver
            </Link>
          </div>
          <div className="flex gap-1">
            {(["todos", "cliente", "admin"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`flex-1 text-xs font-nunito font-black py-1.5 rounded-full transition-all ${
                  filtro === f
                    ? "bg-[#3AAA35] text-white"
                    : "bg-[#f5f5f5] text-[#666] hover:bg-[#ebebeb]"
                }`}
              >
                {f === "todos" ? "Todos" : f === "cliente" ? "Clientes" : "Admin"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <div className="p-5 text-center text-[#999] font-nunito text-sm">Cargando…</div>
          ) : filtradas.length === 0 ? (
            <div className="p-5 text-center text-[#999] font-nunito text-sm">Sin sesiones</div>
          ) : (
            filtradas.map((s) => (
              <button
                key={s.sesion_id}
                onClick={() => setSeleccionada(s)}
                className={`w-full text-left px-4 py-3 border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors ${
                  seleccionada?.sesion_id === s.sesion_id ? "bg-[#f0fdf0] border-l-2 border-l-[#3AAA35]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-nunito font-black px-2 py-0.5 rounded-full ${
                    s.contexto === "admin"
                      ? "bg-[#fff3cd] text-[#856404]"
                      : "bg-[#e8f5e9] text-[#2e7d32]"
                  }`}>
                    {s.contexto === "admin" ? "Admin" : "Cliente"}
                  </span>
                  <span className="text-xs font-nunito text-[#999]">
                    {s.mensajes.length} msg
                  </span>
                </div>
                <p className="font-nunito text-xs text-[#1A1A1A] truncate">
                  {s.mensajes[0]?.pregunta?.slice(0, 50) || "Sin pregunta"}
                </p>
                <p className="font-nunito text-xs text-[#999] mt-0.5">
                  {formatFecha(s.fecha_fin)}
                  {s.perfil && <span className="ml-2 text-[#3AAA35]">· {s.perfil}</span>}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detalle de sesión */}
      <div className="flex-1 overflow-y-auto bg-[#f9fafb]">
        {!seleccionada ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="font-nunito text-[#999] text-sm">Selecciona una sesión para ver el hilo completo</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6">
            {/* Header de sesión */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-[#f0f0f0] shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-nunito font-black text-[#1A1A1A] text-sm">
                    Sesión: <span className="text-[#999] font-normal">{seleccionada.sesion_id}</span>
                  </p>
                  <p className="font-nunito text-xs text-[#999] mt-0.5">
                    {formatFecha(seleccionada.fecha_inicio)} → {formatFecha(seleccionada.fecha_fin)}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {seleccionada.perfil && (
                    <span className="text-xs font-nunito font-black px-2 py-1 rounded-full bg-[#e8f5e9] text-[#2e7d32]">
                      {seleccionada.perfil}
                    </span>
                  )}
                  {seleccionada.dieta && (
                    <span className="text-xs font-nunito font-black px-2 py-1 rounded-full bg-[#fff3e0] text-[#e65100]">
                      {seleccionada.dieta}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex flex-col gap-3">
              {[...seleccionada.mensajes].reverse().map((m, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-[#f0f0f0] shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-nunito text-[#999]">{formatFecha(m.fecha)}</span>
                    {m.herramientas && (
                      <span className="text-xs font-nunito text-[#3AAA35] bg-[#e8f5e9] px-2 py-0.5 rounded-full">
                        🔧 {m.herramientas}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end mb-2">
                    <div className="bg-[#3AAA35] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                      <p className="font-nunito text-white text-xs leading-relaxed">{m.pregunta}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="bg-[#f5f5f5] rounded-2xl rounded-tl-sm px-3 py-2">
                      <p className="font-nunito text-[#1A1A1A] text-xs leading-relaxed whitespace-pre-wrap">{m.respuesta}</p>
                    </div>
                  </div>
                  {m.categoria && (
                    <p className="text-xs font-nunito text-[#bbb] mt-1 text-right">{m.categoria}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
