import { NextResponse } from "next/server";
import { getMemoriaReciente } from "@/lib/airtable";

export const dynamic = "force-dynamic";

function contarCampo(registros: Array<Record<string, string>>, campo: string): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const r of registros) {
    const valor = (r[campo] ?? "").trim();
    if (!valor) continue;
    // Si el campo puede tener múltiples valores separados por coma (ej. intereses)
    const partes = valor.split(",").map((v) => v.trim()).filter(Boolean);
    for (const parte of partes) {
      conteo[parte] = (conteo[parte] ?? 0) + 1;
    }
  }
  return conteo;
}

function ordenarConteo(conteo: Record<string, number>): Array<{ valor: string; count: number }> {
  return Object.entries(conteo)
    .map(([valor, count]) => ({ valor, count }))
    .sort((a, b) => b.count - a.count);
}

function recomendacionDelDia(perfiles: Array<{ valor: string; count: number }>): string {
  if (perfiles.length === 0) return "Sin datos suficientes aún.";

  const topPerfil = perfiles[0]?.valor ?? "general";
  const recomendaciones: Record<string, string> = {
    activo:    "Destacar proteínas vegetales, frutas de alto rendimiento energético (plátano, naranja) y verduras frescas de temporada.",
    gym:       "Priorizar batatas, brócoli, espinacas, pechuga y productos proteicos. Armar pack 'Semana fit'.",
    sedentario:"Mostrar kits de ensalada listos para preparar, frutas de fácil consumo y opciones económicas.",
    bailarin:  "Resaltar frutas energéticas, hidratos complejos (papa, arroz) y productos livianos para rendimiento.",
    deportista:"Potenciar cítricos, frutas de rápida energía, ensaladas completas y kits de recuperación.",
    vegano:    "Destacar proteínas vegetales (legumbres, tofu), frutas de temporada y vegetales de hoja verde.",
    vegetariano:"Mostrar huevos, quesos frescos, legumbres y la mayor variedad de verduras.",
  };

  return recomendaciones[topPerfil] ?? `Adaptar oferta al perfil dominante: ${topPerfil}. Revisar stock de productos más consultados.`;
}

function calcularTendencia(
  registros: Array<{ fecha: string; [key: string]: string }>,
  campo: string
): { esta_semana: Record<string, number>; semana_pasada: Record<string, number> } {
  const ahora = new Date();
  const inicioEstaSemana = new Date(ahora);
  inicioEstaSemana.setDate(ahora.getDate() - 7);
  const inicioSemanaPasada = new Date(ahora);
  inicioSemanaPasada.setDate(ahora.getDate() - 14);

  const estaSemana: Array<Record<string, string>> = [];
  const semanaPasada: Array<Record<string, string>> = [];

  for (const r of registros) {
    const fecha = new Date(r.fecha);
    if (fecha >= inicioEstaSemana) {
      estaSemana.push(r);
    } else if (fecha >= inicioSemanaPasada) {
      semanaPasada.push(r);
    }
  }

  return {
    esta_semana:   contarCampo(estaSemana,   campo),
    semana_pasada: contarCampo(semanaPasada, campo),
  };
}

export async function GET() {
  try {
    const registros = await getMemoriaReciente("cliente", 200);

    // Mapear a objeto plano para facilitar el análisis
    const datos = registros.map((r) => ({
      fecha:          r.fecha,
      categoria:      r.categoria,
      pregunta:       r.pregunta,
      perfil:         (r as unknown as Record<string, string>).perfil         ?? "",
      intereses:      (r as unknown as Record<string, string>).intereses      ?? "",
      dieta:          (r as unknown as Record<string, string>).dieta          ?? "",
      signo_zodiacal: (r as unknown as Record<string, string>).signo_zodiacal ?? "",
      sesion_tipo:    (r as unknown as Record<string, string>).sesion_tipo    ?? "",
    }));

    // Conteos
    const perfiles         = ordenarConteo(contarCampo(datos, "perfil"));
    const intereses        = ordenarConteo(contarCampo(datos, "intereses"));
    const dietas           = ordenarConteo(contarCampo(datos, "dieta"));
    const signos           = ordenarConteo(contarCampo(datos, "signo_zodiacal"));
    const categorias       = ordenarConteo(contarCampo(datos, "categoria"));
    const sesiones         = ordenarConteo(contarCampo(datos, "sesion_tipo"));

    // Recomendación del día
    const recomendacion    = recomendacionDelDia(perfiles);

    // Tendencias: categorías esta semana vs semana pasada
    const tendencias       = calcularTendencia(datos, "categoria");

    // Últimas 10 consultas con datos de perfil
    const ultimas_consultas = registros.slice(0, 10).map((r) => ({
      fecha:     r.fecha,
      pregunta:  r.pregunta.slice(0, 120),
      categoria: r.categoria,
      perfil:    (r as unknown as Record<string, string>).perfil      ?? "",
      dieta:     (r as unknown as Record<string, string>).dieta       ?? "",
      sesion_tipo:(r as unknown as Record<string, string>).sesion_tipo ?? "",
    }));

    return NextResponse.json({
      total_registros:  registros.length,
      perfiles,
      intereses,
      dietas,
      signos,
      categorias,
      sesiones,
      recomendacion,
      tendencias,
      ultimas_consultas,
      generado_en: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en celia-insights:", error);
    return NextResponse.json({ error: "Error al obtener insights" }, { status: 500 });
  }
}
