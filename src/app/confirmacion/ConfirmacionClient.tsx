"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface PedidoConfirmado {
  nombre:    string;
  telefono:  string;
  direccion: string;
  fecha:     string;      // "jueves 13 de marzo"
  total:     number;
  items:     { nombre: string; cantidad: number; unidad: string; precio: number; imagen: string }[];
  waUrl:     string;
}

const unidadLabel: Record<string, string> = {
  kg: "kg", unidad: "c/u", litro: "lt", atado: "atado", docena: "doc",
};

export default function ConfirmacionClient() {
  const [pedido, setPedido] = useState<PedidoConfirmado | null>(null);
  const [abrioWA, setAbrioWA] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("frescon_pedido_confirmado");
      if (raw) setPedido(JSON.parse(raw));
    } catch {}
  }, []);

  function abrirWhatsApp() {
    if (!pedido) return;
    window.open(pedido.waUrl, "_blank");
    setAbrioWA(true);
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">🌿</span>
        <p className="font-nunito font-black text-[#1A1A1A] text-2xl">No hay pedido activo</p>
        <Link href="/" className="mt-2 bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-8 py-3 rounded-full transition-colors">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">

      {/* Header verde */}
      <div className="bg-[#2A7A26] px-6 md:px-[4.5rem] py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={120} height={52} className="object-contain" />
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Check animado */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-[#3AAA35] flex items-center justify-center mb-5 shadow-lg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <span className="font-pacifico text-[#F9C514] text-xl mb-1">¡Listo!</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-5xl leading-tight">
            PEDIDO <span className="text-[#3AAA35]">CONFIRMADO</span>
          </h1>
          <p className="text-[#666] mt-3 text-base max-w-md">
            Tu pedido fue registrado. Ahora envíanos el comprobante de transferencia por WhatsApp para coordinar la entrega.
          </p>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-5">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">Resumen de tu pedido</h2>

          <div className="flex flex-col gap-3 mb-5">
            {pedido.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image src={item.imagen} alt={item.nombre} fill className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-nunito font-black text-[#1A1A1A] text-sm truncate">{item.nombre}</p>
                  <p className="text-[#999] text-xs">{item.cantidad} {unidadLabel[item.unidad] ?? item.unidad}</p>
                </div>
                <span className="font-nunito font-black text-[#3AAA35] text-sm flex-shrink-0">
                  ${(item.precio * item.cantidad).toLocaleString("es-CL")}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#f0f0f0] pt-4 flex justify-between items-center">
            <span className="font-nunito font-black text-[#1A1A1A]">Total pagado</span>
            <span className="font-nunito font-black text-[#3AAA35] text-2xl">${pedido.total.toLocaleString("es-CL")}</span>
          </div>
        </div>

        {/* Datos de entrega */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-5">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">Datos de entrega</h2>
          <div className="flex flex-col gap-2 text-sm font-nunito">
            <div className="flex items-center gap-2 text-[#666]">
              <span>👤</span><span>{pedido.nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-[#666]">
              <span>📱</span><span>{pedido.telefono}</span>
            </div>
            <div className="flex items-start gap-2 text-[#666]">
              <span className="flex-shrink-0">📍</span><span>{pedido.direccion}</span>
            </div>
            <div className="flex items-center gap-2 text-[#1A1A1A] font-black">
              <span>📅</span><span>Entrega el {pedido.fecha}</span>
            </div>
          </div>
        </div>

        {/* Botón WhatsApp */}
        <button
          onClick={abrirWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-nunito font-black py-4 rounded-full transition-colors text-base flex items-center justify-center gap-3 shadow-md mb-4"
        >
          <WhatsAppIcon />
          Enviar comprobante por WhatsApp
        </button>

        {abrioWA && (
          <p className="text-center text-[#3AAA35] text-sm font-nunito font-black mb-4">
            ✓ WhatsApp abierto — adjunta el comprobante en la conversación
          </p>
        )}

        <Link
          href="/"
          className="w-full block text-center bg-white border-2 border-[#e5e5e5] hover:border-[#3AAA35] text-[#1A1A1A] font-nunito font-black py-3.5 rounded-full transition-colors text-sm"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
