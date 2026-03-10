import { NextResponse } from "next/server";

const COOKIE_NAME = "fa_rep";
const COOKIE_MAX  = 60 * 60 * 14; // 14 horas (un día de trabajo)

export async function POST(req: Request) {
  const { pin } = await req.json();
  const correctPin = process.env.REPARTIDOR_PIN ?? "1234";

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
