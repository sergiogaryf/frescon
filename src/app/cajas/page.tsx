"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CAJAS, Caja } from "@/lib/cajas";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

function cajaToProduct(caja: Caja): Product {
  return {
    id:          caja.id,
    nombre:      caja.nombre,
    precio:      caja.precio,
    categoria:   "kits",
    unidad:      "unidad",
    stock:       99,
    es_estrella: true,
    origen:      "Valle de Aconcagua",
    descripcion: caja.descripcion,
    imagen:      "",
    badges:      [caja.badge],
  };
}

function CajaCard({ caja }: { caja: Caja }) {
  const addItem = useCartStore((s) => s.addItem);
  const [agregada, setAgregada] = useState(false);

  function handleAgregar() {
    addItem(cajaToProduct(caja));
    setAgregada(true);
    setTimeout(() => setAgregada(false), 2000);
  }

  return (
    <div className={`${caja.color} rounded-3xl p-6 flex flex-col gap-4 border border-white shadow-sm hover:shadow-md transition-shadow`}>
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

      {/* Productos incluidos */}
      <div className="flex flex-wrap gap-1.5">
        {caja.productos.map((prod) => (
          <span
            key={prod}
            className="bg-white/70 text-[#444] font-nunito text-xs px-2.5 py-1 rounded-full border border-white"
          >
            {prod}
          </span>
        ))}
      </div>

      {/* Precio + ahorro + botón */}
      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div>
          <p className="font-nunito font-black text-[#1A1A1A] text-2xl">
            ${caja.precio.toLocaleString("es-CL")}
          </p>
          <span className="inline-block bg-[#3AAA35] text-white font-nunito font-black text-xs px-2.5 py-0.5 rounded-full mt-1">
            Ahorras {caja.ahorro}%
          </span>
        </div>
        <button
          onClick={handleAgregar}
          className={`flex-shrink-0 font-nunito font-black text-sm px-5 py-3 rounded-full transition-all ${
            agregada
              ? "bg-[#3AAA35] text-white scale-95"
              : "bg-[#1A1A1A] hover:bg-[#3AAA35] text-white"
          }`}
        >
          {agregada ? "✓ Agregada" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

export default function CajasPage() {
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
          Catálogo
        </Link>
      </div>

      {/* Título */}
      <div className="bg-white border-b border-[#f0f0f0] px-6 md:px-[4.5rem] py-10">
        <div className="max-w-5xl mx-auto">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-5xl leading-tight mt-1">
            CAJAS <span className="text-[#3AAA35]">FRESCÓN</span>
          </h1>
          <p className="text-[#666] mt-2 text-lg font-nunito">
            Selección curada por Celia 🐱
          </p>
        </div>
      </div>

      {/* Grid de cajas */}
      <div className="max-w-5xl mx-auto px-6 md:px-[4.5rem] py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAJAS.map((caja) => (
            <CajaCard key={caja.id} caja={caja} />
          ))}
        </div>

        {/* Nota al pie */}
        <p className="mt-10 text-center text-[#999] font-nunito text-sm leading-relaxed max-w-lg mx-auto">
          Cada caja se prepara con lo mejor disponible esa semana. Los productos exactos pueden variar
          ligeramente según temporada. 🌿
        </p>
      </div>

      {/* Footer simple */}
      <footer className="border-t border-[#f0f0f0] bg-white mt-4 py-6 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-nunito text-[#999]">
        <Link href="/catalogo" className="hover:text-[#3AAA35] transition-colors font-black">
          Ver catálogo completo
        </Link>
        <span className="hidden sm:inline">·</span>
        <Link href="/checkout" className="hover:text-[#3AAA35] transition-colors font-black">
          Ir al checkout
        </Link>
      </footer>

    </div>
  );
}
