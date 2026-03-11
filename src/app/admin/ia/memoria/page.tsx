"use client";

import { useEffect, useState } from "react";

interface Entrada {
  id:           string;
  fecha:        string;
  contexto:     string;
  pregunta:     string;
  respuesta:    string;
  categoria:    string;
  herramientas: string;
  sesion_id:    string;
  util:         boolean;
  notas_admin:  string;
}

interface Stats {
  total:         number;
  por_categoria: Record<string, number>;
  por_contexto:  Record<string, number>;
  frecuentes:    Array<{ pregunta: string; categoria: string; fecha: string }>;
}

const CATEGORIA_COLOR: Record<string, string> = {
  precios:       "bg-yellow-50 text-yellow-700 border-yellow-200",
  pedidos:       "bg-blue-50 text-blue-700 border-blue-200",
  entregas:      "bg-orange-50 text-orange-700 border-orange-200",
  zonas:         "bg-purple-50 text-purple-700 border-purple-200",
  productos:     "bg-green-50 text-green-700 border-green-200",
  compras_admin: "bg-teal-50 text-teal-700 border-teal-200",
  inventario:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  finanzas:      "bg-red-50 text-red-700 border-red-200",
  general:       "bg-gray-50 text-gray-600 border-gray-200",
};

function formatFecha(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CeliaMemoriaPage() {
  const [entradas,   setEntradas]   = useState<Entrada[]>([]);
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [filtro,     setFiltro]     = useState("all");
  const [expandido,  setExpandido]  = useState<string | null>(null);
  const [nota,       setNota]       = useState<Record<string, string>>({});

  async function cargar() {
    setLoading(true);
    const [listaRes, statsRes] = await Promise.all([
      fetch(`/api/admin/celia-memoria?tipo=lista&contexto=${filtro}`),
      fetch("/api/admin/celia-memoria?tipo=stats"),
    ]);
    setEntradas(await listaRes.json());
    setStats(await statsRes.json());
    setLoading(false);
  }

  useEffect(() => { cargar(); }, [filtro]);

  async function toggleUtil(e: Entrada) {
    await fetch("/api/admin/celia-memoria", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: e.id, util: !e.util, notas_admin: e.notas_admin }),
    });
    cargar();
  }

  async function guardarNota(e: Entrada) {
    await fetch("/api/admin/celia-memoria", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: e.id, util: e.util, notas_admin: nota[e.id] ?? e.notas_admin }),
    });
    cargar();
  }

  async function eliminar(id: string) {
    await fetch("/api/admin/celia-memoria", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    cargar();
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">🧠 Memoria de Celia</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Historial de conversaciones para retroalimentación y mejora continua</p>
        </div>
        <button onClick={cargar} className="px-4 py-2 rounded-full font-nunito font-black text-sm bg-white border border-[#e5e5e5] hover:border-[#3AAA35]/40 text-[#666] transition-all">
          🔄 Actualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-nunito font-black text-3xl text-[#3AAA35]">{stats.total}</p>
            <p className="font-nunito text-[#999] text-xs mt-1">Conversaciones guardadas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-nunito font-black text-3xl text-blue-500">{stats.por_contexto["cliente"] ?? 0}</p>
            <p className="font-nunito text-[#999] text-xs mt-1">De clientes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-nunito font-black text-3xl text-purple-500">{stats.por_contexto["admin"] ?? 0}</p>
            <p className="font-nunito text-[#999] text-xs mt-1">Del admin</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="font-nunito font-black text-3xl text-[#F9C514]">{Object.keys(stats.por_categoria).length}</p>
            <p className="font-nunito text-[#999] text-xs mt-1">Categorías detectadas</p>
          </div>
        </div>
      )}

      {/* Distribución por categoría */}
      {stats && Object.keys(stats.por_categoria).length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <p className="font-nunito font-black text-[#1A1A1A] text-sm mb-3">📊 Preguntas más frecuentes por categoría</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.por_categoria)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <span key={cat} className={`text-xs font-nunito font-black px-3 py-1 rounded-full border ${CATEGORIA_COLOR[cat] ?? CATEGORIA_COLOR.general}`}>
                  {cat} · {count}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {["all", "cliente", "admin"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full font-nunito font-black text-sm transition-all ${
              filtro === f ? "bg-[#3AAA35] text-white" : "bg-white text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
            }`}
          >
            {f === "all" ? "Todos" : f === "cliente" ? "🛒 Clientes" : "🔧 Admin"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#bbb] font-nunito">Cargando memoria…</div>
      ) : entradas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🐱</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin conversaciones aún</p>
          <p className="text-[#999] text-sm font-nunito mt-1">Celia guardará aquí cada intercambio automáticamente</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entradas.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div
                className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[#f9fafb] transition-colors"
                onClick={() => setExpandido(expandido === e.id ? null : e.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-nunito font-black px-2 py-0.5 rounded-full border ${CATEGORIA_COLOR[e.categoria] ?? CATEGORIA_COLOR.general}`}>
                      {e.categoria || "general"}
                    </span>
                    <span className={`text-[10px] font-nunito font-black px-2 py-0.5 rounded-full ${e.contexto === "admin" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                      {e.contexto === "admin" ? "🔧 admin" : "🛒 cliente"}
                    </span>
                    {e.herramientas && (
                      <span className="text-[10px] font-nunito text-[#bbb]">🔧 {e.herramientas}</span>
                    )}
                    {e.util && <span className="text-[10px]">⭐</span>}
                  </div>
                  <p className="font-nunito text-[#1A1A1A] text-sm font-black truncate">{e.pregunta}</p>
                  <p className="text-[#999] text-xs font-nunito mt-0.5">{formatFecha(e.fecha)}</p>
                </div>
                <span className="text-[#bbb] text-xs font-nunito flex-shrink-0">{expandido === e.id ? "▲" : "▼"}</span>
              </div>

              {expandido === e.id && (
                <div className="border-t border-[#f0f0f0] px-4 py-4 bg-[#fafafa] flex flex-col gap-3">
                  <div>
                    <p className="font-nunito font-black text-xs text-[#666] mb-1">💬 Pregunta</p>
                    <p className="font-nunito text-sm text-[#1A1A1A] bg-white rounded-xl px-3 py-2">{e.pregunta}</p>
                  </div>
                  <div>
                    <p className="font-nunito font-black text-xs text-[#666] mb-1">🐱 Respuesta de Celia</p>
                    <p className="font-nunito text-sm text-[#1A1A1A] bg-white rounded-xl px-3 py-2 whitespace-pre-wrap">{e.respuesta}</p>
                  </div>
                  <div>
                    <p className="font-nunito font-black text-xs text-[#666] mb-1">📝 Notas admin</p>
                    <textarea
                      defaultValue={e.notas_admin}
                      onChange={(ev) => setNota((n) => ({ ...n, [e.id]: ev.target.value }))}
                      placeholder="Agrega notas para mejorar esta respuesta…"
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs text-[#1A1A1A] resize-none h-16"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => toggleUtil(e)}
                      className={`text-xs font-nunito font-black px-3 py-1.5 rounded-full border transition-colors ${
                        e.util ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "border-[#e5e5e5] text-[#666] hover:border-yellow-200"
                      }`}
                    >
                      {e.util ? "⭐ Marcado útil" : "☆ Marcar útil"}
                    </button>
                    <button
                      onClick={() => guardarNota(e)}
                      className="text-xs font-nunito font-black px-3 py-1.5 rounded-full border border-[#3AAA35]/30 text-[#3AAA35] hover:bg-[#3AAA35]/10 transition-colors"
                    >
                      💾 Guardar nota
                    </button>
                    <button
                      onClick={() => eliminar(e.id)}
                      className="text-xs font-nunito font-black px-3 py-1.5 rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition-colors ml-auto"
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
