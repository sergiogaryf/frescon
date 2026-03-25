import { NextResponse } from "next/server";
import { getEquipo } from "@/lib/airtable";

export async function POST(req: Request) {
  const { pin } = await req.json();

  if (!pin) {
    return NextResponse.json({ error: "PIN requerido" }, { status: 400 });
  }

  // Buscar encargado activo con ese PIN en la tabla de equipo
  const equipo = await getEquipo();
  const encargado = equipo.find(
    (m) => m.rol === "Encargado" && m.activo && m.pin_acceso === pin
  );

  if (!encargado) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, nombre: encargado.nombre });
  res.cookies.set("fa_enc", pin, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 14, // 14 horas
    path:     "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("fa_enc");
  return res;
}
