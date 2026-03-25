"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56912345678";

const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME    ?? "Banco Estado";
const BANK_HOLDER  = process.env.NEXT_PUBLIC_BANK_HOLDER  ?? "Frescon SpA";
const BANK_RUT     = process.env.NEXT_PUBLIC_BANK_RUT     ?? "76.123.456-7";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "000-000000-00";
const BANK_EMAIL   = process.env.NEXT_PUBLIC_BANK_EMAIL   ?? "pagos@frescon.cl";

const unidadLabel: Record<string, string> = {
  kg: "kg", unidad: "c/u", litro: "lt", atado: "atado", docena: "doc",
};

/** Devuelve los próximos N jueves desde hoy */
function getProximosJueves(n = 4): Date[] {
  const jueves: Date[] = [];
  const hoy = new Date();
  const d = new Date(hoy);
  // Avanzar hasta el próximo jueves (4 = Thursday)
  d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7));
  for (let i = 0; i < n; i++) {
    jueves.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return jueves;
}

function formatJueves(d: Date): string {
  return d.toLocaleDateString("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

const DELIVERY_MINIMO = 20000;
const DELIVERY_COSTO  = 3000;
const CODIGOS_DESCUENTO: Record<string, number> = { FRESCON10: 10, AMAMOSACELIA: 5 };

export default function CheckoutForm() {
  const { items, total, clearCart, cajaDescuento, setCajaDescuento } = useCartStore();
  const router      = useRouter();
  const totalValue  = total();

  const jueves = useMemo(() => getProximosJueves(4), []);

  const [nombre,    setNombre]    = useState("");
  const [email,     setEmail]     = useState("");
  const [telefono,  setTelefono]  = useState("");
  const [calle,     setCalle]     = useState("");
  const [numeroDpto, setNumeroDpto] = useState("");
  const [ciudad,    setCiudad]    = useState("Concón");
  const [detalleEntrega, setDetalleEntrega] = useState("");
  const [notas,     setNotas]     = useState("");
  const [fecha,     setFecha]     = useState<Date | null>(null);
  const [pagado,      setPagado]      = useState(false);
  const [suscripcion, setSuscripcion] = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [enviando,  setEnviando]  = useState(false);
  const [codigo,    setCodigo]    = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState<string | null>(null);
  const [codigoError,    setCodigoError]    = useState("");
  const [codigoRef,      setCodigoRef]      = useState("");
  const [refAplicado,    setRefAplicado]    = useState<{ codigo: string; mensaje: string } | null>(null);
  const [refError,       setRefError]       = useState("");
  const [telPendiente,   setTelPendiente]   = useState("");
  const [pendienteAplicado, setPendienteAplicado] = useState(0);
  const [pendienteError,    setPendienteError]    = useState("");
  const [bankCopiado,  setBankCopiado]  = useState(false);

  const copiarDatosBancarios = useCallback(() => {
    const texto = `Banco: ${BANK_NAME}\nTitular: ${BANK_HOLDER}\nRUT: ${BANK_RUT}\nCuenta: ${BANK_ACCOUNT}\nEmail: ${BANK_EMAIL}`;
    navigator.clipboard.writeText(texto);
    setBankCopiado(true);
    setTimeout(() => setBankCopiado(false), 2000);
  }, []);

  const pctDescuento   = cajaDescuento > 0 ? cajaDescuento : (codigoAplicado ? (CODIGOS_DESCUENTO[codigoAplicado] ?? 0) : 0) + (refAplicado ? 5 : 0) + pendienteAplicado;
  const montoDescuento = Math.round(totalValue * pctDescuento / 100);
  const subtotalConDesc = totalValue - montoDescuento;
  const costoDelivery  = subtotalConDesc >= DELIVERY_MINIMO ? 0 : DELIVERY_COSTO;
  const totalFinal     = subtotalConDesc + costoDelivery;

  function aplicarCodigo() {
    const upper = codigo.trim().toUpperCase();
    if (CODIGOS_DESCUENTO[upper] !== undefined) {
      setCodigoAplicado(upper);
      setCodigoError("");
    } else {
      setCodigoAplicado(null);
      setCodigoError("Código inválido");
    }
  }

  function quitarCodigo() {
    setCodigoAplicado(null);
    setCodigo("");
    setCodigoError("");
  }

  async function aplicarRef() {
    const res = await fetch("/api/referidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: codigoRef }),
    });
    const data = await res.json();
    if (data.valido) {
      setRefAplicado({ codigo: codigoRef, mensaje: data.mensaje });
      setRefError("");
    } else {
      setRefError(data.error ?? "Código inválido");
    }
  }

  async function canjearPendiente() {
    if (!telPendiente.trim()) return;
    const res = await fetch("/api/referidos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono: telPendiente }),
    });
    const data = await res.json();
    if (data.descuento > 0) {
      setPendienteAplicado(data.descuento);
      setPendienteError("");
    } else {
      setPendienteAplicado(0);
      setPendienteError("No tienes descuento acumulado por referidos");
    }
  }

  // Si el carrito está vacío redirige al home
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">🛒</span>
        <p className="font-nunito font-black text-[#1A1A1A] text-2xl">Tu pedido está vacío</p>
        <p className="text-[#999]">Agrega productos antes de confirmar.</p>
        <Link href="/" className="mt-2 bg-[#3AAA35] hover:bg-[#2A7A26] text-white font-nunito font-black px-8 py-3 rounded-full transition-colors">
          Ver productos
        </Link>
      </div>
    );
  }

  // Componer dirección completa
  const direccion = [calle, numeroDpto, ciudad].filter(Boolean).join(", ");

  function validate() {
    const e: Record<string, string> = {};
    if (!nombre.trim())    e.nombre    = "Ingresa tu nombre";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Ingresa un correo válido";
    if (!telefono.trim())  e.telefono  = "Ingresa tu teléfono";
    if (!calle.trim())     e.calle     = "Ingresa tu calle";
    if (!ciudad.trim())    e.ciudad    = "Selecciona tu ciudad";
    else if (!/conc[oó]n|re[nñ]aca|jard[ií]n del mar/i.test(ciudad)) e.ciudad = "Solo hacemos delivery en Concón, Reñaca y Jardín del Mar.";
    if (!fecha)            e.fecha     = "Elige un jueves de entrega";
    if (!pagado)           e.pagado    = "Confirma que realizaste la transferencia";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildWhatsApp() {
    const lineas = items
      .map(({ product: p, cantidad }) =>
        `• ${cantidad}x ${p.nombre} (${unidadLabel[p.unidad]}) — $${(p.precio * cantidad).toLocaleString("es-CL")}`
      )
      .join("%0A");

    const fechaStr = fecha ? formatJueves(fecha) : "";

    const descuentoLine = montoDescuento > 0
      ? `🎟️ Descuento ${pctDescuento}% (${codigoAplicado}): -$${montoDescuento.toLocaleString("es-CL")}%0A`
      : "";
    const delivery = costoDelivery > 0
      ? `📦 Envío: $${costoDelivery.toLocaleString("es-CL")}%0A`
      : `📦 Envío: *Gratis* ✅%0A`;

    const msg =
      `Hola Frescon! 🌿%0A%0A` +
      `*Mi pedido:*%0A${lineas}%0A%0A` +
      descuentoLine +
      delivery +
      `*Total: $${totalFinal.toLocaleString("es-CL")}*%0A%0A` +
      `*Datos de entrega:*%0A` +
      `👤 ${nombre}%0A` +
      `📱 ${telefono}%0A` +
      `📧 ${email}%0A` +
      `📍 ${calle}${numeroDpto ? `, ${numeroDpto}` : ""}, ${ciudad}%0A` +
      `📅 Jueves: ${fechaStr}` +
      (detalleEntrega ? `%0A🏠 ${detalleEntrega}` : "") +
      (notas ? `%0A📝 ${notas}` : "") +
      `%0A%0AAdjunto comprobante de transferencia.`;

    return `https://wa.me/${WHATSAPP}?text=${msg}`;
  }

  async function handleConfirmar() {
    if (!validate()) return;
    setEnviando(true);

    const detalle = items
      .map(({ product: p, cantidad }) =>
        `${cantidad}x ${p.nombre} (${unidadLabel[p.unidad]}) — $${(p.precio * cantidad).toLocaleString("es-CL")}`
      )
      .join("\n");

    try {
      await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_cliente: nombre,
          email,
          telefono,
          direccion,
          fecha_entrega: `${fecha!.getFullYear()}-${String(fecha!.getMonth() + 1).padStart(2, "0")}-${String(fecha!.getDate()).padStart(2, "0")}`,
          notas: [detalleEntrega, notas].filter(Boolean).join(" | "),
          total: totalFinal,
          detalle_pedido: detalle,
          suscripcion_activa: suscripcion,
          referido_por: refAplicado?.codigo ?? "",
        }),
      });
    } catch {
      // Si falla Airtable igual continuamos — el WhatsApp es el respaldo
    }

    const waUrl = buildWhatsApp();

    // Guardar datos para la página de confirmación
    sessionStorage.setItem("frescon_pedido_confirmado", JSON.stringify({
      nombre,
      email,
      telefono,
      calle,
      numeroDpto,
      ciudad,
      direccion,
      detalleEntrega,
      fecha: fecha ? formatJueves(fecha) : "",
      total: totalFinal,
      items: items.map(({ product: p, cantidad }) => ({
        nombre:   p.nombre,
        cantidad,
        unidad:   p.unidad,
        precio:   p.precio,
        imagen:   p.imagen,
      })),
      waUrl,
    }));

    clearCart();
    router.push("/confirmacion");
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">

      {/* Header */}
      <div className="bg-[#2A7A26] px-9 md:px-[4.5rem] py-5 flex items-center justify-between">
        <Link href="/">
          <Image src="/images/Logo.png" alt="Frescon" width={140} height={60} className="object-contain" />
        </Link>
        <Link href="/" className="text-white/70 hover:text-white font-nunito text-sm transition-colors flex items-center gap-1.5">
          <ArrowLeftIcon />
          Volver al catálogo
        </Link>
      </div>

      {/* Page title */}
      <div className="bg-white border-b border-[#f0f0f0] px-9 md:px-[4.5rem] py-10">
        <div className="max-w-5xl mx-auto">
          <span className="font-pacifico text-[#F9C514] text-xl">Frescon</span>
          <h1 className="font-nunito font-black text-[#1A1A1A] text-4xl md:text-5xl leading-tight mt-1">
            COMPLETA TU <span className="text-[#3AAA35]">PEDIDO</span>
          </h1>
          <p className="text-[#666] mt-2">
            Ingresa tus datos, elige tu jueves y confirma el pago por transferencia.
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-9 md:px-[4.5rem] py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* ── Columna izquierda: formulario ── */}
        <div className="flex flex-col gap-6">

          {/* Tus datos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="font-nunito font-black text-[#1A1A1A] text-lg mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#3AAA35] text-white text-xs font-black flex items-center justify-center">1</span>
              Tus datos
            </h2>

            <div className="flex flex-col gap-4">
              <Field label="Nombre completo" error={errors.nombre}>
                <input
                  type="text"
                  placeholder="María González"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={inputClass(!!errors.nombre)}
                />
              </Field>

              <Field label="Correo electrónico" error={errors.email}>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass(!!errors.email)}
                />
                <p className="text-[#999] text-xs mt-1 font-nunito">📧 Recibirás la confirmación de tu pedido aquí</p>
              </Field>

              <Field label="Teléfono" error={errors.telefono}>
                <input
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={inputClass(!!errors.telefono)}
                />
              </Field>

              {/* Dirección desglosada */}
              <Field label="Calle y número" error={errors.calle}>
                <input
                  type="text"
                  placeholder="Ej: Av. Las Dunas 123"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  className={inputClass(!!errors.calle)}
                />
              </Field>

              <Field label="Depto / casa / oficina (opcional)">
                <input
                  type="text"
                  placeholder="Ej: Depto 304, Torre B"
                  value={numeroDpto}
                  onChange={(e) => setNumeroDpto(e.target.value)}
                  className={inputClass(false)}
                />
              </Field>

              <Field label="Ciudad" error={errors.ciudad}>
                <select
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className={inputClass(!!errors.ciudad)}
                >
                  <option value="Concón">Concón</option>
                  <option value="Reñaca">Reñaca</option>
                  <option value="Jardín del Mar">Jardín del Mar</option>
                </select>
                <p className="text-[#999] text-xs mt-1 font-nunito">📍 Solo entregamos en Concón, Reñaca y Jardín del Mar</p>
              </Field>

              <Field label="Detalle de entrega (opcional)">
                <input
                  type="text"
                  placeholder="Ej: Portón verde, tocar timbre 3, dejar con conserje..."
                  value={detalleEntrega}
                  onChange={(e) => setDetalleEntrega(e.target.value)}
                  className={inputClass(false)}
                />
              </Field>

              <Field label="Notas adicionales (opcional)">
                <textarea
                  rows={2}
                  placeholder="Algún comentario sobre tu pedido..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className={`${inputClass(false)} resize-none`}
                />
              </Field>
            </div>
          </div>

          {/* Fecha de entrega */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="font-nunito font-black text-[#1A1A1A] text-lg mb-2 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#3AAA35] text-white text-xs font-black flex items-center justify-center">2</span>
              Elige tu jueves
            </h2>
            <p className="text-[#999] text-xs mb-5">Hacemos delivery todos los jueves.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {jueves.map((d) => {
                const selected = fecha?.toDateString() === d.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setFecha(d); setErrors((e) => ({ ...e, fecha: "" })); }}
                    className={`flex flex-col items-center gap-0.5 py-4 px-2 rounded-2xl border-2 font-nunito transition-all ${
                      selected
                        ? "border-[#3AAA35] bg-[#3AAA35]/8 text-[#1A1A1A]"
                        : "border-[#e5e5e5] hover:border-[#3AAA35]/40 text-[#666]"
                    }`}
                  >
                    <span className="text-2xl">📅</span>
                    <span className="font-black text-xs text-center leading-tight mt-1">Jueves</span>
                    <span className="font-black text-sm text-[#3AAA35]">{formatShort(d)}</span>
                  </button>
                );
              })}
            </div>
            {errors.fecha && <p className="text-red-400 text-xs mt-2">{errors.fecha}</p>}
          </div>

          {/* Pago por transferencia */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="font-nunito font-black text-[#1A1A1A] text-lg mb-2 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#3AAA35] text-white text-xs font-black flex items-center justify-center">3</span>
              Pago por transferencia
            </h2>
            <p className="text-[#999] text-xs mb-5">Realiza la transferencia ahora y adjunta el comprobante al confirmar.</p>

            {/* Datos bancarios */}
            <div className="bg-[#f9fafb] rounded-2xl p-4 flex flex-col gap-2 mb-5">
              <BankRow label="Banco"    value={BANK_NAME}    />
              <BankRow label="Titular"  value={BANK_HOLDER}  />
              <BankRow label="RUT"      value={BANK_RUT}     />
              <BankRow label="Cuenta"   value={BANK_ACCOUNT} />
              <BankRow label="Email"    value={BANK_EMAIL}   />
              <button
                type="button"
                onClick={copiarDatosBancarios}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#e5e5e5] hover:border-[#3AAA35] hover:bg-[#3AAA35]/5 text-[#666] hover:text-[#3AAA35] font-nunito font-black text-xs transition-all"
              >
                {bankCopiado ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Datos copiados
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    Copiar datos bancarios
                  </>
                )}
              </button>
            </div>

            {/* Código de descuento */}
            {cajaDescuento > 0 ? (
              <div className="mb-5 bg-[#F9C514]/15 border border-[#F9C514]/30 rounded-2xl px-4 py-3">
                <p className="font-nunito font-black text-[#1A1A1A] text-sm">🎁 Descuento de caja aplicado: {cajaDescuento}%</p>
                <p className="font-nunito text-[#666] text-xs mt-1">Las cajas ya incluyen descuento. No se combinan con codigos ni referidos.</p>
              </div>
            ) : (
            <div className="mb-5">
              <p className="font-nunito font-black text-[#1A1A1A] text-xs mb-2">🎟️ ¿Tienes un código de descuento?</p>
              {codigoAplicado ? (
                <div className="flex items-center justify-between bg-[#3AAA35]/10 border border-[#3AAA35]/30 rounded-2xl px-4 py-2.5">
                  <span className="font-nunito font-black text-[#3AAA35] text-sm">✓ {codigoAplicado} — {pctDescuento}% off</span>
                  <button onClick={quitarCodigo} className="text-[#999] hover:text-red-400 text-xs font-nunito transition-colors">Quitar</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: DESCUENTO"
                    value={codigo}
                    onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setCodigoError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && aplicarCodigo()}
                    className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] focus:border-[#3AAA35] focus:outline-none font-nunito text-sm text-[#1A1A1A] placeholder-[#bbb]"
                  />
                  <button
                    onClick={aplicarCodigo}
                    className="bg-[#1A1A1A] hover:bg-[#333] text-white font-nunito font-black text-xs px-4 py-2.5 rounded-2xl transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              )}
              {codigoError && <p className="text-red-400 text-xs mt-1.5">{codigoError}</p>}

              {/* Código de referido */}
              <div className="flex gap-2 mt-2">
                <input
                  value={codigoRef}
                  onChange={(e) => { setCodigoRef(e.target.value.toUpperCase()); setRefError(""); }}
                  placeholder="¿Tienes código de amigo? FRESC-XXX-0000"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e5e5e5] font-nunito text-xs text-[#1A1A1A] placeholder-[#bbb] focus:border-[#3AAA35] focus:outline-none"
                  disabled={!!refAplicado}
                />
                <button
                  type="button"
                  onClick={aplicarRef}
                  disabled={!!refAplicado || !codigoRef.trim()}
                  className="px-3 py-2 rounded-xl bg-[#f0f0f0] hover:bg-[#e5e5e5] disabled:opacity-40 font-nunito font-black text-xs text-[#444] transition-colors"
                >
                  {refAplicado ? "✓" : "Aplicar"}
                </button>
              </div>
              {refAplicado && <p className="font-nunito text-xs text-[#3AAA35] mt-1">{refAplicado.mensaje}</p>}
              {refError && <p className="font-nunito text-xs text-red-500 mt-1">{refError}</p>}

              {/* Descuento pendiente por referidos */}
              {pendienteAplicado > 0 ? (
                <div className="flex items-center gap-2 mt-2 bg-[#F9C514]/20 border border-[#F9C514]/40 rounded-xl px-3 py-2">
                  <span className="font-nunito font-black text-[#1A1A1A] text-xs">🎁 Descuento por referidos: {pendienteAplicado}% off</span>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="font-nunito text-[#999] text-xs mb-1.5">🎁 ¿Tienes descuento acumulado por referidos?</p>
                  <div className="flex gap-2">
                    <input
                      value={telPendiente}
                      onChange={(e) => { setTelPendiente(e.target.value); setPendienteError(""); }}
                      placeholder="Tu teléfono +56 9..."
                      className="flex-1 px-3 py-2 rounded-xl border border-[#e5e5e5] font-nunito text-xs text-[#1A1A1A] placeholder-[#bbb] focus:border-[#F9C514] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={canjearPendiente}
                      disabled={!telPendiente.trim()}
                      className="px-3 py-2 rounded-xl bg-[#F9C514] hover:bg-[#E0B010] disabled:opacity-40 font-nunito font-black text-xs text-[#1A1A1A] transition-colors"
                    >
                      Canjear
                    </button>
                  </div>
                  {pendienteError && <p className="font-nunito text-xs text-[#999] mt-1">{pendienteError}</p>}
                </div>
              )}
            </div>
            )}

            {/* Desglose envío + descuento + total */}
            <div className="bg-[#3AAA35]/8 rounded-2xl px-4 py-3 mb-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-nunito text-[#666] text-sm">Total sin descuentos</span>
                <span className="font-nunito font-black text-[#1A1A1A] text-sm">${totalValue.toLocaleString("es-CL")}</span>
              </div>
              {montoDescuento > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="font-nunito text-[#3AAA35] text-sm">🎟️ Descuento {pctDescuento}% ({codigoAplicado})</span>
                  <span className="font-nunito font-black text-[#3AAA35] text-sm">-${montoDescuento.toLocaleString("es-CL")}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-nunito text-[#999] text-sm">Descuentos</span>
                  <span className="font-nunito text-[#999] text-sm">—</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-nunito text-[#666] text-sm">📦 Pago por envío</span>
                {costoDelivery === 0 ? (
                  <span className="font-nunito font-black text-[#3AAA35] text-sm flex items-center gap-1">
                    Gratis <span className="bg-[#3AAA35] text-white text-[10px] font-black px-2 py-0.5 rounded-full">✓</span>
                  </span>
                ) : (
                  <span className="font-nunito font-black text-[#1A1A1A] text-sm">${DELIVERY_COSTO.toLocaleString("es-CL")}</span>
                )}
              </div>
              {costoDelivery > 0 && (
                <p className="text-[#999] text-xs">Envío gratis en compras sobre ${DELIVERY_MINIMO.toLocaleString("es-CL")}</p>
              )}
              <div className="border-t border-[#3AAA35]/20 pt-2 flex items-center justify-between">
                <span className="font-nunito font-black text-[#1A1A1A]">Total a pagar</span>
                <span className="font-nunito font-black text-[#3AAA35] text-xl">${totalFinal.toLocaleString("es-CL")}</span>
              </div>
            </div>

            {/* Suscripción semanal */}
            <div
              onClick={() => setSuscripcion((s) => !s)}
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all mb-4 ${
                suscripcion
                  ? "border-[#3AAA35] bg-[#3AAA35]/5"
                  : "border-[#e5e5e5] hover:border-[#3AAA35]/40"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                suscripcion ? "border-[#3AAA35] bg-[#3AAA35]" : "border-[#ccc]"
              }`}>
                {suscripcion && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <p className="font-nunito font-black text-[#1A1A1A] text-sm">🔁 Repetir este pedido cada semana</p>
                <p className="font-nunito text-[#999] text-xs mt-0.5">
                  Recibirás los mismos productos automáticamente todos los jueves. Puedes cancelar cuando quieras.
                </p>
              </div>
            </div>

            {/* Checkbox confirmación */}
            <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-2xl border-2 transition-colors ${
              pagado ? "border-[#3AAA35] bg-[#3AAA35]/5" : errors.pagado ? "border-red-300 bg-red-50" : "border-[#e5e5e5]"
            }`}>
              <input
                type="checkbox"
                checked={pagado}
                onChange={(e) => { setPagado(e.target.checked); setErrors((er) => ({ ...er, pagado: "" })); }}
                className="mt-0.5 accent-[#3AAA35] w-4 h-4 flex-shrink-0"
              />
              <span className="font-nunito text-sm text-[#1A1A1A] leading-snug">
                Ya realicé la transferencia por <strong className="text-[#3AAA35]">${totalFinal.toLocaleString("es-CL")}</strong> y tengo el comprobante listo para adjuntar.
              </span>
            </label>
            {errors.pagado && <p className="text-red-400 text-xs mt-1.5">{errors.pagado}</p>}
          </div>
        </div>

        {/* ── Columna derecha: resumen del pedido ── */}
        <div className="lg:sticky lg:top-6 self-start flex flex-col gap-4">

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h2 className="font-nunito font-black text-[#1A1A1A] text-base mb-4">
              Tu pedido ({items.length} producto{items.length !== 1 ? "s" : ""})
            </h2>

            <div className="flex flex-col gap-2">
              {items.map(({ product: p, cantidad }) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 relative flex-shrink-0">
                    <Image src={p.imagen} alt={p.nombre} fill className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-nunito font-black text-[#1A1A1A] text-sm truncate">{p.nombre}</p>
                    <p className="text-[#999] text-xs">{cantidad} {unidadLabel[p.unidad]}</p>
                  </div>
                  <span className="font-nunito font-black text-[#3AAA35] text-sm flex-shrink-0">
                    ${(p.precio * cantidad).toLocaleString("es-CL")}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#f0f0f0] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-nunito text-[#999] text-xs">Total sin descuentos</span>
                <span className="font-nunito font-black text-[#1A1A1A] text-xs">${totalValue.toLocaleString("es-CL")}</span>
              </div>
              {montoDescuento > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-nunito text-[#3AAA35] text-xs">🎟️ Descuento {pctDescuento}%</span>
                  <span className="font-nunito font-black text-[#3AAA35] text-xs">-${montoDescuento.toLocaleString("es-CL")}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-nunito text-[#999] text-xs">📦 Pago por envío</span>
                <span className={`font-nunito font-black text-xs ${costoDelivery === 0 ? "text-[#3AAA35]" : "text-[#1A1A1A]"}`}>
                  {costoDelivery === 0 ? "Gratis" : `$${DELIVERY_COSTO.toLocaleString("es-CL")}`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-[#f0f0f0] mt-0.5">
                <span className="font-nunito font-black text-[#1A1A1A]">Total a pagar</span>
                <span className="font-nunito font-black text-[#3AAA35] text-xl">${totalFinal.toLocaleString("es-CL")}</span>
              </div>
            </div>

            {fecha && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#666] font-nunito">
                <span>📅</span>
                <span>Entrega el <strong>{formatJueves(fecha)}</strong></span>
              </div>
            )}
          </div>

          {/* Botón confirmar */}
          <button
            onClick={handleConfirmar}
            disabled={enviando}
            className="w-full bg-[#3AAA35] hover:bg-[#2A7A26] disabled:opacity-60 text-white font-nunito font-black py-4 rounded-full transition-colors text-base flex items-center justify-center gap-2 shadow-md"
          >
            <WhatsAppIcon />
            {enviando ? "Guardando pedido..." : "Confirmar pedido por WhatsApp"}
          </button>

          <p className="text-center text-[#bbb] text-xs font-nunito">
            Se abrirá WhatsApp con tu pedido y datos.<br />Adjunta el comprobante de pago en la conversación.
          </p>
        </div>

      </div>
    </div>
  );
}

/* ── Subcomponentes ── */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-nunito font-black text-[#1A1A1A] text-xs">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#999] text-xs font-nunito">{label}</span>
      <span className="font-nunito font-black text-[#1A1A1A] text-sm">{value}</span>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-3 rounded-2xl border-2 font-nunito text-[#1A1A1A] text-sm placeholder-[#bbb] focus:outline-none transition-colors ${
    hasError
      ? "border-red-300 focus:border-red-400 bg-red-50"
      : "border-[#e5e5e5] focus:border-[#3AAA35] bg-white"
  }`;
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
