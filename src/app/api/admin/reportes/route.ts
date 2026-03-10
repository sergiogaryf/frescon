import { NextResponse } from "next/server";
import { getPedidos } from "@/lib/airtable";

function parsearItems(detalle: string) {
  return detalle.split("\n").flatMap((linea) => {
    const m = linea.match(/^(\d+(?:\.\d+)?)x\s(.+?)\s\(/);
    if (!m) return [];
    return [{ nombre: m[2].trim(), cantidad: parseFloat(m[1]) }];
  });
}

export async function GET() {
  try {
    const todos = await getPedidos();

    const entregados = todos.filter((p) => p.estado === "Entregado");
    const ingresos   = entregados.reduce((s, p) => s + p.total, 0);

    // Top productos
    const conteo: Record<string, number> = {};
    for (const p of todos) {
      for (const { nombre, cantidad } of parsearItems(p.detalle_pedido)) {
        conteo[nombre] = (conteo[nombre] ?? 0) + cantidad;
      }
    }
    const topProductos = Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    // Por estado
    const porEstado: Record<string, number> = {};
    for (const p of todos) {
      porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
    }

    // Últimas 4 semanas (por fecha_entrega)
    const semanales: Record<string, { pedidos: number; ingresos: number }> = {};
    for (const p of todos) {
      const semana = p.fecha_entrega?.slice(0, 10) ?? "sin fecha";
      if (!semanales[semana]) semanales[semana] = { pedidos: 0, ingresos: 0 };
      semanales[semana].pedidos++;
      if (p.estado === "Entregado") semanales[semana].ingresos += p.total;
    }
    const semanalesArr = Object.entries(semanales)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 8)
      .map(([fecha, v]) => ({ fecha, ...v }));

    return NextResponse.json({
      totalPedidos:   todos.length,
      totalEntregados: entregados.length,
      ingresos,
      ticketPromedio: entregados.length > 0 ? Math.round(ingresos / entregados.length) : 0,
      porEstado,
      topProductos,
      semanales: semanalesArr,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
