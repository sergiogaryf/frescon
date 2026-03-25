"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PedidoAdmin } from "@/lib/airtable";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

const ESTADO_STYLE: Record<string, string> = {
  Pendiente:   "bg-[#F9C514]/20 text-[#7A5F00]",
  Confirmado:  "bg-blue-50 text-blue-600",
  "En camino": "bg-orange-50 text-orange-600",
  Entregado:   "bg-[#3AAA35]/10 text-[#1A6A18]",
  Cancelado:   "bg-red-50 text-red-500",
};
const ESTADO_EMOJI: Record<string, string> = {
  Pendiente: "🟡", Confirmado: "🔵", "En camino": "🚗", Entregado: "✅", Cancelado: "❌",
};

interface LineaItem {
  cantidad: number;
  nombre: string;
  unidad: string;
  precioUnitario: number;
}

interface ProductoAPI {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  imagen: string;
  categoria: string;
}

const unidadLabel: Record<string, string> = {
  kg: "kg", unidad: "c/u", litro: "lt", atado: "atado", docena: "doc",
};

/** Parsea "2x Lechuga (kg) — $2.000" */
function parsearLinea(linea: string): LineaItem | null {
  const m = linea.match(/^(\d+)x\s+(.+?)\s+\(([^)]+)\)\s+—\s+\$([0-9.,]+)$/);
  if (!m) return null;
  const cantidad = parseInt(m[1], 10);
  const subtotal = parseInt(m[4].replace(/\./g, "").replace(",", ""), 10);
  return {
    cantidad,
    nombre: m[2],
    unidad: m[3],
    precioUnitario: Math.round(subtotal / cantidad),
  };
}

function formatearLinea(item: LineaItem): string {
  const subtotal = item.precioUnitario * item.cantidad;
  return `${item.cantidad}x ${item.nombre} (${item.unidad}) — $${subtotal.toLocaleString("es-CL")}`;
}

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
}

interface PerfilInfo {
  encontrado: boolean;
  nombre?: string;
  zona?: string;
  preferencias?: string;
  dieta?: string;
  productos_favoritos?: string;
  total_pedidos?: number;
}

const STORAGE_KEY = "frescon-cuenta-tel";

export default function CuentaPage() {
  const [telefono, setTelefono] = useState("");
  const [pedidos,  setPedidos]  = useState<PedidoAdmin[] | null>(null);
  const [perfil,   setPerfil]   = useState<PerfilInfo | null>(null);
  const [loading,  setLoading]  = useState(false);

  const cargarCuenta = useCallback(async (tel: string) => {
    setLoading(true);
    const [resP, resPerfil] = await Promise.all([
      fetch(`/api/cuenta?telefono=${encodeURIComponent(tel)}`),
      fetch(`/api/cliente/perfil?telefono=${encodeURIComponent(tel)}`),
    ]);
    const data = await resP.json();
    const perfilData = await resPerfil.json();
    setPedidos(Array.isArray(data) ? data : []);
    setPerfil(perfilData?.encontrado ? perfilData : null);
    setLoading(false);
  }, []);

  // Restaurar sesion al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTelefono(saved);
      cargarCuenta(saved);
    }
  }, [cargarCuenta]);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    localStorage.setItem(STORAGE_KEY, telefono.trim());
    await cargarCuenta(telefono.trim());
  }

  function cerrarSesion() {
    localStorage.removeItem(STORAGE_KEY);
    setPedidos(null);
    setPerfil(null);
    setTelefono("");
  }

  function actualizarPedido(id: string, updates: Partial<PedidoAdmin>) {
    setPedidos((prev) =>
      prev?.map((p) => (p.id === id ? { ...p, ...updates } : p)) ?? null
    );
  }

  const nombre = pedidos?.[0]?.nombre_cliente ?? "";
  const tienePedidoActivo = pedidos?.some((p) => p.estado === "Pendiente" || p.estado === "Confirmado") ?? false;

  return (
    <div className="min-h-screen bg-[#f9fafb]">

      {/* Header */}
      <div className="bg-[#2A7A26] px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={120} height={54} className="object-contain" />
        </Link>
        <Link href="/" className="text-white/60 hover:text-white font-nunito text-sm transition-colors">
          ← Volver al inicio
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Titulo */}
        <div className="mb-8">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl leading-tight mt-1">
            MIS <span className="text-[#3AAA35]">PEDIDOS</span>
          </h1>
          <p className="text-[#999] mt-2">Ingresa tu numero de telefono para ver el historial de tus pedidos.</p>
        </div>

        {/* Buscador — se oculta cuando hay sesion abierta */}
        {pedidos === null ? (
          <form onSubmit={buscar} className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <label className="font-nunito font-black text-[#1A1A1A] text-sm mb-2 block">📱 Tu telefono</label>
            <div className="flex gap-3">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-[#1A1A1A] text-sm"
              />
              <button
                type="submit"
                disabled={loading || !telefono.trim()}
                className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black px-6 py-3 rounded-2xl text-sm transition-colors"
              >
                {loading ? "…" : "Buscar"}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-3xl p-4 shadow-sm mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">📱</span>
              <span className="font-nunito font-black text-[#1A1A1A] text-sm">{telefono}</span>
            </div>
            <button
              onClick={cerrarSesion}
              className="text-[#999] hover:text-red-400 font-nunito font-black text-xs px-4 py-2 rounded-2xl border border-[#e5e5e5] hover:border-red-300 transition-all"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Resultados */}
        {pedidos !== null && (
          pedidos.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin pedidos</p>
              <p className="text-[#999] text-sm font-nunito mt-1">No encontramos pedidos con ese telefono.</p>
              <Link href="/catalogo" className="inline-block mt-4 bg-[#F9C514] text-[#1A1A1A] font-nunito font-black px-6 py-2.5 rounded-full text-sm">
                Ver catalogo
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <p className="font-nunito font-black text-[#1A1A1A]">
                  {nombre && `Hola, ${nombre.split(" ")[0]}! `}
                  {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} encontrado{pedidos.length !== 1 ? "s" : ""}
                </p>
                <Link
                  href="/seguimiento"
                  className="bg-[#3AAA35]/10 text-[#2A7A26] font-nunito font-black text-xs px-4 py-2 rounded-full hover:bg-[#3AAA35]/20 transition-colors flex-shrink-0"
                >
                  🚗 Ver estado en tiempo real
                </Link>
              </div>

              {/* Perfil personalizado */}
              {perfil && (
                <div className="bg-gradient-to-br from-[#F9C514]/10 to-[#3AAA35]/5 rounded-3xl p-5 mb-4 border border-[#F9C514]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🐱</span>
                    <h3 className="font-nunito font-black text-[#1A1A1A] text-sm">Tu perfil Frescon</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {perfil.zona && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        📍 {perfil.zona}
                      </span>
                    )}
                    {perfil.dieta && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        🥗 {perfil.dieta}
                      </span>
                    )}
                    {(perfil.total_pedidos ?? 0) > 0 && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        📦 {perfil.total_pedidos} pedido{(perfil.total_pedidos ?? 0) > 1 ? "s" : ""}
                      </span>
                    )}
                    {perfil.preferencias && (
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-nunito font-black text-[#666] border border-[#e5e5e5]">
                        ❤️ {perfil.preferencias}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/catalogo?tel=${encodeURIComponent(telefono)}`}
                    className="inline-flex items-center gap-2 bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black text-xs px-5 py-2.5 rounded-full transition-colors"
                  >
                    🛒 Ver catalogo personalizado
                  </Link>
                </div>
              )}

              {/* Banner envio gratis */}
              {tienePedidoActivo && (
                <div className="bg-[#3AAA35]/10 border border-[#3AAA35]/20 rounded-2xl px-4 py-3 mb-4">
                  <p className="font-nunito font-black text-[#2A7A26] text-sm">🚚 Envio gratis en tu proximo pedido</p>
                  <p className="font-nunito text-[#666] text-xs mt-1">Ya tienes un pedido activo para este jueves. Agrega mas productos sin cargo de envio adicional.</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {pedidos.map((p) => (
                  <PedidoCard key={p.id} pedido={p} onUpdate={actualizarPedido} />
                ))}
              </div>
              {/* Codigo de referido */}
              <ReferidosSection telefono={telefono} nombre={nombre} />

              <div className="mt-6 text-center">
                <Link href="/catalogo" className="bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-8 py-3 rounded-full text-sm inline-block transition-colors">
                  + Hacer nuevo pedido
                </Link>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

/* ── Pedido Card con edicion (solo Pendiente) ── */

function PedidoCard({ pedido: p, onUpdate }: {
  pedido: PedidoAdmin;
  onUpdate: (id: string, updates: Partial<PedidoAdmin>) => void;
}) {
  const esPendiente = p.estado === "Pendiente";
  const [editando, setEditando] = useState(false);
  const [items, setItems] = useState<LineaItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [productos, setProductos] = useState<ProductoAPI[]>([]);
  const [buscaProducto, setBuscaProducto] = useState("");
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [cargandoReorder, setCargandoReorder] = useState(false);
  const [reorderError, setReorderError] = useState("");
  const reorderItems = useCartStore((s) => s.reorderItems);
  const setPedidoBase = useCartStore((s) => s.setPedidoBase);
  const router = useRouter();

  async function volverAPedir() {
    setCargandoReorder(true);
    setReorderError("");
    try {
      const res = await fetch("/api/productos");
      const catalogo: Product[] = await res.json();
      if (!Array.isArray(catalogo)) throw new Error();

      const lineas = p.detalle_pedido.split("\n").filter(Boolean);
      const parsed = lineas.map(parsearLinea).filter((x): x is LineaItem => x !== null);

      const cartItems = parsed
        .map((item) => {
          const prod = catalogo.find(
            (pr) => pr.nombre.toLowerCase() === item.nombre.toLowerCase()
          );
          if (!prod) return null;
          return { product: prod, cantidad: item.cantidad };
        })
        .filter((x): x is { product: Product; cantidad: number } => x !== null);

      if (cartItems.length === 0) {
        setReorderError("Los productos de este pedido ya no estan disponibles.");
        setCargandoReorder(false);
        return;
      }

      reorderItems(cartItems);

      if (cartItems.length < parsed.length) {
        const noDisponibles = parsed
          .filter((item) => !catalogo.some((pr) => pr.nombre.toLowerCase() === item.nombre.toLowerCase()))
          .map((i) => i.nombre);
        setReorderError(`Algunos productos ya no estan disponibles: ${noDisponibles.join(", ")}. Se agregaron los demas al carrito.`);
        setTimeout(() => router.push("/checkout"), 2000);
      } else {
        router.push("/checkout");
      }
    } catch {
      setReorderError("Error al cargar los productos. Intenta de nuevo.");
    }
    setCargandoReorder(false);
  }

  function iniciarEdicion() {
    const lineas = p.detalle_pedido.split("\n").filter(Boolean);
    const parsed = lineas.map(parsearLinea).filter((x): x is LineaItem => x !== null);
    setItems(parsed);
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    setItems([]);
    setMostrarCatalogo(false);
  }

  function cambiarCantidad(idx: number, delta: number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const nueva = item.cantidad + delta;
        return nueva >= 1 ? { ...item, cantidad: nueva } : item;
      })
    );
  }

  function eliminarItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function abrirCatalogo() {
    if (productos.length === 0) {
      setCargandoProductos(true);
      try {
        const res = await fetch("/api/productos");
        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      setCargandoProductos(false);
    }
    setMostrarCatalogo(true);
    setBuscaProducto("");
  }

  function agregarProducto(prod: ProductoAPI) {
    const existente = items.findIndex((it) => it.nombre === prod.nombre);
    if (existente >= 0) {
      cambiarCantidad(existente, 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          cantidad: 1,
          nombre: prod.nombre,
          unidad: unidadLabel[prod.unidad] ?? prod.unidad,
          precioUnitario: prod.precio,
        },
      ]);
    }
    setMostrarCatalogo(false);
  }

  const nuevoTotal = items.reduce((s, it) => s + it.precioUnitario * it.cantidad, 0);

  async function guardar() {
    if (items.length === 0) return;
    setGuardando(true);
    const detalle = items.map(formatearLinea).join("\n");
    try {
      const res = await fetch(`/api/pedidos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detalle_pedido: detalle, total: nuevoTotal }),
      });
      if (res.ok) {
        onUpdate(p.id, { detalle_pedido: detalle, total: nuevoTotal });
        setEditando(false);
        setItems([]);
      }
    } catch { /* ignore */ }
    setGuardando(false);
  }

  const productosFiltrados = buscaProducto.trim()
    ? productos.filter((pr) => pr.nombre.toLowerCase().includes(buscaProducto.toLowerCase()))
    : productos;

  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className={`text-xs font-nunito font-black px-2.5 py-1 rounded-full ${ESTADO_STYLE[p.estado] ?? ""}`}>
            {ESTADO_EMOJI[p.estado]} {p.estado}
          </span>
          <p className="font-nunito text-[#999] text-xs mt-1.5">
            📅 Entrega: {formatFecha(p.fecha_entrega)}
          </p>
        </div>
        <p className="font-nunito font-black text-[#3AAA35] text-lg flex-shrink-0">
          ${(editando ? nuevoTotal : p.total).toLocaleString("es-CL")}
        </p>
      </div>

      {/* Vista normal */}
      {!editando && (
        <>
          <div className="bg-[#f9fafb] rounded-2xl p-3">
            {p.detalle_pedido.split("\n").map((linea, i) => (
              <p key={i} className="font-nunito text-[#666] text-xs">{linea}</p>
            ))}
          </div>
          {p.notas && (
            <p className="text-[#999] text-xs font-nunito mt-2">📝 {p.notas}</p>
          )}
          {/* Editar pedido — solo Pendiente (no pagado) */}
          {esPendiente && (
            <button
              onClick={iniciarEdicion}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-[#e5e5e5] hover:border-[#F9C514] hover:bg-[#F9C514]/5 text-[#666] hover:text-[#1A1A1A] font-nunito font-black text-xs transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
              Editar pedido
            </button>
          )}
          <button
            onClick={volverAPedir}
            disabled={cargandoReorder}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#F9C514] hover:bg-[#E0B010] disabled:opacity-50 text-[#1A1A1A] font-nunito font-black text-xs transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M21 21v-5h-5"/>
            </svg>
            {cargandoReorder ? "Cargando..." : "Volver a pedir"}
          </button>
          {reorderError && (
            <p className="mt-2 text-xs font-nunito text-orange-600 text-center">{reorderError}</p>
          )}
          {/* Agregar productos — solo Pendiente (no pagado) */}
          {esPendiente && (
            <button
              onClick={() => {
                setPedidoBase(p.id, p.fecha_entrega, p.detalle_pedido, p.total);
                router.push("/catalogo");
              }}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-[#3AAA35] hover:bg-[#3AAA35]/5 text-[#3AAA35] font-nunito font-black text-xs transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
              </svg>
              Agregar productos a este envio
            </button>
          )}
        </>
      )}

      {/* Vista edicion (solo Pendiente) */}
      {editando && (
        <div className="mt-1">
          {items.length === 0 ? (
            <div className="bg-red-50 rounded-2xl p-4 text-center mb-3">
              <p className="font-nunito text-red-500 text-xs font-black">El pedido no puede quedar vacio</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {items.map((item, idx) => (
                <div key={idx} className="bg-[#f9fafb] rounded-2xl px-3 py-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-nunito font-black text-[#1A1A1A] text-xs truncate">{item.nombre}</p>
                    <p className="font-nunito text-[#999] text-[10px]">
                      ${item.precioUnitario.toLocaleString("es-CL")} / {item.unidad}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => cambiarCantidad(idx, -1)}
                      disabled={item.cantidad <= 1}
                      className="w-6 h-6 rounded-lg bg-white border border-[#e5e5e5] flex items-center justify-center text-[#666] hover:border-[#3AAA35] hover:text-[#3AAA35] disabled:opacity-30 transition-colors text-xs font-black"
                    >
                      -
                    </button>
                    <span className="font-nunito font-black text-[#1A1A1A] text-xs w-6 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(idx, 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-[#e5e5e5] flex items-center justify-center text-[#666] hover:border-[#3AAA35] hover:text-[#3AAA35] transition-colors text-xs font-black"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-nunito font-black text-[#3AAA35] text-xs w-16 text-right flex-shrink-0">
                    ${(item.precioUnitario * item.cantidad).toLocaleString("es-CL")}
                  </span>
                  <button
                    onClick={() => eliminarItem(idx)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[#ccc] hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar producto */}
          {!mostrarCatalogo ? (
            <button
              onClick={abrirCatalogo}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-[#3AAA35]/30 hover:border-[#3AAA35] text-[#3AAA35] font-nunito font-black text-xs transition-all hover:bg-[#3AAA35]/5 mb-3"
            >
              + Agregar producto
            </button>
          ) : (
            <div className="border-2 border-[#3AAA35]/20 rounded-2xl p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={buscaProducto}
                  onChange={(e) => setBuscaProducto(e.target.value)}
                  placeholder="Buscar producto..."
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-xs text-[#1A1A1A] placeholder-[#bbb]"
                />
                <button
                  onClick={() => setMostrarCatalogo(false)}
                  className="text-[#999] hover:text-[#666] font-nunito text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
              {cargandoProductos ? (
                <p className="font-nunito text-[#999] text-xs text-center py-3">Cargando...</p>
              ) : (
                <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                  {productosFiltrados.length === 0 ? (
                    <p className="font-nunito text-[#999] text-xs text-center py-2">Sin resultados</p>
                  ) : (
                    productosFiltrados.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => agregarProducto(prod)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#3AAA35]/5 transition-colors text-left w-full"
                      >
                        {prod.imagen && (
                          <div className="w-7 h-7 relative flex-shrink-0">
                            <Image src={prod.imagen} alt={prod.nombre} fill className="object-contain" />
                          </div>
                        )}
                        <span className="font-nunito font-black text-[#1A1A1A] text-xs flex-1 truncate">{prod.nombre}</span>
                        <span className="font-nunito text-[#3AAA35] text-xs flex-shrink-0">
                          ${prod.precio.toLocaleString("es-CL")}/{unidadLabel[prod.unidad] ?? prod.unidad}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Total editado */}
          {items.length > 0 && (
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="font-nunito text-[#999] text-xs">Nuevo total</span>
              <span className="font-nunito font-black text-[#3AAA35] text-base">${nuevoTotal.toLocaleString("es-CL")}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={cancelarEdicion}
              className="flex-1 py-2.5 rounded-2xl border-2 border-[#e5e5e5] hover:border-[#999] text-[#666] font-nunito font-black text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando || items.length === 0}
              className="flex-1 py-2.5 rounded-2xl bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black text-xs transition-colors"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Referidos ── */

function ReferidosSection({ telefono, nombre }: { telefono: string; nombre: string }) {
  const [data, setData] = useState<{ codigo: string; total_referidos: number } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!telefono) return;
    fetch(`/api/referidos?telefono=${encodeURIComponent(telefono)}`)
      .then(r => r.json())
      .then(d => setData(d));
  }, [telefono]);

  if (!data) return null;

  const mensaje = `¡Hola! Compra frutas y verduras frescas del Valle de Aconcagua con Frescon 🌿 Usa mi codigo ${data.codigo} y ambos obtenemos 5% de descuento. Pide en frescon.cl`;

  void nombre;

  function copiar() {
    navigator.clipboard.writeText(data!.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function compartir() {
    if (navigator.share) {
      navigator.share({ text: mensaje });
    } else {
      navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#3AAA35]/10 to-[#2A7A26]/5 rounded-3xl p-6 border border-[#3AAA35]/20 mt-6">
      <h3 className="font-nunito font-black text-[#1A1A1A] text-lg mb-1">🎁 Invita a tus amigos</h3>
      <p className="font-nunito text-[#666] text-sm mb-4">
        Comparte tu codigo y ambos obtienen <strong className="text-[#3AAA35]">5% de descuento</strong> en el proximo pedido.
      </p>
      <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between mb-3 border border-[#e5e5e5]">
        <span className="font-nunito font-black text-[#1A1A1A] text-lg tracking-wider">{data.codigo}</span>
        <button onClick={copiar} className="text-xs font-nunito font-black text-[#3AAA35] hover:text-[#2A7A26] transition-colors">
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      {data.total_referidos > 0 && (
        <p className="font-nunito text-xs text-[#999] mb-3">
          Ya referiste a <strong>{data.total_referidos}</strong> persona{data.total_referidos > 1 ? "s" : ""} 🎉
        </p>
      )}
      <button
        onClick={compartir}
        className="w-full bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black text-sm py-3 rounded-2xl transition-colors"
      >
        📤 Compartir con amigos
      </button>
    </div>
  );
}
