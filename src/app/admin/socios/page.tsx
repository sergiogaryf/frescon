"use client";

import { useState } from "react";

/* ── Tipos ── */
interface Socio {
  id: string;
  nombre: string;
  rol: string;
  balance: number;
  telefono: string;
  conectado: boolean;
}

interface Aprobacion {
  id: string;
  concepto: string;
  monto: number;
  solicitadoPor: string;
  fecha: string;
}

interface Movimiento {
  id: string;
  fecha: string;
  concepto: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  estado: "Aprobado" | "Rechazado" | "Acreditado" | "Pendiente";
  socio: string;
}

/* ── Mock data ── */
const SOCIOS: Socio[] = [
  { id: "s1", nombre: "Socio 1",  rol: "Operaciones",  balance: 189425, telefono: "912345678", conectado: true  },
  { id: "s2", nombre: "Socio 2",  rol: "Comercial",    balance: 189425, telefono: "987654321", conectado: false },
];

const APROBACIONES: Aprobacion[] = [
  { id: "a1", concepto: "Reposicion frutas",  monto: 85000,  solicitadoPor: "Socio 1", fecha: "2026-04-14" },
  { id: "a2", concepto: "Gasolina reparto",   monto: 45000,  solicitadoPor: "Socio 2", fecha: "2026-04-13" },
];

const MOVIMIENTOS: Movimiento[] = [
  { id: "m1", fecha: "2026-04-15", concepto: "Venta online",            tipo: "ingreso", monto: 124500, estado: "Acreditado", socio: "Socio 1" },
  { id: "m2", fecha: "2026-04-14", concepto: "Compra frutas",           tipo: "egreso",  monto: 85000,  estado: "Aprobado",   socio: "Socio 1" },
  { id: "m3", fecha: "2026-04-13", concepto: "Gasolina reparto",        tipo: "egreso",  monto: 45000,  estado: "Pendiente",  socio: "Socio 2" },
  { id: "m4", fecha: "2026-04-12", concepto: "Publicidad Instagram",    tipo: "egreso",  monto: 32000,  estado: "Aprobado",   socio: "Socio 2" },
  { id: "m5", fecha: "2026-04-11", concepto: "Venta online",            tipo: "ingreso", monto: 98700,  estado: "Acreditado", socio: "Socio 1" },
  { id: "m6", fecha: "2026-04-10", concepto: "Etiquetas packaging",     tipo: "egreso",  monto: 18500,  estado: "Aprobado",   socio: "Socio 1" },
  { id: "m7", fecha: "2026-04-09", concepto: "Compra frutas",           tipo: "egreso",  monto: 72000,  estado: "Rechazado",  socio: "Socio 2" },
  { id: "m8", fecha: "2026-04-08", concepto: "Venta online",            tipo: "ingreso", monto: 156300, estado: "Acreditado", socio: "Socio 2" },
];

const ESTADO_STYLE: Record<string, string> = {
  Aprobado:   "bg-[#3AAA35]/10 text-[#1A6A18] border border-[#3AAA35]/30",
  Rechazado:  "bg-red-50 text-red-500 border border-red-200",
  Acreditado: "bg-blue-50 text-blue-600 border border-blue-200",
  Pendiente:  "bg-[#F9C514]/20 text-[#7A5F00] border border-[#F9C514]/40",
};

const ESTADO_EMOJI: Record<string, string> = {
  Aprobado: "\u2705", Rechazado: "\u274C", Acreditado: "\uD83D\uDCB3", Pendiente: "\uD83D\uDD52",
};

/* ── Helpers ── */
function fmt(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

function formatFecha(iso: string) {
  if (!iso) return "\u2014";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

function buildWhatsAppUrl(tel: string, msg: string) {
  const clean = tel.replace(/\D/g, "").replace(/^56/, "");
  return `https://wa.me/56${clean}?text=${encodeURIComponent(msg)}`;
}

/* ── Componente ── */
export default function AdminSociosPage() {
  const [aprobaciones, setAprobaciones] = useState(APROBACIONES);
  const [movimientos]                   = useState(MOVIMIENTOS);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [showForm, setShowForm]         = useState(false);
  const [nuevoGasto, setNuevoGasto]     = useState({ concepto: "", monto: "", socio: "Socio 1" });

  /* KPIs */
  const totalEquity   = SOCIOS.reduce((s, p) => s + p.balance, 0);
  const ingresosMes   = movimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const egresosMes    = movimientos.filter((m) => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);
  const plMes         = ingresosMes - egresosMes;

  /* Acciones mock */
  function aprobar(id: string) {
    setAprobaciones((prev) => prev.filter((a) => a.id !== id));
  }
  function rechazar(id: string) {
    setAprobaciones((prev) => prev.filter((a) => a.id !== id));
  }

  /* Filtro movimientos */
  const ESTADOS_FILTRO = ["Todos", "Aprobado", "Rechazado", "Acreditado", "Pendiente"];
  const movFiltrados   = filtroEstado === "Todos" ? movimientos : movimientos.filter((m) => m.estado === filtroEstado);

  /* WhatsApp preview */
  function generarWaMsg() {
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return "";
    return `\uD83D\uDCB8 *Solicitud de gasto \u2014 Frescon*\n\n\uD83D\uDCCB *Concepto:* ${nuevoGasto.concepto}\n\uD83D\uDCB0 *Monto:* $${parseInt(nuevoGasto.monto || "0").toLocaleString("es-CL")}\n\uD83D\uDC64 *Solicitado por:* ${nuevoGasto.socio}\n\uD83D\uDCC5 *Fecha:* ${new Date().toLocaleDateString("es-CL")}\n\n\u00BFApruebas este gasto? Responde SI o NO`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">{"\uD83D\uDCB0"} Wallet Socios</h1>
        <p className="text-[#999] font-nunito text-sm mt-1">
          Gestion financiera entre socios de Frescon
        </p>
      </div>

      {/* ── Tarjetas de socios ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {SOCIOS.map((socio) => (
          <div key={socio.id} className="bg-white rounded-3xl shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#3AAA35]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{"\uD83D\uDC64"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-nunito font-black text-[#1A1A1A]">{socio.nombre}</p>
                  <span className={`text-[10px] font-nunito font-black px-2 py-0.5 rounded-full ${
                    socio.conectado
                      ? "bg-[#3AAA35]/10 text-[#2A7A26]"
                      : "bg-[#f9fafb] text-[#bbb]"
                  }`}>
                    {socio.conectado ? "\uD83D\uDFE2 Conectado" : "\u26AA Desconectado"}
                  </span>
                </div>
                <p className="text-[#999] text-xs font-nunito">{socio.rol} {"\u00B7"} +56 {socio.telefono}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-nunito font-black text-[#3AAA35] text-xl">{fmt(socio.balance)}</p>
                <p className="text-[#bbb] text-[10px] font-nunito">Balance</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPIs resumen ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Equity total",     value: fmt(totalEquity),  color: "text-[#1A1A1A]" },
          { label: "Ingresos mes",     value: fmt(ingresosMes),  color: "text-[#3AAA35]" },
          { label: "Egresos mes",      value: fmt(egresosMes),   color: "text-[#7A5F00]" },
          { label: "P&L mensual",      value: fmt(plMes),        color: plMes >= 0 ? "text-[#3AAA35]" : "text-red-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className={`font-nunito font-black text-2xl ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[#999] text-xs font-nunito mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Aprobaciones pendientes ── */}
      {aprobaciones.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">{"\uD83D\uDD14"} Aprobaciones pendientes</h2>
          <div className="flex flex-col gap-3">
            {aprobaciones.map((a) => (
              <div key={a.id} className="flex items-center gap-4 bg-[#F9C514]/5 rounded-2xl px-4 py-3 border border-[#F9C514]/20">
                <div className="flex-1 min-w-0">
                  <p className="font-nunito font-black text-[#1A1A1A] text-sm">{a.concepto}</p>
                  <p className="text-[#999] text-xs font-nunito">
                    {a.solicitadoPor} {"\u00B7"} {formatFecha(a.fecha)}
                  </p>
                </div>
                <p className="font-nunito font-black text-[#7A5F00] text-lg flex-shrink-0">{fmt(a.monto)}</p>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => aprobar(a.id)}
                    className="px-4 py-2 rounded-full font-nunito font-black text-sm bg-[#3AAA35] text-white hover:bg-[#2A7A26] transition-all"
                  >
                    {"\u2705"} Aprobar
                  </button>
                  <button
                    onClick={() => rechazar(a.id)}
                    className="px-4 py-2 rounded-full font-nunito font-black text-sm bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all"
                  >
                    {"\u274C"} Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Nuevo gasto + WhatsApp preview ── */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border-2 border-[#3AAA35]/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base">{"\uD83D\uDCDD"} Solicitar gasto</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-nunito font-black px-3 py-1.5 rounded-full border border-[#e5e5e5] hover:border-[#3AAA35]/40 text-[#666] transition-colors"
          >
            {showForm ? "Cerrar" : "+ Nuevo"}
          </button>
        </div>

        {showForm && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="font-nunito font-black text-[#1A1A1A] text-xs">Concepto</label>
                <input
                  type="text"
                  value={nuevoGasto.concepto}
                  placeholder="Compra frutas, Gasolina..."
                  onChange={(e) => setNuevoGasto((f) => ({ ...f, concepto: e.target.value }))}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm text-[#1A1A1A]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-nunito font-black text-[#1A1A1A] text-xs">Monto ($)</label>
                <input
                  type="number"
                  value={nuevoGasto.monto}
                  placeholder="85000"
                  onChange={(e) => setNuevoGasto((f) => ({ ...f, monto: e.target.value }))}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm text-[#1A1A1A]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-nunito font-black text-[#1A1A1A] text-xs">Solicitado por</label>
                <select
                  value={nuevoGasto.socio}
                  onChange={(e) => setNuevoGasto((f) => ({ ...f, socio: e.target.value }))}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm"
                >
                  {SOCIOS.map((s) => (
                    <option key={s.id} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* WhatsApp preview */}
            {nuevoGasto.concepto && nuevoGasto.monto && (
              <div className="bg-[#25D366]/5 rounded-2xl p-4 border border-[#25D366]/20">
                <p className="font-nunito font-black text-[#128C7E] text-xs mb-2">{"\uD83D\uDCAC"} Vista previa WhatsApp</p>
                <pre className="font-nunito text-sm text-[#666] whitespace-pre-wrap leading-relaxed mb-3">
                  {generarWaMsg()}
                </pre>
                <div className="flex gap-2">
                  {SOCIOS.filter((s) => s.nombre !== nuevoGasto.socio).map((s) => (
                    <a
                      key={s.id}
                      href={buildWhatsAppUrl(s.telefono, generarWaMsg())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full font-nunito font-black text-sm bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-all"
                    >
                      {"\uD83D\uDCAC"} Enviar a {s.nombre}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Tabla de movimientos ── */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base">{"\uD83D\uDCCA"} Movimientos recientes</h2>
          <div className="flex gap-2">
            {ESTADOS_FILTRO.map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-3 py-1.5 rounded-full font-nunito font-black text-xs transition-all ${
                  filtroEstado === e
                    ? "bg-[#3AAA35] text-white"
                    : "bg-[#f9fafb] text-[#999] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
                }`}
              >
                {ESTADO_EMOJI[e] ?? ""} {e}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className="px-6 py-3 font-nunito font-black text-[#999] text-xs text-left">Fecha</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-left">Concepto</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-left">Socio</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Monto</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {movFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-4xl mb-2">{"\uD83D\uDCED"}</p>
                    <p className="font-nunito font-black text-[#1A1A1A]">Sin movimientos</p>
                    <p className="text-[#999] text-sm font-nunito mt-1">en el estado seleccionado</p>
                  </td>
                </tr>
              ) : movFiltrados.map((m, i) => (
                <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                  <td className="px-6 py-3 font-nunito text-[#666] text-sm">{formatFecha(m.fecha)}</td>
                  <td className="px-4 py-3 font-nunito font-black text-[#1A1A1A] text-sm">{m.concepto}</td>
                  <td className="px-4 py-3 font-nunito text-[#666] text-sm">{m.socio}</td>
                  <td className={`px-4 py-3 font-nunito font-black text-sm text-right ${
                    m.tipo === "ingreso" ? "text-[#3AAA35]" : "text-[#1A1A1A]"
                  }`}>
                    {m.tipo === "ingreso" ? "+" : "-"}{fmt(m.monto)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-nunito font-black px-2.5 py-1 rounded-full ${ESTADO_STYLE[m.estado]}`}>
                      {ESTADO_EMOJI[m.estado]} {m.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
