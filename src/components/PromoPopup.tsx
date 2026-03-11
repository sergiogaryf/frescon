"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

const PALTA_HASS: Product = {
  id:          "palta-hass-promo",
  nombre:      "Palta Chilena",
  precio:      5100,
  categoria:   "frutas",
  unidad:      "kg",
  es_estrella: true,
  stock:       10,
  origen:      "Quillota",
  descripcion: "Palta chilena cremosa y madura, la mejor de la zona.",
  imagen:      "/images/productos/PaltaHass.png",
  badges:      [],
};

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const { addItem, toggleCart } = useCartStore();

  useEffect(() => {
    // Mostrar solo una vez por sesión
    const ya = sessionStorage.getItem("promo-palta-vista");
    if (!ya) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function cerrar() {
    sessionStorage.setItem("promo-palta-vista", "1");
    setVisible(false);
  }

  function comprar() {
    addItem(PALTA_HASS);
    cerrar();
    toggleCart();
  }

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
        onClick={cerrar}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">

          {/* Botón cerrar */}
          <button
            onClick={cerrar}
            className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>

          {/* Imagen promo */}
          <Image
            src="/images/promo-palta.png"
            alt="Palta Hass Frescon"
            width={600}
            height={600}
            className="w-full object-cover"
            priority
          />

          {/* Botón comprar superpuesto abajo */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <button
              onClick={comprar}
              className="w-full bg-[#F9C514] hover:bg-[#E0B010] text-[#1A1A1A] font-nunito font-black text-lg py-4 rounded-full transition-colors shadow-lg"
            >
              🛒 Agregar al carrito — $5.100/kg
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
