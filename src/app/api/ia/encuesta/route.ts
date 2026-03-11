import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

const perfilesTable = base("PerfilesCeliaClientes");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      telefono,
      sesion_id,
      puntuacion,
      comentario,
    }: {
      telefono:   string;
      sesion_id?: string;
      puntuacion: number;
      comentario?: string;
    } = body;

    if (!telefono || puntuacion === undefined) {
      return NextResponse.json(
        { ok: false, error: "telefono y puntuacion son requeridos" },
        { status: 400 }
      );
    }

    const puntaje = Math.max(1, Math.min(5, Number(puntuacion)));

    // Buscar si ya existe un registro con ese teléfono
    const existentes = await perfilesTable
      .select({
        filterByFormula: `{telefono} = "${telefono}"`,
        maxRecords: 1,
      })
      .all();

    if (existentes.length > 0) {
      // Actualizar el registro existente
      const campos: Record<string, unknown> = {
        encuesta_satisfaccion: puntaje,
        ultimo_contacto:       new Date().toISOString(),
      };
      if (comentario) {
        const notasActuales = String(existentes[0].fields.notas ?? "");
        const nuevaNota = `[${new Date().toLocaleDateString("es-CL")}] Encuesta (${puntaje}/5): ${comentario}`;
        campos.notas = notasActuales
          ? `${notasActuales}\n${nuevaNota}`
          : nuevaNota;
      }
      await perfilesTable.update(existentes[0].id, campos as Record<string, string | number>);
    } else {
      // Crear nuevo registro con los datos disponibles
      const campos: Record<string, unknown> = {
        telefono,
        encuesta_satisfaccion: puntaje,
        primer_contacto:       new Date().toISOString(),
        ultimo_contacto:       new Date().toISOString(),
      };
      if (sesion_id) {
        // sesion_id no es un campo de la tabla, se omite
      }
      if (comentario) {
        campos.notas = `[${new Date().toLocaleDateString("es-CL")}] Encuesta (${puntaje}/5): ${comentario}`;
      }
      await perfilesTable.create(campos as Record<string, string | number>);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error guardando encuesta:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al guardar encuesta" },
      { status: 500 }
    );
  }
}
