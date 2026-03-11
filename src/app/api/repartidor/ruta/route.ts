import { NextResponse } from "next/server";
import { getPedidos, updatePedido } from "@/lib/airtable";
import { enviarWhatsApp } from "@/lib/whatsapp";

/** Devuelve los pedidos de hoy (o del próximo jueves) con estado Confirmado o En camino */
export async function GET() {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const todos = await getPedidos({ fecha: hoy });
    const activos = todos.filter((p) =>
      ["Confirmado", "En camino", "Pendiente"].includes(p.estado)
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
        }
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
