"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56912345678";

const unidadLabel: Record<string, string> = {
  kg: "kg", unidad: "c/u", litro: "lt", atado: "atado", docena: "doc",
};

export default function CartSidebar() {
  const { isOpen, items, toggleCart, addItem, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const [todosProductos, setTodosProductos] = useState<Product[]>([]);

  // Carga el catálogo solo cuando se abre el carrito
  useEffect(() => {
    if (isOpen && todosProductos.length === 0) {
      fetch("/api/productos")
        .then((r) => r.json())
        .then((data: Product[]) => setTodosProductos(data))
        .catch(() => {});
    }
  }, [isOpen, todosProductos.length]);

  const cartIds = new Set(items.map((i) => i.product.id));
  const recomendados = todosProductos
    .filter((p) => !cartIds.has(p.id) && p.es_estrella)
    .slice(0, 4);

  const totalValue = total();

  function buildWhatsAppMessage() {
    const lineas = items
      .map((i) => `• ${i.cantidad}x ${i.product.nombre} (${unidadLabel[i.product.unidad]}) — $${(i.product.precio * i.cantidad).toLocaleString("es-CL")}`)
      .join("%0A");
    const msg = `Hola Frescon! 🌿%0AMi pedido:%0A${lineas}%0A%0A*Total: $${totalValue.toLocaleString("es-CL")}*%0A%0AAdjunto comprobante de pago.`;
    return `https://wa.me/${WHATSAPP}?text=${msg}`;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#1A5C18]/60 z-40 backdrop-blur-sm"
          onClick={toggleCart}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-[#2A7A26] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/images/Logo.png" alt="Frescon" width={100} height={44} className="object-contain" />
            <span className="text-white/60 text-sm font-nunito">— Mi pedido</span>
          </div>
          <button onClick={toggleCart} className="text-white/70 hover:text-white transition-colors p-1">
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
              <span className="text-5xl">🛒</span>
              <p className="font-nunito font-black text-[#1A1A1A] text-lg">Tu pedido está vacío</p>
              <p className="text-[#999] text-sm">Agrega productos del catálogo</p>
              <button
                onClick={toggleCart}
                className="mt-2 bg-[#F9C514] text-[#1A1A1A] font-nunito font-black px-6 py-2.5 rounded-full text-sm"
              >
                Ver productos
              </button>
            </div>
          ) : (
            <>
              {/* Lista de productos */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-nunito font-black text-[#1A1A1A] text-sm">
                    {items.length} producto{items.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={clearCart}
                    className="text-[#ccc] hover:text-red-400 text-xs font-nunito transition-colors"
                  >
                    Vaciar
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map(({ product, cantidad }) => (
                    <div key={product.id} className="flex items-center gap-3 bg-[#f9fafb] rounded-2xl px-3 py-2.5">
                      <div className="w-10 h-10 flex-shrink-0 relative">
                        <Image src={product.imagen} alt={product.nombre} fill className="object-contain" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-nunito font-black text-[#1A1A1A] text-sm truncate">{product.nombre}</p>
                        <p className="text-[#999] text-xs">{unidadLabel[product.unidad]} · ${product.precio.toLocaleString("es-CL")}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(product.id, cantidad - 1)}
                          className="w-6 h-6 rounded-full border border-[#e5e5e5] hover:border-[#3AAA35] text-[#666] text-xs font-black flex items-center justify-center transition-colors"
                        >−</button>
                        <span className="font-nunito font-black text-[#1A1A1A] text-sm w-4 text-center">{cantidad}</span>
                        <button
                          onClick={() => updateQuantity(product.id, cantidad + 1)}
                          className="w-6 h-6 rounded-full border border-[#e5e5e5] hover:border-[#3AAA35] text-[#666] text-xs font-black flex items-center justify-center transition-colors"
                        >+</button>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <p className="font-nunito font-black text-[#3AAA35] text-sm">
                          ${(product.precio * cantidad).toLocaleString("es-CL")}
                        </p>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="text-[#ccc] hover:text-red-400 text-xs transition-colors"
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mx-5 bg-[#3AAA35]/8 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="font-nunito font-black text-[#1A1A1A]">Total</span>
                <span className="font-nunito font-black text-[#3AAA35] text-xl">
                  ${totalValue.toLocaleString("es-CL")}
                </span>
              </div>
            </>
          )}

          {/* Productos recomendados */}
          {recomendados.length > 0 && (
            <div className="px-5 py-4 mt-2">
              <p className="font-nunito font-black text-[#1A1A1A] text-sm mb-3">
                🌿 También te puede interesar
              </p>
              <div className="flex flex-col gap-2">
                {recomendados.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-white border border-[#f0f0f0] rounded-2xl px-3 py-2.5 hover:border-[#3AAA35]/30 transition-colors">
                    <div className="w-9 h-9 flex-shrink-0 relative">
                      <Image src={p.imagen} alt={p.nombre} fill className="object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-nunito font-black text-[#1A1A1A] text-sm truncate">{p.nombre}</p>
                      <p className="text-[#999] text-xs">${p.precio.toLocaleString("es-CL")} / {unidadLabel[p.unidad]}</p>
                    </div>
                    <button
                      onClick={() => addItem(p)}
                      className="flex-shrink-0 bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] font-nunito font-black text-xs px-3 py-1.5 rounded-full transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instrucciones de pago */}
          {items.length > 0 && (
            <div className="mx-5 mb-4 mt-2 bg-[#f9fafb] rounded-2xl p-4">
              <p className="font-nunito font-black text-[#1A1A1A] text-sm mb-1">💳 ¿Cómo pagar?</p>
              <p className="text-[#666] text-xs leading-relaxed">
                Realiza una transferencia bancaria al confirmar tu pedido. Luego envía el comprobante por WhatsApp y listo.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-[#f0f0f0] flex flex-col gap-2 bg-white">
            <Link
              href="/checkout"
              onClick={toggleCart}
              className="w-full bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black py-3.5 rounded-full transition-colors text-sm text-center"
            >
              Realizar compra
            </Link>

            <a
              href={buildWhatsAppMessage()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] font-nunito font-black py-3.5 rounded-full transition-colors text-sm"
            >
              <WhatsAppIcon />
              Enviar comprobante de pago
            </a>
          </div>
        )}
      </aside>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
