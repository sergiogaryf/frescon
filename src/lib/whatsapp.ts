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
  extra?:   string; // mensaje personalizado directo (ej: repartidor)
  pedido?: {
    detalle:        string;
    total:          number;
    fecha_entrega:  string;
    direccion:      string;
  };
}

function formatFechaEntrega(iso: string): string {
  if (!iso) return "próximo jueves";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" });
}

function buildMensaje(data: NotifData): string {
  const { nombre, tipo, extra, pedido } = data;

  // Mensaje personalizado directo (repartidor)
  if (extra && tipo === "pedido_confirmado" && nombre === "Repartidor") return extra;

  switch (tipo) {
    case "pedido_confirmado": {
      // Si tenemos detalle del pedido, enviar resumen completo
      if (pedido) {
        const bankName    = process.env.NEXT_PUBLIC_BANK_NAME    ?? "Banco Estado";
        const bankHolder  = process.env.NEXT_PUBLIC_BANK_HOLDER  ?? "Frescon SpA";
        const bankRut     = process.env.NEXT_PUBLIC_BANK_RUT     ?? "76.123.456-7";
        const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "000-000000-00";
        const bankEmail   = process.env.NEXT_PUBLIC_BANK_EMAIL   ?? "pagos@frescon.cl";
        const telLimpio   = data.telefono.replace(/\D/g, "").slice(-9);

        return (
          `✅ *¡Pedido confirmado, ${nombre}!*\n\n` +
          `🛒 *Tu pedido:*\n` +
          `${pedido.detalle}\n\n` +
          `💰 *Total: $${pedido.total.toLocaleString("es-CL")}*\n\n` +
          `📅 *Entrega:* ${formatFechaEntrega(pedido.fecha_entrega)}\n` +
          `⏰ *Horario:* 10:00 a 13:00 hrs\n` +
          `📍 *Dirección:* ${pedido.direccion}\n\n` +
          `💳 *Datos para transferencia:*\n` +
          `${bankName}\n` +
          `${bankHolder}\n` +
          `RUT: ${bankRut}\n` +
          `Cuenta: ${bankAccount}\n` +
          `Email: ${bankEmail}\n\n` +
          `📦 *Sigue tu pedido en:*\n` +
          `frescon.cl/seguimiento?tel=${telLimpio}\n\n` +
          `¿Dudas? Responde este mensaje 🐱\n` +
          `— Celia, Frescón 🌿`
        );
      }
      return `¡Hola ${nombre}! 🌿 Tu pedido Frescón fue recibido y confirmado. Te esperamos el próximo jueves entre 10:00 y 13:00. Si tienes cambios o dudas, responde este mensaje. ¡Gracias! — Celia 🐱`;
    }
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
