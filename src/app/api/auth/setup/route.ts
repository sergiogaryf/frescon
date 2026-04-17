import { NextResponse } from "next/server";
import { generateToken, SESSION_COOKIE } from "@/lib/auth";
import { getPerfilCliente, updateClienteFields } from "@/lib/airtable";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * Setup: primer ingreso para clientes existentes (sin email/password).
 * Paso 1: POST { telefono } → busca cliente, devuelve nombre
 * Paso 2: POST { telefono, email } → vincula email, crea sesión
 */
export async function POST(req: Request) {
  try {
    // Rate limit: 10 intentos por IP cada 15 minutos
    const ip = getClientIP(req);
    const rl = checkRateLimit({ name: "setup", maxRequests: 10, windowSeconds: 900 }, ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${rl.resetIn} segundos.` },
        { status: 429 }
      );
    }

    const { telefono, email } = await req.json();

    if (!telefono) {
      return NextResponse.json({ error: "Telefono es obligatorio" }, { status: 400 });
    }

    const perfil = await getPerfilCliente(telefono);
    if (!perfil) {
      return NextResponse.json({
        encontrado: false,
        error: "No encontramos una cuenta con ese telefono. Puedes crear una nueva.",
      }, { status: 404 });
    }

    // Paso 1: solo teléfono → devolver datos del cliente
    if (!email) {
      return NextResponse.json({
        encontrado: true,
        nombre: perfil.nombre_detectado,
        tieneEmail: Boolean(perfil.email),
        email: perfil.email || undefined,
      });
    }

    // Paso 2: vincular email y crear sesión
    const session_token = generateToken();

    await updateClienteFields(perfil.id, {
      email,
      session_token,
    });

    const res = NextResponse.json({
      ok: true,
      nombre: perfil.nombre_detectado,
      email,
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
    console.error("Error setup:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
