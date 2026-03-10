import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");

  try {
    const formula = fecha
      ? `IS_SAME({fecha}, "${fecha}")`
      : "";

    const records = await base("Inventario")
      .select({ filterByFormula: formula, sort: [{ field: "producto_nombre" }] })
      .all();

    const data = records.map((r) => ({
      id:                  r.id,
      fecha:               String(r.fields.fecha               ?? ""),
      producto_nombre:     String(r.fields.producto_nombre     ?? ""),
      stock_comprado_kg:   Number(r.fields.stock_comprado_kg   ?? 0),
      vendido_kg:          Number(r.fields.vendido_kg          ?? 0),
      sobrante_kg:         Number(r.fields.sobrante_kg         ?? 0),
      precio_compra_total: Number(r.fields.precio_compra_total ?? 0),
      merma_pct:           Number(r.fields.merma_pct           ?? 0),
    }));

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
