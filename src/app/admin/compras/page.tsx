"use client";

import { useEffect, useState, useCallback } from "react";
import { PedidoAdmin } from "@/lib/airtable";
import Image from "next/image";

/* ── Tipos ── */
interface CompraItem {
  id: string; fecha: string; proveedor: string; producto: string;
  cantidad: number; unidad: string; precio_unitario: number; subtotal: number;
  categoria: string; boleta_url: string; notas: string; creado_por: string;
  estado: string; lote: string;
}

interface FormItem {
  producto: string; cantidad: number; unidad: string;
  precio_unitario: number; categoria: string;
}

const CATEGORIAS = ["Frutas", "Verduras", "Empaque", "Insumos", "Transporte", "Otros"];
const UNIDADES   = ["kg", "unidad", "caja", "bolsa", "rollo", "paquete", "atado", "bandeja"];

const INSUMOS_SUGERIDOS = [
  "Bolsas kraft 1kg", "Bolsas kraft 2kg", "Bolsas kraft 3kg", "Bolsas plásticas",
  "Cajas de cartón", "Etiquetas Frescón", "Cinta embalaje", "Film plástico",
  "Guantes", "Elásticos", "Stickers", "Hielo",
];

const EMPTY_ITEM: FormItem = { producto: "", cantidad: 1, unidad: "kg", precio_unitario: 0, categoria: "Verduras" };

/* ── Precios mayorista (para tab "Consolidado") ── */
interface PrecioMayorista {
  unidad_compra: string; peso_unidad: number; precio_unidad: number; tipo: "kg" | "unidad" | "atado";
}
const PRECIOS: Record<string, PrecioMayorista> = {
  "Tomate":    { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad: 12600, tipo: "kg"     },
  "Papa":      { unidad_compra: "malla",  peso_unidad: 15, precio_unidad:  6000, tipo: "kg"     },
  "Cebolla":   { unidad_compra: "malla",  peso_unidad: 18, precio_unidad:  6300, tipo: "kg"     },
  "Zanahoria": { unidad_compra: "malla",  peso_unidad: 18, precio_unidad:  8100, tipo: "kg"     },
  "Lechuga":   { unidad_compra: "cajón",  peso_unidad: 24, precio_unidad: 12000, tipo: "unidad" },
  "Palta Hass":{ unidad_compra: "malla",  peso_unidad: 15, precio_unidad: 30000, tipo: "kg"     },
  "Manzana":   { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad: 10800, tipo: "kg"     },
  "Naranja":   { unidad_compra: "malla",  peso_unidad: 18, precio_unidad:  9000, tipo: "kg"     },
  "Limón":     { unidad_compra: "malla",  peso_unidad: 15, precio_unidad: 12000, tipo: "kg"     },
  "Huevos":    { unidad_compra: "malla",  peso_unidad: 30, precio_unidad:  6000, tipo: "unidad" },
  "Cilantro":  { unidad_compra: "atado",  peso_unidad:  1, precio_unidad:    500, tipo: "atado" },
  "Perejil":   { unidad_compra: "atado",  peso_unidad:  1, precio_unidad:    500, tipo: "atado" },
  "Betarraga": { unidad_compra: "malla",  peso_unidad: 15, precio_unidad:  5250, tipo: "kg"     },
  "Zapallo":   { unidad_compra: "kg",     peso_unidad:  1, precio_unidad:    400, tipo: "kg"     },
  "Brócoli":   { unidad_compra: "cajón",  peso_unidad: 10, precio_unidad:  6000, tipo: "kg"     },
  "Espinaca":  { unidad_compra: "atado",  peso_unidad:  1, precio_unidad:    600, tipo: "atado" },
  "Pepino":    { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad:  9000, tipo: "kg"     },
  "Pimentón":  { unidad_compra: "cajón",  peso_unidad: 10, precio_unidad:  8000, tipo: "kg"     },
  "Choclo":    { unidad_compra: "malla",  peso_unidad: 12, precio_unidad:  7200, tipo: "unidad" },
  "Durazno":   { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad: 14400, tipo: "kg"     },
  "Ciruela":   { unidad_compra: "cajón",  peso_unidad: 10, precio_unidad:  9000, tipo: "kg"     },
};

/* ── Helpers ── */
function hoy() { return new Date().toISOString().split("T")[0]; }

function formatFecha(iso: string) {
  if (!iso) return "Sin fecha";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

function agruparPorLote(compras: CompraItem[]) {
  const map: Record<string, CompraItem[]> = {};
  for (const c of compras) {
    const key = c.lote || c.id;
    if (!map[key]) map[key] = [];
    map[key].push(c);
  }
  return Object.entries(map).sort((a, b) => {
    const fa = a[1][0]?.fecha ?? "";
    const fb = b[1][0]?.fecha ?? "";
    return fb.localeCompare(fa);
  });
}

/* ── Consolidado helpers ── */
function getProximosJueves(n = 4) {
  const dates: string[] = [];
  const d = new Date();
  const dow = d.getDay();
  // Calcular el proximo jueves (dow=4)
  let daysTo = (4 - dow + 7) % 7;
  if (daysTo === 0) daysTo = 0; // Si hoy es jueves, incluirlo
  d.setDate(d.getDate() + daysTo);
  for (let i = 0; i < n; i++) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function formatJuevesLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return "jueves, " + d.toLocaleDateString("es-CL", { day: "numeric", month: "long" });
}

function parsearDetalle(detalle: string) {
  if (!detalle) return [];
  const MAP: Record<string, string> = { "kg": "kg", "c/u": "unidad", "lt": "litro", "atado": "atado", "doc": "docena" };
  return detalle.split("\n").flatMap((l) => {
    const m = l.match(/^(\d+(?:\.\d+)?)x\s(.+?)\s\(([^)]+)\)/);
    return m ? [{ nombre: m[2].trim(), cantidad: parseFloat(m[1]), unidad: MAP[m[3]] ?? m[3] }] : [];
  });
}

function agregarPedidos(pedidos: PedidoAdmin[]) {
  const mapa: Record<string, { cantidad: number; unidad: string }> = {};
  for (const p of pedidos) {
    for (const { nombre, cantidad, unidad } of parsearDetalle(p.detalle_pedido)) {
      if (!mapa[nombre]) mapa[nombre] = { cantidad: 0, unidad };
      mapa[nombre].cantidad += cantidad;
    }
  }
  return Object.entries(mapa).map(([nombre, { cantidad, unidad }]) => {
    const ref = PRECIOS[nombre] ?? null;
    let mallas = 0, costo = 0;
    if (ref) {
      if (ref.tipo === "atado") { mallas = cantidad; costo = cantidad * ref.precio_unidad; }
      else { mallas = Math.ceil(cantidad / ref.peso_unidad); costo = mallas * ref.precio_unidad; }
    }
    return { nombre, totalCantidad: cantidad, unidad, precioRef: ref, mallasNecesarias: mallas, costoTotal: costo };
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/* ── PDF Registro ── */
async function exportPdfCompras(compras: CompraItem[]) {
  const { initPdf, drawFooter, fmt } = await import("@/lib/pdf");
  const hoyFmt = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  const doc = await initPdf("Registro de Compras", hoyFmt);
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  const gastoTotal = compras.reduce((s, c) => s + c.subtotal, 0);

  doc.setFontSize(9);
  const kpis = [
    ["Total registros", String(compras.length)],
    ["Gasto total", fmt(gastoTotal)],
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
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(102, 102, 102);
  doc.text("Fecha", 15, y);
  doc.text("Proveedor", 40, y);
  doc.text("Producto", 80, y);
  doc.text("Cant.", 130, y, { align: "right" });
  doc.text("P.Unit.", 155, y, { align: "right" });
  doc.text("Subtotal", W - 15, y, { align: "right" });
  y += 3;
  doc.line(15, y, W - 15, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  for (const c of compras) {
    if (y > 270) { drawFooter(doc); doc.addPage(); y = 20; }
    doc.setTextColor(102, 102, 102);
    doc.text(formatFecha(c.fecha), 15, y);
    doc.setTextColor(26, 26, 26);
    doc.text(c.proveedor.slice(0, 18), 40, y);
    doc.text(c.producto.slice(0, 22), 80, y);
    doc.text(`${c.cantidad} ${c.unidad}`, 130, y, { align: "right" });
    doc.text(fmt(c.precio_unitario), 155, y, { align: "right" });
    doc.setTextColor(58, 170, 53);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(c.subtotal), W - 15, y, { align: "right" });
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
  doc.text(fmt(gastoTotal), W - 15, y, { align: "right" });

  drawFooter(doc);
  doc.save(`compras-frescon-${new Date().toISOString().split("T")[0]}.pdf`);
}

/* ── PDF Consolidado ── */
interface ConsolidadoItem {
  nombre: string; totalCantidad: number; unidad: string;
  precioRef: PrecioMayorista | null; mallasNecesarias: number; costoTotal: number;
}

async function exportPdfConsolidado(
  items: ConsolidadoItem[],
  pedidos: PedidoAdmin[],
  fechaLabel: string,
) {
  const { initPdf, drawFooter, fmt } = await import("@/lib/pdf");
  const doc = await initPdf("Consolidado de Compras", fechaLabel);
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  const confirmados = pedidos.filter((p) => p.estado === "Confirmado");
  const totalConfirmado = confirmados.reduce((s, p) => s + p.total, 0);
  const totalQuillota = items.reduce((s, i) => s + i.costoTotal, 0);

  doc.setFontSize(9);
  const kpis = [
    ["Fecha", fechaLabel],
    ["Pedidos confirmados", String(confirmados.length)],
    ["Total confirmado", fmt(totalConfirmado)],
    ["Costo Quillota", fmt(totalQuillota)],
    ["Margen estimado", fmt(totalConfirmado - totalQuillota)],
  ];
  for (const [label, value] of kpis) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    doc.text(label, 20, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 26);
    doc.text(value, 85, y);
    y += 6;
  }

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, W - 15, y);
  y += 8;

  // Tabla
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(102, 102, 102);
  doc.text("Producto", 15, y);
  doc.text("Cantidad", 70, y, { align: "right" });
  doc.text("Unidad compra", 100, y);
  doc.text("Cant. compra", 140, y, { align: "right" });
  doc.text("$/unidad", 165, y, { align: "right" });
  doc.text("Total", W - 15, y, { align: "right" });
  y += 3;
  doc.line(15, y, W - 15, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  for (const item of items) {
    if (y > 270) { drawFooter(doc); doc.addPage(); y = 20; }
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.text(item.nombre, 15, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    doc.text(`${item.totalCantidad} ${item.unidad}`, 70, y, { align: "right" });
    doc.text(item.precioRef?.unidad_compra ?? "—", 100, y);
    doc.text(item.precioRef ? String(item.mallasNecesarias) : "—", 140, y, { align: "right" });
    doc.text(item.precioRef ? fmt(item.precioRef.precio_unidad) : "—", 165, y, { align: "right" });
    doc.setTextColor(58, 170, 53);
    doc.setFont("helvetica", "bold");
    doc.text(item.costoTotal > 0 ? fmt(item.costoTotal) : "—", W - 15, y, { align: "right" });
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
  doc.text("TOTAL CONFIRMADO", W - 75, y, { align: "right" });
  doc.text(fmt(totalConfirmado), W - 15, y, { align: "right" });

  drawFooter(doc);
  doc.save(`consolidado-frescon-${fechaLabel.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════ */
/* ── Componente principal ── */
/* ═══════════════════════════════════════════════════════════════ */
export default function AdminComprasPage() {
  const [tab, setTab] = useState<"registro" | "consolidado">("registro");
  const [comprasParaPdf, setComprasParaPdf] = useState<CompraItem[]>([]);
  const [consolidadoPdf, setConsolidadoPdf] = useState<{
    items: ConsolidadoItem[]; pedidos: PedidoAdmin[]; fechaLabel: string;
  } | null>(null);

  function handleExportPdf() {
    if (tab === "consolidado" && consolidadoPdf) {
      exportPdfConsolidado(consolidadoPdf.items, consolidadoPdf.pedidos, consolidadoPdf.fechaLabel);
    } else {
      exportPdfCompras(comprasParaPdf);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">🛒 Compras</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Registro de gastos y lista de compra</p>
        </div>
        <button
          onClick={handleExportPdf}
          className="bg-[#1A1A1A] hover:bg-[#333] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          📄 Exportar PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "registro" as const,    label: "📋 Registro",    desc: "Gastos y boletas" },
          { key: "consolidado" as const, label: "🧮 Consolidado", desc: "Lista desde pedidos" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-3 rounded-2xl font-nunito font-black text-sm transition-all ${
              tab === t.key
                ? "bg-[#3AAA35] text-white shadow-md"
                : "bg-white text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
            }`}
          >
            {t.label}
            <span className={`block text-[10px] font-normal mt-0.5 ${tab === t.key ? "text-white/70" : "text-[#bbb]"}`}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {tab === "registro"
        ? <TabRegistro onComprasLoaded={setComprasParaPdf} />
        : <TabConsolidado onDataReady={setConsolidadoPdf} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* ── TAB: Registro de Compras ── */
/* ═══════════════════════════════════════════════════════════════ */
function TabRegistro({ onComprasLoaded }: { onComprasLoaded: (c: CompraItem[]) => void }) {
  const [compras,   setCompras]   = useState<CompraItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtro,    setFiltro]    = useState("Todas");

  /* Form state */
  const [fecha,     setFecha]     = useState(hoy());
  const [proveedor, setProveedor] = useState("");
  const [items,     setItems]     = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [notas,     setNotas]     = useState("");
  const [foto,      setFoto]      = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState<string[]>([]);

  async function fetchCompras() {
    setLoading(true);
    const r = await fetch("/api/admin/compras");
    const data = await r.json();
    setCompras(data);
    onComprasLoaded(data);
    setLoading(false);
  }

  async function fetchProductos() {
    try {
      const r = await fetch("/api/productos");
      const data = await r.json();
      const nombres = data.map((p: { nombre: string }) => p.nombre);
      setProductos([...nombres, ...INSUMOS_SUGERIDOS]);
    } catch {
      setProductos(INSUMOS_SUGERIDOS);
    }
  }

  useEffect(() => { fetchCompras(); fetchProductos(); }, []);

  function addItem() { setItems([...items, { ...EMPTY_ITEM }]); }
  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof FormItem, value: string | number) {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function guardar() {
    if (!proveedor.trim() || items.length === 0) return;
    setGuardando(true);

    const lote = `compra_${Date.now()}`;
    const payload = items
      .filter((it) => it.producto.trim())
      .map((it) => ({
        fecha,
        proveedor: proveedor.trim(),
        producto:  it.producto.trim(),
        cantidad:  it.cantidad,
        unidad:    it.unidad,
        precio_unitario: it.precio_unitario,
        subtotal:  Math.round(it.cantidad * it.precio_unitario),
        categoria: it.categoria,
        notas,
        creado_por: "Admin",
        estado:    "Registrada",
        lote,
      }));

    const res = await fetch("/api/admin/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // Upload foto if present
    if (foto && data.ids?.length) {
      for (const recordId of data.ids) {
        const formData = new FormData();
        formData.append("file", foto);
        formData.append("recordId", recordId);
        await fetch("/api/admin/compras/upload", { method: "POST", body: formData }).catch(() => {});
        break; // solo subir a un registro
      }
    }

    // Reset form
    setShowForm(false);
    setProveedor("");
    setItems([{ ...EMPTY_ITEM }]);
    setNotas("");
    setFoto(null);
    setFotoPreview(null);
    setFecha(hoy());
    await fetchCompras();
    setGuardando(false);
  }

  async function verificar(loteKey: string, itemsLote: CompraItem[]) {
    for (const c of itemsLote) {
      await fetch("/api/admin/compras", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, estado: "Verificada" }),
      });
    }
    fetchCompras();
  }

  async function eliminar(loteKey: string, itemsLote: CompraItem[]) {
    for (const c of itemsLote) {
      await fetch(`/api/admin/compras?id=${c.id}`, { method: "DELETE" });
    }
    fetchCompras();
  }

  const lotes = agruparPorLote(compras);
  const filtrados = filtro === "Todas"
    ? lotes
    : lotes.map(([key, items]) => [key, items.filter((c) => c.categoria === filtro)] as [string, CompraItem[]]).filter(([, items]) => items.length > 0);

  // KPIs
  const hoyStr = hoy();
  const mesActual = hoyStr.slice(0, 7);
  const comprasMes = compras.filter((c) => c.fecha.startsWith(mesActual));
  const totalMesReal = comprasMes.reduce((s, c) => s + c.subtotal, 0);
  const comprasSemana = compras.filter((c) => {
    const diff = (new Date(hoyStr).getTime() - new Date(c.fecha).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  });
  const totalSemana = comprasSemana.reduce((s, c) => s + c.subtotal, 0);

  // Sugerencias de producto
  const [sugerenciasIdx, setSugerenciasIdx] = useState<number | null>(null);

  function getSugerencias(texto: string) {
    if (!texto || texto.length < 2) return [];
    const lower = texto.toLowerCase();
    return productos.filter((p) => p.toLowerCase().includes(lower)).slice(0, 6);
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="font-nunito font-black text-xl text-[#3AAA35]">${totalMesReal.toLocaleString("es-CL")}</p>
          <p className="text-[#999] text-[10px] font-nunito mt-1">Gasto mes</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="font-nunito font-black text-xl text-[#1A1A1A]">${totalSemana.toLocaleString("es-CL")}</p>
          <p className="text-[#999] text-[10px] font-nunito mt-1">Gasto semana</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="font-nunito font-black text-xl text-[#1A1A1A]">{lotes.length}</p>
          <p className="text-[#999] text-[10px] font-nunito mt-1">Compras registradas</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          + Nueva compra
        </button>
        <div className="flex gap-1.5 flex-wrap">
          {["Todas", ...CATEGORIAS].map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`px-3 py-1.5 rounded-full font-nunito font-black text-[10px] transition-all ${
                filtro === cat
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#f9fafb] text-[#999] border border-[#e5e5e5] hover:border-[#ccc]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario nueva compra */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6 border-2 border-[#3AAA35]/30">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-lg mb-4">Nueva compra</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm" />
            </div>
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Proveedor</label>
              <input type="text" value={proveedor} onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej: Feria Quillota, Empaque Sur..."
                className="w-full mt-1 px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm" />
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <label className="font-nunito font-black text-[#1A1A1A] text-xs mb-2 block">Productos comprados</label>
            <div className="flex flex-col gap-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-[#f9fafb] rounded-2xl p-3">
                  <div className="flex-1 min-w-0 relative">
                    <input
                      type="text"
                      value={item.producto}
                      placeholder="Producto..."
                      onChange={(e) => { updateItem(idx, "producto", e.target.value); setSugerenciasIdx(idx); }}
                      onFocus={() => setSugerenciasIdx(idx)}
                      onBlur={() => setTimeout(() => setSugerenciasIdx(null), 200)}
                      className="w-full px-3 py-2 rounded-xl border border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs"
                    />
                    {sugerenciasIdx === idx && item.producto.length >= 2 && getSugerencias(item.producto).length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-white border border-[#e5e5e5] rounded-xl shadow-lg mt-1 max-h-32 overflow-y-auto">
                        {getSugerencias(item.producto).map((sug) => (
                          <button
                            key={sug}
                            onMouseDown={() => { updateItem(idx, "producto", sug); setSugerenciasIdx(null); }}
                            className="w-full text-left px-3 py-1.5 font-nunito text-xs hover:bg-[#f0fdf4] transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="number" value={item.cantidad} min={0.1} step={0.5}
                    onChange={(e) => updateItem(idx, "cantidad", parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-2 rounded-xl border border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs text-center" />
                  <select value={item.unidad} onChange={(e) => updateItem(idx, "unidad", e.target.value)}
                    className="w-20 px-1 py-2 rounded-xl border border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs">
                    {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-[#999] text-xs">$</span>
                    <input type="number" value={item.precio_unitario} min={0} step={100}
                      onChange={(e) => updateItem(idx, "precio_unitario", parseInt(e.target.value) || 0)}
                      placeholder="Precio"
                      className="w-20 px-2 py-2 rounded-xl border border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs text-right" />
                  </div>
                  <select value={item.categoria} onChange={(e) => updateItem(idx, "categoria", e.target.value)}
                    className="w-24 px-1 py-2 rounded-xl border border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[10px]">
                    {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <span className="font-nunito font-black text-xs text-[#3AAA35] w-16 text-right py-2">
                    ${Math.round(item.cantidad * item.precio_unitario).toLocaleString("es-CL")}
                  </span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm px-1 py-2">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addItem}
              className="mt-2 text-[#3AAA35] font-nunito font-black text-xs hover:text-[#2A7A26] transition-colors">
              + Agregar producto
            </button>
          </div>

          {/* Total */}
          <div className="bg-[#f0fdf4] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
            <span className="font-nunito font-black text-[#166534] text-sm">Total compra</span>
            <span className="font-nunito font-black text-[#166534] text-xl">
              ${items.reduce((s, it) => s + Math.round(it.cantidad * it.precio_unitario), 0).toLocaleString("es-CL")}
            </span>
          </div>

          {/* Foto + Notas */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Foto de boleta</label>
              <div className="mt-1 flex items-center gap-3">
                <label className="cursor-pointer bg-[#f9fafb] border-2 border-dashed border-[#e5e5e5] hover:border-[#3AAA35] rounded-2xl px-4 py-3 text-center transition-colors flex-1">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />
                  <span className="font-nunito text-xs text-[#999]">
                    {foto ? `📸 ${foto.name.slice(0, 20)}` : "📸 Tomar foto o seleccionar"}
                  </span>
                </label>
                {fotoPreview && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#e5e5e5] flex-shrink-0">
                    <Image src={fotoPreview} alt="Boleta" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Notas</label>
              <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones..."
                className="w-full mt-1 px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm" />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button onClick={guardar} disabled={guardando || !proveedor.trim() || !items.some((i) => i.producto.trim())}
              className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black px-6 py-2.5 rounded-full text-sm transition-colors">
              {guardando ? "Guardando…" : "Guardar compra"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-[#999] font-nunito font-black px-5 py-2.5 rounded-full text-sm border border-[#e5e5e5] hover:border-[#ccc] transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de compras */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#bbb] font-nunito">Cargando compras…</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin compras registradas</p>
          <p className="text-[#999] font-nunito text-sm mt-1">Presiona &quot;+ Nueva compra&quot; para comenzar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrados.map(([loteKey, itemsLote]) => {
            const first    = itemsLote[0];
            const total    = itemsLote.reduce((s, c) => s + c.subtotal, 0);
            const expanded = expandido === loteKey;
            const verified = itemsLote.every((c) => c.estado === "Verificada");

            return (
              <div key={loteKey} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandido(expanded ? null : loteKey)}
                  className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-[#f9fafb] transition-colors"
                >
                  {first.boleta_url ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#e5e5e5] flex-shrink-0">
                      <Image src={first.boleta_url} alt="Boleta" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#f9fafb] flex items-center justify-center flex-shrink-0 text-lg">🧾</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-nunito font-black text-[#1A1A1A] text-sm">{first.proveedor || "Sin proveedor"}</p>
                      <span className={`text-[9px] font-nunito font-black px-2 py-0.5 rounded-full ${
                        verified ? "bg-[#3AAA35]/10 text-[#2A7A26]" : "bg-blue-50 text-blue-500"
                      }`}>
                        {verified ? "✅ Verificada" : "📋 Registrada"}
                      </span>
                    </div>
                    <p className="text-[#999] text-xs font-nunito">
                      {formatFecha(first.fecha)} · {itemsLote.length} item{itemsLote.length > 1 ? "s" : ""} · {first.creado_por}
                    </p>
                  </div>
                  <p className="font-nunito font-black text-[#3AAA35] text-base flex-shrink-0">
                    ${total.toLocaleString("es-CL")}
                  </p>
                  <span className={`text-[#bbb] transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
                </button>

                {expanded && (
                  <div className="border-t border-[#f0f0f0] px-5 py-3">
                    <div className="flex flex-col gap-1.5 mb-3">
                      {itemsLote.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-nunito font-black px-1.5 py-0.5 rounded-full ${
                              c.categoria === "Frutas" ? "bg-green-50 text-green-600" :
                              c.categoria === "Verduras" ? "bg-emerald-50 text-emerald-600" :
                              c.categoria === "Empaque" ? "bg-blue-50 text-blue-600" :
                              c.categoria === "Insumos" ? "bg-yellow-50 text-yellow-700" :
                              "bg-gray-50 text-gray-500"
                            }`}>{c.categoria}</span>
                            <span className="font-nunito text-sm text-[#1A1A1A]">{c.producto}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-nunito text-xs text-[#999]">{c.cantidad} {c.unidad} × ${c.precio_unitario.toLocaleString("es-CL")}</span>
                            <span className="font-nunito font-black text-sm text-[#1A1A1A]">${c.subtotal.toLocaleString("es-CL")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {first.notas && (
                      <p className="text-[#999] text-xs font-nunito mb-3">💬 {first.notas}</p>
                    )}
                    <div className="flex gap-2">
                      {!verified && (
                        <button onClick={() => verificar(loteKey, itemsLote)}
                          className="text-xs font-nunito font-black px-3 py-1.5 rounded-full bg-[#3AAA35]/10 text-[#2A7A26] hover:bg-[#3AAA35]/20 transition-colors">
                          ✅ Verificar
                        </button>
                      )}
                      <button onClick={() => eliminar(loteKey, itemsLote)}
                        className="text-xs font-nunito font-black px-3 py-1.5 rounded-full border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* ── TAB: Consolidado (lista de compra desde pedidos) ── */
/* ═══════════════════════════════════════════════════════════════ */
function TabConsolidado({ onDataReady }: {
  onDataReady: (data: { items: ConsolidadoItem[]; pedidos: PedidoAdmin[]; fechaLabel: string } | null) => void;
}) {
  const proximosJueves = getProximosJueves(4);
  const [fecha, setFecha] = useState(proximosJueves[0]);
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Jueves historicos desde Airtable
  const [juevesHistoricos, setJuevesHistoricos] = useState<string[]>([]);
  const [loadingHistoricos, setLoadingHistoricos] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [showHistoricos, setShowHistoricos] = useState(false);

  // Cargar todos los pedidos para extraer jueves unicos
  const fetchJuevesHistoricos = useCallback(async () => {
    setLoadingHistoricos(true);
    try {
      const res = await fetch("/api/admin/pedidos");
      const data = await res.json();
      const todos: PedidoAdmin[] = Array.isArray(data) ? data : [];
      const fechasSet = new Set<string>();
      for (const p of todos) {
        if (p.fecha_entrega) {
          // Verificar que sea un jueves
          const d = new Date(p.fecha_entrega + "T12:00:00");
          if (d.getDay() === 4) { // 4 = jueves
            fechasSet.add(p.fecha_entrega);
          } else {
            // Incluir igual si tiene pedidos registrados
            fechasSet.add(p.fecha_entrega);
          }
        }
      }
      const sorted = Array.from(fechasSet).sort((a, b) => b.localeCompare(a));
      setJuevesHistoricos(sorted);
    } catch {
      setJuevesHistoricos([]);
    }
    setLoadingHistoricos(false);
  }, []);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/pedidos?fecha=${fecha}`);
    const data = await res.json();
    const filtered = (Array.isArray(data) ? data : []).filter((p: PedidoAdmin) => p.estado !== "Cancelado");
    setPedidos(filtered);
    setLoading(false);
  }, [fecha]);

  useEffect(() => { fetchJuevesHistoricos(); }, [fetchJuevesHistoricos]);
  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  // Notificar al padre para PDF
  const items = agregarPedidos(pedidos);
  const totalQuillota = items.reduce((s, i) => s + i.costoTotal, 0);
  const confirmados = pedidos.filter((p) => p.estado === "Confirmado");
  const totalConfirmado = confirmados.reduce((s, p) => s + p.total, 0);
  const totalCliente = pedidos.reduce((s, p) => s + p.total, 0);

  useEffect(() => {
    onDataReady({ items, pedidos, fechaLabel: formatJuevesLabel(fecha) });
  }, [pedidos, fecha]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([fetchPedidos(), fetchJuevesHistoricos()]);
    setRefreshing(false);
  }

  // Filtrar jueves historicos por busqueda
  const juevesHistoricosFiltrados = juevesHistoricos.filter((j) => {
    // No mostrar los que ya estan en proximosJueves
    if (proximosJueves.includes(j)) return false;
    if (!busqueda.trim()) return true;
    const label = formatJuevesLabel(j).toLowerCase();
    return label.includes(busqueda.toLowerCase());
  });

  return (
    <>
      {/* Selector jueves proximos */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-nunito font-black text-[#1A1A1A] text-sm">📅 Selecciona el jueves</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f9fafb] border border-[#e5e5e5] hover:border-[#3AAA35]/40 text-[#666] font-nunito font-black text-xs transition-all disabled:opacity-50"
          >
            <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            {refreshing ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {proximosJueves.map((j) => (
            <button key={j} onClick={() => { setFecha(j); setShowHistoricos(false); }}
              className={`px-4 py-2 rounded-full font-nunito font-black text-sm transition-all ${
                fecha === j && !showHistoricos ? "bg-[#3AAA35] text-white" : "bg-[#f9fafb] text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
              }`}>
              {formatJuevesLabel(j)}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador de jueves historicos */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
        <button
          onClick={() => setShowHistoricos(!showHistoricos)}
          className="w-full flex items-center justify-between"
        >
          <p className="font-nunito font-black text-[#1A1A1A] text-sm">📚 Jueves historicos</p>
          <span className={`text-[#bbb] transition-transform text-sm ${showHistoricos ? "rotate-180" : ""}`}>▼</span>
        </button>

        {showHistoricos && (
          <div className="mt-4">
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]">🔍</span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar jueves... ej: marzo, abril"
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm"
              />
            </div>

            {loadingHistoricos ? (
              <p className="text-[#bbb] font-nunito text-sm text-center py-4">Cargando historicos…</p>
            ) : juevesHistoricosFiltrados.length === 0 ? (
              <p className="text-[#999] font-nunito text-sm text-center py-4">
                {busqueda ? "Sin resultados para esa busqueda" : "Sin jueves historicos registrados"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {juevesHistoricosFiltrados.map((j) => (
                  <button key={j} onClick={() => { setFecha(j); }}
                    className={`px-4 py-2 rounded-full font-nunito font-black text-sm transition-all ${
                      fecha === j ? "bg-[#3AAA35] text-white" : "bg-[#f9fafb] text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
                    }`}>
                    {formatJuevesLabel(j)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#bbb] font-nunito">Cargando pedidos…</div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🧺</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin pedidos para este jueves</p>
          <p className="text-[#999] font-nunito text-sm mt-2">{formatJuevesLabel(fecha)}</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-3xl font-nunito font-black text-[#3AAA35]">{pedidos.length}</p>
              <p className="text-[#999] text-xs font-nunito mt-1">Pedidos totales</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-3xl font-nunito font-black text-[#166534]">{confirmados.length}</p>
              <p className="text-[#999] text-xs font-nunito mt-1">Confirmados</p>
            </div>
            <div className="bg-[#f0fdf4] rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xl font-nunito font-black text-[#3AAA35]">${totalConfirmado.toLocaleString("es-CL")}</p>
              <p className="text-[#166534] text-xs font-nunito font-black mt-1">Total confirmado</p>
            </div>
            <div className="bg-[#F9C514]/10 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xl font-nunito font-black text-[#7A5F00]">${totalQuillota.toLocaleString("es-CL")}</p>
              <p className="text-[#7A5F00] text-xs font-nunito font-black mt-1">💰 Costo Quillota</p>
            </div>
          </div>

          {/* Info del jueves seleccionado */}
          <div className="bg-[#f0fdf4] rounded-2xl px-5 py-3 mb-4 flex items-center justify-between">
            <span className="font-nunito font-black text-[#166534] text-sm">
              📅 {formatJuevesLabel(fecha)}
            </span>
            <span className="font-nunito text-[#166534] text-xs">
              Total todos los pedidos: ${totalCliente.toLocaleString("es-CL")}
            </span>
          </div>

          {/* Tabla de compra */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
              <p className="font-nunito font-black text-[#1A1A1A]">Detalle de compra</p>
              <p className="text-[#999] text-xs font-nunito">{items.length} productos</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafb] text-left">
                    <th className="px-5 py-3 font-nunito font-black text-[#999] text-xs">Producto</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Pedidos</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-center">Unidad</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-center">Cant.</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">$/unidad</th>
                    <th className="px-4 py-3 font-nunito font-black text-[#999] text-xs text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.nombre} className={i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}>
                      <td className="px-5 py-3 font-nunito font-black text-[#1A1A1A] text-sm">{item.nombre}</td>
                      <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">{item.totalCantidad} {item.unidad}</td>
                      <td className="px-4 py-3 text-center">
                        {item.precioRef ? (
                          <span className="font-nunito font-black text-[#3AAA35] text-xs bg-[#3AAA35]/10 px-2 py-0.5 rounded-full">{item.precioRef.unidad_compra}</span>
                        ) : <span className="text-[#bbb] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 font-nunito font-black text-[#1A1A1A] text-sm text-center">{item.precioRef ? item.mallasNecesarias : "—"}</td>
                      <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">{item.precioRef ? `$${item.precioRef.precio_unidad.toLocaleString("es-CL")}` : "—"}</td>
                      <td className="px-4 py-3 font-nunito font-black text-[#3AAA35] text-sm text-right">{item.costoTotal > 0 ? `$${item.costoTotal.toLocaleString("es-CL")}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F9C514]/10 border-t-2 border-[#F9C514]/40">
                    <td colSpan={5} className="px-5 py-4 font-nunito font-black text-[#7A5F00]">💰 TOTAL A PAGAR EN QUILLOTA</td>
                    <td className="px-4 py-4 font-nunito font-black text-[#7A5F00] text-lg text-right">${totalQuillota.toLocaleString("es-CL")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white font-nunito font-black px-6 py-3 rounded-full text-sm transition-colors">
              🖨️ Imprimir
            </button>
          </div>
        </>
      )}
    </>
  );
}
