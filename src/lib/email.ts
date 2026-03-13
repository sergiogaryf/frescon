import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM           = "Frescón <onboarding@resend.dev>";
const ADMIN_EMAIL    = "sergiogaryf@gmail.com";
const REPARTIDOR_EMAIL = process.env.REPARTIDOR_EMAIL ?? "";
const LOGO_URL       = "https://www.frescon.cl/icon.png";

/* ── Estilos reutilizables ── */
const s = {
  body:    "font-family:'Helvetica Neue',Arial,sans-serif; background:#f0f4ee; margin:0; padding:0;",
  outer:   "background:#f0f4ee; padding:32px 16px;",
  table:   "max-width:580px; margin:0 auto;",
  header:  "background:#2A7A26; border-radius:16px 16px 0 0; padding:32px 36px 28px;",
  kicker:  "margin:0 0 6px; font-size:12px; font-weight:700; color:#F9C514; text-transform:uppercase; letter-spacing:1.5px;",
  h1:      "margin:0; font-size:26px; font-weight:900; color:#ffffff; line-height:1.25;",
  body_td: "background:#ffffff; padding:28px 36px; border-radius:0 0 16px 16px;",
  p:       "margin:0 0 14px; font-size:15px; color:#1A1A1A; line-height:1.65;",
  box:     "background:#f5f9f4; border-radius:12px; padding:18px 20px; margin:18px 0;",
  label:   "margin:0 0 4px; font-size:11px; font-weight:700; color:#3AAA35; text-transform:uppercase; letter-spacing:.8px;",
  value:   "margin:0; font-size:14px; color:#1A1A1A; font-weight:600; line-height:1.5;",
  total:   "margin:0; font-size:28px; font-weight:900; color:#2A7A26;",
  btn:     "display:inline-block; background:#3AAA35; color:#ffffff; text-decoration:none; font-weight:900; font-size:15px; padding:14px 32px; border-radius:999px; margin:20px 0;",
  divider: "border:none; border-top:1px solid #eaeae6; margin:28px 0;",
  ftd:     "padding:20px 0 0; text-align:center;",
  ftext:   "margin:6px 0 0; font-size:12px; color:#999; line-height:1.6;",
};

/* ── Base template ── */
function base(kicker: string, titulo: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title></head>
<body style="${s.body}">
<div style="${s.outer}">
<table width="100%" cellpadding="0" cellspacing="0" style="${s.table}">

  <!-- Logo -->
  <tr><td style="padding:0 0 20px; text-align:center;">
    <img src="${LOGO_URL}" alt="Frescón" height="48" style="display:inline-block;" />
  </td></tr>

  <!-- Header -->
  <tr><td style="${s.header}">
    <p style="${s.kicker}">${kicker}</p>
    <h1 style="${s.h1}">${titulo}</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="${s.body_td}">
    ${body}
    <hr style="${s.divider}" />
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="${s.ftd}">
        <img src="${LOGO_URL}" alt="" height="28" style="opacity:.3; display:inline-block;" />
        <p style="${s.ftext}">
          <strong style="color:#555;">Frescón Delivery</strong><br>
          Concón · Reñaca · Jardín del Mar<br>
          <a href="https://www.frescon.cl" style="color:#3AAA35; text-decoration:none;">www.frescon.cl</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</div>
</body></html>`;
}

/* ── Componentes HTML inline ── */
function box(label: string, lines: string[]) {
  return `<div style="${s.box}">
    <p style="${s.label}">${label}</p>
    ${lines.map(l => `<p style="${s.value}">${l}</p>`).join("")}
  </div>`;
}

function btn(href: string, text: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="text-align:center; padding:8px 0;">
      <a href="${href}" style="${s.btn}">${text}</a>
    </td></tr>
  </table>`;
}

/* ── Email: pedido confirmado (cliente) ── */
export async function emailPedidoConfirmado(data: {
  nombre:        string;
  email:         string;
  telefono?:     string;
  direccion:     string;
  fecha_entrega: string;
  detalle:       string;
  total:         number;
}) {
  const urlSeguimiento = data.telefono
    ? `https://www.frescon.cl/seguimiento?tel=${encodeURIComponent(data.telefono)}`
    : "https://www.frescon.cl/seguimiento";
  try {
    await resend.emails.send({
      from:    FROM,
      to:      data.email,
      subject: "✅ Tu pedido Frescón está confirmado",
      html: base(
        "Frescon Delivery 🌿",
        `¡Hola ${data.nombre}, tu pedido está confirmado!`,
        `
        <p style="${s.p}">Gracias por tu compra. Todo fresco y listo para el <strong>${data.fecha_entrega}</strong>. 🥦</p>

        ${box("📦 Detalle del pedido", data.detalle.split("\n"))}

        <div style="${s.box}">
          <p style="${s.label}">💰 Total a pagar</p>
          <p style="${s.total}">$${data.total.toLocaleString("es-CL")}</p>
        </div>

        ${box("📍 Dirección de entrega", [data.direccion])}

        ${btn(urlSeguimiento, "Seguir mi pedido")}

        <p style="margin:0; font-size:13px; color:#888; text-align:center;">
          ¿Tienes dudas? Escríbenos por WhatsApp o responde este correo.
        </p>
        `
      ),
    });
  } catch (e) {
    console.error("Error email pedido confirmado:", e);
  }
}

/* ── Email: pedido en camino (cliente) ── */
export async function emailEnCamino(data: {
  nombre: string;
  email:  string;
}) {
  try {
    await resend.emails.send({
      from:    FROM,
      to:      data.email,
      subject: "🚗 Tu pedido Frescón está en camino",
      html: base(
        "Frescon Delivery · En camino",
        `¡${data.nombre}, tu pedido viene en camino! 🚗`,
        `
        <p style="${s.p}">El repartidor ya salió. Llegamos en aproximadamente <strong>20 minutos</strong>.</p>
        <p style="${s.p}">Asegúrate de estar en casa o déjanos instrucciones si no puedes recibirlo.</p>
        ${btn("https://www.frescon.cl/seguimiento", "📍 Ver seguimiento en tiempo real")}
        `
      ),
    });
  } catch (e) {
    console.error("Error email en camino:", e);
  }
}

/* ── Email: pedido entregado (cliente) ── */
export async function emailEntregado(data: {
  nombre: string;
  email:  string;
}) {
  try {
    await resend.emails.send({
      from:    FROM,
      to:      data.email,
      subject: "🌿 ¡Tu pedido Frescón fue entregado!",
      html: base(
        "Frescon Delivery · Entregado ✅",
        `¡Listo ${data.nombre}, todo entregado!`,
        `
        <p style="${s.p}">Tu pedido Frescón fue entregado con éxito. Esperamos que todo esté bien fresco y delicioso. 🥦🍋🥑</p>
        <p style="${s.p}">Si algo no está bien, responde este correo y lo resolvemos de inmediato.</p>
        ${btn("https://www.frescon.cl/catalogo", "🛒 Ver productos para la próxima semana")}
        `
      ),
    });
  } catch (e) {
    console.error("Error email entregado:", e);
  }
}

/* ── Email: resumen diario admin ── */
export async function emailResumenAdmin(data: {
  fecha:   string;
  pedidos: Array<{ nombre_cliente: string; direccion: string; total: number; detalle_pedido: string }>;
  total:   number;
}) {
  if (!ADMIN_EMAIL) return;
  try {
    const filas = data.pedidos.map((p, i) => `
      <div style="${s.box} margin-bottom:10px;">
        <p style="${s.label}">#${i + 1} · ${p.nombre_cliente}</p>
        <p style="${s.value}">${p.direccion}</p>
        <p style="margin:4px 0; font-size:13px; color:#666;">${p.detalle_pedido}</p>
        <p style="margin:6px 0 0; font-size:18px; font-weight:900; color:#2A7A26;">$${p.total.toLocaleString("es-CL")}</p>
      </div>
    `).join("");

    await resend.emails.send({
      from:    FROM,
      to:      ADMIN_EMAIL,
      subject: `📋 Resumen Frescón — ${data.fecha} (${data.pedidos.length} pedidos)`,
      html: base(
        `Resumen del día · ${data.fecha}`,
        `${data.pedidos.length} pedidos confirmados`,
        `
        <div style="${s.box} text-align:center;">
          <p style="${s.label}">💰 Total del día</p>
          <p style="${s.total}">$${data.total.toLocaleString("es-CL")}</p>
        </div>
        ${filas}
        ${btn("https://www.frescon.cl/admin/pedidos", "📋 Ver en panel admin")}
        `
      ),
    });
  } catch (e) {
    console.error("Error email resumen admin:", e);
  }
}

/* ── Email: ruta del día (repartidor) ── */
export async function emailRutaRepartidor(data: {
  fecha:   string;
  pedidos: Array<{ nombre_cliente: string; telefono: string; direccion: string; total: number; detalle_pedido: string; orden_entrega?: number }>;
}) {
  if (!REPARTIDOR_EMAIL) return;
  try {
    const filas = data.pedidos.map((p, i) => `
      <div style="${s.box} margin-bottom:10px;">
        <p style="${s.label}">Parada ${p.orden_entrega ?? i + 1}</p>
        <p style="${s.value}">${p.nombre_cliente} · ${p.telefono}</p>
        <p style="margin:4px 0; font-size:13px; color:#555;">${p.direccion}</p>
        <p style="margin:4px 0; font-size:12px; color:#888;">${p.detalle_pedido}</p>
        <p style="margin:6px 0 0; font-size:16px; font-weight:900; color:#2A7A26;">$${p.total.toLocaleString("es-CL")}</p>
      </div>
    `).join("");

    await resend.emails.send({
      from:    FROM,
      to:      REPARTIDOR_EMAIL,
      subject: `🚗 Tu ruta Frescón — ${data.fecha}`,
      html: base(
        `Ruta del día · ${data.fecha}`,
        `${data.pedidos.length} entregas para hoy 🚗`,
        `
        ${filas}
        ${btn("https://www.frescon.cl/repartidor", "📱 Abrir app del repartidor")}
        `
      ),
    });
  } catch (e) {
    console.error("Error email ruta repartidor:", e);
  }
}
