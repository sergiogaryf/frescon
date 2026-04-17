/**
 * Google reCAPTCHA v3 — verificación server-side.
 * Se activa solo si RECAPTCHA_SECRET_KEY está configurado.
 * Si no está configurado, permite todas las requests (graceful degradation).
 */

interface RecaptchaResult {
  success: boolean;
  score: number;
  action: string;
}

export async function verifyRecaptcha(
  token: string | undefined,
  expectedAction: string
): Promise<{ valid: boolean; score: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Si no hay secret key, no verificar (reCAPTCHA no configurado)
  if (!secretKey) {
    return { valid: true, score: 1 };
  }

  // Si hay secret key pero no hay token, rechazar
  if (!token) {
    return { valid: false, score: 0 };
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const data: RecaptchaResult = await res.json();

    if (!data.success) {
      return { valid: false, score: 0 };
    }

    // Verificar que la acción coincide
    if (data.action !== expectedAction) {
      return { valid: false, score: data.score };
    }

    // Score > 0.5 = probablemente humano (0.0 = bot, 1.0 = humano)
    return { valid: data.score >= 0.5, score: data.score };
  } catch (e) {
    console.error("Error verificando reCAPTCHA:", e);
    // En caso de error, permitir (no bloquear por falla de Google)
    return { valid: true, score: 0.5 };
  }
}
