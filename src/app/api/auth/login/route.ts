import { NextResponse } from "next/server";
import { verifyPassword, generateToken, SESSION_COOKIE } from "@/lib/auth";
import { getClienteByEmail, updateClienteFields } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y clave son obligatorios" }, { status: 400 });
    }

    const cliente = await getClienteByEmail(email);
    if (!cliente || !cliente.password_hash) {
      return NextResponse.json({ error: "Correo o clave incorrectos" }, { status: 401 });
    }

    if (!verifyPassword(password, cliente.password_hash)) {
      return NextResponse.json({ error: "Correo o clave incorrectos" }, { status: 401 });
    }

    const session_token = generateToken();
    await updateClienteFields(cliente.id, { session_token });

    const res = NextResponse.json({
      ok: true,
      nombre: cliente.nombre_detectado,
      email: cliente.email,
    });
    res.cookies.set(SESSION_COOKIE, session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Error login:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
