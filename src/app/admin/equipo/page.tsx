"use client";

import { useEffect, useState } from "react";

interface Repartidor {
  id:            string;
  nombre:        string;
  telefono:      string;
  pin_acceso:    string;
  activo:        boolean;
  zona_asignada: string;
}

const EMPTY: Omit<Repartidor, "id"> = { nombre: "", telefono: "", pin_acceso: "", activo: true, zona_asignada: "" };

export default function AdminEquipoPage() {
  const [lista,     setLista]     = useState<Repartidor[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [pinVisible, setPinVisible] = useState<Record<string, boolean>>({});

  async function fetchLista() {
    setLoading(true);
    const r = await fetch("/api/admin/equipo");
    setLista(await r.json());
    setLoading(false);
  }

  useEffect(() => { fetchLista(); }, []);

  async function guardar() {
    setGuardando(true);
    if (editId) {
      await fetch("/api/admin/equipo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...form }),
      });
    } else {
      await fetch("/api/admin/equipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(EMPTY);
    setEditId(null);
    setShowForm(false);
    await fetchLista();
    setGuardando(false);
  }

  async function toggleActivo(rep: Repartidor) {
    await fetch("/api/admin/equipo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rep.id, activo: !rep.activo }),
    });
    fetchLista();
  }

  function editar(rep: Repartidor) {
    setForm({ nombre: rep.nombre, telefono: rep.telefono, pin_acceso: rep.pin_acceso, activo: rep.activo, zona_asignada: rep.zona_asignada });
    setEditId(rep.id);
    setShowForm(true);
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">👥 Equipo</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Gestiona los repartidores y sus accesos</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}
          className="bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          + Agregar
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border-2 border-[#3AAA35]/30">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-lg mb-4">
            {editId ? "Editar repartidor" : "Nuevo repartidor"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "nombre",        label: "Nombre completo",  placeholder: "Juan Pérez"           },
              { key: "telefono",      label: "Teléfono",         placeholder: "+56 9 1234 5678"      },
              { key: "pin_acceso",    label: "PIN (4 dígitos)",  placeholder: "1234"                 },
              { key: "zona_asignada", label: "Zona asignada",    placeholder: "Concón Norte"         },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-nunito font-black text-[#1A1A1A] text-xs">{label}</label>
                <input
                  type="text"
                  value={(form as unknown as Record<string, string>)[key]}
                  placeholder={placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm text-[#1A1A1A]"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={guardar}
              disabled={guardando || !form.nombre || !form.pin_acceso}
              className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              {guardando ? "Guardando…" : editId ? "Actualizar" : "Crear repartidor"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-[#999] font-nunito font-black px-5 py-2.5 rounded-full text-sm border border-[#e5e5e5] hover:border-[#ccc] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#bbb] font-nunito">Cargando…</div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">👷</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin repartidores</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((rep) => (
            <div key={rep.id} className={`bg-white rounded-3xl shadow-sm p-5 flex items-center gap-4 ${!rep.activo ? "opacity-50" : ""}`}>
              <div className="w-12 h-12 rounded-full bg-[#3AAA35]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🚗</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-nunito font-black text-[#1A1A1A]">{rep.nombre}</p>
                  <span className={`text-[10px] font-nunito font-black px-2 py-0.5 rounded-full ${rep.activo ? "bg-[#3AAA35]/10 text-[#2A7A26]" : "bg-red-50 text-red-400"}`}>
                    {rep.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-[#999] text-xs font-nunito">{rep.telefono} · {rep.zona_asignada || "Sin zona"}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[#bbb] text-xs font-nunito">PIN:</span>
                  <span className="font-nunito font-black text-xs text-[#1A1A1A] tracking-widest">
                    {pinVisible[rep.id] ? rep.pin_acceso : "••••"}
                  </span>
                  <button
                    onClick={() => setPinVisible((v) => ({ ...v, [rep.id]: !v[rep.id] }))}
                    className="text-[#bbb] text-[10px] hover:text-[#666] transition-colors"
                  >
                    {pinVisible[rep.id] ? "ocultar" : "ver"}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => editar(rep)}
                  className="text-xs font-nunito font-black px-3 py-1.5 rounded-full border border-[#e5e5e5] hover:border-[#3AAA35]/40 text-[#666] transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => toggleActivo(rep)}
                  className={`text-xs font-nunito font-black px-3 py-1.5 rounded-full border transition-colors ${
                    rep.activo
                      ? "border-red-200 text-red-400 hover:bg-red-50"
                      : "border-[#3AAA35]/30 text-[#3AAA35] hover:bg-[#3AAA35]/10"
                  }`}
                >
                  {rep.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
