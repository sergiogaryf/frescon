import { NextRequest, NextResponse } from "next/server";
import { crearPedido, perfilesTable } from "@/lib/airtable";
import { enviarWhatsApp } from "@/lib/whatsapp";

function isPedidoAbierto(): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const dia  = now.getDay();
  const hora = now.getHours();
  const min  = now.getMinutes();
  if (dia === 1 || dia === 2) return true;
  if (dia === 3 && (hora < 23 || (hora === 23 && min <= 59))) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre_cliente, telefono, direccion,
      fecha_entrega, notas, total, detalle_pedido,
      suscripcion_activa, referido_por,
    } = body;

    if (!nombre_cliente || !telefono || !direccion || !fecha_entrega || !total) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!isPedidoAbierto()) {
      return NextResponse.json(
        { error: "El plazo de pedidos está cerrado. Los pedidos se reciben de lunes a miércoles hasta las 23:59." },
        { status: 403 }
      );
    }

    if (!/conc[oó]n|re[nñ]aca|jard[ií]n del mar/i.test(direccion)) {
      return NextResponse.json(
        { error: "Solo realizamos delivery en Concón, Reñaca y Jardín del Mar." },
        { status: 422 }
      );
    }

    const id = await crearPedido({
      nombre_cliente, telefono, direccion,
      fecha_entrega, notas, total, detalle_pedido,
      suscripcion_activa, referido_por,
    });

    // Si el pedido usó un código de referido, acreditar 5% al referidor
    if (referido_por) {
      perfilesTable
        .select({ filterByFormula: `{codigo_referido} = "${referido_por}"`, maxRecords: 1 })
        .all()
        .then((records) => {
          if (records.length > 0) {
            const actual = Number(records[0].fields.descuento_pendiente ?? 0);
            perfilesTable.update(records[0].id, {
              descuento_pendiente: actual + 5,
            } as unknown as Record<string, string | number | boolean>);
          }
        })
        .catch(() => {});
    }

    // WhatsApp al cliente: confirmación de pedido
    enviarWhatsApp({ nombre: nombre_cliente, telefono, tipo: "pedido_confirmado" }).catch(() => {});

    // WhatsApp al repartidor: nuevo pedido recibido
    const telRepartidor = process.env.REPARTIDOR_WHATSAPP_NUMBER;
    if (telRepartidor) {
      const msgRepartidor =
        `🛒 *Nuevo pedido Frescón*\n` +
        `👤 ${nombre_cliente}\n` +
        `📱 ${telefono}\n` +
        `📍 ${direccion}\n` +
        `📅 Entrega: ${fecha_entrega}\n` +
        `💰 Total: $${Number(total).toLocaleString("es-CL")}\n\n` +
        `📦 Detalle:\n${detalle_pedido}` +
        (notas ? `\n📝 Notas: ${notas}` : "");
      enviarWhatsApp({ nombre: "Repartidor", telefono: telRepartidor, tipo: "pedido_confirmado", extra: msgRepartidor }).catch(() => {});
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Error creando pedido:", err);
    return NextResponse.json({ error: "Error al guardar el pedido" }, { status: 500 });
  }
}
