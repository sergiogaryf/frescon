import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { getClienteBySession, updateClienteFields } from "@/lib/airtable";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      const cliente = await getClienteBySession(token);
      if (cliente) {
        await updateClienteFields(cliente.id, { session_token: "" });
      }
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    console.error("Error logout:", e);
    return NextResponse.json({ ok: true });
  }
}
