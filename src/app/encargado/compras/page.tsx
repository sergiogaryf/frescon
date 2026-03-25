"use client";

import { useEffect, useState } from "react";
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
  return Object.entries(map).sort((a, b) => (b[1][0]?.fecha ?? "").localeCompare(a[1][0]?.fecha ?? ""));
}

export default function EncargadoComprasPage() {
  const [compras,   setCompras]   = useState<CompraItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  /* Form state */
  const [fecha,     setFecha]     = useState(hoy());
  const [proveedor, setProveedor] = useState("");
  const [items,     setItems]     = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [notas,     setNotas]     = useState("");
  const [foto,      setFoto]      = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState<string[]>(INSUMOS_SUGERIDOS);
  const [sugerenciasIdx, setSugerenciasIdx] = useState<number | null>(null);

  async function fetchCompras() {
    setLoading(true);
    const r = await fetch("/api/admin/compras");
    setCompras(await r.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchCompras();
    fetch("/api/productos").then((r) => r.json()).then((data) => {
      setProductos([...data.map((p: { nombre: string }) => p.nombre), ...INSUMOS_SUGERIDOS]);
    }).catch(() => {});
  }, []);

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

  function getSugerencias(texto: string) {
    if (!texto || texto.length < 2) return [];
    const lower = texto.toLowerCase();
    return productos.filter((p) => p.toLowerCase().includes(lower)).slice(0, 6);
  }

  async function guardar() {
    if (!proveedor.trim() || items.length === 0) return;
    setGuardando(true);

    const lote = `compra_${Date.now()}`;
    const payload = items.filter((it) => it.producto.trim()).map((it) => ({
      fecha, proveedor: proveedor.trim(), producto: it.producto.trim(),
      cantidad: it.cantidad, unidad: it.unidad, precio_unitario: it.precio_unitario,
      subtotal: Math.round(it.cantidad * it.precio_unitario), categoria: it.categoria,
      notas, creado_por: "Encargado", estado: "Registrada", lote,
    }));

    const res = await fetch("/api/admin/compras", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (foto && data.ids?.length) {
      const formData = new FormData();
      formData.append("file", foto);
      formData.append("recordId", data.ids[0]);
      await fetch("/api/admin/compras/upload", { method: "POST", body: formData }).catch(() => {});
    }

    setShowForm(false); setProveedor(""); setItems([{ ...EMPTY_ITEM }]);
    setNotas(""); setFoto(null); setFotoPreview(null); setFecha(hoy());
    await fetchCompras();
    setGuardando(false);
  }

  const lotes = agruparPorLote(compras);
  const totalMes = compras.filter((c) => c.fecha.startsWith(hoy().slice(0, 7))).reduce((s, c) => s + c.subtotal, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-2xl">🛒 Registro de Compras</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Total mes: <strong className="text-[#3AAA35]">${totalMes.toLocaleString("es-CL")}</strong></p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors">
          + Nueva compra
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-md p-5 mb-6 border-2 border-[#3AAA35]/30">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-3">Nueva compra</h2>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm" />
            </div>
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Proveedor</label>
              <input type="text" value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Feria Quillota…"
                className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm" />
            </div>
          </div>

          <label className="font-nunito font-black text-[#1A1A1A] text-xs mb-1.5 block">Productos</label>
          <div className="flex flex-col gap-2 mb-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-1.5 items-start bg-[#f9fafb] rounded-xl p-2">
                <div className="flex-1 min-w-0 relative">
                  <input type="text" value={item.producto} placeholder="Producto…"
                    onChange={(e) => { updateItem(idx, "producto", e.target.value); setSugerenciasIdx(idx); }}
                    onFocus={() => setSugerenciasIdx(idx)}
                    onBlur={() => setTimeout(() => setSugerenciasIdx(null), 200)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs" />
                  {sugerenciasIdx === idx && item.producto.length >= 2 && getSugerencias(item.producto).length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-white border border-[#e5e5e5] rounded-lg shadow-lg mt-1 max-h-28 overflow-y-auto">
                      {getSugerencias(item.producto).map((sug) => (
                        <button key={sug} onMouseDown={() => { updateItem(idx, "producto", sug); setSugerenciasIdx(null); }}
                          className="w-full text-left px-2 py-1 font-nunito text-xs hover:bg-[#f0fdf4]">{sug}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" value={item.cantidad} min={0.1} step={0.5}
                  onChange={(e) => updateItem(idx, "cantidad", parseFloat(e.target.value) || 0)}
                  className="w-14 px-1.5 py-1.5 rounded-lg border border-[#e5e5e5] font-nunito text-xs text-center" />
                <select value={item.unidad} onChange={(e) => updateItem(idx, "unidad", e.target.value)}
                  className="w-16 px-1 py-1.5 rounded-lg border border-[#e5e5e5] font-nunito text-[10px]">
                  {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                </select>
                <input type="number" value={item.precio_unitario} min={0} step={100}
                  onChange={(e) => updateItem(idx, "precio_unitario", parseInt(e.target.value) || 0)} placeholder="$"
                  className="w-16 px-1.5 py-1.5 rounded-lg border border-[#e5e5e5] font-nunito text-xs text-right" />
                <select value={item.categoria} onChange={(e) => updateItem(idx, "categoria", e.target.value)}
                  className="w-20 px-1 py-1.5 rounded-lg border border-[#e5e5e5] font-nunito text-[10px]">
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <span className="font-nunito font-black text-[10px] text-[#3AAA35] w-12 text-right py-1.5">
                  ${Math.round(item.cantidad * item.precio_unitario).toLocaleString("es-CL")}
                </span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="text-red-400 text-xs px-0.5 py-1.5">✕</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addItem} className="text-[#3AAA35] font-nunito font-black text-xs hover:text-[#2A7A26] mb-3">+ Agregar producto</button>

          <div className="bg-[#f0fdf4] rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
            <span className="font-nunito font-black text-[#166534] text-sm">Total</span>
            <span className="font-nunito font-black text-[#166534] text-lg">
              ${items.reduce((s, it) => s + Math.round(it.cantidad * it.precio_unitario), 0).toLocaleString("es-CL")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Foto boleta</label>
              <label className="mt-1 cursor-pointer bg-[#f9fafb] border-2 border-dashed border-[#e5e5e5] hover:border-[#3AAA35] rounded-xl px-3 py-2 text-center transition-colors block">
                <input type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />
                <span className="font-nunito text-xs text-[#999]">
                  {foto ? `📸 ${foto.name.slice(0, 20)}` : "📸 Tomar foto"}
                </span>
              </label>
              {fotoPreview && (
                <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-[#e5e5e5]">
                  <Image src={fotoPreview} alt="Boleta" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                </div>
              )}
            </div>
            <div>
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Notas</label>
              <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones…"
                className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={guardar} disabled={guardando || !proveedor.trim()}
              className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black px-5 py-2 rounded-full text-sm transition-colors">
              {guardando ? "Guardando…" : "Guardar compra"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-[#999] font-nunito font-black px-4 py-2 rounded-full text-sm border border-[#e5e5e5]">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#bbb] font-nunito">Cargando…</div>
      ) : lotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-nunito font-black text-[#1A1A1A]">Sin compras registradas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lotes.map(([loteKey, itemsLote]) => {
            const first = itemsLote[0];
            const total = itemsLote.reduce((s, c) => s + c.subtotal, 0);
            const expanded = expandido === loteKey;
            return (
              <div key={loteKey} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setExpandido(expanded ? null : loteKey)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[#f9fafb] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-[#f9fafb] flex items-center justify-center flex-shrink-0 text-base">🧾</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-nunito font-black text-[#1A1A1A] text-sm">{first.proveedor}</p>
                    <p className="text-[#999] text-[11px] font-nunito">{formatFecha(first.fecha)} · {itemsLote.length} items</p>
                  </div>
                  <p className="font-nunito font-black text-[#3AAA35] text-sm">${total.toLocaleString("es-CL")}</p>
                  <span className={`text-[#bbb] text-xs transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
                </button>
                {expanded && (
                  <div className="border-t border-[#f0f0f0] px-4 py-2.5">
                    {itemsLote.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-1">
                        <span className="font-nunito text-xs text-[#1A1A1A]">{c.producto}</span>
                        <span className="font-nunito text-xs text-[#999]">{c.cantidad} {c.unidad} — ${c.subtotal.toLocaleString("es-CL")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
