import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { getClienteBySession } from "@/lib/airtable";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    const cliente = await getClienteBySession(token);
    if (!cliente) {
      return NextResponse.json({ loggedIn: false });
    }

    return NextResponse.json({
      loggedIn: true,
      nombre: cliente.nombre_detectado,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      comuna: cliente.comuna,
    });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
