import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CHAT_FILE = join("/tmp", "repartidor-chat.json");

interface ChatMsg {
  role: "admin" | "repartidor";
  texto: string;
  hora: string;
}

function leerMensajes(): ChatMsg[] {
  try {
    if (!existsSync(CHAT_FILE)) return [];
    return JSON.parse(readFileSync(CHAT_FILE, "utf-8"));
  } catch { return []; }
}

function guardarMensajes(msgs: ChatMsg[]) {
  writeFileSync(CHAT_FILE, JSON.stringify(msgs.slice(-50)), "utf-8");
}

export async function GET() {
  return NextResponse.json({ mensajes: leerMensajes() });
}

export async function POST(req: Request) {
  const { texto, role } = await req.json();
  if (!texto || !role) return NextResponse.json({ error: "texto y role requeridos" }, { status: 400 });

  const msgs = leerMensajes();
  msgs.push({
    role,
    texto: String(texto).slice(0, 500),
    hora: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" }),
  });
  guardarMensajes(msgs);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  guardarMensajes([]);
  return NextResponse.json({ ok: true });
}
