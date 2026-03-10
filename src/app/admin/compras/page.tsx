"use client";

import { useEffect, useState, useCallback } from "react";
import { PedidoAdmin } from "@/lib/airtable";

/* ── Precios mayorista (editable en Airtable en v2) ── */
interface PrecioMayorista {
  unidad_compra: string;   // "cajón" | "malla" | "atado"
  peso_unidad:   number;   // kg o unidades por malla/cajón
  precio_unidad: number;   // precio por malla/cajón en $CLP
  tipo:          "kg" | "unidad" | "atado";
}

const PRECIOS: Record<string, PrecioMayorista> = {
  "Tomate":        { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad: 12600,  tipo: "kg"     },
  "Papa":          { unidad_compra: "malla",  peso_unidad: 15, precio_unidad:  6000,  tipo: "kg"     },
  "Cebolla":       { unidad_compra: "malla",  peso_unidad: 18, precio_unidad:  6300,  tipo: "kg"     },
  "Zanahoria":     { unidad_compra: "malla",  peso_unidad: 18, precio_unidad:  8100,  tipo: "kg"     },
  "Lechuga":       { unidad_compra: "cajón",  peso_unidad: 24, precio_unidad: 12000,  tipo: "unidad" },
  "Palta Hass":    { unidad_compra: "malla",  peso_unidad: 15, precio_unidad: 30000,  tipo: "kg"     },
  "Manzana":       { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad: 10800,  tipo: "kg"     },
  "Naranja":       { unidad_compra: "malla",  peso_unidad: 18, precio_unidad:  9000,  tipo: "kg"     },
  "Limón":         { unidad_compra: "malla",  peso_unidad: 15, precio_unidad: 12000,  tipo: "kg"     },
  "Huevos":        { unidad_compra: "malla",  peso_unidad: 30, precio_unidad:  6000,  tipo: "unidad" },
  "Cilantro":      { unidad_compra: "atado",  peso_unidad:  1, precio_unidad:    500, tipo: "atado"  },
  "Perejil":       { unidad_compra: "atado",  peso_unidad:  1, precio_unidad:    500, tipo: "atado"  },
  "Betarraga":     { unidad_compra: "malla",  peso_unidad: 15, precio_unidad:  5250,  tipo: "kg"     },
  "Zapallo":       { unidad_compra: "kg",     peso_unidad:  1, precio_unidad:    400, tipo: "kg"     },
  "Brócoli":       { unidad_compra: "cajón",  peso_unidad: 10, precio_unidad:  6000,  tipo: "kg"     },
  "Espinaca":      { unidad_compra: "atado",  peso_unidad:  1, precio_unidad:    600, tipo: "atado"  },
  "Pepino":        { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad:  9000,  tipo: "kg"     },
  "Pimentón":      { unidad_compra: "cajón",  peso_unidad: 10, precio_unidad:  8000,  tipo: "kg"     },
  "Choclo":        { unidad_compra: "malla",  peso_unidad: 12, precio_unidad:  7200,  tipo: "unidad" },
  "Durazno":       { unidad_compra: "cajón",  peso_unidad: 18, precio_unidad: 14400,  tipo: "kg"     },
  "Ciruela":       { unidad_compra: "cajón",  peso_unidad: 10, precio_unidad:  9000,  tipo: "kg"     },
};

/* ── Helpers ── */
function getProximosJueves(n = 5): string[] {
  const dates: string[] = [];
  const d = new Date();
  const dayOfWeek = d.getDay();
  const daysToThursday = (4 - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysToThursday);
  for (let i = 0; i < n; i++) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function formatFechaLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

interface ItemAgregado {
  nombre:          string;
  totalCantidad:   number;
  unidad:          string;
  precioRef:       PrecioMayorista | null;
  mallasNecesarias: number;
  costoTotal:      number;
}

function parsearDetalle(detalle: string): { nombre: string; cantidad: number; unidad: string }[] {
  if (!detalle) return [];
  const LABEL_MAP: Record<string, string> = {
    "kg": "kg", "c/u": "unidad", "lt": "litro", "atado": "atado", "doc": "docena",
  };
  return detalle.split("\n").flatMap((linea) => {
    const m = linea.match(/^(\d+(?:\.\d+)?)x\s(.+?)\s\(([^)]+)\)/);
    if (!m) return [];
    return [{ nombre: m[2].trim(), cantidad: parseFloat(m[1]), unidad: LABEL_MAP[m[3]] ?? m[3] }];
  });
}

function agregarPedidos(pedidos: PedidoAdmin[]): ItemAgregado[] {
  const mapa: Record<string, { cantidad: number; unidad: string }> = {};

  for (const pedido of pedidos) {
    for (const { nombre, cantidad, unidad } of parsearDetalle(pedido.detalle_pedido)) {
      if (!mapa[nombre]) mapa[nombre] = { cantidad: 0, unidad };
      mapa[nombre].cantidad += cantidad;
    }
  }

  return Object.entries(mapa).map(([nombre, { cantidad, unidad }]) => {
    const precioRef = PRECIOS[nombre] ?? null;
    let mallasNecesarias = 0;
    let costoTotal       = 0;

    if (precioRef) {
      if (precioRef.tipo === "atado") {
        mallasNecesarias = cantidad;
        costoTotal       = cantidad * precioRef.precio_unidad;
      } else {
        mallasNecesarias = Math.ceil(cantidad / precioRef.peso_unidad);
        costoTotal       = mallasNecesarias * precioRef.precio_unidad;
      }
    }

    return { nombre, totalCantidad: cantidad, unidad, precioRef, mallasNecesarias, costoTotal };
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function buildWhatsAppCompras(items: ItemAgregado[], fecha: string, totalPedidos: number) {
  const lineas = items.map((i) => {
    if (!i.precioRef) return `• ${i.nombre}: ${i.totalCantidad} ${i.unidad} — sin precio ref.`;
    if (i.precioRef.tipo === "atado") return `• ${i.nombre}: ${i.mallasNecesarias} ${i.precioRef.unidad_compra} — $${i.costoTotal.toLocaleString("es-CL")}`;
    return `• ${i.nombre}: ${i.mallasNecesarias} ${i.precioRef.unidad_compra} (${i.totalCantidad} ${i.unidad} pedidos) — $${i.costoTotal.toLocaleString("es-CL")}`;
  });
  const total = items.reduce((s, i) => s + i.costoTotal, 0);
  const msg =
    `🛒 Lista de compra Frescon — ${formatFechaLabel(fecha)}%0A` +
    `${totalPedidos} pedidos activos%0A%0A` +
    lineas.join("%0A") +
    `%0A%0A💰 *TOTAL QUILLOTA: $${total.toLocaleString("es-CL")}*`;
  return `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56912345678"}?text=${msg}`;
}

/* ── Componente ── */
export default function AdminComprasPage() {
  const jueves = getProximosJueves(5);
  const [fecha,   setFecha]   = useState(jueves[0]);
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/pedidos?fecha=${fecha}`);
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];
    // Excluir cancelados
    setPedidos(lista.filter((p: PedidoAdmin) => p.estado !== "Cancelado"));
    setLoading(false);
  }, [fecha]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const items = agregarPedidos(pedidos);
  const totalQuillota = items.reduce((s, i) => s + i.costoTotal, 0);
  const totalCliente  = pedidos.reduce((s, p) => s + p.total, 0);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">🛒 Lista de Compra</h1>
        <p className="text-[#999] font-nunito text-sm">Consolidado de todos los pedidos del jueves seleccionado</p>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
        <p className="font-nunito font-black text-[#1A1A1A] text-sm mb-3">📅 Selecciona el jueves</p>
        <div className="flex flex-wrap gap-2">
          {jueves.map((j) => (
            <button
              key={j}
              onClick={() => setFecha(j)}
              className={`px-4 py-2 rounded-full font-nunito font-black text-sm transition-all ${
                fecha === j
                  ? "bg-[#3AAA35] text-white"
                  : "bg-[#f9fafb] text-[#666] border border-[#e5e5e5] hover:border-[#3AAA35]/40"
              }`}
            >
              {formatFechaLabel(j)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#bbb] font-nunito">Cargando pedidos…</div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🧺</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin pedidos para este jueves</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-3xl font-nunito font-black text-[#3AAA35]">{pedidos.length}</p>
              <p className="text-[#999] text-xs font-nunito mt-1">Pedidos activos</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xl font-nunito font-black text-[#3AAA35]">${totalCliente.toLocaleString("es-CL")}</p>
              <p className="text-[#999] text-xs font-nunito mt-1">Total clientes</p>
            </div>
            <div className="bg-[#F9C514]/10 rounded-2xl p-4 shadow-sm text-center col-span-2 md:col-span-1">
              <p className="text-xl font-nunito font-black text-[#7A5F00]">${totalQuillota.toLocaleString("es-CL")}</p>
              <p className="text-[#7A5F00] text-xs font-nunito font-black mt-1">💰 A pagar Quillota</p>
            </div>
          </div>

          {/* Tabla de compras */}
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
                      <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">
                        {item.totalCantidad} {item.unidad}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.precioRef ? (
                          <span className="font-nunito font-black text-[#3AAA35] text-xs bg-[#3AAA35]/10 px-2 py-0.5 rounded-full">
                            {item.precioRef.unidad_compra}
                          </span>
                        ) : (
                          <span className="text-[#bbb] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-nunito font-black text-[#1A1A1A] text-sm text-center">
                        {item.precioRef ? item.mallasNecesarias : "—"}
                      </td>
                      <td className="px-4 py-3 font-nunito text-[#666] text-sm text-right">
                        {item.precioRef ? `$${item.precioRef.precio_unidad.toLocaleString("es-CL")}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-nunito font-black text-[#3AAA35] text-sm text-right">
                        {item.costoTotal > 0 ? `$${item.costoTotal.toLocaleString("es-CL")}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F9C514]/10 border-t-2 border-[#F9C514]/40">
                    <td colSpan={5} className="px-5 py-4 font-nunito font-black text-[#7A5F00]">
                      💰 TOTAL A PAGAR EN QUILLOTA
                    </td>
                    <td className="px-4 py-4 font-nunito font-black text-[#7A5F00] text-lg text-right">
                      ${totalQuillota.toLocaleString("es-CL")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Botones acción */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white font-nunito font-black px-6 py-3 rounded-full text-sm transition-colors"
            >
              🖨️ Imprimir lista
            </button>
            <a
              href={buildWhatsAppCompras(items, fecha, pedidos.length)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-6 py-3 rounded-full text-sm transition-colors"
            >
              📱 Enviar por WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  );
}
