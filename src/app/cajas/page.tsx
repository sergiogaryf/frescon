"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CAJAS, Caja, ItemCaja } from "@/lib/cajas";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

interface LineaPedido {
  cantidad: number;
  nombre: string;
}

function parsearLineaPedido(linea: string): LineaPedido | null {
  const m = linea.match(/^(\d+)x\s+(.+?)\s+\([^)]+\)\s+—/);
  if (!m) return null;
  return { cantidad: parseInt(m[1], 10), nombre: m[2] };
}

function CajaCard({ caja, onAgregar, cargando }: { caja: Caja; onAgregar: () => void; cargando: boolean }) {
  return (
    <div className={`${caja.color} rounded-3xl p-6 flex flex-col gap-4 border border-white shadow-sm hover:shadow-md transition-shadow`}>
      {/* Emoji + badge */}
      <div className="flex items-start justify-between">
        <span className="text-5xl">{caja.emoji}</span>
        <span className="bg-white/80 backdrop-blur-sm text-[#3AAA35] font-nunito font-black text-xs px-3 py-1 rounded-full border border-[#3AAA35]/20">
          {caja.badge}
        </span>
      </div>

      {/* Nombre + descripcion */}
      <div>
        <h2 className="font-nunito font-black text-[#1A1A1A] text-lg leading-tight">{caja.nombre}</h2>
        <p className="text-[#666] text-sm mt-1 font-nunito leading-snug">{caja.descripcion}</p>
      </div>

      {/* Imagen principal */}
      <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-white/60">
        <Image src={caja.imagen} alt={caja.nombre} fill className="object-contain p-3" />
      </div>

      {/* Productos incluidos */}
      <div className="flex flex-col gap-1.5">
        {caja.items.map((item) => (
          <div key={item.nombre} className="flex items-center gap-2">
            <div className="relative w-7 h-7 flex-shrink-0">
              <Image src={item.imagen} alt={item.nombre} fill className="object-contain" />
            </div>
            <span className="flex-1 font-nunito text-xs text-[#444] truncate">
              {item.nombre} <span className="text-[#999]">({item.cantidad})</span>
            </span>
            <span className="font-nunito font-black text-xs text-[#3AAA35] flex-shrink-0">
              ${item.subtotal.toLocaleString("es-CL")}
            </span>
          </div>
        ))}
      </div>

      {/* Precio + ahorro + boton */}
      <div className="mt-auto flex items-end justify-between gap-3 pt-2 border-t border-black/5">
        <div>
          <p className="font-nunito text-[#999] text-sm line-through">
            ${caja.precio_original.toLocaleString("es-CL")}
          </p>
          <p className="font-nunito font-black text-[#1A1A1A] text-2xl leading-tight">
            ${caja.precio.toLocaleString("es-CL")}
          </p>
          <span className="inline-block bg-[#3AAA35] text-white font-nunito font-black text-xs px-2.5 py-0.5 rounded-full mt-1">
            Ahorras {caja.ahorro}%
          </span>
        </div>
        <button
          onClick={onAgregar}
          disabled={cargando}
          className="flex-shrink-0 font-nunito font-black text-sm px-5 py-3 rounded-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white transition-colors"
        >
          {cargando ? "..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}

function CajaParaTi() {
  const [telefono, setTelefono] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cajaGenerada, setCajaGenerada] = useState<{ items: ItemCaja[]; total: number; totalConDescuento: number } | null>(null);
  const [error, setError] = useState("");
  const [agregando, setAgregando] = useState(false);
  const { reorderItems, setCajaDescuento } = useCartStore();
  const router = useRouter();

  async function generarCaja(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    setCargando(true);
    setError("");
    setCajaGenerada(null);

    try {
      const [resPedidos, resCat] = await Promise.all([
        fetch(`/api/cuenta?telefono=${encodeURIComponent(telefono)}`),
        fetch("/api/productos"),
      ]);
      const pedidos = await resPedidos.json();
      const catalogo: Product[] = await resCat.json();

      if (!Array.isArray(pedidos) || pedidos.length === 0) {
        setError("No encontramos pedidos con ese telefono. Necesitas al menos un pedido previo.");
        setCargando(false);
        return;
      }
      if (!Array.isArray(catalogo)) throw new Error();

      // Contar frecuencia de productos en todos los pedidos
      const frecuencia: Record<string, number> = {};
      for (const pedido of pedidos) {
        const lineas = (pedido.detalle_pedido || "").split("\n").filter(Boolean);
        for (const linea of lineas) {
          const parsed = parsearLineaPedido(linea);
          if (parsed) {
            frecuencia[parsed.nombre] = (frecuencia[parsed.nombre] || 0) + parsed.cantidad;
          }
        }
      }

      // Monto promedio de pedidos
      const montoPromedio = pedidos.reduce((s: number, p: { total: number }) => s + (p.total || 0), 0) / pedidos.length;
      const presupuesto = Math.round(montoPromedio);

      // Ordenar por frecuencia y matchear con catalogo
      const ranking = Object.entries(frecuencia)
        .sort((a, b) => b[1] - a[1])
        .map(([nombre]) => {
          const prod = catalogo.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase());
          return prod ? prod : null;
        })
        .filter((x): x is Product => x !== null);

      if (ranking.length === 0) {
        setError("No pudimos matchear los productos de tus pedidos con el catalogo actual.");
        setCargando(false);
        return;
      }

      // Construir caja dentro del presupuesto
      const unidadLabel: Record<string, string> = {
        kg: "kg", unidad: "unidad", litro: "litro", atado: "atado", docena: "docena",
      };
      const cajaItems: ItemCaja[] = [];
      let acumulado = 0;

      for (const prod of ranking) {
        if (acumulado + prod.precio > presupuesto) continue;
        cajaItems.push({
          nombre: prod.nombre,
          cantidad: `1 ${unidadLabel[prod.unidad] ?? prod.unidad}`,
          subtotal: prod.precio,
          imagen: prod.imagen || "/images/productos/Tomate.png",
        });
        acumulado += prod.precio;
        if (cajaItems.length >= 10) break;
      }

      // Si pocos items, completar con baratos del catalogo
      if (cajaItems.length < 3) {
        const usados = new Set(cajaItems.map((i) => i.nombre.toLowerCase()));
        const extras = catalogo
          .filter((p) => !usados.has(p.nombre.toLowerCase()) && p.stock > 0)
          .sort((a, b) => a.precio - b.precio);
        for (const prod of extras) {
          if (cajaItems.length >= 5) break;
          if (acumulado + prod.precio > presupuesto * 1.1) continue;
          cajaItems.push({
            nombre: prod.nombre,
            cantidad: `1 ${unidadLabel[prod.unidad] ?? prod.unidad}`,
            subtotal: prod.precio,
            imagen: prod.imagen || "/images/productos/Tomate.png",
          });
          acumulado += prod.precio;
        }
      }

      const totalConDescuento = Math.round(acumulado * 0.95);
      setCajaGenerada({ items: cajaItems, total: acumulado, totalConDescuento });
    } catch {
      setError("Error al generar tu caja. Intenta de nuevo.");
    }
    setCargando(false);
  }

  async function agregarAlCarrito() {
    if (!cajaGenerada) return;
    setAgregando(true);
    try {
      const resCat = await fetch("/api/productos");
      const catalogo: Product[] = await resCat.json();
      if (!Array.isArray(catalogo)) throw new Error();

      const cartItems = cajaGenerada.items
        .map((item) => {
          const prod = catalogo.find((p) => p.nombre.toLowerCase() === item.nombre.toLowerCase());
          if (!prod) return null;
          return { product: prod, cantidad: 1 };
        })
        .filter((x): x is { product: Product; cantidad: number } => x !== null);

      if (cartItems.length === 0) {
        setError("Error al agregar productos.");
        setAgregando(false);
        return;
      }

      reorderItems(cartItems);
      setCajaDescuento(5);
      router.push("/checkout");
    } catch {
      setError("Error al agregar al carrito.");
    }
    setAgregando(false);
  }

  return (
    <div className="bg-gradient-to-br from-[#F9C514]/10 to-[#3AAA35]/5 rounded-3xl p-6 flex flex-col gap-4 border-2 border-[#F9C514]/30 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <span className="text-5xl">🐱</span>
        <span className="bg-[#F9C514] text-[#1A1A1A] font-nunito font-black text-xs px-3 py-1 rounded-full">
          Personalizada
        </span>
      </div>

      <div>
        <h2 className="font-nunito font-black text-[#1A1A1A] text-lg leading-tight">Caja Para Ti</h2>
        <p className="text-[#666] text-sm mt-1 font-nunito leading-snug">
          Celia arma una caja con tus productos favoritos, ajustada a lo que sueles pedir. 5% de descuento incluido.
        </p>
      </div>

      {!cajaGenerada ? (
        <>
          <form onSubmit={generarCaja} className="flex flex-col gap-3">
            <label className="font-nunito font-black text-[#1A1A1A] text-xs">Ingresa tu telefono para generar tu caja</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="flex-1 px-3 py-2.5 rounded-xl border-2 border-[#e5e5e5] focus:border-[#F9C514] focus:outline-none font-nunito text-sm text-[#1A1A1A]"
              />
              <button
                type="submit"
                disabled={cargando || !telefono.trim()}
                className="bg-[#F9C514] hover:bg-[#E0B010] disabled:opacity-50 text-[#1A1A1A] font-nunito font-black px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {cargando ? "..." : "Generar"}
              </button>
            </div>
          </form>
          {error && <p className="text-red-500 text-xs font-nunito">{error}</p>}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {cajaGenerada.items.map((item) => (
              <div key={item.nombre} className="flex items-center gap-2">
                <div className="relative w-7 h-7 flex-shrink-0">
                  <Image src={item.imagen} alt={item.nombre} fill className="object-contain" />
                </div>
                <span className="flex-1 font-nunito text-xs text-[#444] truncate">
                  {item.nombre} <span className="text-[#999]">({item.cantidad})</span>
                </span>
                <span className="font-nunito font-black text-xs text-[#3AAA35] flex-shrink-0">
                  ${item.subtotal.toLocaleString("es-CL")}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-2 border-t border-black/5">
            <div>
              <p className="font-nunito text-[#999] text-sm line-through">
                ${cajaGenerada.total.toLocaleString("es-CL")}
              </p>
              <p className="font-nunito font-black text-[#1A1A1A] text-2xl leading-tight">
                ${cajaGenerada.totalConDescuento.toLocaleString("es-CL")}
              </p>
              <span className="inline-block bg-[#F9C514] text-[#1A1A1A] font-nunito font-black text-xs px-2.5 py-0.5 rounded-full mt-1">
                5% descuento
              </span>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={agregarAlCarrito}
                disabled={agregando}
                className="font-nunito font-black text-sm px-5 py-3 rounded-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white transition-colors"
              >
                {agregando ? "..." : "Agregar"}
              </button>
              <button
                onClick={() => { setCajaGenerada(null); setError(""); }}
                className="font-nunito text-xs text-[#999] hover:text-[#666] transition-colors"
              >
                Regenerar
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-nunito mt-1">{error}</p>}
        </>
      )}
    </div>
  );
}

export default function CajasPage() {
  const [cargandoId, setCargandoId] = useState<string | null>(null);
  const { reorderItems, setCajaDescuento } = useCartStore();
  const router = useRouter();

  async function agregarCaja(caja: Caja) {
    setCargandoId(caja.id);
    try {
      const res = await fetch("/api/productos");
      const catalogo: Product[] = await res.json();
      if (!Array.isArray(catalogo)) throw new Error();

      const cartItems = caja.items
        .map((item) => {
          const prod = catalogo.find((p) => p.nombre.toLowerCase() === item.nombre.toLowerCase());
          if (!prod) return null;
          const cantMatch = item.cantidad.match(/^(\d+)/);
          const cant = cantMatch ? parseInt(cantMatch[1], 10) : 1;
          return { product: prod, cantidad: cant };
        })
        .filter((x): x is { product: Product; cantidad: number } => x !== null);

      if (cartItems.length > 0) {
        reorderItems(cartItems);
        setCajaDescuento(caja.ahorro);
        router.push("/checkout");
      }
    } catch { /* ignore */ }
    setCargandoId(null);
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">

      {/* Header */}
      <div className="bg-[#2A7A26] px-6 md:px-[4.5rem] py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={120} height={52} className="object-contain" />
        </Link>
        <Link
          href="/catalogo"
          className="text-white/80 hover:text-white font-nunito font-black text-sm transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Catalogo
        </Link>
      </div>

      {/* Titulo */}
      <div className="bg-white border-b border-[#f0f0f0] px-6 md:px-[4.5rem] py-10">
        <div className="max-w-5xl mx-auto">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-5xl leading-tight mt-1">
            CAJAS <span className="text-[#3AAA35]">FRESCON</span>
          </h1>
          <p className="text-[#666] mt-2 text-lg font-nunito">
            Seleccion creada por Celia 🐱 — Todas con descuento incluido.
          </p>
        </div>
      </div>

      {/* Grid de cajas */}
      <div className="max-w-5xl mx-auto px-6 md:px-[4.5rem] py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAJAS.map((caja) => (
            <CajaCard
              key={caja.id}
              caja={caja}
              onAgregar={() => agregarCaja(caja)}
              cargando={cargandoId === caja.id}
            />
          ))}
          <CajaParaTi />
        </div>

        <div className="mt-10 bg-orange-50 rounded-2xl p-4 max-w-lg mx-auto">
          <p className="text-center text-[#666] font-nunito text-sm leading-relaxed">
            Las cajas ya incluyen descuento. No se pueden combinar con codigos de descuento ni referidos.
          </p>
        </div>

        <p className="mt-4 text-center text-[#999] font-nunito text-sm leading-relaxed max-w-lg mx-auto">
          Cada caja se prepara con lo mejor disponible esa semana. Los productos exactos pueden variar
          ligeramente segun temporada. 🌿
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#f0f0f0] bg-white mt-4 py-6 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-nunito text-[#999]">
        <Link href="/catalogo" className="hover:text-[#3AAA35] transition-colors font-black">
          Ver catalogo completo
        </Link>
        <span className="hidden sm:inline">·</span>
        <Link href="/checkout" className="hover:text-[#3AAA35] transition-colors font-black">
          Ir al checkout
        </Link>
      </footer>
    </div>
  );
}
