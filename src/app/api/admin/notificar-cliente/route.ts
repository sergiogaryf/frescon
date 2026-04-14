import { NextResponse } from "next/server";

interface NotifPayload {
  telefono: string;
  nombre: string;
  tipo: "pedido_confirmado" | "en_camino" | "entregado" | "custom";
  mensaje_custom?: string;
  detalle_pedido?: string;
  total?: number;
  fecha_entrega?: string;
  direccion?: string;
}

function formatFecha(iso: string): string {
  if (!iso) return "próximo jueves";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" });
}

function buildMensaje(payload: NotifPayload): string {
  const nombre = payload.nombre || "Cliente";
  switch (payload.tipo) {
    case "pedido_confirmado": {
      if (payload.detalle_pedido && payload.total) {
        const bankName    = process.env.NEXT_PUBLIC_BANK_NAME    ?? "Banco Estado";
        const bankHolder  = process.env.NEXT_PUBLIC_BANK_HOLDER  ?? "Frescon SpA";
        const bankRut     = process.env.NEXT_PUBLIC_BANK_RUT     ?? "76.123.456-7";
        const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "1024232279";
        const bankEmail   = process.env.NEXT_PUBLIC_BANK_EMAIL   ?? "pagos@frescon.cl";
        const telLimpio   = payload.telefono.replace(/\D/g, "").slice(-9);

        return (
          `✅ *¡Pedido confirmado, ${nombre}!*\n\n` +
          `🛒 *Tu pedido:*\n${payload.detalle_pedido}\n\n` +
          `💰 *Total: $${payload.total.toLocaleString("es-CL")}*\n\n` +
          `📅 *Entrega:* ${formatFecha(payload.fecha_entrega ?? "")}\n` +
          `⏰ *Horario:* 10:00 a 13:00 hrs\n` +
          (payload.direccion ? `📍 *Dirección:* ${payload.direccion}\n\n` : "\n") +
          `💳 *Datos para transferencia:*\n` +
          `${bankName}\n${bankHolder}\nRUT: ${bankRut}\nCuenta Vista: ${bankAccount}\nEmail: ${bankEmail}\n\n` +
          `📦 Sigue tu pedido: frescon.cl/seguimiento?tel=${telLimpio}\n\n` +
          `¿Dudas? Responde este mensaje 🐱\n— Celia, Frescón 🌿`
        );
      }
      return `¡Hola ${nombre}! 🌿 Tu pedido Frescón ha sido confirmado. Te esperamos el jueves entre 10:00 y 13:00. Si tienes dudas, responde este mensaje. — Celia 🐱`;
    }
    case "en_camino":
      return `¡${nombre}, tu pedido Frescón ya está en camino! 🚐🥦 El repartidor llegará pronto. Puedes seguir tu pedido en: frescon.cl/seguimiento — Celia 🐱`;
    case "entregado":
      return `✅ ¡Entregado! ${nombre}, espero que disfrutes tus productos frescos del Valle de Aconcagua. ¡Hasta el próximo jueves! 🌿 — Celia 🐱`;
    case "custom":
      return payload.mensaje_custom ?? "Mensaje de Frescón";
    default:
      return "Mensaje de Frescón";
  }
}

export async function POST(req: Request) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    return NextResponse.json(
      { error: "Twilio no configurado. Agrega TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM en .env.local" },
      { status: 503 }
    );
  }

  const payload: NotifPayload = await req.json();
  const { telefono, nombre, tipo, mensaje_custom } = payload;

  if (!telefono || !tipo) {
    return NextResponse.json({ error: "telefono y tipo son requeridos" }, { status: 400 });
  }

  // Normalizar teléfono a formato internacional Chile
  const limpio = telefono.replace(/\D/g, "");
  const to = limpio.startsWith("56")
    ? `whatsapp:+${limpio}`
    : `whatsapp:+56${limpio.slice(-9)}`;

  const mensaje = buildMensaje({ telefono, nombre, tipo, mensaje_custom });

  // Llamar a Twilio REST API
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const formData = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: to,
    Body: mensaje,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
    },
    body: formData.toString(),
  });

  const data = await res.json() as { sid?: string; error_code?: number; message?: string };

  if (!res.ok) {
    return NextResponse.json(
      { error: data.message ?? "Error al enviar WhatsApp" },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true, sid: data.sid, mensaje_enviado: mensaje });
}
