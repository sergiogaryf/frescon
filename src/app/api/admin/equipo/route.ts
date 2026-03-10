import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
const tabla = base("Repartidores");

export async function GET() {
  const records = await tabla.select({ sort: [{ field: "nombre" }] }).all();
  return NextResponse.json(records.map((r) => ({
    id:           r.id,
    nombre:       String(r.fields.nombre        ?? ""),
    telefono:     String(r.fields.telefono       ?? ""),
    pin_acceso:   String(r.fields.pin_acceso     ?? ""),
    activo:       Boolean(r.fields.activo),
    zona_asignada:String(r.fields.zona_asignada  ?? ""),
  })));
}

export async function POST(req: Request) {
  const body = await req.json();
  const record = await tabla.create({
    nombre:        body.nombre,
    telefono:      body.telefono,
    pin_acceso:    body.pin_acceso,
    activo:        true,
    zona_asignada: body.zona_asignada ?? "",
  });
  return NextResponse.json({ ok: true, id: record.id });
}

export async function PATCH(req: Request) {
  const { id, ...fields } = await req.json();
  await tabla.update(id, fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await tabla.update(id, { activo: false });
  return NextResponse.json({ ok: true });
}
