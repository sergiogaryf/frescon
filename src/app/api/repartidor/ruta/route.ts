import { NextResponse } from "next/server";
import { getPedidos, updatePedido } from "@/lib/airtable";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { emailEnCamino, emailEntregado } from "@/lib/email";

/** Devuelve los pedidos de hoy. Con ?historial=1 devuelve los últimos 60 días. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const historial = searchParams.get("historial") === "1";

    if (historial) {
      const todos = await getPedidos();
      const hoy = new Date().toISOString().split("T")[0];
      const pasados = todos
        .filter((p) => p.fecha_entrega < hoy)
        .sort((a, b) => b.fecha_entrega.localeCompare(a.fecha_entrega));
      return NextResponse.json(pasados);
    }

    const hoy = new Date().toISOString().split("T")[0];
    const todos = await getPedidos({ fecha: hoy });
    const activos = todos.filter((p) =>
      ["Confirmado", "En camino", "Pendiente", "Entregado"].includes(p.estado)
    );
    activos.sort((a, b) => {
      if (a.orden_entrega && b.orden_entrega) return a.orden_entrega - b.orden_entrega;
      return a.nombre_cliente.localeCompare(b.nombre_cliente);
    });
    return NextResponse.json(activos);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { orden } = await req.json();
    if (!Array.isArray(orden)) return NextResponse.json({ error: "orden requerido" }, { status: 400 });
    await Promise.all(
      orden.map((item: { id: string; orden_entrega: number }) =>
        updatePedido(item.id, { orden_entrega: item.orden_entrega })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { id, estado } = await req.json();
  if (!id || !estado) return NextResponse.json({ error: "id y estado requeridos" }, { status: 400 });

  try {
    await updatePedido(id, { estado });

    // WhatsApp automático al marcar "En camino" o "Entregado"
    if (estado === "En camino" || estado === "Entregado") {
      getPedidos().then((todos) => {
        const pedido = todos.find((p) => p.id === id);
        if (pedido) {
          enviarWhatsApp({
            nombre:   pedido.nombre_cliente,
            telefono: pedido.telefono,
            tipo:     estado === "En camino" ? "en_camino" : "entregado",
          }).catch(() => {});
          if (pedido.email) {
            if (estado === "En camino") {
              emailEnCamino({ nombre: pedido.nombre_cliente, email: pedido.email }).catch(() => {});
            } else {
              emailEntregado({ nombre: pedido.nombre_cliente, email: pedido.email }).catch(() => {});
            }
          }
        }
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
