import { NextRequest, NextResponse } from "next/server";
import { updatePedido } from "@/lib/airtable";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { detalle_pedido, total } = body;

    if (!detalle_pedido || total == null) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    await updatePedido(id, { detalle_pedido, total });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando pedido:", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
