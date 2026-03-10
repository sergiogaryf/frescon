import { NextResponse } from "next/server";
import { getPedidos, updatePedido } from "@/lib/airtable";

/** Devuelve los pedidos de hoy (o del próximo jueves) con estado Confirmado o En camino */
export async function GET() {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    // Buscar pedidos de hoy sin importar estado, para el repartidor
    const todos = await getPedidos({ fecha: hoy });
    const activos = todos.filter((p) =>
      ["Confirmado", "En camino", "Pendiente"].includes(p.estado)
    );
    // Ordenar: primero por orden_entrega (si existe), luego por nombre
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
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
