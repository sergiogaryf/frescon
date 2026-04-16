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
  allProducts?: Product[];
}

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

/** Busca productos del catálogo que coincidan con los ingredientes de la receta */
function matchIngredientes(ingredientes: string[], productos: Product[]): Product[] {
  const matched: Product[] = [];
  for (const ing of ingredientes) {
    const ingNorm = ing.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const p of productos) {
      const pNorm = p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (ingNorm.includes(pNorm) && !matched.some((m) => m.id === p.id)) {
        matched.push(p);
      }
    }
  }
  return matched;
}

export default function ProductDetailModal({ product, isOpen, onClose, allProducts }: Props) {
  const info = getNutrition(product.nombre);
  const { addItem, removeItem, items } = useCartStore();
  const enCarrito = items.some((i) => i.product.id === product.id);
  const [cantidad, setCantidad] = useState(1);
  const [recetaAgregada, setRecetaAgregada] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const productosReceta = info && allProducts
    ? matchIngredientes(info.receta.ingredientes, allProducts)
    : [];

  function handleAddReceta() {
    for (const p of productosReceta) {
      if (!items.some((i) => i.product.id === p.id)) {
        addItem(p);
      }
    }
    setRecetaAgregada(true);
    setTimeout(() => setRecetaAgregada(false), 2500);
  }

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

  /* ── Columna izquierda: producto + carrito ── */
  const productPanel = (
    <div className="flex flex-col items-center lg:items-start">
      {/* Imagen */}
      <div className="w-44 h-44 lg:w-56 lg:h-56 relative shrink-0 bg-[#f9fafb] rounded-2xl p-4">
        <Image
          src={product.imagen}
          alt={product.nombre}
          fill
          className="object-contain"
        />
      </div>

      {/* Info básica */}
      <div className="text-center lg:text-left mt-4 w-full">
        <h2 className="font-nunito font-black text-[#1A1A1A] text-2xl leading-tight">
          {product.nombre}
        </h2>
        <p className="text-[#999] text-sm mt-0.5">
          {product.origen}
          {product.origen ? " · " : ""}
          {unidadLabel[product.unidad] ?? product.unidad}
        </p>
        <p className="font-nunito font-black text-[#3AAA35] text-3xl mt-2">
          ${product.precio.toLocaleString("es-CL")}
        </p>
      </div>

      {/* Botón agregar — solo visible en desktop dentro del panel izquierdo */}
      <div className="hidden lg:block w-full mt-5">
        {enCarrito ? (
          <button
            onClick={handleRemove}
            className="w-full py-3 rounded-full font-nunito font-black text-sm bg-[#3AAA35] text-white hover:bg-red-400 transition-colors"
          >
            ✓ En tu carrito — quitar
          </button>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
              >−</button>
              <span className="font-nunito font-black text-[#1A1A1A] w-6 text-center">{cantidad}</span>
              <button
                onClick={() => setCantidad((c) => c + 1)}
                className="w-9 h-9 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
              >+</button>
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-3 rounded-full font-nunito font-black text-sm bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] transition-colors"
            >
              Agregar al carrito — ${(product.precio * cantidad).toLocaleString("es-CL")}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Columna derecha: info nutricional ── */
  const nutritionPanel = info ? (
    <div className="flex flex-col gap-5">
      {/* 1. Vitaminas */}
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

      {/* 2. Aporte Energético */}
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

      {/* 3. Beneficios */}
      <section>
        <SectionTitle icon="benefits" text="¿Para qué sirve?" />
        <ul className="mt-3 flex flex-col gap-2.5">
          {info.beneficios.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-[#3AAA35] shrink-0" />
              <span className="text-[#1A1A1A] text-sm leading-snug font-inter">{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Frecuencia */}
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

      {/* 5. Receta */}
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
          {productosReceta.length > 0 && (
            <button
              onClick={handleAddReceta}
              disabled={recetaAgregada}
              className={`mt-3 w-full py-2.5 rounded-full font-nunito font-black text-sm transition-all ${
                recetaAgregada
                  ? "bg-[#3AAA35] text-white"
                  : "bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A]"
              }`}
            >
              {recetaAgregada
                ? `${productosReceta.length} producto${productosReceta.length > 1 ? "s" : ""} agregado${productosReceta.length > 1 ? "s" : ""}`
                : `Agregar ingredientes al carrito (${productosReceta.length})`}
            </button>
          )}
        </div>
      </section>

      {/* Fuente */}
      <p className="text-[10px] text-[#bbb] text-center lg:text-left font-inter">
        Información nutricional basada en USDA FoodData Central e INTA Chile. Valores aproximados por 100 g de porción comestible.
      </p>
    </div>
  ) : (
    <div className="flex items-center justify-center py-8">
      <p className="text-[#999] text-sm font-inter">
        {product.descripcion || "Información nutricional próximamente."}
      </p>
    </div>
  );

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal — móvil: sheet vertical | desktop: tarjeta horizontal */}
      <div
        ref={modalRef}
        className="relative bg-white w-full rounded-t-3xl lg:rounded-3xl lg:max-w-4xl lg:mx-6 max-h-[92vh] overflow-y-auto shadow-2xl animate-slideUp"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur border border-[#e5e5e5] flex items-center justify-center text-[#666] hover:text-[#1A1A1A] hover:border-[#3AAA35] transition-colors"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Layout horizontal en desktop */}
        <div className="flex flex-col lg:flex-row lg:gap-8 p-6 lg:p-8">
          {/* Izquierda: producto */}
          <div className="lg:w-[280px] shrink-0">
            {productPanel}
          </div>

          {/* Separador desktop */}
          <div className="hidden lg:block w-px bg-[#e5e5e5] self-stretch" />

          {/* Separador móvil */}
          <div className="lg:hidden border-t border-[#e5e5e5] my-5" />

          {/* Derecha: nutrición */}
          <div className="flex-1 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
            {nutritionPanel}
          </div>
        </div>

        {/* Footer móvil: botón agregar (solo en móvil) */}
        <div className="lg:hidden sticky bottom-0 bg-white border-t border-[#e5e5e5] px-6 py-4">
          {enCarrito ? (
            <button
              onClick={handleRemove}
              className="w-full py-3 rounded-full font-nunito font-black text-sm bg-[#3AAA35] text-white hover:bg-red-400 transition-colors"
            >
              ✓ En tu carrito — quitar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
                >−</button>
                <span className="font-nunito font-black text-[#1A1A1A] w-6 text-center">{cantidad}</span>
                <button
                  onClick={() => setCantidad((c) => c + 1)}
                  className="w-9 h-9 rounded-full border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black flex items-center justify-center transition-colors"
                >+</button>
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
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.25s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ccc;
        }
      `}</style>
    </div>
  );
}

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
