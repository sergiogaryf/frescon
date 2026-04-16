import { NextResponse } from "next/server";
import { hashPassword, generateToken, SESSION_COOKIE } from "@/lib/auth";
import { getClienteByResetToken, updateClienteFields } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token y nueva clave son obligatorios" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La clave debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const cliente = await getClienteByResetToken(token);
    if (!cliente) {
      return NextResponse.json({ error: "Link invalido o expirado" }, { status: 400 });
    }

    // Verificar expiración
    if (cliente.reset_token_expiry) {
      const expiry = new Date(cliente.reset_token_expiry);
      if (expiry < new Date()) {
        return NextResponse.json({ error: "El link ha expirado. Solicita uno nuevo." }, { status: 400 });
      }
    }

    const password_hash = hashPassword(password);
    const session_token = generateToken();

    await updateClienteFields(cliente.id, {
      password_hash,
      session_token,
      reset_token: "",
      reset_token_expiry: "",
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Error reset-password:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
