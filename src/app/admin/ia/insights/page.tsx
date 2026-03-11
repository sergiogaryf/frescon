"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ItemConteo {
  valor: string;
  count: number;
}

interface UltimaConsulta {
  fecha:       string;
  pregunta:    string;
  categoria:   string;
  perfil:      string;
  dieta:       string;
  sesion_tipo: string;
}

interface InsightsData {
  total_registros:  number;
  perfiles:         ItemConteo[];
  intereses:        ItemConteo[];
  dietas:           ItemConteo[];
  signos:           ItemConteo[];
  categorias:       ItemConteo[];
  sesiones:         ItemConteo[];
  recomendacion:    string;
  tendencias:       { esta_semana: Record<string, number>; semana_pasada: Record<string, number> };
  ultimas_consultas: UltimaConsulta[];
  generado_en:      string;
}

const PERFIL_EMOJI: Record<string, string> = {
  activo:     "🏃",
  gym:        "🏋️",
  bailarin:   "💃",
  sedentario: "🛋️",
  deportista: "🎯",
  vegano:     "🌱",
  vegetariano:"🥗",
};

const DIETA_EMOJI: Record<string, string> = {
  vegano:       "🌱",
  vegetariano:  "🥗",
  omnivoro:     "🍗",
  sin_gluten:   "🌾",
};

const SESION_EMOJI: Record<string, string> = {
  nueva_consulta: "✨",
  recompra:       "🔁",
  soporte:        "🆘",
};

function BarChart({ items, colorClass = "bg-[#3AAA35]" }: { items: ItemConteo[]; colorClass?: string }) {
  const max = items[0]?.count ?? 1;
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.valor} className="flex items-center gap-3">
          <span className="font-nunito text-sm text-[#444] w-28 truncate capitalize">{item.valor}</span>
          <div className="flex-1 bg-[#f0f0f0] rounded-full h-3 overflow-hidden">
            <div
              className={`${colorClass} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="font-nunito font-black text-sm text-[#1A1A1A] w-6 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const [data,     setData]     = useState<InsightsData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/celia-insights");
      if (!res.ok) throw new Error("Error al cargar");
      const json = await res.json();
      setData(json);
    } catch {
      setError("No se pudieron cargar los insights. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-[#f0f0f0] px-6 lg:px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-2xl">💡 Insights de Celia</h1>
          <p className="text-[#999] font-nunito text-sm mt-0.5">Lo que quieren tus clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/ia"
            className="text-xs font-nunito font-black px-4 py-2 rounded-full border border-[#e5e5e5] text-[#666] hover:border-[#3AAA35]/40 transition-all"
          >
            ← Volver
          </Link>
          <button
            onClick={cargar}
            disabled={cargando}
            className="text-xs font-nunito font-black px-4 py-2 rounded-full bg-[#3AAA35] text-white hover:bg-[#2A7A26] disabled:opacity-40 transition-all"
          >
            {cargando ? "Cargando…" : "🔄 Actualizar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 lg:mx-8 mt-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 font-nunito text-sm text-red-600">
          {error}
        </div>
      )}

      {cargando && !data && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-[#3AAA35] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="font-nunito text-sm text-[#999]">Analizando datos…</p>
          </div>
        </div>
      )}

      {data && (
        <div className="px-6 lg:px-8 py-6 flex flex-col gap-6">

          {/* Stat rápida */}
          <div className="bg-white rounded-3xl shadow-sm px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#3AAA35]/10 flex items-center justify-center text-2xl">📊</div>
            <div>
              <p className="font-nunito font-black text-[#1A1A1A] text-xl">{data.total_registros} consultas analizadas</p>
              <p className="font-nunito text-xs text-[#999]">
                Actualizado: {new Date(data.generado_en).toLocaleString("es-CL")}
              </p>
            </div>
          </div>

          {/* Recomendación del día */}
          <div className="bg-[#3AAA35] rounded-3xl shadow-sm px-6 py-5">
            <p className="font-nunito font-black text-white text-base mb-2">🌟 Recomendación del día</p>
            <p className="font-nunito text-white/90 text-sm leading-relaxed">{data.recomendacion}</p>
          </div>

          {/* Grid de secciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Perfiles detectados */}
            <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">👤 Perfiles detectados</h2>
              {data.perfiles.length === 0 ? (
                <p className="font-nunito text-sm text-[#bbb]">Sin datos aún</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.perfiles.slice(0, 6).map((p) => (
                    <div key={p.valor} className="flex items-center justify-between bg-[#fafafa] rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{PERFIL_EMOJI[p.valor] ?? "👤"}</span>
                        <span className="font-nunito font-bold text-sm text-[#1A1A1A] capitalize">{p.valor}</span>
                      </div>
                      <span className="font-nunito font-black text-[#3AAA35] text-lg">{p.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tipo de sesión */}
            <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">🔁 Tipo de sesión</h2>
              {data.sesiones.length === 0 ? (
                <p className="font-nunito text-sm text-[#bbb]">Sin datos aún</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.sesiones.map((s) => (
                    <div key={s.valor} className="flex items-center justify-between bg-[#fafafa] rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{SESION_EMOJI[s.valor] ?? "💬"}</span>
                        <span className="font-nunito font-bold text-sm text-[#1A1A1A] capitalize">{s.valor.replace("_", " ")}</span>
                      </div>
                      <span className="font-nunito font-black text-[#3AAA35] text-lg">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Intereses frecuentes */}
            <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">🏷️ Intereses frecuentes</h2>
              {data.intereses.length === 0 ? (
                <p className="font-nunito text-sm text-[#bbb]">Sin datos aún</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.intereses.slice(0, 12).map((i) => (
                    <span
                      key={i.valor}
                      className="inline-flex items-center gap-1 bg-[#3AAA35]/10 text-[#2A7A26] font-nunito font-bold text-xs px-3 py-1.5 rounded-full"
                    >
                      {i.valor.replace(/_/g, " ")}
                      <span className="bg-[#3AAA35] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">
                        {i.count}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dietas */}
            <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">🥦 Dietas</h2>
              {data.dietas.length === 0 ? (
                <p className="font-nunito text-sm text-[#bbb]">Sin datos aún</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.dietas.map((d) => (
                    <div key={d.valor} className="flex items-center gap-3">
                      <span className="text-lg">{DIETA_EMOJI[d.valor] ?? "🍽️"}</span>
                      <div className="flex-1">
                        <BarChart items={[d]} colorClass="bg-[#3AAA35]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categorías de preguntas */}
            <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">📂 Categorías de consultas</h2>
              {data.categorias.length === 0 ? (
                <p className="font-nunito text-sm text-[#bbb]">Sin datos aún</p>
              ) : (
                <BarChart items={data.categorias.slice(0, 8)} />
              )}
            </div>

            {/* Signos zodiacales */}
            <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">♈ Signos zodiacales</h2>
              {data.signos.length === 0 ? (
                <p className="font-nunito text-sm text-[#bbb]">Sin datos aún</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.signos.map((s) => (
                    <span
                      key={s.valor}
                      className="inline-flex items-center gap-1 bg-[#fafafa] border border-[#e5e5e5] text-[#444] font-nunito text-xs px-3 py-1.5 rounded-full"
                    >
                      <span className="capitalize">{s.valor}</span>
                      <span className="font-black text-[#3AAA35]">{s.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Tendencias */}
          {(Object.keys(data.tendencias.esta_semana).length > 0 || Object.keys(data.tendencias.semana_pasada).length > 0) && (
            <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
              <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">📈 Tendencias — esta semana vs anterior</h2>
              <div className="overflow-x-auto">
                <table className="w-full font-nunito text-sm">
                  <thead>
                    <tr className="text-left text-[#999] text-xs">
                      <th className="pb-2 font-black">Categoría</th>
                      <th className="pb-2 font-black text-right">Esta semana</th>
                      <th className="pb-2 font-black text-right">Semana anterior</th>
                      <th className="pb-2 font-black text-right">Var.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {Array.from(new Set([
                      ...Object.keys(data.tendencias.esta_semana),
                      ...Object.keys(data.tendencias.semana_pasada),
                    ])).map((cat) => {
                      const actual   = data.tendencias.esta_semana[cat]   ?? 0;
                      const anterior = data.tendencias.semana_pasada[cat] ?? 0;
                      const diff     = actual - anterior;
                      return (
                        <tr key={cat}>
                          <td className="py-2 capitalize text-[#1A1A1A]">{cat}</td>
                          <td className="py-2 text-right font-black text-[#1A1A1A]">{actual}</td>
                          <td className="py-2 text-right text-[#999]">{anterior}</td>
                          <td className={`py-2 text-right font-black ${diff > 0 ? "text-[#3AAA35]" : diff < 0 ? "text-red-500" : "text-[#999]"}`}>
                            {diff > 0 ? `+${diff}` : diff === 0 ? "—" : diff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Últimas consultas */}
          <div className="bg-white rounded-3xl shadow-sm px-6 py-5">
            <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">💬 Últimas 10 consultas</h2>
            {data.ultimas_consultas.length === 0 ? (
              <p className="font-nunito text-sm text-[#bbb]">Sin consultas aún</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.ultimas_consultas.map((c, i) => (
                  <div key={i} className="bg-[#fafafa] rounded-2xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-nunito text-sm text-[#1A1A1A] leading-snug flex-1">{c.pregunta}</p>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {c.perfil && (
                          <span className="text-xs bg-[#3AAA35]/10 text-[#2A7A26] font-nunito font-bold px-2 py-0.5 rounded-full capitalize">
                            {PERFIL_EMOJI[c.perfil] ?? "👤"} {c.perfil}
                          </span>
                        )}
                        {c.sesion_tipo && (
                          <span className="text-xs bg-[#f0f0f0] text-[#666] font-nunito px-2 py-0.5 rounded-full">
                            {c.sesion_tipo.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[#bbb] font-nunito">
                        {new Date(c.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-xs bg-[#f0f0f0] text-[#888] font-nunito px-2 py-0.5 rounded-full">{c.categoria}</span>
                      {c.dieta && (
                        <span className="text-xs text-[#bbb] font-nunito">{DIETA_EMOJI[c.dieta] ?? ""} {c.dieta}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
