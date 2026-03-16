"use client";

import Image from "next/image";
import Navbar from "@/components/layout/Navbar";

export default function Hero() {

  return (
    <section className="relative min-h-screen overflow-x-hidden flex flex-col">

      {/* Fondo hero */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/fondohero.png"
          alt="Fondo Frescon"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay oscuro leve para legibilidad */}
        <div className="absolute inset-0 bg-[#1A5C18]/40" />
      </div>

      <Navbar transparent />

      {/* ── MÓVIL ── imagen de fondo + texto y botones al frente */}
      <div className="relative z-10 flex-1 flex flex-col md:hidden">
        {/* Imagen de fondo semitransparente — pegada a la derecha */}
        <div className="absolute inset-0 flex items-end justify-end">
          <Image
            src="/images/hero-main.png"
            alt="Frescon"
            width={440}
            height={638}
            className="object-contain object-bottom w-[88%] opacity-30"
            priority
          />
        </div>

        {/* Contenido al frente */}
        <div className="relative z-10 flex flex-col justify-between flex-1 px-7 pt-4 pb-0">
          <h1 className="font-nunito font-black text-white text-2xl leading-tight drop-shadow-lg max-w-[60%]">
            Lo más fresco directo a tu puerta
          </h1>

          <div className="flex flex-col gap-2.5 pb-40">
            <a
              href="#catalogo"
              className="bg-[#F9C514] text-[#1A1A1A] font-nunito font-black text-base px-8 py-3 rounded-full text-center"
            >
              Ver productos
            </a>
            <a
              href="#como-funciona"
              className="border-2 border-white text-white font-nunito font-bold text-base px-8 py-3 rounded-full text-center"
            >
              ¿Cómo funciona?
            </a>
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── layout dos columnas */}
      <div className="relative z-10 flex-1 hidden md:flex flex-row items-center">
        {/* Columna izquierda — texto centrado verticalmente */}
        <div className="flex-1 px-[4.5rem] text-left relative z-10">
          <h1 className="font-nunito font-black text-white text-6xl leading-tight mb-4 drop-shadow-lg">
            Lo más fresco,{" "}
            <span className="text-[#F9C514]">directo a tu puerta</span>
          </h1>
          <p className="text-white/90 text-lg mb-3 drop-shadow">
            Verduras y frutas de temporada, seleccionadas con cariño.<br />
            <span className="text-[#F9C514] font-semibold">Delivery todos los jueves.</span>
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {["🌿 Sin intermediarios", "📦 Delivery jueves", "🥦 Temporada"].map((badge) => (
              <span key={badge} className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/25">
                {badge}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <a href="#catalogo" className="bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] font-nunito font-black text-base px-8 py-4 rounded-full transition-colors">
              Ver productos
            </a>
            <a href="#como-funciona" className="border-2 border-white/50 hover:border-white text-white font-nunito font-bold text-base px-8 py-4 rounded-full transition-colors backdrop-blur-sm">
              ¿Cómo funciona?
            </a>
          </div>
        </div>

        {/* Columna derecha — imagen sobredimensionada para que las verduras desborden arriba */}
        <div className="relative w-[600px] flex-shrink-0 self-stretch overflow-visible">
          <Image
            src="/images/hero-main.png"
            alt="Frescon app y verduras frescas"
            width={541}
            height={779}
            className="absolute bottom-0 right-0 w-[541px] max-w-none object-contain object-right-bottom z-0"
            priority
          />
        </div>
      </div>

    </section>
  );
}

