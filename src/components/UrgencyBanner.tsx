"use client";

import { useState, useEffect } from "react";

/** Retorna el proximo miercoles a las 23:59:59 */
function getProximoCierre(): Date {
  const ahora = new Date();
  const dia = ahora.getDay(); // 0=dom, 1=lun, ..., 3=mie
  let diasHasta: number;

  if (dia <= 3) {
    // Dom(0)-Mie(3): contar hasta este miercoles
    diasHasta = 3 - dia;
  } else {
    // Jue(4)-Sab(6): contar hasta el proximo miercoles
    diasHasta = 3 + (7 - dia);
  }

  const cierre = new Date(ahora);
  cierre.setDate(cierre.getDate() + diasHasta);
  cierre.setHours(23, 59, 59, 999);
  return cierre;
}

function calcularTiempo(cierre: Date) {
  const diff = cierre.getTime() - Date.now();
  if (diff <= 0) return null;

  const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins  = Math.floor((diff / (1000 * 60)) % 60);
  const segs  = Math.floor((diff / 1000) % 60);

  return { dias, horas, mins, segs };
}

function esDiaDeOrden(): boolean {
  const dia = new Date().getDay();
  // Lun(1), Mar(2), Mie(3) = ventana de pedidos
  return dia >= 1 && dia <= 3;
}

export default function UrgencyBanner() {
  const [cierre] = useState(() => getProximoCierre());
  const [tiempo, setTiempo] = useState(calcularTiempo(cierre));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(esDiaDeOrden());
    if (!esDiaDeOrden()) return;

    const timer = setInterval(() => {
      const t = calcularTiempo(cierre);
      if (!t) {
        setVisible(false);
        clearInterval(timer);
      } else {
        setTiempo(t);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cierre]);

  if (!visible || !tiempo) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="sticky top-0 z-40 bg-[#1A1A1A] text-white">
      <div className="flex items-center justify-center gap-3 px-4 py-2.5">
        {/* Desktop: mensaje completo */}
        <p className="hidden md:block font-nunito text-sm">
          <span className="text-[#F9C514] font-black">⏰ Pedidos cierran el miercoles</span>
          <span className="text-white/70 mx-2">—</span>
          <span className="text-white/90">Tu caja fresca llega el jueves</span>
        </p>

        {/* Timer */}
        <div className="flex items-center gap-1.5">
          <span className="md:hidden font-nunito text-xs text-[#F9C514] font-black">⏰</span>
          <div className="flex items-center gap-1 font-mono text-sm font-black tracking-wider">
            {tiempo.dias > 0 && (
              <>
                <span className="bg-white/10 rounded px-1.5 py-0.5 text-[#F9C514]">{tiempo.dias}d</span>
                <span className="text-white/30">:</span>
              </>
            )}
            <span className="bg-white/10 rounded px-1.5 py-0.5">{pad(tiempo.horas)}</span>
            <span className="text-white/30 animate-pulse">:</span>
            <span className="bg-white/10 rounded px-1.5 py-0.5">{pad(tiempo.mins)}</span>
            <span className="text-white/30 animate-pulse">:</span>
            <span className="bg-white/10 rounded px-1.5 py-0.5">{pad(tiempo.segs)}</span>
          </div>
        </div>

        {/* Mobile: texto corto */}
        <p className="md:hidden font-nunito text-[11px] text-white/60">
          Cierre mie.
        </p>
      </div>
    </div>
  );
}
