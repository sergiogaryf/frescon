import { NextResponse } from "next/server";
import { getPedidos, updatePedido } from "@/lib/airtable";
import { enviarWhatsApp, TipoNotif } from "@/lib/whatsapp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") ?? undefined;
  const fecha  = searchParams.get("fecha")  ?? undefined;

  try {
    const pedidos = await getPedidos({ estado, fecha });
    return NextResponse.json(pedidos);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  try {
    await updatePedido(id, fields);

    // WhatsApp automático al cambiar estado
    const estadosNotif: Record<string, TipoNotif> = {
      "En camino": "en_camino",
      "Entregado":  "entregado",
      "Cancelado":  "cancelado",
    };
    const tipoNotif = fields.estado ? estadosNotif[fields.estado as string] : undefined;

    if (tipoNotif && fields.nombre_cliente && fields.telefono) {
      enviarWhatsApp({
        nombre:   fields.nombre_cliente as string,
        telefono: fields.telefono as string,
        tipo:     tipoNotif,
      }).catch(() => {});
    } else if (tipoNotif && fields.estado) {
      // Buscar los datos del pedido para notificar
      getPedidos().then((todos) => {
        const pedido = todos.find((p) => p.id === id);
        if (pedido && tipoNotif) {
          enviarWhatsApp({
            nombre:   pedido.nombre_cliente,
            telefono: pedido.telefono,
            tipo:     tipoNotif,
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
