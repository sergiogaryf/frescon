import { NextResponse } from "next/server";
import { getSuscripciones, updatePedido } from "@/lib/airtable";

export async function GET() {
  try {
    const suscripciones = await getSuscripciones();
    return NextResponse.json(suscripciones);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  try {
    await updatePedido(id, { suscripcion_activa: false });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
