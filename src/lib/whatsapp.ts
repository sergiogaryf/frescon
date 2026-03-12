/**
 * Utilidad para enviar mensajes WhatsApp via Twilio
 * Se usa en API routes (servidor). No importar en componentes cliente.
 */

export type TipoNotif =
  | "pedido_confirmado"
  | "en_camino"
  | "entregado"
  | "cancelado"
  | "cierre_pedidos";

export interface NotifData {
  nombre:   string;
  telefono: string;
  tipo:     TipoNotif;
  extra?:   string; // info adicional (detalle, etc.)
}

function buildMensaje(data: NotifData): string {
  const { nombre, tipo, extra } = data;
  // Si viene mensaje personalizado (ej: notif al repartidor), úsalo directamente
  if (extra && tipo === "pedido_confirmado" && nombre === "Repartidor") return extra;
  switch (tipo) {
    case "pedido_confirmado":
      return `¡Hola ${nombre}! 🌿 Tu pedido Frescón fue recibido y confirmado. Te esperamos el próximo jueves entre 10:00 y 13:00. Si tienes cambios o dudas, responde este mensaje. ¡Gracias! — Celia 🐱`;
    case "en_camino":
      return `¡${nombre}, tu pedido Frescón ya está en camino! 🚗🥦 El repartidor llegará pronto. Puedes seguir tu pedido en: frescon.cl/seguimiento — Celia 🐱`;
    case "entregado":
      return `✅ ¡Entregado, ${nombre}! Espero que disfrutes tus productos frescos del Valle de Aconcagua 🌿 Hasta el próximo jueves. — Celia 🐱`;
    case "cancelado":
      return `Hola ${nombre}, tu pedido Frescón fue cancelado. Si tienes preguntas, contáctanos por WhatsApp. Lamentamos los inconvenientes. — Frescón 🌿`;
    case "cierre_pedidos":
      return `¡Hola ${nombre}! ⏰ Recuerda que el plazo de pedidos Frescón cierra HOY MIÉRCOLES a las 23:59. ¡Pide tu cajita en frescon.cl antes que sea tarde! 🌿 — Celia 🐱`;
    default:
      return extra ?? "Mensaje de Frescón";
  }
}

function normalizarTelefono(telefono: string): string {
  const limpio = telefono.replace(/\D/g, "");
  if (limpio.startsWith("56")) return `whatsapp:+${limpio}`;
  return `whatsapp:+56${limpio.slice(-9)}`;
}

export async function enviarWhatsApp(data: NotifData): Promise<{ ok: boolean; error?: string }> {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM,
  } = process.env;

  // Si Twilio no está configurado, solo loggear (no es un error crítico)
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.log("[WhatsApp] Twilio no configurado — mensaje omitido:", data.tipo, data.telefono);
    return { ok: false, error: "Twilio no configurado" };
  }

  try {
    const to      = normalizarTelefono(data.telefono);
    const mensaje = buildMensaje(data);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        Authorization:   `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: TWILIO_WHATSAPP_FROM,
        To:   to,
        Body: mensaje,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.json() as { message?: string };
      console.error("[WhatsApp] Error Twilio:", err.message);
      return { ok: false, error: err.message };
    }

    return { ok: true };
  } catch (e) {
    console.error("[WhatsApp] Error inesperado:", e);
    return { ok: false, error: String(e) };
  }
}
