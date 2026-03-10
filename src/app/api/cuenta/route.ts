import { NextResponse } from "next/server";
import { getPedidos } from "@/lib/airtable";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telefono = searchParams.get("telefono")?.trim();
  if (!telefono) return NextResponse.json([], { status: 200 });

  const todos = await getPedidos();
  const limpiar = (s: string) => s.replace(/\D/g, "").slice(-9);
  const busqueda = limpiar(telefono);

  const filtrados = todos.filter((p) => limpiar(p.telefono).includes(busqueda));
  filtrados.sort((a, b) => b.fecha_pedido.localeCompare(a.fecha_pedido));

  return NextResponse.json(filtrados);
}
