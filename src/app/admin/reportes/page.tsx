"use client";

import { useEffect, useState } from "react";

interface Reporte {
  totalPedidos:     number;
  totalEntregados:  number;
  ingresos:         number;
  ticketPromedio:   number;
  porEstado:        Record<string, number>;
  topProductos:     { nombre: string; cantidad: number }[];
  semanales:        { fecha: string; pedidos: number; ingresos: number }[];
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
    ["Fecha", "Pedidos", "Ingresos"],
    ...semanales.map((s) => [s.fecha, s.pedidos, s.ingresos]),
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
      Calculando reportes…
    </div>
  );
  if (!data) return null;

  const maxProducto = Math.max(...data.topProductos.map((p) => p.cantidad), 1);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">📈 Reportes</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Resumen general del negocio</p>
        </div>
        <button
          onClick={() => exportCSVReporte(data.semanales)}
          className="bg-[#1A1A1A] hover:bg-[#333] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total pedidos",     value: data.totalPedidos,                    color: "text-[#1A1A1A]" },
          { label: "Entregados",        value: data.totalEntregados,                 color: "text-[#3AAA35]" },
          { label: "Ingresos totales",  value: `$${data.ingresos.toLocaleString("es-CL")}`, color: "text-[#3AAA35]" },
          { label: "Ticket promedio",   value: `$${data.ticketPromedio.toLocaleString("es-CL")}`, color: "text-[#1A1A1A]" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className={`font-nunito font-black text-2xl ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[#999] text-xs font-nunito mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Por estado */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">Pedidos por estado</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(data.porEstado).sort((a, b) => b[1] - a[1]).map(([estado, cantidad]) => (
              <div key={estado} className="flex items-center justify-between">
                <span className="font-nunito text-[#666] text-sm">{ESTADO_EMOJI[estado] ?? "•"} {estado}</span>
                <span className="font-nunito font-black text-[#1A1A1A] text-sm">{cantidad}</span>
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

      {/* Histórico por semana */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f0f0f0]">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base">Histórico por fecha de entrega</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className="px-6 py-3 font-nunito font-black text-[#999] text-xs text-left">Fecha</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Pedidos</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Ingresos</th>
                <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Ticket prom.</th>
              </tr>
            </thead>
            <tbody>
              {data.semanales.map((s, i) => (
                <tr key={s.fecha} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                  <td className="px-6 py-3 font-nunito font-black text-[#1A1A1A] text-sm">{formatFecha(s.fecha)}</td>
                  <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">{s.pedidos}</td>
                  <td className="px-4 py-3 font-nunito font-black text-[#3AAA35] text-sm text-right">
                    ${s.ingresos.toLocaleString("es-CL")}
                  </td>
                  <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">
                    {s.pedidos > 0 ? `$${Math.round(s.ingresos / s.pedidos).toLocaleString("es-CL")}` : "—"}
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
