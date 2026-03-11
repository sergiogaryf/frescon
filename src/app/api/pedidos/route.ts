import { NextRequest, NextResponse } from "next/server";
import { crearPedido, perfilesTable } from "@/lib/airtable";
import { enviarWhatsApp } from "@/lib/whatsapp";

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

    // WhatsApp automático: confirmación de pedido (no bloquea respuesta)
    enviarWhatsApp({ nombre: nombre_cliente, telefono, tipo: "pedido_confirmado" }).catch(() => {});

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Error creando pedido:", err);
    return NextResponse.json({ error: "Error al guardar el pedido" }, { status: 500 });
  }
}
