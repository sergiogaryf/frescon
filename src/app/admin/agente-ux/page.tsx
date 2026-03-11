"use client";

import { useEffect, useState, useCallback } from "react";

interface Mejora {
  id:                string;
  titulo:            string;
  descripcion:       string;
  categoria:         string;
  prioridad:         string;
  razon:             string;
  implementacion:    string;
  impacto_estimado:  string;
  estado:            string;
  ciclo:             number;
  fecha:             string;
}

interface Stats {
  total:         number;
  pendientes:    number;
  en_progreso:   number;
  implementadas: number;
  ciclo_actual:  number;
}

const CATEGORIAS: Record<string, { label: string; color: string; bg: string }> = {
  conversion:  { label: "Conversión",  color: "#7C3AED", bg: "#F5F3FF" },
  chat:        { label: "Chat IA",     color: "#0369A1", bg: "#E0F2FE" },
  navegacion:  { label: "Navegación",  color: "#0F766E", bg: "#F0FDFA" },
  productos:   { label: "Productos",   color: "#B45309", bg: "#FFFBEB" },
  checkout:    { label: "Checkout",    color: "#DC2626", bg: "#FEF2F2" },
  whatsapp:    { label: "WhatsApp",    color: "#166534", bg: "#F0FDF4" },
  general:     { label: "General",     color: "#6B7280", bg: "#F9FAFB" },
};

const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 };

export default function AgenteUXPage() {
  const [mejoras,   setMejoras]   = useState<Mejora[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [cargando,  setCargando]  = useState(true);
  const [analizando, setAnalizando] = useState(false);
  const [filtro,    setFiltro]    = useState<"todos" | "pendiente" | "en_progreso" | "implementado">("todos");
  const [filtroCat, setFiltroCat] = useState<string>("todas");
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const [error,     setError]     = useState<string | null>(null);
  const [logAnalisis, setLogAnalisis] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/admin/agente-ux");
      const data = await res.json() as { mejoras: Mejora[]; stats: Stats };
      setMejoras(data.mejoras ?? []);
      setStats(data.stats ?? null);
    } catch (e) {
      setError(String(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const ejecutarAnalisis = async () => {
    setAnalizando(true);
    setError(null);
    setLogAnalisis("🤖 Recopilando datos del negocio...");
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setLogAnalisis("📊 Analizando pedidos, chat y perfiles de clientes...");
      await new Promise((r) => setTimeout(r, 1500));
      setLogAnalisis("🧠 Claude generando mejoras priorizadas...");
      const res = await fetch("/api/admin/agente-ux", { method: "POST" });
      const data = await res.json() as { ok?: boolean; ciclo?: number; total?: number; guardadas?: number; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Error desconocido");
      setLogAnalisis(`✅ Ciclo ${data.ciclo} completado. ${data.guardadas}/${data.total} mejoras guardadas.`);
      await new Promise((r) => setTimeout(r, 2000));
      setLogAnalisis(null);
      await cargar();
    } catch (e) {
      setError(String(e));
      setLogAnalisis(null);
    } finally {
      setAnalizando(false);
    }
  };

  const cambiarEstado = async (id: string, estado: string) => {
    setMejoras((prev) => prev.map((m) => m.id === id ? { ...m, estado } : m));
    try {
      await fetch("/api/admin/agente-ux", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, estado }),
      });
      if (stats) {
        await cargar(); // recargar stats
      }
    } catch { /* reverter */ await cargar(); }
  };

  const mejorasFiltradas = mejoras
    .filter((m) => filtro === "todos" || m.estado === filtro)
    .filter((m) => filtroCat === "todas" || m.categoria === filtroCat)
    .sort((a, b) => {
      const pa = PRIORIDAD_ORDEN[a.prioridad as keyof typeof PRIORIDAD_ORDEN] ?? 2;
      const pb = PRIORIDAD_ORDEN[b.prioridad as keyof typeof PRIORIDAD_ORDEN] ?? 2;
      if (pa !== pb) return pa - pb;
      return b.ciclo - a.ciclo;
    });

  const toggleExpandir = (id: string) =>
    setExpandido((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-[#f8faf8]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e5e5] px-6 py-4 sticky top-11 lg:top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-nunito font-black text-[#1A1A1A] text-xl">🤖 Agente UX</h1>
            <p className="font-nunito text-xs text-[#777] mt-0.5">
              Análisis continuo de experiencia y conversión — {stats ? `Ciclo ${stats.ciclo_actual}` : "Sin ciclos aún"}
            </p>
          </div>
          <button
            onClick={ejecutarAnalisis}
            disabled={analizando}
            className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-60 text-white font-nunito font-black px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            {analizando ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Analizando…
              </>
            ) : (
              <>⚡ Nuevo análisis</>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Log del análisis */}
        {logAnalisis && (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-2xl px-4 py-3">
            <p className="font-nunito text-sm text-[#166534] font-black">{logAnalisis}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-2xl px-4 py-3">
            <p className="font-nunito text-sm text-[#dc2626]">⚠️ {error}</p>
            {error.includes("MejorasUX") && (
              <p className="font-nunito text-xs text-[#dc2626] mt-1">
                Crea la tabla <strong>MejorasUX</strong> en Airtable con los campos: titulo, descripcion, categoria, prioridad, razon, implementacion, impacto_estimado, estado, ciclo, fecha.
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pendientes",    value: stats.pendientes,    color: "#F59E0B", bg: "#FFFBEB" },
              { label: "En progreso",   value: stats.en_progreso,   color: "#3B82F6", bg: "#EFF6FF" },
              { label: "Implementadas", value: stats.implementadas, color: "#3AAA35", bg: "#F0FDF4" },
              { label: "Total mejoras", value: stats.total,         color: "#6B7280", bg: "#F9FAFB" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl px-4 py-3 border border-[#f0f0f0] shadow-sm">
                <p className="font-nunito text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="font-nunito text-xs text-[#777] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {/* Por estado */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#e5e5e5]">
            {(["todos", "pendiente", "en_progreso", "implementado"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`font-nunito text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  filtro === f
                    ? "bg-[#3AAA35] text-white font-black"
                    : "text-[#555] hover:bg-[#f5f5f5]"
                }`}
              >
                {f === "todos" ? "Todas" : f === "en_progreso" ? "En progreso" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Por categoría */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#e5e5e5] flex-wrap">
            <button
              onClick={() => setFiltroCat("todas")}
              className={`font-nunito text-xs px-3 py-1.5 rounded-lg transition-colors ${
                filtroCat === "todas" ? "bg-[#1A1A1A] text-white font-black" : "text-[#555] hover:bg-[#f5f5f5]"
              }`}
            >
              Todas
            </button>
            {Object.entries(CATEGORIAS).filter(([k]) => k !== "general").map(([k, v]) => (
              <button
                key={k}
                onClick={() => setFiltroCat(k)}
                className={`font-nunito text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  filtroCat === k ? "font-black" : "text-[#555] hover:bg-[#f5f5f5]"
                }`}
                style={filtroCat === k ? { backgroundColor: v.bg, color: v.color } : {}}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de mejoras */}
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-[#3AAA35] border-t-transparent animate-spin" />
          </div>
        ) : mejorasFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#f0f0f0] p-12 text-center">
            <p className="text-4xl mb-3">🤖</p>
            <p className="font-nunito font-black text-[#1A1A1A] text-base">Sin mejoras aún</p>
            <p className="font-nunito text-sm text-[#777] mt-1">
              Ejecuta el primer análisis para que el agente genere mejoras priorizadas.
            </p>
            <button
              onClick={ejecutarAnalisis}
              disabled={analizando}
              className="mt-4 bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              ⚡ Ejecutar primer análisis
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {mejorasFiltradas.map((m) => {
              const cat = CATEGORIAS[m.categoria] ?? CATEGORIAS.general;
              const isOpen = expandido[m.id];
              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl border transition-all ${
                    m.estado === "implementado"
                      ? "border-[#86efac] opacity-70"
                      : m.estado === "en_progreso"
                      ? "border-[#93c5fd]"
                      : "border-[#f0f0f0]"
                  } shadow-sm`}
                >
                  {/* Card header */}
                  <div className="px-4 py-3 flex items-start gap-3">
                    {/* Prioridad dot */}
                    <div
                      className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          m.prioridad === "alta" ? "#DC2626" :
                          m.prioridad === "media" ? "#F59E0B" : "#6B7280",
                      }}
                      title={`Prioridad ${m.prioridad}`}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-nunito text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cat.bg, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                        <span className="font-nunito text-[10px] text-[#999]">Ciclo {m.ciclo}</span>
                        {m.impacto_estimado && (
                          <span className="font-nunito text-[10px] text-[#3AAA35] font-black bg-[#f0fdf4] px-2 py-0.5 rounded-full">
                            {m.impacto_estimado}
                          </span>
                        )}
                      </div>
                      <p
                        className="font-nunito font-black text-[#1A1A1A] text-sm mt-1 cursor-pointer hover:text-[#3AAA35] transition-colors"
                        onClick={() => toggleExpandir(m.id)}
                      >
                        {m.titulo}
                      </p>
                      <p className="font-nunito text-xs text-[#555] mt-0.5 leading-relaxed">{m.descripcion}</p>
                    </div>

                    {/* Estado selector */}
                    <div className="flex-shrink-0 flex flex-col gap-1 items-end">
                      <select
                        value={m.estado}
                        onChange={(e) => cambiarEstado(m.id, e.target.value)}
                        className="font-nunito text-[10px] border border-[#e5e5e5] rounded-lg px-2 py-1 text-[#555] focus:outline-none focus:border-[#3AAA35] cursor-pointer"
                      >
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="en_progreso">🔄 En progreso</option>
                        <option value="implementado">✅ Implementado</option>
                        <option value="descartado">❌ Descartado</option>
                      </select>
                      <button
                        onClick={() => toggleExpandir(m.id)}
                        className="text-[#bbb] hover:text-[#555] transition-colors"
                        aria-label={isOpen ? "Colapsar" : "Expandir"}
                      >
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                        >
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isOpen && (
                    <div className="border-t border-[#f5f5f5] px-4 py-3 space-y-3">
                      <div>
                        <p className="font-nunito text-[10px] font-black text-[#999] uppercase tracking-wide mb-1">¿Por qué hacerlo?</p>
                        <p className="font-nunito text-xs text-[#444] leading-relaxed">{m.razon}</p>
                      </div>
                      <div>
                        <p className="font-nunito text-[10px] font-black text-[#999] uppercase tracking-wide mb-1">Cómo implementar</p>
                        <p className="font-nunito text-xs text-[#444] bg-[#f9fafb] rounded-lg px-3 py-2 font-mono leading-relaxed">{m.implementacion}</p>
                      </div>
                      {m.fecha && (
                        <p className="font-nunito text-[10px] text-[#bbb]">
                          Generado: {new Date(m.fecha).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info self-feeding */}
        <div className="bg-white rounded-2xl border border-[#f0f0f0] px-5 py-4 text-center">
          <p className="font-nunito text-xs text-[#777] leading-relaxed">
            🔄 <strong>Retroalimentación automática:</strong> cada nuevo análisis lee las mejoras anteriores,
            escala la prioridad de las pendientes críticas y profundiza en nuevas capas de optimización.
            {stats && stats.ciclo_actual > 0 && (
              <> Ciclo actual: <strong>{stats.ciclo_actual}</strong> — {stats.implementadas} mejoras implementadas de {stats.total} generadas.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
