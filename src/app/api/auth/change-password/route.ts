import { NextResponse } from "next/server";
import { hashPassword, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { getClienteBySession, updateClienteFields } from "@/lib/airtable";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const cliente = await getClienteBySession(token);
    if (!cliente) {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva clave debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Si ya tiene password, verificar la actual
    if (cliente.password_hash && currentPassword) {
      if (!verifyPassword(currentPassword, cliente.password_hash)) {
        return NextResponse.json({ error: "La clave actual es incorrecta" }, { status: 401 });
      }
    }

    const password_hash = hashPassword(newPassword);
    await updateClienteFields(cliente.id, { password_hash });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error change-password:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
