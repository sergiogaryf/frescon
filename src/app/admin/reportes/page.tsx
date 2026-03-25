"use client";

import { useEffect, useState } from "react";

interface Reporte {
  totalPedidos:        number;
  totalPagados:        number;
  totalEntregados:     number;
  totalPendientes:     number;
  totalCancelados:     number;
  ingresosPagados:     number;
  ingresosPendientes:  number;
  ingresosEntregados:  number;
  ticketPromedio:      number;
  porEstado:           Record<string, number>;
  topProductos:        { nombre: string; cantidad: number }[];
  semanales:           { fecha: string; pedidos: number; pagados: number; pendientes: number; ingresosPagados: number; ingresosPendientes: number }[];
}

const ESTADO_EMOJI: Record<string, string> = {
  Pendiente: "🟡", Confirmado: "🔵", "En camino": "🟠", Entregado: "✅", Cancelado: "❌",
};

function formatFecha(iso: string) {
  if (!iso || iso === "sin fecha") return "Sin fecha";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

function exportCSVReporte(semanales: Reporte["semanales"]) {
  const rows = [
    ["Fecha entrega", "Pedidos", "Pagados", "Pendientes", "Ingresos pagados", "Ingresos pendientes"],
    ...semanales.map((s) => [s.fecha, s.pedidos, s.pagados, s.pendientes, s.ingresosPagados, s.ingresosPendientes]),
  ];
  const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `reporte-frescon-${new Date().toISOString().split("T")[0]}.csv`; a.click();
}

export default function AdminReportesPage() {
  const [data,    setData]    = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reportes")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64 text-[#bbb] font-nunito">
      Calculando reportes...
    </div>
  );
  if (!data) return null;

  const maxProducto = Math.max(...data.topProductos.map((p) => p.cantidad), 1);
  const maxIngresoSemanal = Math.max(...data.semanales.map((s) => s.ingresosPagados + s.ingresosPendientes), 1);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">📈 Reportes</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Agrupado por fecha de entrega</p>
        </div>
        <button
          onClick={() => exportCSVReporte(data.semanales)}
          className="bg-[#1A1A1A] hover:bg-[#333] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total pedidos",     value: String(data.totalPedidos),                          color: "text-[#1A1A1A]" },
          { label: "Pagados",           value: String(data.totalPagados),                          color: "text-[#3AAA35]" },
          { label: "Ingresos pagados",  value: `$${data.ingresosPagados.toLocaleString("es-CL")}`, color: "text-[#3AAA35]" },
          { label: "Ticket promedio",   value: `$${data.ticketPromedio.toLocaleString("es-CL")}`,  color: "text-[#1A1A1A]" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className={`font-nunito font-black text-2xl ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[#999] text-xs font-nunito mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[#3AAA35]/8 rounded-2xl px-4 py-3 text-center">
          <p className="font-nunito font-black text-lg text-[#3AAA35]">${data.ingresosEntregados.toLocaleString("es-CL")}</p>
          <p className="font-nunito text-[10px] text-[#2A7A26] mt-0.5">✅ Ya entregados</p>
        </div>
        <div className="bg-[#F9C514]/10 rounded-2xl px-4 py-3 text-center">
          <p className="font-nunito font-black text-lg text-[#7A5F00]">${data.ingresosPendientes.toLocaleString("es-CL")}</p>
          <p className="font-nunito text-[10px] text-[#7A5F00] mt-0.5">🟡 Sin pago ({data.totalPendientes})</p>
        </div>
        <div className="bg-[#f9fafb] rounded-2xl px-4 py-3 text-center">
          <p className="font-nunito font-black text-lg text-[#1A1A1A]">
            {data.totalPedidos > 0 ? `${Math.round((data.totalPagados / data.totalPedidos) * 100)}%` : "—"}
          </p>
          <p className="font-nunito text-[10px] text-[#999] mt-0.5">💳 Tasa de pago</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Por estado */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">Pedidos por estado</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(data.porEstado).sort((a, b) => b[1] - a[1]).map(([estado, cantidad]) => (
              <div key={estado} className="flex items-center justify-between">
                <span className="font-nunito text-[#666] text-sm">{ESTADO_EMOJI[estado] ?? "•"} {estado}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-[#f0f0f0] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#3AAA35] h-full rounded-full"
                      style={{ width: `${(cantidad / data.totalPedidos) * 100}%` }}
                    />
                  </div>
                  <span className="font-nunito font-black text-[#1A1A1A] text-sm w-6 text-right">{cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">🏆 Top 5 productos</h2>
          <div className="flex flex-col gap-3">
            {data.topProductos.map((p, i) => (
              <div key={p.nombre}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-nunito font-black text-[#1A1A1A] text-sm">
                    {["🥇","🥈","🥉","4️⃣","5️⃣"][i]} {p.nombre}
                  </span>
                  <span className="text-[#999] text-xs font-nunito">{p.cantidad} u.</span>
                </div>
                <div className="bg-[#f0f0f0] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#3AAA35] h-full rounded-full transition-all"
                    style={{ width: `${(p.cantidad / maxProducto) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historico por fecha de entrega */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f0f0f0]">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base">Por fecha de entrega</h2>
        </div>

        {/* Mini barchart */}
        <div className="px-6 pt-4 pb-2 flex items-end gap-2 h-32">
          {data.semanales.map((s) => {
            const pctPagados    = maxIngresoSemanal > 0 ? (s.ingresosPagados / maxIngresoSemanal) * 100 : 0;
            const pctPendientes = maxIngresoSemanal > 0 ? (s.ingresosPendientes / maxIngresoSemanal) * 100 : 0;
            return (
              <div key={s.fecha} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                  {pctPendientes > 0 && (
                    <div
                      className="w-full bg-[#F9C514]/40 rounded-t-md"
                      style={{ height: `${pctPendientes}%` }}
                      title={`Sin pago: $${s.ingresosPendientes.toLocaleString("es-CL")}`}
                    />
                  )}
                  {pctPagados > 0 && (
                    <div
                      className={`w-full bg-[#3AAA35] ${pctPendientes > 0 ? "" : "rounded-t-md"} rounded-b-md`}
                      style={{ height: `${pctPagados}%` }}
                      title={`Pagados: $${s.ingresosPagados.toLocaleString("es-CL")}`}
                    />
                  )}
                  {pctPagados === 0 && pctPendientes === 0 && (
                    <div className="w-full bg-[#f0f0f0] rounded-md" style={{ height: "4px" }} />
                  )}
                </div>
                <span className="font-nunito text-[9px] text-[#999] text-center leading-tight">
                  {formatFecha(s.fecha).split(",")[0]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="px-6 pb-3 flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-nunito text-[10px] text-[#999]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3AAA35]" /> Pagado
          </span>
          <span className="flex items-center gap-1.5 font-nunito text-[10px] text-[#999]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F9C514]/40" /> Sin pago
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto border-t border-[#f0f0f0]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className="px-6 py-3 font-nunito font-black text-[#999] text-xs text-left">Fecha entrega</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Pedidos</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Pagados</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Sin pago</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Ticket prom.</th>
              </tr>
            </thead>
            <tbody>
              {data.semanales.map((s, i) => (
                <tr key={s.fecha} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                  <td className="px-6 py-3 font-nunito font-black text-[#1A1A1A] text-sm">{formatFecha(s.fecha)}</td>
                  <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">{s.pedidos}</td>
                  <td className="px-4 py-3 font-nunito font-black text-[#3AAA35] text-sm text-right">
                    {s.ingresosPagados > 0 ? `$${s.ingresosPagados.toLocaleString("es-CL")}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-nunito font-black text-[#7A5F00] text-sm text-right">
                    {s.ingresosPendientes > 0 ? `$${s.ingresosPendientes.toLocaleString("es-CL")}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">
                    {s.pagados > 0 ? `$${Math.round(s.ingresosPagados / s.pagados).toLocaleString("es-CL")}` : "—"}
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
