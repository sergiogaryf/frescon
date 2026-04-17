import { NextResponse } from "next/server";
import { generateToken, SESSION_COOKIE } from "@/lib/auth";
import { getClienteByEmail, registrarCliente, updateClienteFields } from "@/lib/airtable";

interface GoogleTokenPayload {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  sub: string;
}

async function verifyGoogleToken(credential: string): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!res.ok) return null;

    const data = await res.json();

    // Verificar que el token es para nuestro Client ID
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && data.aud !== clientId) {
      console.error("Google token aud mismatch:", data.aud, "vs", clientId);
      return null;
    }

    if (!data.email || data.email_verified === "false") {
      return null;
    }

    return {
      email: data.email,
      email_verified: data.email_verified === "true",
      name: data.name || data.email.split("@")[0],
      picture: data.picture || "",
      sub: data.sub,
    };
  } catch (e) {
    console.error("Error verificando token Google:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: "Token de Google requerido" }, { status: 400 });
    }

    const payload = await verifyGoogleToken(credential);
    if (!payload) {
      return NextResponse.json({ error: "Token de Google invalido" }, { status: 401 });
    }

    const session_token = generateToken();

    // Buscar cliente existente por email
    const existing = await getClienteByEmail(payload.email);

    if (existing) {
      // Cliente existente — actualizar sesión
      await updateClienteFields(existing.id, { session_token });

      const res = NextResponse.json({
        ok: true,
        nombre: existing.nombre_detectado || payload.name,
        email: payload.email,
        isNew: false,
      });
      res.cookies.set(SESSION_COOKIE, session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return res;
    }

    // Cliente nuevo — crear cuenta
    await registrarCliente({
      email: payload.email,
      password_hash: "", // No necesita password con Google
      nombre: payload.name,
      telefono: "",
      direccion: "",
      comuna: "",
      session_token,
    });

    const res = NextResponse.json({
      ok: true,
      nombre: payload.name,
      email: payload.email,
      isNew: true,
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
    console.error("Error Google auth:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
