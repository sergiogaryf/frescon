"use client";

import { useEffect, useState, useCallback } from "react";
import { PedidoAdmin } from "@/lib/airtable";

const ESTADOS = ["Todos", "Pendiente", "Confirmado", "En camino", "Entregado", "Cancelado"];

const ESTADO_STYLE: Record<string, string> = {
  Pendiente:   "bg-[#F9C514]/20 text-[#7A5F00] border border-[#F9C514]/40",
  Confirmado:  "bg-blue-50 text-blue-600 border border-blue-200",
  "En camino": "bg-orange-50 text-orange-600 border border-orange-200",
  Entregado:   "bg-[#3AAA35]/10 text-[#1A6A18] border border-[#3AAA35]/30",
  Cancelado:   "bg-red-50 text-red-500 border border-red-200",
};

const ESTADO_EMOJI: Record<string, string> = {
  Pendiente: "\u{1F7E1}", Confirmado: "\u{1F535}", "En camino": "\u{1F7E0}", Entregado: "\u2705", Cancelado: "\u274C",
};

const TRANSICIONES: Record<string, string[]> = {
  Pendiente:   ["Confirmado", "Cancelado"],
  Confirmado:  ["En camino", "Cancelado"],
  "En camino": ["Entregado", "Cancelado"],
  Entregado:   [],
  Cancelado:   ["Pendiente"],
};

function formatFecha(iso: string) {
  if (!iso) return "\u2014";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

function formatMonto(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

function buildWhatsAppUrl(p: PedidoAdmin): string {
  const tel = p.telefono.replace(/\D/g, "").replace(/^56/, "");
  const msg =
    `\u2705 *\u00A1Pedido confirmado, ${p.nombre_cliente}!*\n\n` +
    `\u{1F6D2} *Tu pedido:*\n${p.detalle_pedido}\n\n` +
    `\u{1F4B0} *Total: ${formatMonto(p.total)}*\n\n` +
    `\u{1F4C5} *Entrega:* ${formatFecha(p.fecha_entrega)}\n` +
    `\u23F0 *Horario:* 10:00 a 13:00 hrs\n` +
    `\u{1F4CD} *Direcci\u00F3n:* ${p.direccion}\n` +
    (p.notas ? `\u{1F3E0} *Notas:* ${p.notas}\n` : "") +
    `\n\u00BFDudas? Responde este mensaje \u{1F431}\n\u2014 Celia, Fresc\u00F3n \u{1F33F}`;
  return `https://wa.me/56${tel}?text=${encodeURIComponent(msg)}`;
}

function parsearLineas(detalle: string) {
  return detalle.split("\n").filter(Boolean).map((linea) => {
    const m = linea.match(/^(\d+(?:\.\d+)?)x\s(.+?)\s\((.+?)\)\s[—\-]+\s\$([.\d]+)$/);
    if (!m) return { cantidad: 1, nombre: linea, unidad: "", unitPrice: 0, lineTotal: 0 };
    const cantidad = parseFloat(m[1]);
    const lineTotal = parseInt(m[4].replace(/\./g, ""), 10);
    return { cantidad, nombre: m[2].trim(), unidad: m[3], unitPrice: Math.round(lineTotal / cantidad), lineTotal };
  });
}

async function loadLogoBase64(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = "/icon.png";
  });
}

async function generarPdfPedido(p: PedidoAdmin) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const logoData = await loadLogoBase64();

  // --- Header verde ---
  doc.setFillColor(58, 170, 53);
  doc.rect(0, 0, W, 38, "F");

  if (logoData) {
    doc.addImage(logoData, "PNG", 12, 6, 26, 26);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("FRESCON", 42, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Delivery", 42, 28);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de Pedido", W - 15, 20, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(formatFecha(p.fecha_entrega), W - 15, 28, { align: "right" });

  // --- Datos del cliente ---
  let y = 50;
  const labelX = 15;
  const valueX = 50;

  doc.setTextColor(102, 102, 102);
  doc.setFontSize(9);

  const infoRows = [
    ["Cliente", p.nombre_cliente],
    ["Telefono", p.telefono],
    ["Direccion", p.direccion],
    ["Entrega", formatFecha(p.fecha_entrega)],
    ["Estado", p.estado],
  ];
  if (p.notas) infoRows.push(["Notas", p.notas]);

  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(102, 102, 102);
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 26, 26);
    const lines = doc.splitTextToSize(value, W - valueX - 15);
    doc.text(lines, valueX, y);
    y += lines.length * 5 + 2;
  }

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, W - 15, y);
  y += 8;

  // --- Tabla de productos ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(102, 102, 102);
  doc.text("Cant.", 15, y);
  doc.text("Producto", 30, y);
  doc.text("P.Unit.", W - 55, y, { align: "right" });
  doc.text("Subtotal", W - 15, y, { align: "right" });
  y += 3;
  doc.line(15, y, W - 15, y);
  y += 6;

  const items = parsearLineas(p.detalle_pedido);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(9);

  let subtotalCalc = 0;
  for (const item of items) {
    doc.text(String(item.cantidad), 15, y);
    const prodText = item.unidad ? `${item.nombre} (${item.unidad})` : item.nombre;
    const prodLines = doc.splitTextToSize(prodText, W - 95);
    doc.text(prodLines, 30, y);
    if (item.unitPrice > 0) {
      doc.text(formatMonto(item.unitPrice), W - 55, y, { align: "right" });
      doc.text(formatMonto(item.lineTotal), W - 15, y, { align: "right" });
    }
    subtotalCalc += item.lineTotal;
    y += prodLines.length * 5 + 2;
  }

  y += 4;
  doc.line(15, y, W - 15, y);
  y += 8;

  // --- Totales ---
  const descuento = subtotalCalc > p.total ? subtotalCalc - p.total : 0;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(102, 102, 102);

  doc.text("Subtotal", W - 60, y, { align: "right" });
  doc.setTextColor(26, 26, 26);
  doc.text(formatMonto(subtotalCalc), W - 15, y, { align: "right" });
  y += 6;

  doc.setTextColor(102, 102, 102);
  doc.text("Descuento", W - 60, y, { align: "right" });
  doc.setTextColor(26, 26, 26);
  doc.text(descuento > 0 ? `-${formatMonto(descuento)}` : "$0", W - 15, y, { align: "right" });
  y += 6;

  doc.setTextColor(102, 102, 102);
  doc.text("Envio", W - 60, y, { align: "right" });
  doc.setTextColor(58, 170, 53);
  doc.text("Gratis", W - 15, y, { align: "right" });
  y += 4;

  doc.setDrawColor(58, 170, 53);
  doc.setLineWidth(0.5);
  doc.line(W - 85, y, W - 15, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(58, 170, 53);
  doc.text("TOTAL", W - 60, y, { align: "right" });
  doc.text(formatMonto(p.total), W - 15, y, { align: "right" });

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(15, footerY, W - 15, footerY);
  doc.setTextColor(153, 153, 153);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Frescon Delivery | frescon.cl | Del Valle de Aconcagua a tu mesa", W / 2, footerY + 6, { align: "center" });

  return doc;
}

async function exportPdfPedidos(pedidos: PedidoAdmin[]) {
  const { initPdf, drawFooter, fmt } = await import("@/lib/pdf");
  const doc = await initPdf("Resumen de Pedidos", new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }));
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  // KPIs
  const totalMonto = pedidos.reduce((s, p) => s + p.total, 0);
  const pagados = pedidos.filter((p) => ["Confirmado", "Entregado", "En camino"].includes(p.estado)).length;

  doc.setFontSize(9);
  const kpis = [
    ["Total pedidos", String(pedidos.length)],
    ["Pagados", String(pagados)],
    ["Monto total", fmt(totalMonto)],
    ["Ticket promedio", fmt(pedidos.length > 0 ? Math.round(totalMonto / pedidos.length) : 0)],
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
  doc.text("Cliente", 15, y);
  doc.text("Entrega", 85, y);
  doc.text("Estado", 120, y);
  doc.text("Total", W - 15, y, { align: "right" });
  y += 3;
  doc.line(15, y, W - 15, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  for (const p of pedidos) {
    if (y > 270) {
      drawFooter(doc);
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(26, 26, 26);
    doc.text(p.nombre_cliente.slice(0, 30), 15, y);
    doc.setTextColor(102, 102, 102);
    doc.text(formatFecha(p.fecha_entrega), 85, y);
    doc.text(p.estado, 120, y);
    doc.setTextColor(58, 170, 53);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(p.total), W - 15, y, { align: "right" });
    doc.setFont("helvetica", "normal");
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
  doc.text("TOTAL", W - 55, y, { align: "right" });
  doc.text(fmt(totalMonto), W - 15, y, { align: "right" });

  drawFooter(doc);
  doc.save(`pedidos-frescon-${new Date().toISOString().split("T")[0]}.pdf`);
}

export default function AdminPedidosPage() {
  const [pedidos,    setPedidos]    = useState<PedidoAdmin[]>([]);
  const [filtro,     setFiltro]     = useState("Todos");
  const [loading,    setLoading]    = useState(true);
  const [expandido,  setExpandido]  = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const qs = filtro !== "Todos" ? `?estado=${encodeURIComponent(filtro)}` : "";
    const res = await fetch(`/api/admin/pedidos${qs}`);
    const data = await res.json();
    setPedidos(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filtro]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setActualizando(id);
    await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: nuevoEstado }),
    });
    await fetchPedidos();
    setActualizando(null);
  }

  async function descargarPdf(p: PedidoAdmin) {
    const doc = await generarPdfPedido(p);
    const nombre = p.nombre_cliente.replace(/\s+/g, "-").toLowerCase();
    doc.save(`pedido-${nombre}-${p.fecha_entrega}.pdf`);
  }

  async function compartirPdf(p: PedidoAdmin) {
    const doc = await generarPdfPedido(p);
    const blob = doc.output("blob");
    const nombre = p.nombre_cliente.replace(/\s+/g, "-").toLowerCase();
    const file = new File([blob], `pedido-${nombre}-${p.fecha_entrega}.pdf`, { type: "application/pdf" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Pedido ${p.nombre_cliente}` });
    } else {
      descargarPdf(p);
    }
  }

  const totales = {
    count: pedidos.length,
    monto: pedidos.reduce((s, p) => s + p.total, 0),
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">{"\u{1F4E6}"} Pedidos</h1>
        {!loading && (
          <p className="text-[#999] font-nunito text-sm mt-1">
            {totales.count} pedido{totales.count !== 1 ? "s" : ""} {"\u00B7"} Total: {formatMonto(totales.monto)}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`px-4 py-1.5 rounded-full font-nunito font-black text-sm transition-all ${
              filtro === e
                ? "bg-[#3AAA35] text-white"
                : "bg-white text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
            }`}
          >
            {ESTADO_EMOJI[e] ?? ""} {e}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => exportPdfPedidos(pedidos)}
            className="px-4 py-1.5 rounded-full font-nunito font-black text-sm bg-[#1A1A1A] text-white hover:bg-[#333] transition-all"
          >
            {"\u{1F4C4}"} Exportar PDF
          </button>
          <button
            onClick={fetchPedidos}
            className="px-4 py-1.5 rounded-full font-nunito font-black text-sm bg-white text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40 transition-all"
          >
            {"\u{1F504}"} Actualizar
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#bbb] font-nunito">Cargando pedidos{"\u2026"}</div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">{"\u{1F4ED}"}</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">No hay pedidos</p>
          <p className="text-[#999] text-sm font-nunito mt-1">en el estado seleccionado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">

              {/* Card header */}
              <div
                className="px-5 py-4 flex items-start gap-4 cursor-pointer hover:bg-[#f9fafb] transition-colors"
                onClick={() => setExpandido(expandido === p.id ? null : p.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-nunito font-black px-2.5 py-1 rounded-full ${ESTADO_STYLE[p.estado] ?? ""}`}>
                      {ESTADO_EMOJI[p.estado]} {p.estado}
                    </span>
                    <span className="text-[#999] text-xs font-nunito">{"\u{1F4C5}"} {formatFecha(p.fecha_entrega)}</span>
                  </div>
                  <p className="font-nunito font-black text-[#1A1A1A] text-base">{p.nombre_cliente}</p>
                  <p className="text-[#999] text-xs font-nunito truncate">{"\u{1F4CD}"} {p.direccion}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-nunito font-black text-[#3AAA35] text-lg">{formatMonto(p.total)}</p>
                  <p className="text-[#bbb] text-xs font-nunito">{expandido === p.id ? "\u25B2 ocultar" : "\u25BC detalle"}</p>
                </div>
              </div>

              {/* Detalle expandido */}
              {expandido === p.id && (
                <div className="border-t border-[#f0f0f0] px-5 py-4 bg-[#fafafa]">

                  {/* Info contacto */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm font-nunito">
                    <a href={`tel:${p.telefono}`} className="text-[#3AAA35] font-black hover:underline">
                      {"\u{1F4F1}"} {p.telefono}
                    </a>
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="text-[#666] hover:text-[#3AAA35] hover:underline">
                        {"\u{1F4E7}"} {p.email}
                      </a>
                    )}
                  </div>

                  {/* Direccion completa */}
                  <div className="bg-white rounded-2xl p-3 mb-4 border border-[#f0f0f0]">
                    <p className="font-nunito font-black text-[#1A1A1A] text-xs mb-1">{"\u{1F4CD}"} Direccion</p>
                    <p className="text-[#666] text-sm font-nunito">{p.direccion}</p>
                    {p.notas && (
                      <p className="text-[#F9C514] font-nunito font-black text-xs mt-2 bg-[#F9C514]/10 px-3 py-1.5 rounded-xl">
                        {"\u{1F3E0}"} {p.notas}
                      </p>
                    )}
                  </div>

                  {/* Detalle pedido */}
                  <div className="bg-white rounded-2xl p-4 mb-4">
                    <p className="font-nunito font-black text-[#1A1A1A] text-xs mb-2">{"\u{1F9FA}"} Productos</p>
                    {p.detalle_pedido.split("\n").map((linea, i) => (
                      <p key={i} className="text-[#666] text-sm font-nunito">{linea}</p>
                    ))}
                    <p className="font-nunito font-black text-[#3AAA35] text-sm mt-2 pt-2 border-t border-[#f0f0f0]">
                      Total: {formatMonto(p.total)}
                    </p>
                  </div>

                  {/* Botones de estado + acciones */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {TRANSICIONES[p.estado] && TRANSICIONES[p.estado].map((nuevoEstado) => (
                      <button
                        key={nuevoEstado}
                        disabled={actualizando === p.id}
                        onClick={() => cambiarEstado(p.id, nuevoEstado)}
                        className={`px-4 py-2 rounded-full font-nunito font-black text-sm transition-all disabled:opacity-50 ${
                          nuevoEstado === "Cancelado"
                            ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                            : nuevoEstado === "Entregado"
                            ? "bg-[#3AAA35] text-white hover:bg-[#2A7A26]"
                            : "bg-[#1A1A1A] text-white hover:bg-[#333]"
                        }`}
                      >
                        {actualizando === p.id ? "Guardando\u2026" : `${ESTADO_EMOJI[nuevoEstado]} Marcar ${nuevoEstado}`}
                      </button>
                    ))}

                    {/* Acciones: PDF + WhatsApp */}
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => descargarPdf(p)}
                        className="px-4 py-2 rounded-full font-nunito font-black text-sm bg-[#f0f0f0] text-[#666] hover:bg-[#e5e5e5] transition-all"
                      >
                        {"\u{1F4C4}"} PDF
                      </button>
                      <button
                        onClick={() => compartirPdf(p)}
                        className="px-4 py-2 rounded-full font-nunito font-black text-sm bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all"
                      >
                        {"\u{1F4E4}"} Compartir
                      </button>
                      <a
                        href={buildWhatsAppUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full font-nunito font-black text-sm bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-all"
                      >
                        {"\u{1F4AC}"} WhatsApp
                      </a>
                    </div>
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
