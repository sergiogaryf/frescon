import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Frescón <onboarding@resend.dev>";
const ADMIN_EMAIL = "sergiogaryf@gmail.com";
const REPARTIDOR_EMAIL = process.env.REPARTIDOR_EMAIL ?? "";

/* ── Helpers ── */
function baseHtml(contenido: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#f5f5f0; margin:0; padding:0; }
  .wrap { max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; }
  .header { background:#3AAA35; padding:28px 32px; }
  .header h1 { color:#fff; margin:0; font-size:22px; font-weight:900; letter-spacing:-0.5px; }
  .header p { color:rgba(255,255,255,0.8); margin:4px 0 0; font-size:14px; }
  .body { padding:28px 32px; }
  .body p { color:#444; font-size:15px; line-height:1.6; margin:0 0 12px; }
  .box { background:#f9fafb; border-radius:12px; padding:16px 20px; margin:16px 0; }
  .box p { margin:4px 0; font-size:14px; }
  .label { color:#999; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
  .total { color:#3AAA35; font-size:24px; font-weight:900; }
  .badge { display:inline-block; background:#F9C514; color:#1A1A1A; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
  .btn { display:block; background:#3AAA35; color:#fff; text-decoration:none; font-weight:900; font-size:15px; text-align:center; padding:14px 24px; border-radius:999px; margin:20px 0; }
  .footer { padding:16px 32px 24px; text-align:center; }
  .footer p { color:#bbb; font-size:12px; margin:0; }
</style>
</head>
<body>
<div style="padding:24px 16px; background:#f5f5f0;">
  <div class="wrap">
    ${contenido}
    <div class="footer">
      <p>🌿 <strong>Frescón Delivery</strong> · Concón, Reñaca y Jardín del Mar</p>
      <p style="margin-top:4px;">frescon.cl</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

/* ── Email: pedido confirmado (cliente) ── */
export async function emailPedidoConfirmado(data: {
  nombre:        string;
  email:         string;
  direccion:     string;
  fecha_entrega: string;
  detalle:       string;
  total:         number;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to:   data.email,
      subject: "✅ Tu pedido Frescón está confirmado",
      html: baseHtml(`
        <div class="header">
          <h1>¡Pedido confirmado! 🛒</h1>
          <p>Hola ${data.nombre}, recibimos tu pedido.</p>
        </div>
        <div class="body">
          <p>Gracias por tu compra. Tu pedido llegará el <strong>${data.fecha_entrega}</strong>.</p>
          <div class="box">
            <p class="label">📦 Detalle</p>
            ${data.detalle.split("\n").map(l => `<p>${l}</p>`).join("")}
            <p style="margin-top:12px;" class="label">Total</p>
            <p class="total">$${data.total.toLocaleString("es-CL")}</p>
          </div>
          <div class="box">
            <p class="label">📍 Dirección de entrega</p>
            <p><strong>${data.direccion}</strong></p>
          </div>
          <a href="https://www.frescon.cl/seguimiento" class="btn">🚗 Seguir mi pedido</a>
        </div>
      `),
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
      from: FROM,
      to:   data.email,
      subject: "🚗 Tu pedido Frescón está en camino",
      html: baseHtml(`
        <div class="header">
          <h1>¡Tu pedido viene en camino! 🚗</h1>
          <p>Hola ${data.nombre}, el repartidor ya salió.</p>
        </div>
        <div class="body">
          <p>Tu pedido Frescón está en camino. Llegamos en aproximadamente <strong>20 minutos</strong>.</p>
          <a href="https://www.frescon.cl/seguimiento" class="btn">📍 Ver seguimiento</a>
        </div>
      `),
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
      from: FROM,
      to:   data.email,
      subject: "🌿 ¡Tu pedido Frescón fue entregado!",
      html: baseHtml(`
        <div class="header">
          <h1>¡Entregado con éxito! ✅</h1>
          <p>Hola ${data.nombre}, que lo disfrutes.</p>
        </div>
        <div class="body">
          <p>Tu pedido Frescón fue entregado. Esperamos que todo esté fresco y delicioso. 🥦🍋</p>
          <p>Si tienes algún problema, responde este correo y te ayudamos.</p>
          <a href="https://www.frescon.cl/catalogo" class="btn">🛒 Ver más productos</a>
        </div>
      `),
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
      <div class="box" style="margin-bottom:10px;">
        <p class="label">#${i + 1} · ${p.nombre_cliente}</p>
        <p>${p.direccion}</p>
        <p style="font-size:12px;color:#666;">${p.detalle_pedido}</p>
        <p class="total" style="font-size:18px;">$${p.total.toLocaleString("es-CL")}</p>
      </div>
    `).join("");

    await resend.emails.send({
      from: FROM,
      to:   ADMIN_EMAIL,
      subject: `📋 Resumen Frescón — ${data.fecha} (${data.pedidos.length} pedidos)`,
      html: baseHtml(`
        <div class="header">
          <h1>Resumen del día 📋</h1>
          <p>${data.fecha} · ${data.pedidos.length} pedidos</p>
        </div>
        <div class="body">
          <div class="box" style="text-align:center;">
            <p class="label">Total del día</p>
            <p class="total">$${data.total.toLocaleString("es-CL")}</p>
          </div>
          ${filas}
        </div>
      `),
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
      <div class="box" style="margin-bottom:10px;">
        <p class="label">Parada ${p.orden_entrega ?? i + 1}</p>
        <p><strong>${p.nombre_cliente}</strong> · ${p.telefono}</p>
        <p>${p.direccion}</p>
        <p style="font-size:12px;color:#666;">${p.detalle_pedido}</p>
        <p class="total" style="font-size:16px;">$${p.total.toLocaleString("es-CL")}</p>
      </div>
    `).join("");

    await resend.emails.send({
      from: FROM,
      to:   REPARTIDOR_EMAIL,
      subject: `🚗 Tu ruta Frescón — ${data.fecha}`,
      html: baseHtml(`
        <div class="header">
          <h1>Tu ruta de hoy 🚗</h1>
          <p>${data.fecha} · ${data.pedidos.length} entregas</p>
        </div>
        <div class="body">
          ${filas}
          <a href="https://www.frescon.cl/repartidor" class="btn">📱 Abrir app del repartidor</a>
        </div>
      `),
    });
  } catch (e) {
    console.error("Error email ruta repartidor:", e);
  }
}
