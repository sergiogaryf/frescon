import { NextResponse } from "next/server";
import { getCompras, crearCompra, updateCompra, deleteCompra } from "@/lib/airtable";

export async function GET() {
  try {
    const compras = await getCompras();
    return NextResponse.json(compras);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const ids: string[] = [];
    for (const item of items) {
      const id = await crearCompra(item);
      ids.push(id);
    }
    return NextResponse.json({ ok: true, ids });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...fields } = await req.json();
    await updateCompra(id, fields);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    await deleteCompra(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
