import { NextResponse } from "next/server";
import { getPedidos, updatePedido } from "@/lib/airtable";

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
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
