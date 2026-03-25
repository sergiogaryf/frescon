import { NextRequest, NextResponse } from "next/server";
import { crearPedido, perfilesTable, upsertPerfilCliente } from "@/lib/airtable";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { emailPedidoConfirmado } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre_cliente, email, telefono, direccion,
      fecha_entrega, notas, total, detalle_pedido,
      suscripcion_activa, referido_por,
    } = body;

    if (!nombre_cliente || !telefono || !direccion || !fecha_entrega || !total) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!/conc[oó]n|re[nñ]aca|jard[ií]n del mar/i.test(direccion)) {
      return NextResponse.json(
        { error: "Solo realizamos delivery en Concón, Reñaca y Jardín del Mar." },
        { status: 422 }
      );
    }

    const id = await crearPedido({
      nombre_cliente, email, telefono, direccion,
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

    // Email al cliente: confirmación de pedido
    if (email) {
      emailPedidoConfirmado({
        nombre: nombre_cliente, email, telefono, direccion,
        fecha_entrega, detalle: detalle_pedido, total: Number(total),
      }).catch(() => {});
    }

    // WhatsApp al cliente: confirmación con resumen completo
    enviarWhatsApp({
      nombre:   nombre_cliente,
      telefono,
      tipo:     "pedido_confirmado",
      pedido: {
        detalle:       detalle_pedido,
        total:         Number(total),
        fecha_entrega,
        direccion,
      },
    }).catch(() => {});

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

    // Auto-enriquecer perfil del cliente
    enrichPerfilCliente({
      telefono, nombre_cliente, direccion, detalle_pedido,
    }).catch(() => {});

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Error creando pedido:", err);
    return NextResponse.json({ error: "Error al guardar el pedido" }, { status: 500 });
  }
}

/* ── Auto-enriquecer perfil del cliente tras pedido ── */
function detectarZona(direccion: string): string {
  const d = direccion.toLowerCase();
  if (/reñaca|renaca/.test(d))     return "Reñaca";
  if (/jard[ií]n del mar/.test(d)) return "Jardín del Mar";
  return "Concón";
}

function extraerProductos(detalle: string): string[] {
  return detalle.split("\n")
    .map((l) => l.match(/^\d+x\s+(.+?)\s+\(/)?.[1]?.trim())
    .filter((n): n is string => !!n);
}

function detectarPreferencias(productos: string[]): string {
  const prefs: string[] = [];
  const nombres = productos.join(" ").toLowerCase();
  if (/lechuga|espinaca|acelga|tomate|zanahoria|brocoli|zapallo/.test(nombres)) prefs.push("verduras");
  if (/manzana|naranja|palta|platano|limon|frutilla|uva/.test(nombres))         prefs.push("frutas");
  if (/hongo|champiñon/.test(nombres))                                           prefs.push("hongos");
  if (/huevo/.test(nombres))                                                     prefs.push("huevos");
  if (/miel/.test(nombres))                                                      prefs.push("miel");
  return prefs.join(", ");
}

async function enrichPerfilCliente(data: {
  telefono: string; nombre_cliente: string; direccion: string; detalle_pedido: string;
}) {
  const productos = extraerProductos(data.detalle_pedido);
  const zona = detectarZona(data.direccion);
  const preferencias = detectarPreferencias(productos);

  await upsertPerfilCliente(data.telefono, {
    nombre_detectado:      data.nombre_cliente,
    zona,
    preferencias,
    productos_favoritos:   productos.join(", "),
    ultimo_pedido_detalle: data.detalle_pedido,
    total_pedidos:         1, // señal para incrementar
  });
}
