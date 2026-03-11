import { NextResponse } from "next/server";
import { memoriaTable } from "@/lib/airtable";

// GET: agrupa registros de CeliaMemoria por sesion_id
export async function GET() {
  try {
    const records = await memoriaTable
      .select({
        sort: [{ field: "fecha", direction: "desc" }],
        maxRecords: 500,
      })
      .all();

    // Agrupar por sesion_id
    const sesiones: Record<string, {
      sesion_id: string;
      contexto: string;
      fecha_inicio: string;
      fecha_fin: string;
      mensajes: Array<{ pregunta: string; respuesta: string; categoria: string; fecha: string; herramientas: string }>;
      perfil?: string;
      dieta?: string;
    }> = {};

    for (const r of records) {
      const sid = String(r.fields.sesion_id ?? "sin_sesion");
      if (!sesiones[sid]) {
        sesiones[sid] = {
          sesion_id: sid,
          contexto: String(r.fields.contexto ?? "cliente"),
          fecha_inicio: String(r.fields.fecha ?? ""),
          fecha_fin: String(r.fields.fecha ?? ""),
          mensajes: [],
          perfil: String(r.fields.perfil ?? ""),
          dieta: String(r.fields.dieta ?? ""),
        };
      }
      sesiones[sid].mensajes.push({
        pregunta: String(r.fields.pregunta ?? ""),
        respuesta: String(r.fields.respuesta ?? ""),
        categoria: String(r.fields.categoria ?? ""),
        fecha: String(r.fields.fecha ?? ""),
        herramientas: String(r.fields.herramientas ?? ""),
      });
      // Actualizar fechas min/max
      const fecha = String(r.fields.fecha ?? "");
      if (fecha > sesiones[sid].fecha_fin) sesiones[sid].fecha_fin = fecha;
      if (fecha < sesiones[sid].fecha_inicio || !sesiones[sid].fecha_inicio) sesiones[sid].fecha_inicio = fecha;
    }

    const lista = Object.values(sesiones).sort((a, b) =>
      b.fecha_fin.localeCompare(a.fecha_fin)
    );

    return NextResponse.json({ sesiones: lista });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
