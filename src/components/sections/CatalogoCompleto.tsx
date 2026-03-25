"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import Navbar from "@/components/layout/Navbar";
import { CAJAS, Caja } from "@/lib/cajas";
import { useCartStore } from "@/store/cartStore";

const categorias = [
  { key: "todos",         label: "Todos",        icon: "🛒" },
  { key: "verduras",      label: "Verduras",     icon: "🥦" },
  { key: "frutas",        label: "Frutas",       icon: "🍋" },
  { key: "frutos_secos",  label: "Frutos Secos", icon: "🥜" },
  { key: "hierbas",       label: "Hierbas",      icon: "🌿" },
  { key: "huevos",        label: "Huevos",       icon: "🥚" },
  { key: "kits",          label: "Cajas",        icon: "📦" },
  { key: "miel",          label: "Miel",         icon: "🍯" },
];


export default function CatalogoCompleto({ productos, favoritos = [] }: { productos: Product[]; favoritos?: string[] }) {
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);
  const [cargandoId, setCargandoId] = useState<string | null>(null);
  const { reorderItems, setCajaDescuento } = useCartStore();
  const router = useRouter();

  async function agregarCaja(caja: Caja) {
    setCargandoId(caja.id);
    try {
      const res = await fetch("/api/productos");
      const catalogo: Product[] = await res.json();
      if (!Array.isArray(catalogo)) { setCargandoId(null); return; }
      const cantMatch = (s: string) => { const m = s.match(/^(\d+)/); return m ? parseInt(m[1], 10) : 1; };
      const cartItems = caja.items
        .map((item) => {
          const prod = catalogo.find((p) => p.nombre.toLowerCase() === item.nombre.toLowerCase());
          if (!prod) return null;
          return { product: prod, cantidad: cantMatch(item.cantidad) };
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

  const tieneFavoritos = favoritos.length > 0;

  const filtrados = useMemo(() => {
    const base = productos.filter((p) => {
      const matchCategoria = filtro === "todos" || p.categoria === filtro;
      const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return matchCategoria && matchBusqueda;
    });

    // Si hay favoritos, ordenar: favoritos primero
    if (tieneFavoritos && filtro === "todos" && !busqueda) {
      const esFav = (p: Product) => favoritos.some((f) => p.nombre.toLowerCase().includes(f));
      const favs = base.filter(esFav);
      const rest = base.filter((p) => !esFav(p));
      return [...favs, ...rest];
    }
    return base;
  }, [filtro, busqueda, productos, favoritos, tieneFavoritos]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const paginados = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  function cambiarFiltro(key: string) { setFiltro(key); setPagina(1); }
  function cambiarBusqueda(val: string) { setBusqueda(val); setPagina(1); }
  function cambiarPorPagina(val: number) { setPorPagina(val); setPagina(1); }

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar igual al home — fondo verde sólido */}
      <div className="bg-[#2A7A26]">
        <Navbar />
      </div>

      {/* Banner móvil — ¿Dónde está mi pedido? */}
      <Link
        href="/seguimiento"
        className="md:hidden flex items-center justify-between bg-[#1A5C18] px-5 py-3 text-white"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <span className="font-nunito font-bold text-sm">¿Dónde está mi pedido?</span>
        </div>
        <span className="text-[#F9C514] font-nunito font-black text-sm">Ver →</span>
      </Link>

      {/* Banner header */}
      <div className="bg-white px-9 md:px-[4.5rem] py-12 border-b border-[#f0f0f0]">
        <div className="max-w-7xl mx-auto">
          <span className="font-pacifico text-[#F9C514] text-2xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-6xl leading-tight mt-1">
            NUESTROS <span className="text-[#3AAA35]">PRODUCTOS</span>
          </h1>
          <p className="text-[#666] mt-3 text-lg">
            Frescos, de temporada y directo del campo a tu puerta cada jueves.
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-9 md:px-[4.5rem] py-10">

        {/* Banner Cajas Frescón */}
        <Link href="/cajas" className="block bg-gradient-to-r from-[#3AAA35] to-[#2A7A26] rounded-2xl p-4 mb-6 flex items-center justify-between hover:opacity-90 transition-opacity">
          <div>
            <p className="font-nunito font-black text-white text-sm">🎁 Cajas Frescón</p>
            <p className="font-nunito text-white/80 text-xs mt-0.5">Selecciones creadas por Celia con 7% de descuento</p>
          </div>
          <span className="text-white text-xl">→</span>
        </Link>

        {/* Banner personalización */}
        {tieneFavoritos && (
          <div className="bg-gradient-to-r from-[#F9C514]/20 to-[#3AAA35]/10 rounded-2xl p-4 mb-6 flex items-center gap-3 border border-[#F9C514]/30">
            <span className="text-2xl">🐱</span>
            <div>
              <p className="font-nunito font-black text-[#1A1A1A] text-sm">Catálogo personalizado para ti</p>
              <p className="font-nunito text-[#666] text-xs">Tus productos favoritos aparecen primero — Celia</p>
            </div>
          </div>
        )}

        {/* Buscador + contador */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
          <div className="relative w-full md:max-w-sm">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white shadow-sm border-2 border-transparent focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] placeholder-[#bbb]"
            />
            {busqueda && (
              <button onClick={() => cambiarBusqueda("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]">✕</button>
            )}
          </div>
          <p className="text-[#999] text-sm font-nunito flex-shrink-0">
            {filtrados.length} producto{filtrados.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categorias.map((cat) => (
            <button
              key={cat.key}
              onClick={() => cambiarFiltro(cat.key)}
              className={`relative flex items-center gap-1.5 px-5 py-2.5 rounded-full font-nunito font-black text-sm transition-all ${
                filtro === cat.key
                  ? "bg-[#3AAA35] text-white shadow-md"
                  : "bg-white text-[#1A1A1A] hover:bg-[#3AAA35]/10 shadow-sm"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}

            </button>
          ))}
        </div>

        {/* Grid kits (cajas) */}
        {filtro === "kits" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {CAJAS.map((caja) => (
              <div key={caja.id} className={`${caja.color} rounded-3xl p-6 flex flex-col gap-4 border border-white shadow-sm`}>
                {/* Emoji + badge */}
                <div className="flex items-start justify-between">
                  <span className="text-5xl">{caja.emoji}</span>
                  <span className="bg-white/80 backdrop-blur-sm text-[#3AAA35] font-nunito font-black text-xs px-3 py-1 rounded-full border border-[#3AAA35]/20">
                    {caja.badge}
                  </span>
                </div>

                {/* Nombre + descripción */}
                <div>
                  <h2 className="font-nunito font-black text-[#1A1A1A] text-lg leading-tight">{caja.nombre}</h2>
                  <p className="text-[#666] text-sm mt-1 font-nunito leading-snug">{caja.descripcion}</p>
                </div>

                {/* Imagen */}
                <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-white/60">
                  <Image src={caja.imagen} alt={caja.nombre} fill className="object-contain p-3" />
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1.5">
                  {caja.items.map((item) => (
                    <div key={item.nombre} className="flex items-center gap-2">
                      <div className="relative w-6 h-6 flex-shrink-0">
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

                {/* Precio + botón */}
                <div className="mt-auto flex items-end justify-between gap-3 pt-2 border-t border-black/5">
                  <div>
                    <p className="font-nunito text-[#999] text-sm line-through">${caja.precio_original.toLocaleString("es-CL")}</p>
                    <p className="font-nunito font-black text-[#1A1A1A] text-2xl leading-tight">${caja.precio.toLocaleString("es-CL")}</p>
                    <span className="inline-block bg-[#3AAA35] text-white font-nunito font-black text-xs px-2.5 py-0.5 rounded-full mt-1">
                      Ahorras {caja.ahorro}%
                    </span>
                  </div>
                  <button
                    onClick={() => agregarCaja(caja)}
                    disabled={cargandoId === caja.id}
                    className="flex-shrink-0 font-nunito font-black text-sm px-5 py-3 rounded-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white transition-colors"
                  >
                    {cargandoId === caja.id ? "..." : "Agregar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : paginados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mb-10">
            {paginados.map((producto) => (
              <ProductCard key={producto.id} product={producto} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center font-nunito">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-black text-xl text-[#1A1A1A]">Sin resultados</p>
            <p className="text-[#999] mt-1">Intenta con otro nombre</p>
          </div>
        )}

        {/* Paginación */}
        {filtrados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#e5e5e5]">

            {/* Items por página */}
            <div className="flex items-center gap-2">
              <span className="text-[#bbb] text-xs font-nunito">Mostrar</span>
              {[10, 20, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => cambiarPorPagina(n)}
                  className={`w-7 h-7 rounded-full text-xs font-nunito font-black transition-all ${
                    porPagina === n
                      ? "bg-[#3AAA35] text-white"
                      : "bg-white text-[#999] hover:text-[#3AAA35] shadow-sm"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Páginas */}
            {totalPaginas > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="w-7 h-7 rounded-full bg-white shadow-sm text-[#999] hover:text-[#3AAA35] disabled:opacity-30 text-sm font-nunito font-black transition-all"
                >‹</button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPagina(n)}
                    className={`w-7 h-7 rounded-full text-xs font-nunito font-black transition-all ${
                      pagina === n
                        ? "bg-[#3AAA35] text-white"
                        : "bg-white text-[#999] hover:text-[#3AAA35] shadow-sm"
                    }`}
                  >{n}</button>
                ))}

                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="w-7 h-7 rounded-full bg-white shadow-sm text-[#999] hover:text-[#3AAA35] disabled:opacity-30 text-sm font-nunito font-black transition-all"
                >›</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
