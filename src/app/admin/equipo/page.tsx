"use client";

import { useEffect, useState } from "react";

interface Miembro {
  id:            string;
  nombre:        string;
  telefono:      string;
  pin_acceso:    string;
  activo:        boolean;
  zona_asignada: string;
  rol:           string;
}

const ROLES = ["Repartidor", "Encargado"];
const ROL_ICON: Record<string, string> = { Repartidor: "🚗", Encargado: "📋" };
const ROL_COLOR: Record<string, string> = {
  Repartidor: "bg-blue-50 text-blue-600",
  Encargado:  "bg-orange-50 text-orange-600",
};

const EMPTY: Omit<Miembro, "id"> = {
  nombre: "", telefono: "", pin_acceso: "", activo: true, zona_asignada: "", rol: "Repartidor",
};

export default function AdminEquipoPage() {
  const [lista,      setLista]      = useState<Miembro[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [pinVisible, setPinVisible] = useState<Record<string, boolean>>({});
  const [filtroRol,  setFiltroRol]  = useState("Todos");

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

  async function toggleActivo(m: Miembro) {
    await fetch("/api/admin/equipo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, activo: !m.activo }),
    });
    fetchLista();
  }

  function editar(m: Miembro) {
    setForm({
      nombre: m.nombre, telefono: m.telefono, pin_acceso: m.pin_acceso,
      activo: m.activo, zona_asignada: m.zona_asignada, rol: m.rol || "Repartidor",
    });
    setEditId(m.id);
    setShowForm(true);
  }

  const filtrados = filtroRol === "Todos" ? lista : lista.filter((m) => m.rol === filtroRol);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-3xl">👥 Equipo</h1>
          <p className="text-[#999] font-nunito text-sm mt-1">Gestiona repartidores y encargados</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}
          className="bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          + Agregar
        </button>
      </div>

      {/* Filtro por rol */}
      <div className="flex gap-2 mb-4">
        {["Todos", ...ROLES].map((r) => (
          <button
            key={r}
            onClick={() => setFiltroRol(r)}
            className={`px-3 py-1.5 rounded-full font-nunito font-black text-xs transition-all ${
              filtroRol === r
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#f9fafb] text-[#999] border border-[#e5e5e5] hover:border-[#ccc]"
            }`}
          >
            {r === "Todos" ? "👥 Todos" : `${ROL_ICON[r]} ${r}`}
          </button>
        ))}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border-2 border-[#3AAA35]/30">
          <h2 className="font-nunito font-black text-[#1A1A1A] text-lg mb-4">
            {editId ? "Editar miembro" : "Nuevo miembro"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-nunito font-black text-[#1A1A1A] text-xs">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                className="px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROL_ICON[r]} {r}</option>)}
              </select>
            </div>
            {[
              { key: "nombre",        label: "Nombre completo",  placeholder: "Juan Pérez"           },
              { key: "telefono",      label: "Teléfono",         placeholder: "+56 9 1234 5678"      },
              { key: "pin_acceso",    label: "PIN de acceso",    placeholder: "1234"                 },
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
            {form.rol === "Repartidor" && (
              <div className="flex flex-col gap-1">
                <label className="font-nunito font-black text-[#1A1A1A] text-xs">Zona asignada</label>
                <input
                  type="text"
                  value={form.zona_asignada}
                  placeholder="Concón Norte"
                  onChange={(e) => setForm((f) => ({ ...f, zona_asignada: e.target.value }))}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm text-[#1A1A1A]"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={guardar}
              disabled={guardando || !form.nombre || !form.pin_acceso}
              className="bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-50 text-white font-nunito font-black px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              {guardando ? "Guardando…" : editId ? "Actualizar" : "Crear miembro"}
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
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">👷</p>
          <p className="font-nunito font-black text-[#1A1A1A] text-lg">Sin miembros</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrados.map((m) => (
            <div key={m.id} className={`bg-white rounded-3xl shadow-sm p-5 flex items-center gap-4 ${!m.activo ? "opacity-50" : ""}`}>
              <div className="w-12 h-12 rounded-full bg-[#3AAA35]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{ROL_ICON[m.rol] ?? "👤"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-nunito font-black text-[#1A1A1A]">{m.nombre}</p>
                  <span className={`text-[10px] font-nunito font-black px-2 py-0.5 rounded-full ${ROL_COLOR[m.rol] ?? "bg-gray-50 text-gray-500"}`}>
                    {m.rol || "Repartidor"}
                  </span>
                  <span className={`text-[10px] font-nunito font-black px-2 py-0.5 rounded-full ${m.activo ? "bg-[#3AAA35]/10 text-[#2A7A26]" : "bg-red-50 text-red-400"}`}>
                    {m.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-[#999] text-xs font-nunito">
                  {m.telefono}{m.zona_asignada ? ` · ${m.zona_asignada}` : ""}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[#bbb] text-xs font-nunito">PIN:</span>
                  <span className="font-nunito font-black text-xs text-[#1A1A1A] tracking-widest">
                    {pinVisible[m.id] ? m.pin_acceso : "••••"}
                  </span>
                  <button
                    onClick={() => setPinVisible((v) => ({ ...v, [m.id]: !v[m.id] }))}
                    className="text-[#bbb] text-[10px] hover:text-[#666] transition-colors"
                  >
                    {pinVisible[m.id] ? "ocultar" : "ver"}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => editar(m)}
                  className="text-xs font-nunito font-black px-3 py-1.5 rounded-full border border-[#e5e5e5] hover:border-[#3AAA35]/40 text-[#666] transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => toggleActivo(m)}
                  className={`text-xs font-nunito font-black px-3 py-1.5 rounded-full border transition-colors ${
                    m.activo
                      ? "border-red-200 text-red-400 hover:bg-red-50"
                      : "border-[#3AAA35]/30 text-[#3AAA35] hover:bg-[#3AAA35]/10"
                  }`}
                >
                  {m.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
