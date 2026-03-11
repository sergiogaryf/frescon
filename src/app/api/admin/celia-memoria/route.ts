import { NextResponse } from "next/server";
import { getMemoriaReciente, getMemoriaStats, memoriaTable } from "@/lib/airtable";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") ?? "lista";
  const ctx  = searchParams.get("contexto") ?? "all";

  if (tipo === "stats") {
    const stats = await getMemoriaStats();
    return NextResponse.json(stats);
  }

  const admin    = ctx !== "cliente" ? await getMemoriaReciente("admin",   100) : [];
  const clientes = ctx !== "admin"   ? await getMemoriaReciente("cliente", 100) : [];
  const todos    = [...admin, ...clientes].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return NextResponse.json(todos);
}

export async function PATCH(req: Request) {
  const { id, util, notas_admin } = await req.json();
  await memoriaTable.update(id, { util, notas_admin });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await memoriaTable.destroy(id);
  return NextResponse.json({ ok: true });
}
