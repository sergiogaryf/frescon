"use client";

import { useEffect, useState } from "react";

interface ItemInventario {
  id:                  string;
  fecha:               string;
  producto_nombre:     string;
  stock_comprado_kg:   number;
  vendido_kg:          number;
  sobrante_kg:         number;
  precio_compra_total: number;
  merma_pct:           number;
}

function getEstado(sobrante: number, stock: number) {
  if (stock === 0) return { emoji: "⚪", label: "Sin datos",    color: "text-[#bbb]" };
  const pct = (sobrante / stock) * 100;
  if (pct <= 20) return { emoji: "🟢", label: "OK",            color: "text-[#3AAA35]" };
  if (pct <= 40) return { emoji: "🟡", label: "Atención",      color: "text-[#D4A800]" };
  return           { emoji: "🔴", label: "Mucho sobrante",    color: "text-red-500"   };
}

function getFechasRecientes(): string[] {
  const fechas: string[] = [];
  const d = new Date();
  for (let i = 0; i < 5; i++) {
    fechas.push(new Date(d).toISOString().split("T")[0]);
    d.setDate(d.getDate() - 7);
  }
  return fechas;
}

async function exportPdfInventario(items: ItemInventario[], fechaLabel: string) {
  const { initPdf, drawFooter, fmt } = await import("@/lib/pdf");
  const doc = await initPdf("Inventario", fechaLabel);
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  const totalCompra   = items.reduce((s, i) => s + i.precio_compra_total, 0);
  const totalVendido  = items.reduce((s, i) => s + i.vendido_kg, 0);
  const totalSobrante = items.reduce((s, i) => s + i.sobrante_kg, 0);

  doc.setFontSize(9);
  const kpis = [
    ["Productos", String(items.length)],
    ["Pagado Quillota", fmt(totalCompra)],
    ["Unidades vendidas", totalVendido.toFixed(1)],
    ["Sobrante total", totalSobrante.toFixed(1)],
  ];
  for (const [label, value] of kpis) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    doc.text(label, 20, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 26);
    doc.text(value, 75, y);
    y += 6;
  }

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, W - 15, y);
  y += 8;

  // Tabla
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(102, 102, 102);
  doc.text("Producto", 15, y);
  doc.text("Comprado", 75, y, { align: "right" });
  doc.text("Vendido", 105, y, { align: "right" });
  doc.text("Sobrante", 140, y, { align: "right" });
  doc.text("Estado", W - 15, y, { align: "right" });
  y += 3;
  doc.line(15, y, W - 15, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const item of items) {
    if (y > 270) { drawFooter(doc); doc.addPage(); y = 20; }
    const estado = getEstado(item.sobrante_kg, item.stock_comprado_kg);
    const pct = item.stock_comprado_kg > 0 ? Math.round((item.sobrante_kg / item.stock_comprado_kg) * 100) : 0;

    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.text(item.producto_nombre, 15, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    doc.text(String(item.stock_comprado_kg), 75, y, { align: "right" });
    doc.setTextColor(58, 170, 53);
    doc.text(String(item.vendido_kg), 105, y, { align: "right" });
    doc.setTextColor(pct > 40 ? 220 : 26, pct > 40 ? 50 : 26, pct > 40 ? 50 : 26);
    doc.text(`${item.sobrante_kg} (${pct}%)`, 140, y, { align: "right" });
    doc.setTextColor(102, 102, 102);
    doc.text(estado.label, W - 15, y, { align: "right" });
    y += 5;
  }

  y += 5;
  doc.setDrawColor(58, 170, 53);
  doc.setLineWidth(0.5);
  doc.line(W - 80, y, W - 15, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(58, 170, 53);
  doc.text("TOTAL COMPRA", W - 55, y, { align: "right" });
  doc.text(fmt(totalCompra), W - 15, y, { align: "right" });

  drawFooter(doc);
  doc.save(`inventario-frescon-${new Date().toISOString().split("T")[0]}.pdf`);
}

export default function AdminInventarioPage() {
  const fechas = getFechasRecientes();
  const [fecha,    setFecha]    = useState(fechas[0]);
  const [items,    setItems]    = useState<ItemInventario[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/inventario?fecha=${fecha}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [fecha]);

  const totalCompra   = items.reduce((s, i) => s + i.precio_compra_total, 0);
  const totalVendido  = items.reduce((s, i) => s + i.vendido_kg, 0);
  const totalSobrante = items.reduce((s, i) => s + i.sobrante_kg, 0);
  const mermaPromedio = items.length > 0
    ? Math.round(items.reduce((s, i) => s + i.merma_pct, 0) / items.length)
    : 0;

  function buildWAOferta(item: ItemInventario) {
    const msg = encodeURIComponent(
      `🍅 Sobrante fresco de hoy: ${item.producto_nombre} — ${item.sobrante_kg} unidades disponibles.\n¡Responde este mensaje para reservar!`
    );
    return `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56912345678"}?text=${msg}`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">📊 Inventario</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Stock comprado vs vendido por día de reparto</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              const label = new Date(fecha + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
              exportPdfInventario(items, label);
            }}
            className="bg-[#1A1A1A] hover:bg-[#333] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors"
          >
            📄 Exportar PDF
          </button>
        )}
      </div>

      {/* Selector fecha */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
        <p className="font-nunito font-black text-[#1A1A1A] text-sm mb-3">📅 Fecha de reparto</p>
        <div className="flex flex-wrap gap-2">
          {fechas.map((f) => {
            const label = f === fechas[0]
              ? "Hoy"
              : new Date(f + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" });
            return (
              <button
                key={f}
                onClick={() => setFecha(f)}
                className={`px-4 py-2 rounded-full font-nunito font-black text-sm transition-all ${
                  fecha === f
                    ? "bg-[#3AAA35] text-white"
                    : "bg-[#f9fafb] text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#bbb] font-nunito">Cargando inventario…</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin datos para esta fecha</p>
          <p className="text-[#999] text-sm font-nunito mt-1">El inventario se genera el día de reparto</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-nunito font-black text-[#1A1A1A]">{items.length}</p>
              <p className="text-[#999] text-xs font-nunito mt-1">Productos</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-lg font-nunito font-black text-[#3AAA35]">${totalCompra.toLocaleString("es-CL")}</p>
              <p className="text-[#999] text-xs font-nunito mt-1">Pagado Quillota</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-nunito font-black text-[#1A1A1A]">{totalVendido.toFixed(1)}</p>
              <p className="text-[#999] text-xs font-nunito mt-1">Unidades vendidas</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm text-center ${totalSobrante > 0 ? "bg-red-50" : "bg-[#3AAA35]/10"}`}>
              <p className={`text-2xl font-nunito font-black ${totalSobrante > 0 ? "text-red-500" : "text-[#3AAA35]"}`}>
                {totalSobrante.toFixed(1)}
              </p>
              <p className="text-[#999] text-xs font-nunito mt-1">Sobrante total</p>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
              <p className="font-nunito font-black text-[#1A1A1A]">Detalle por producto</p>
              <p className="text-[#999] text-xs font-nunito">Merma promedio: {mermaPromedio}%</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafb] text-left">
                    <th className="px-5 py-3 font-nunito font-black text-[#999] text-xs">Producto</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Comprado</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Vendido</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Sobrante</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-center">Estado</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-center">Oferta</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const estado = getEstado(item.sobrante_kg, item.stock_comprado_kg);
                    const pctSobrante = item.stock_comprado_kg > 0
                      ? Math.round((item.sobrante_kg / item.stock_comprado_kg) * 100)
                      : 0;
                    return (
                      <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                        <td className="px-5 py-3 font-nunito font-black text-[#1A1A1A] text-sm">{item.producto_nombre}</td>
                        <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">{item.stock_comprado_kg}</td>
                        <td className="px-4 py-3 font-nunito font-black text-[#3AAA35] text-sm text-right">{item.vendido_kg}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-nunito font-black text-sm ${pctSobrante > 40 ? "text-red-500" : "text-[#1A1A1A]"}`}>
                            {item.sobrante_kg}
                          </span>
                          <span className="text-[#bbb] text-xs font-nunito ml-1">({pctSobrante}%)</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-nunito font-black text-xs ${estado.color}`}>
                            {estado.emoji} {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pctSobrante > 30 && (
                            <a
                              href={buildWAOferta(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-nunito font-black text-[#3AAA35] hover:underline"
                            >
                              📱 Publicar oferta
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
