import { NextResponse } from "next/server";
import { hashPassword, generateToken, SESSION_COOKIE } from "@/lib/auth";
import { getClienteByEmail, registrarCliente } from "@/lib/airtable";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 registros por IP cada 30 minutos
    const ip = getClientIP(req);
    const rl = checkRateLimit({ name: "register", maxRequests: 5, windowSeconds: 1800 }, ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${rl.resetIn} segundos.` },
        { status: 429 }
      );
    }

    const { email, password, nombre, telefono, direccion, comuna } = await req.json();

    if (!email || !nombre || !telefono) {
      return NextResponse.json({ error: "Nombre, correo y telefono son obligatorios" }, { status: 400 });
    }

    const existing = await getClienteByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
    }

    // Password es opcional — si se proporciona, hashear
    const password_hash = password && password.length >= 6
      ? hashPassword(password)
      : "";

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
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Error registro:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
