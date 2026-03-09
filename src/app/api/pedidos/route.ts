import { NextRequest, NextResponse } from "next/server";
import { crearPedido } from "@/lib/airtable";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre_cliente, telefono, direccion, fecha_entrega, notas, total, detalle_pedido } = body;

    if (!nombre_cliente || !telefono || !direccion || !fecha_entrega || !total) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const id = await crearPedido({ nombre_cliente, telefono, direccion, fecha_entrega, notas, total, detalle_pedido });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Error creando pedido:", err);
    return NextResponse.json({ error: "Error al guardar el pedido" }, { status: 500 });
  }
}
