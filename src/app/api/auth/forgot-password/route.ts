import { NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";
import { getClienteByEmail, updateClienteFields } from "@/lib/airtable";
import { emailResetPassword } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Correo es obligatorio" }, { status: 400 });
    }

    const cliente = await getClienteByEmail(email);

    // Siempre responder ok para no revelar si el email existe
    if (!cliente) {
      return NextResponse.json({ ok: true });
    }

    const reset_token = generateToken();
    const reset_token_expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    await updateClienteFields(cliente.id, { reset_token, reset_token_expiry });

    await emailResetPassword({
      nombre: cliente.nombre_detectado || "Cliente",
      email: cliente.email,
      token: reset_token,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error forgot-password:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
