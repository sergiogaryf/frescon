import { NextResponse } from "next/server";
import { getPedidos } from "@/lib/airtable";

export const dynamic = "force-dynamic";

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

    // Confirmado + Entregado + En camino = pagados
    const pagados    = todos.filter((p) => ["Confirmado", "Entregado", "En camino"].includes(p.estado));
    const pendientes = todos.filter((p) => p.estado === "Pendiente");
    const cancelados = todos.filter((p) => p.estado === "Cancelado");
    const entregados = todos.filter((p) => p.estado === "Entregado");

    const ingresosPagados    = pagados.reduce((s, p) => s + p.total, 0);
    const ingresosPendientes = pendientes.reduce((s, p) => s + p.total, 0);
    const ingresosEntregados = entregados.reduce((s, p) => s + p.total, 0);

    const ticketPromedio = pagados.length > 0
      ? Math.round(ingresosPagados / pagados.length)
      : 0;

    // Top productos (no cancelados)
    const noCancelados = todos.filter((p) => p.estado !== "Cancelado");
    const conteo: Record<string, number> = {};
    for (const p of noCancelados) {
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

    // Normalizar cualquier fecha al jueves más cercano (anterior o mismo día)
    const snapToThursday = (iso: string): string => {
      const d = new Date(iso + "T12:00:00");
      const diff = (d.getDay() - 4 + 7) % 7;
      d.setDate(d.getDate() - diff);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    // Historico agrupado por fecha_entrega (normalizado a jueves)
    const semanales: Record<string, {
      pedidos: number;
      pagados: number;
      pendientes: number;
      ingresosPagados: number;
      ingresosPendientes: number;
    }> = {};
    for (const p of todos) {
      if (p.estado === "Cancelado") continue;
      const raw = p.fecha_entrega?.slice(0, 10) ?? "sin fecha";
      const fecha = raw === "sin fecha" ? raw : snapToThursday(raw);
      if (!semanales[fecha]) semanales[fecha] = { pedidos: 0, pagados: 0, pendientes: 0, ingresosPagados: 0, ingresosPendientes: 0 };
      semanales[fecha].pedidos++;
      if (p.estado === "Pendiente") {
        semanales[fecha].pendientes++;
        semanales[fecha].ingresosPendientes += p.total;
      } else {
        semanales[fecha].pagados++;
        semanales[fecha].ingresosPagados += p.total;
      }
    }
    const semanalesArr = Object.entries(semanales)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([fecha, v]) => ({ fecha, ...v }));

    return NextResponse.json({
      totalPedidos:      todos.length,
      totalPagados:      pagados.length,
      totalEntregados:   entregados.length,
      totalPendientes:   pendientes.length,
      totalCancelados:   cancelados.length,
      ingresosPagados,
      ingresosPendientes,
      ingresosEntregados,
      ticketPromedio,
      porEstado,
      topProductos,
      semanales: semanalesArr,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
