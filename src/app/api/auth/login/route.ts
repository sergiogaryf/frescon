import { NextResponse } from "next/server";
import { verifyPassword, generateToken, SESSION_COOKIE } from "@/lib/auth";
import { getClienteByEmail, updateClienteFields } from "@/lib/airtable";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: Request) {
  try {
    // Rate limit: 10 intentos por IP cada 15 minutos
    const ip = getClientIP(req);
    const rl = checkRateLimit({ name: "login", maxRequests: 10, windowSeconds: 900 }, ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${rl.resetIn} segundos.` },
        { status: 429 }
      );
    }

    const { email, password, pin, recaptchaToken } = await req.json();

    // Verificar reCAPTCHA (solo si está configurado)
    const captcha = await verifyRecaptcha(recaptchaToken, "login");
    if (!captcha.valid) {
      return NextResponse.json({ error: "Verificacion de seguridad fallida" }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: "Correo es obligatorio" }, { status: 400 });
    }
    if (!password && !pin) {
      return NextResponse.json({ error: "Ingresa tu clave o los ultimos 6 digitos de tu telefono" }, { status: 400 });
    }

    const cliente = await getClienteByEmail(email);
    if (!cliente) {
      return NextResponse.json({ error: "Correo o clave incorrectos" }, { status: 401 });
    }

    // Modo PIN: últimos 6 dígitos del teléfono
    if (pin) {
      const digits = pin.replace(/\D/g, "");
      if (digits.length < 6) {
        return NextResponse.json({ error: "El PIN debe tener 6 digitos" }, { status: 400 });
      }
      const phoneLast6 = cliente.telefono.replace(/\D/g, "").slice(-6);
      if (digits.slice(-6) !== phoneLast6) {
        return NextResponse.json({ error: "Correo o PIN incorrectos" }, { status: 401 });
      }
    } else {
      // Modo password tradicional
      if (!cliente.password_hash) {
        return NextResponse.json({ error: "Correo o clave incorrectos" }, { status: 401 });
      }
      if (!verifyPassword(password, cliente.password_hash)) {
        return NextResponse.json({ error: "Correo o clave incorrectos" }, { status: 401 });
      }
    }

    const session_token = generateToken();
    await updateClienteFields(cliente.id, { session_token });

    const hasPassword = Boolean(cliente.password_hash);

    const res = NextResponse.json({
      ok: true,
      nombre: cliente.nombre_detectado,
      email: cliente.email,
      needsPassword: !hasPassword,
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
