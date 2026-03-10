import { NextResponse } from "next/server";

const COOKIE_NAME = "fa_admin";
const COOKIE_MAX  = 60 * 60 * 10; // 10 horas

export async function POST(req: Request) {
  const { pin } = await req.json();
  const correctPin = process.env.ADMIN_PIN ?? "frescon2024";

  if (pin === correctPin) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, correctPin, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX,
      path: "/",
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: "PIN incorrecto" }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
