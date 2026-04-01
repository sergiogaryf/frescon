"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Product } from "@/types";
import { getNutrition } from "@/data/product-nutrition";
import { useCartStore } from "@/store/cartStore";

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

/* ── Helpers de visualización ── */

const nivelLabel: Record<string, { texto: string; color: string; porcentaje: number }> = {
  bajo: { texto: "Bajo en calorías", color: "#3AAA35", porcentaje: 20 },
  moderado: { texto: "Energía moderada", color: "#F9C514", porcentaje: 55 },
  alto: { texto: "Alto aporte energético", color: "#E0B010", porcentaje: 85 },
};

const unidadLabel: Record<string, string> = {
  kg: "por kilo",
  unidad: "por unidad",
  litro: "por litro",
  atado: "por atado",
  docena: "por docena",
};

export default function ProductDetailModal({ product, isOpen, onClose }: Props) {
  const info = getNutrition(product.nombre);
  const { addItem, removeItem, items } = useCartStore();
  const enCarrito = items.some((i) => i.product.id === product.id);
  const [cantidad, setCantidad] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  /* cerrar con Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const nivel = info ? nivelLabel[info.nivelEnergetico] : null;

  function handleAdd() {
    for (let i = 0; i < cantidad; i++) addItem(product);
    onClose();
  }

  function handleRemove() {
    removeItem(product.id);
    onClose();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slideUp"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="sticky top-0 right-0 z-10 float-right mt-4 mr-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur border border-[#e5e5e5] flex items-center justify-center text-[#666] hover:text-[#1A1A1A] hover:border-[#3AAA35] transition-colors"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header: imagen + info básica */}
        <div className="flex flex-col sm:flex-row items-center gap-4 px-6 pt-6 pb-4">
          <div className="w-36 h-36 relative shrink-0 bg-[#f9fafb] rounded-2xl p-3">
            <Image
              src={product.imagen}
              alt={product.nombre}
              fill
              className="object-contain"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-nunito font-black text-[#1A1A1A] text-2xl leading-tight">
              {product.nombre}
            </h2>
            <p className="text-[#999] text-sm mt-0.5">
              {product.origen}
              {product.origen ? " · " : ""}
              {unidadLabel[product.unidad] ?? product.unidad}
            </p>
            <p className="font-nunito font-black text-[#3AAA35] text-2xl mt-1">
              ${product.precio.toLocaleString("es-CL")}
            </p>
          </div>
        </div>

        {/* Línea divisora */}
        <div className="mx-6 border-t border-[#e5e5e5]" />

        {info ? (
          <div className="px-6 py-5 flex flex-col gap-6">
            {/* ── 1. Vitaminas y Minerales ── */}
            <section>
              <SectionTitle icon="vitamin" text="Vitaminas y Minerales" />
              <div className="flex flex-wrap gap-2 mt-3">
                {info.vitaminas.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1.5 bg-[#3AAA35]/10 text-[#2A7A26] font-nunito font-bold text-xs px-3 py-1.5 rounded-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3AAA35]" />
                    {v}
                  </span>
                ))}
              </div>
            </section>

            {/* ── 2. Aporte Energético ── */}
            <section>
              <SectionTitle icon="energy" text="Aporte Energético" />
              <div className="mt-3 bg-[#f9fafb] rounded-2xl p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-nunito font-black text-[#1A1A1A] text-3xl">
                    {info.calorias}
                  </span>
                  <span className="text-[#999] text-sm font-nunito">kcal / 100 g</span>
                </div>
                {nivel && (
                  <>
                    <div className="mt-2 h-2.5 w-full bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${nivel.porcentaje}%`,
                          background: `linear-gradient(90deg, #3AAA35, ${nivel.color})`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-[#666] font-nunito font-bold mt-1.5">
                      {nivel.texto}
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* ── 3. ¿Para qué sirve? ── */}
            <section>
              <SectionTitle icon="benefits" text="¿Para qué sirve?" />
              <ul className="mt-3 flex flex-col gap-2.5">
                {info.beneficios.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#3AAA35] shrink-0" />
                    <span className="text-[#1A1A1A] text-sm leading-snug font-inter">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 4. ¿Cuánto comer? ── */}
            <section>
              <SectionTitle icon="calendar" text="¿Cuánto comer?" />
              <div className="mt-3 border-2 border-[#3AAA35]/20 rounded-2xl p-4 bg-[#3AAA35]/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3AAA35]" />
                  <span className="font-nunito font-black text-[#2A7A26] text-sm">
                    {info.frecuencia}
                  </span>
                </div>
                <p className="text-[#666] text-sm mt-1.5 ml-5 font-inter">
                  Porción sugerida: {info.porcion}
                </p>
              </div>
            </section>

            {/* ── 5. Receta Rápida ── */}
            <section>
              <SectionTitle icon="recipe" text="Receta Rápida" />
              <div className="mt-3 bg-[#FFF9E6] border border-[#F9C514]/30 rounded-2xl p-4">
                <h4 className="font-nunito font-black text-[#1A1A1A] text-base">
                  {info.receta.nombre}
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {info.receta.ingredientes.map((ing, i) => (
                    <span
                      key={i}
                      className="inline-block bg-white border border-[#F9C514]/40 text-[#1A1A1A] text-xs font-nunito px-2.5 py-1 rounded-full"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
                <p className="text-[#666] text-sm mt-3 leading-relaxed font-inter">
                  {info.receta.preparacion}
                </p>
              </div>
            </section>

            {/* Fuente */}
            <p className="text-[10px] text-[#bbb] text-center font-inter">
              Información nutricional basada en USDA FoodData Central e INTA Chile. Valores aproximados por 100 g de porción comestible.
            </p>
          </div>
        ) : (
          /* Sin data nutricional */
          <div className="px-6 py-8 text-center">
            <p className="text-[#999] text-sm font-inter">
              {product.descripcion || "Información nutricional próximamente."}
            </p>
          </div>
        )}

        {/* Footer: botón agregar */}
        <div className="sticky bottom-0 bg-white border-t border-[#e5e5e5] px-6 py-4">
          {enCarrito ? (
            <button
              onClick={handleRemove}
              className="w-full py-3 rounded-full font-nunito font-black text-sm bg-[#3AAA35] text-white hover:bg-red-400 transition-colors"
            >
              ✓ En tu carrito — quitar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {/* Selector cantidad */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <span className="font-nunito font-black text-[#1A1A1A] w-6 text-center">
                  {cantidad}
                </span>
                <button
                  onClick={() => setCantidad((c) => c + 1)}
                  className="w-9 h-9 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="flex-1 py-3 rounded-full font-nunito font-black text-sm bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] transition-colors"
              >
                Agregar — ${(product.precio * cantidad).toLocaleString("es-CL")}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ── Componente: Título de sección ── */

function SectionTitle({ icon, text }: { icon: string; text: string }) {
  const icons: Record<string, string> = {
    vitamin: "🧬",
    energy: "⚡",
    benefits: "💪",
    calendar: "📅",
    recipe: "👨‍🍳",
  };

  return (
    <h3 className="flex items-center gap-2 font-nunito font-black text-[#1A1A1A] text-base">
      <span className="text-lg">{icons[icon]}</span>
      {text}
    </h3>
  );
}
