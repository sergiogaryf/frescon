import { NextRequest, NextResponse } from "next/server";
import { ordersTable } from "@/lib/airtable";

/**
 * GET /api/cliente/direcciones?email=...&telefono=...
 * Devuelve las direcciones únicas de pedidos anteriores del cliente.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const telefono = req.nextUrl.searchParams.get("telefono");

  if (!email && !telefono) {
    return NextResponse.json({ direcciones: [] });
  }

  const filters: string[] = [];
  if (email) filters.push(`{cliente_email} = "${email}"`);
  if (telefono) {
    const digits = telefono.replace(/\D/g, "");
    if (digits.length >= 9) {
      filters.push(`FIND("${digits.slice(-9)}", SUBSTITUTE(SUBSTITUTE({telefono}, " ", ""), "+", ""))`);
    }
  }

  if (filters.length === 0) {
    return NextResponse.json({ direcciones: [] });
  }

  const filterByFormula =
    filters.length === 1
      ? filters[0]
      : `OR(${filters.join(", ")})`;

  try {
    const records = await ordersTable
      .select({
        filterByFormula,
        fields: ["direccion", "fecha_pedido"],
        sort: [{ field: "fecha_pedido", direction: "desc" }],
      })
      .all();

    // Extraer direcciones únicas (más reciente primero)
    const seen = new Set<string>();
    const direcciones: string[] = [];

    for (const r of records) {
      const dir = String(r.fields.direccion ?? "").trim();
      if (dir && !seen.has(dir.toLowerCase())) {
        seen.add(dir.toLowerCase());
        direcciones.push(dir);
      }
    }

    return NextResponse.json({ direcciones });
  } catch (e) {
    console.error("Error fetching direcciones:", e);
    return NextResponse.json({ direcciones: [] });
  }
}
