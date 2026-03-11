"use client";

import { useState, useEffect } from "react";

interface Suscripcion {
  id:             string;
  nombre_cliente: string;
  telefono:       string;
  direccion:      string;
  fecha_entrega:  string;
  fecha_pedido:   string;
  total:          number;
  detalle_pedido: string;
}

export default function SuscripcionesPage() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [cargando,      setCargando]      = useState(true);
  const [cancelando,    setCancelando]    = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/suscripciones")
      .then((r) => r.json())
      .then((data) => setSuscripciones(data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  async function handleCancelar(id: string) {
    setCancelando(id);
    try {
      const res = await fetch("/api/admin/suscripciones", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSuscripciones((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelando(null);
    }
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl flex items-center gap-3">
          🔁 Suscripciones activas
          {!cargando && (
            <span className="bg-[#3AAA35] text-white font-nunito font-black text-sm px-3 py-1 rounded-full">
              {suscripciones.length}
            </span>
          )}
        </h1>
        <p className="text-[#999] font-nunito text-sm mt-1">
          Clientes que activaron entrega automática semanal.
        </p>
      </div>

      {/* Estado cargando */}
      {cargando && (
        <div className="flex items-center justify-center py-20 text-[#bbb] font-nunito text-sm">
          Cargando suscripciones...
        </div>
      )}

      {/* Estado vacío */}
      {!cargando && suscripciones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <span className="text-5xl">🌿</span>
          <p className="font-nunito font-black text-[#1A1A1A] text-xl">
            No hay suscripciones activas aún
          </p>
          <p className="text-[#999] font-nunito text-sm max-w-sm">
            Los clientes que marquen &quot;Repetir este pedido cada semana&quot; en el checkout aparecerán aquí.
          </p>
        </div>
      )}

      {/* Cards */}
      {!cargando && suscripciones.length > 0 && (
        <div className="flex flex-col gap-4">
          {suscripciones.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-[#f0f0f0] flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Info cliente */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="font-nunito font-black text-[#1A1A1A]">{s.nombre_cliente}</p>
                  <p className="font-nunito text-[#999] text-sm">{s.telefono}</p>
                </div>
                <div>
                  <p className="font-nunito text-[#666] text-sm">{s.direccion}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-nunito text-[#999] text-xs leading-relaxed line-clamp-2">
                    {s.detalle_pedido}
                  </p>
                </div>
              </div>

              {/* Total + botón cancelar */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="font-nunito font-black text-[#3AAA35] text-xl">
                    ${s.total.toLocaleString("es-CL")}
                  </p>
                  <p className="font-nunito text-[#bbb] text-xs">semanal</p>
                </div>
                <button
                  onClick={() => handleCancelar(s.id)}
                  disabled={cancelando === s.id}
                  className="flex-shrink-0 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-500 font-nunito font-black text-sm px-4 py-2.5 rounded-2xl transition-colors border border-red-100"
                >
                  {cancelando === s.id ? "..." : "❌ Cancelar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
