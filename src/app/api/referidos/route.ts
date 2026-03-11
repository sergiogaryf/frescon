import { NextResponse } from "next/server";
import { getPedidos, perfilesTable } from "@/lib/airtable";

// Genera código determinístico desde teléfono
function generarCodigo(telefono: string, nombre: string): string {
  const tel = telefono.replace(/\D/g, "").slice(-4);
  const nom = nombre.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "X");
  return `FRESC-${nom}-${tel}`;
}

// GET: obtener o generar código para un teléfono
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telefono = searchParams.get("telefono") ?? "";
  if (!telefono) return NextResponse.json({ error: "telefono requerido" }, { status: 400 });

  try {
    // Buscar en Airtable PerfilesCeliaClientes
    const limpio = telefono.replace(/\D/g, "").slice(-9);
    const records = await perfilesTable
      .select({ filterByFormula: `SEARCH("${limpio}", {telefono})`, maxRecords: 1 })
      .all();

    let nombre = "CLI";
    let codigoGuardado: string | undefined;
    let recordId: string | undefined;

    if (records.length > 0) {
      nombre = String(records[0].fields.nombre_detectado ?? "CLI");
      codigoGuardado = String(records[0].fields.codigo_referido ?? "");
      recordId = records[0].id;
    }

    const codigo = codigoGuardado || generarCodigo(limpio, nombre);

    // Guardar código si no tenía
    if (recordId && !codigoGuardado) {
      await perfilesTable.update(recordId, { codigo_referido: codigo } as unknown as Record<string, string | number | boolean>);
    } else if (!recordId) {
      await perfilesTable.create({
        telefono: limpio,
        codigo_referido: codigo,
        primer_contacto: new Date().toISOString(),
        ultimo_contacto: new Date().toISOString(),
        total_conversaciones: 0,
      } as unknown as Record<string, string | number | boolean>);
    }

    // Contar cuántos pedidos usaron este código
    const todos = await getPedidos();
    const pedidosReferidos = todos.filter(p => {
      const notas = p.notas ?? "";
      return notas.includes(`referido:${codigo}`) || notas.includes(codigo);
    });

    const descuento_pendiente = Number(records[0]?.fields.descuento_pendiente ?? 0);

    return NextResponse.json({
      codigo,
      total_referidos: pedidosReferidos.length,
      descuento_pct: 5,
      descuento_pendiente,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: validar código de referido en checkout
export async function POST(req: Request) {
  const { codigo } = await req.json();
  if (!codigo) return NextResponse.json({ valido: false });

  try {
    const upper = codigo.trim().toUpperCase();
    if (!upper.startsWith("FRESC-")) {
      return NextResponse.json({ valido: false, error: "Código inválido" });
    }

    // Verificar que el código existe en Airtable
    const records = await perfilesTable
      .select({ filterByFormula: `{codigo_referido} = "${upper}"`, maxRecords: 1 })
      .all();

    if (!records.length) {
      return NextResponse.json({ valido: false, error: "Código no encontrado" });
    }

    const nombre = String(records[0].fields.nombre_detectado ?? "un amigo");
    return NextResponse.json({
      valido: true,
      descuento_pct: 5,
      mensaje: `¡Código de ${nombre} aplicado! Ambos obtienen 5% de descuento 🎉`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PUT: canjear descuento pendiente (lo consume y retorna el % acumulado)
export async function PUT(req: Request) {
  const { telefono } = await req.json();
  if (!telefono) return NextResponse.json({ error: "telefono requerido" }, { status: 400 });

  try {
    const limpio = telefono.replace(/\D/g, "").slice(-9);
    const records = await perfilesTable
      .select({ filterByFormula: `SEARCH("${limpio}", {telefono})`, maxRecords: 1 })
      .all();

    if (!records.length) return NextResponse.json({ descuento: 0 });

    const descuento = Number(records[0].fields.descuento_pendiente ?? 0);
    if (descuento <= 0) return NextResponse.json({ descuento: 0 });

    // Consumir el descuento
    await perfilesTable.update(records[0].id, {
      descuento_pendiente: 0,
    } as unknown as Record<string, string | number | boolean>);

    return NextResponse.json({ descuento });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
