import { NextResponse } from "next/server";
import {
  getMemoriaReciente,
  getMemoriaStats,
  getPedidos,
  PedidoAdmin,
  MemoriaEntry,
} from "@/lib/airtable";

function getLunesYDomingo(): { lunes: string; domingo: string } {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes...
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);
  lunes.setHours(0, 0, 0, 0);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return {
    lunes:   lunes.toISOString().split("T")[0],
    domingo: domingo.toISOString().split("T")[0],
  };
}

function parsearProductos(detalles: string[]): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const detalle of detalles) {
    try {
      // El detalle puede ser JSON o texto plano separado por comas/saltos
      let items: string[] = [];
      if (detalle.trim().startsWith("[") || detalle.trim().startsWith("{")) {
        const parsed = JSON.parse(detalle);
        if (Array.isArray(parsed)) {
          items = parsed.map((p: { nombre?: string; name?: string }) =>
            String(p.nombre ?? p.name ?? p)
          );
        }
      } else {
        items = detalle.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      }
      for (const item of items) {
        const nombre = item.replace(/^\d+x\s*/i, "").trim();
        if (nombre) conteo[nombre] = (conteo[nombre] ?? 0) + 1;
      }
    } catch {
      // Si no se puede parsear, ignorar
    }
  }
  return conteo;
}

function topN<T extends Record<string, number>>(
  obj: T,
  n: number
): Array<{ nombre: string; veces: number }> {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([nombre, veces]) => ({ nombre, veces }));
}

export async function GET() {
  try {
    const { lunes, domingo } = getLunesYDomingo();

    // 1. Pedidos de la semana (todos los estados, filtramos por fecha_entrega en rango)
    const todosPedidos: PedidoAdmin[] = await getPedidos();
    const pedidosSemana = todosPedidos.filter((p) => {
      const fecha = p.fecha_entrega?.split("T")[0] ?? "";
      return fecha >= lunes && fecha <= domingo;
    });

    // 2. Total ingresos estimados
    const totalIngresos = pedidosSemana.reduce((acc, p) => acc + (p.total ?? 0), 0);

    // 3. Productos más pedidos
    const detalles = pedidosSemana
      .map((p) => p.detalle_pedido)
      .filter(Boolean);
    const conteoProdutos = parsearProductos(detalles);
    const productosMasPedidos = topN(conteoProdutos, 10);

    // 4. Perfiles de clientes que contactaron a Celia esta semana
    const memoriaClientes: MemoriaEntry[] = await getMemoriaReciente("cliente", 100);
    const clientesSemana = memoriaClientes.filter((m) => {
      const fecha = m.fecha?.split("T")[0] ?? "";
      return fecha >= lunes && fecha <= domingo;
    });

    // Clientes únicos por sesion_id
    const sesionesUnicas = new Map<string, MemoriaEntry>();
    for (const m of clientesSemana) {
      if (m.sesion_id && !sesionesUnicas.has(m.sesion_id)) {
        sesionesUnicas.set(m.sesion_id, m);
      }
    }
    const perfilesSemana = Array.from(sesionesUnicas.values()).map((m) => ({
      sesion_id:      m.sesion_id,
      perfil:         m.perfil,
      intereses:      m.intereses,
      dieta:          m.dieta,
      signo_zodiacal: m.signo_zodiacal,
      fecha:          m.fecha,
    }));

    // 5. Intereses más frecuentes
    const conteoIntereses: Record<string, number> = {};
    for (const m of clientesSemana) {
      if (m.intereses) {
        const items = m.intereses.split(",").map((s) => s.trim()).filter(Boolean);
        for (const item of items) {
          conteoIntereses[item] = (conteoIntereses[item] ?? 0) + 1;
        }
      }
    }
    const interesesFrecuentes = topN(conteoIntereses, 10);

    // 6. Preguntas sin resolver
    const preguntasSinResolver = memoriaClientes
      .filter((m) => {
        const sinHerramientas = !m.herramientas || m.herramientas.trim() === "";
        const mencionaContacto = /whatsapp|contactar|llamar|teléfono/i.test(m.respuesta);
        return sinHerramientas && mencionaContacto;
      })
      .map((m) => ({
        pregunta: m.pregunta,
        respuesta: m.respuesta.slice(0, 200),
        fecha: m.fecha,
        sesion_id: m.sesion_id,
      }));

    // 7. Stats generales
    const stats = await getMemoriaStats();

    // 8. Top 3 recomendaciones para la próxima semana
    const recomendaciones: string[] = [];

    if (productosMasPedidos.length > 0) {
      recomendaciones.push(
        `Asegurar stock de "${productosMasPedidos[0].nombre}" — fue el producto más solicitado esta semana (${productosMasPedidos[0].veces} pedidos).`
      );
    }

    if (interesesFrecuentes.length > 0) {
      recomendaciones.push(
        `Destacar productos relacionados con "${interesesFrecuentes[0].nombre}" en el catálogo — es el interés más detectado entre clientes esta semana.`
      );
    }

    if (preguntasSinResolver.length > 0) {
      recomendaciones.push(
        `Revisar y resolver ${preguntasSinResolver.length} consultas sin respuesta definitiva donde Celia sugirió contacto manual.`
      );
    } else if (recomendaciones.length < 3) {
      recomendaciones.push(
        `Activar campaña de fidelización: ${pedidosSemana.length} pedidos esta semana. Considera enviar un descuento a clientes frecuentes.`
      );
    }

    return NextResponse.json({
      semana: { lunes, domingo },
      pedidos: {
        total:           pedidosSemana.length,
        total_ingresos:  totalIngresos,
        lista:           pedidosSemana,
        productos_top:   productosMasPedidos,
      },
      clientes_celia: {
        total_interacciones: clientesSemana.length,
        sesiones_unicas:     perfilesSemana.length,
        perfiles:            perfilesSemana,
        intereses_top:       interesesFrecuentes,
      },
      preguntas_sin_resolver: preguntasSinResolver,
      stats_generales:        stats,
      recomendaciones,
    });
  } catch (error) {
    console.error("Error generando informe semanal:", error);
    return NextResponse.json(
      { error: "Error generando informe semanal" },
      { status: 500 }
    );
  }
}
