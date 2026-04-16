import { NextResponse } from "next/server";
import { hashPassword, generateToken, SESSION_COOKIE } from "@/lib/auth";
import { getClienteByEmail, registrarCliente } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const { email, password, nombre, telefono, direccion, comuna } = await req.json();

    if (!email || !password || !nombre || !telefono) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La clave debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const existing = await getClienteByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
    }

    const password_hash = hashPassword(password);
    const session_token = generateToken();

    await registrarCliente({
      email,
      password_hash,
      nombre,
      telefono,
      direccion: direccion ?? "",
      comuna: comuna ?? "",
      session_token,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Error registro:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
