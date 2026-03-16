"use client";

import Image from "next/image";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [cantidad, setCantidad] = useState(1);
  const { addItem, removeItem, items } = useCartStore();

  const enCarrito = items.some((i) => i.product.id === product.id);

  const unidadLabel: Record<string, string> = {
    kg: "por kilo", unidad: "por unidad", litro: "por litro",
    atado: "por atado", docena: "por docena",
  };

  function handleToggle() {
    if (enCarrito) {
      removeItem(product.id);
    } else {
      for (let i = 0; i < cantidad; i++) addItem(product);
    }
  }

  const esProximo = product.categoria === "frutos_secos";

  return (
    <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow flex flex-col overflow-hidden group">

      {/* Imagen + badges */}
      <div className="relative bg-[#f9fafb] pt-6 px-6 pb-2 flex justify-center">
        {esProximo ? (
          <span className="absolute top-3 left-3 bg-[#F9C514] text-[#1A1A1A] font-nunito font-black text-[10px] px-2 py-1 rounded-full">
            Próximamente
          </span>
        ) : product.badges?.includes("nuevo") ? (
          <span className="absolute top-3 left-3 bg-red-500 text-white font-nunito font-black text-[10px] px-2 py-1 rounded-full">
            Nuevo
          </span>
        ) : product.es_estrella && (
          <span className="absolute top-3 left-3 bg-[#F9C514] text-[#1A1A1A] font-nunito font-black text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
            🌿 Temporada
          </span>
        )}
        <span className="absolute top-3 right-3 bg-white border border-[#e5e5e5] text-[#666] font-nunito text-[10px] px-2 py-1 rounded-full">
          {unidadLabel[product.unidad] ?? product.unidad}
        </span>
        <div className="w-28 h-28 relative group-hover:scale-105 transition-transform duration-300">
          <Image src={product.imagen} alt={product.nombre} fill className="object-contain" />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 px-4 pb-4 pt-3 gap-3">
        <div>
          <h3 className="font-nunito font-black text-[#1A1A1A] text-base leading-tight">{product.nombre}</h3>
          {product.origen && <p className="text-[#999] text-xs mt-0.5">{product.origen}</p>}
        </div>

        {!esProximo && (
          <p className="font-nunito font-black text-[#3AAA35] text-xl">
            ${product.precio.toLocaleString("es-CL")}
          </p>
        )}

        {/* Selector cantidad — solo si no está en carrito y no es próximo */}
        {!enCarrito && !esProximo && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              className="w-8 h-8 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
            >−</button>
            <span className="font-nunito font-black text-[#1A1A1A] w-6 text-center">{cantidad}</span>
            <button
              onClick={() => setCantidad((c) => c + 1)}
              className="w-8 h-8 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
            >+</button>
          </div>
        )}

        {/* Botón agregar / quitar */}
        {esProximo ? (
          <button disabled className="w-full py-2.5 rounded-full font-nunito font-black text-sm bg-[#e5e5e5] text-[#aaa] cursor-not-allowed mt-auto">
            Próximamente
          </button>
        ) : (
          <button
            onClick={handleToggle}
            className={`w-full py-2.5 rounded-full font-nunito font-black text-sm transition-all ${
              enCarrito
                ? "bg-[#3AAA35] text-white hover:bg-red-400"
                : "bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A]"
            }`}
          >
            {enCarrito ? "✓ Agregado — quitar" : "Agregar al carrito"}
          </button>
        )}
      </div>
    </div>
  );
}
