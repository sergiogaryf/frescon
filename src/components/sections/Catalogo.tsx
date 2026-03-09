"use client";

import { useState } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";

const categorias = [
  { key: "todos",    label: "Todos",    icon: "🛒" },
  { key: "verduras", label: "Verduras", icon: "🥦" },
  { key: "frutas",   label: "Frutas",   icon: "🍋" },
  { key: "hierbas",  label: "Hierbas",  icon: "🌿" },
  { key: "huevos",   label: "Huevos",   icon: "🥚" },
  { key: "kits",     label: "Kits",     icon: "📦" },
];

export default function Catalogo({ productos }: { productos: Product[] }) {
  const [filtro, setFiltro] = useState("todos");

  const filtrados =
    filtro === "todos"
      ? productos
      : productos.filter((p) => p.categoria === filtro);

  // Mostrar solo los primeros 8 en el home
  const visibles = filtrados.slice(0, 8);

  return (
    <section id="catalogo" className="bg-[#f9fafb] py-24 px-9 md:px-[4.5rem]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <span className="font-pacifico text-[#F9C514] text-2xl">Frescon</span>
          <h2 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-6xl leading-tight mt-1">
            NUESTROS PRODUCTOS
          </h2>
          <p className="text-[#666] mt-3 text-lg">
            Frescos, de temporada y directo del campo a tu puerta cada jueves.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-10">
          {categorias.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFiltro(cat.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-nunito font-black text-sm transition-all ${
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

        {/* Grid productos */}
        {visibles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {visibles.map((producto) => (
              <ProductCard key={producto.id} product={producto} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center font-nunito">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-black text-lg text-[#1A1A1A]">Sin productos en esta categoría</p>
          </div>
        )}

        {/* CTA ver más */}
        <div className="mt-10 text-center">
          <a
            href="/catalogo"
            className="inline-block bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-10 py-4 rounded-full transition-colors text-lg"
          >
            Ver catálogo completo ({productos.length} productos) →
          </a>
        </div>
      </div>
    </section>
  );
}
