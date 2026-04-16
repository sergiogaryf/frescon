import { NextRequest, NextResponse } from "next/server";
import { getPerfilCliente, upsertPerfilCliente } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  const telefono = req.nextUrl.searchParams.get("telefono");
  if (!telefono) {
    return NextResponse.json({ error: "telefono requerido" }, { status: 400 });
  }

  const perfil = await getPerfilCliente(telefono);
  if (!perfil) {
    return NextResponse.json({ encontrado: false });
  }

  return NextResponse.json({
    encontrado:          true,
    nombre:              perfil.nombre_detectado,
    email:               perfil.email ?? "",
    direccion:           perfil.direccion ?? "",
    comuna:              perfil.comuna ?? "",
    zona:                perfil.zona,
    preferencias:        perfil.preferencias,
    dieta:               perfil.dieta,
    productos_favoritos: perfil.productos_favoritos,
    total_pedidos:       perfil.total_pedidos,
    signo_zodiacal:      perfil.signo_zodiacal,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { telefono, ...data } = body;

  if (!telefono) {
    return NextResponse.json({ error: "telefono requerido" }, { status: 400 });
  }

  await upsertPerfilCliente(telefono, data);
  return NextResponse.json({ ok: true });
}
