import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getPedidos, getProductos, getMemoriaReciente,
  getMejoras, crearMejora, updateMejora, MejoraUX,
} from "@/lib/airtable";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── GET: Obtiene mejoras existentes ── */
export async function GET() {
  try {
    const mejoras = await getMejoras();
    const stats = {
      total:         mejoras.length,
      pendientes:    mejoras.filter((m) => m.estado === "pendiente").length,
      en_progreso:   mejoras.filter((m) => m.estado === "en_progreso").length,
      implementadas: mejoras.filter((m) => m.estado === "implementado").length,
      ciclo_actual:  mejoras.reduce((max, m) => Math.max(max, m.ciclo), 0),
    };
    return NextResponse.json({ mejoras, stats });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/* ── PATCH: Actualiza estado de una mejora ── */
export async function PATCH(req: Request) {
  const { id, estado } = await req.json();
  if (!id || !estado) return NextResponse.json({ error: "id y estado requeridos" }, { status: 400 });
  try {
    await updateMejora(id, { estado });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/* ── POST: Ejecuta ciclo de análisis UX ── */
export async function POST() {
  try {
    // 1. Recolectar datos del negocio
    const [pedidos, productos, memoriaClientes, mejorasAnteriores] = await Promise.all([
      getPedidos(),
      getProductos(),
      getMemoriaReciente("cliente", 50),
      getMejoras(),
    ]);

    const cicloActual = mejorasAnteriores.reduce((max, m) => Math.max(max, m.ciclo), 0) + 1;

    // 2. Procesar métricas
    const ahora = new Date();
    const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const pedidos30 = pedidos.filter((p) => new Date(p.fecha_pedido) > hace30);

    const estados = pedidos30.reduce<Record<string, number>>((acc, p) => {
      acc[p.estado] = (acc[p.estado] ?? 0) + 1; return acc;
    }, {});

    const ingresoTotal = pedidos30.reduce((s, p) => s + p.total, 0);
    const ticketPromedio = pedidos30.length ? Math.round(ingresoTotal / pedidos30.length) : 0;
    const envioGratis = pedidos30.filter((p) => p.total >= 20000).length;
    const envioConCosto = pedidos30.length - envioGratis;

    // Categorías de preguntas frecuentes de Celia
    const categoriasCelia = memoriaClientes.reduce<Record<string, number>>((acc, m) => {
      acc[m.categoria] = (acc[m.categoria] ?? 0) + 1; return acc;
    }, {});

    // Preguntas más frecuentes
    const preguntasFrecuentes = memoriaClientes.slice(0, 15).map((m) => m.pregunta.slice(0, 150));

    // Productos más vistos/sugeridos
    const productosActivos = productos.filter((p) => p.stock > 0);
    const productosBajoStock = productos.filter((p) => p.stock > 0 && p.stock < 5);

    // Mejoras previas para retroalimentación
    const mejorasPendientes = mejorasAnteriores.filter((m) => m.estado === "pendiente");
    const mejorasImplementadas = mejorasAnteriores.filter((m) => m.estado === "implementado");

    // 3. Construir contexto para el agente
    const contextoNegocio = `
## DATOS NEGOCIO FRESCÓN (últimos 30 días)
- Pedidos totales: ${pedidos30.length}
- Ingresos: $${ingresoTotal.toLocaleString("es-CL")} CLP
- Ticket promedio: $${ticketPromedio.toLocaleString("es-CL")} CLP
- Estados: ${JSON.stringify(estados)}
- Pedidos con envío gratis (>$20k): ${envioGratis} (${pedidos30.length ? Math.round(envioGratis / pedidos30.length * 100) : 0}%)
- Pedidos con costo envío ($3k): ${envioConCosto}
- Productos activos en catálogo: ${productosActivos.length}
- Productos con stock bajo (<5 unidades): ${productosBajoStock.map((p) => p.nombre).join(", ") || "ninguno"}

## ANÁLISIS CHAT CELIA (${memoriaClientes.length} conversaciones)
- Categorías de consultas: ${JSON.stringify(categoriasCelia)}
- Preguntas frecuentes de clientes:
${preguntasFrecuentes.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}

## ARQUITECTURA UX ACTUAL
- Landing page: Hero + secciones misión/visión/catálogo/cómo funciona
- Catálogo: filtro por categoría, cards con precio, botón agregar
- Carrito: sidebar lateral con recomendaciones de productos estrella
- Checkout: nombre, teléfono, dirección, selector de jueves de entrega, código descuento (FRESCON10 10%), referidos (5%), checkbox suscripción semanal, datos transferencia bancaria
- Chat Celia: widget flotante, streaming, tarjetas de productos, mini-carrito integrado, quick replies, pedidos desde chat
- WhatsApp: notificaciones automáticas en pedido confirmado, en camino, entregado, cancelado
- Seguimiento: página pública /seguimiento con polling
- Panel admin: dashboard, pedidos, suscripciones, sesiones, memoria Celia, agente UX
- Repartidor: vista de ruta con mapa, chat, fotos de entrega

## CICLO DE ANÁLISIS: ${cicloActual}
${mejorasImplementadas.length > 0 ? `
## MEJORAS YA IMPLEMENTADAS (${mejorasImplementadas.length}):
${mejorasImplementadas.slice(0, 10).map((m) => `- [${m.categoria}] ${m.titulo}`).join("\n")}
` : ""}
${mejorasPendientes.length > 0 ? `
## MEJORAS PENDIENTES AÚN NO IMPLEMENTADAS (priorizar):
${mejorasPendientes.slice(0, 10).map((m) => `- [${m.prioridad.toUpperCase()}] [${m.categoria}] ${m.titulo}: ${m.descripcion.slice(0, 100)}`).join("\n")}
` : ""}`;

    const SYSTEM_AGENTE = `Eres un experto en UX, conversión e-commerce y growth hacking especializado en pequeños negocios de delivery de alimentos frescos en Chile.

Tu misión: analizar datos reales del negocio Frescón y generar mejoras concretas y priorizadas que maximicen ventas, retención y experiencia de usuario.

CONTEXTO FRESCÓN:
- Delivery semanal (jueves) de frutas/verduras frescas del Valle de Aconcagua a Concón, Chile
- Mercado objetivo: familias y personas saludables en Concón
- Diferenciadores: frescura campo-a-mesa, personalización por perfil, asistente IA Celia
- Modelo: pedidos lun-mié, compra en Quillota jueves mañana, reparto jueves 10-13h
- Pago: solo transferencia bancaria (sin pasarela de pago online)
- Precio envío: gratis sobre $20.000, $3.000 si no

CRITERIOS DE ANÁLISIS:
1. Impacto en conversión (% de visitantes que compran)
2. Impacto en ticket promedio (aumentar valor del carrito)
3. Retención y recurrencia (suscripciones, recompra)
4. Reducción de fricción (simplificar el proceso)
5. Engagement con Celia (más pedidos via chat)
6. Urgencia y escasez (aprovechar ciclo semanal)
7. Social proof y confianza
8. Mobile-first (la mayoría usa celular)

REGLAS PARA MEJORAS:
- Cada mejora debe ser específica, accionable y medible
- Incluir el ARCHIVO exacto de código donde implementar
- Prioridad "alta" = impacto directo en ventas o retención esta semana
- Prioridad "media" = mejora de experiencia con impacto a 30 días
- Prioridad "baja" = optimización a largo plazo
- Si hay mejoras pendientes de ciclos anteriores, inclúyelas con prioridad escalada si son críticas`;

    const prompt = `${contextoNegocio}

Analiza todos los datos anteriores y genera exactamente 8 mejoras UX/conversión para Frescón en este ciclo ${cicloActual}.

Enfócate en:
${cicloActual === 1 ? "- Quick wins: mejoras rápidas de alto impacto\n- Fricción obvia en el checkout\n- CTAs y mensajes clave\n- Urgencia del ciclo semanal" : ""}
${cicloActual === 2 ? "- Personalización basada en perfil de cliente\n- Reactivación de clientes inactivos\n- Upsell y cross-sell\n- Optimización del chat Celia" : ""}
${cicloActual >= 3 ? "- Segmentación avanzada\n- Automatizaciones de retención\n- A/B tests específicos\n- Métricas de largo plazo" : ""}

Responde ÚNICAMENTE con un JSON array de 8 objetos con esta estructura exacta:
[
  {
    "titulo": "Título corto y claro (máx 60 chars)",
    "descripcion": "Qué hacer exactamente (2-3 oraciones)",
    "categoria": "conversion|chat|navegacion|productos|checkout|whatsapp",
    "prioridad": "alta|media|baja",
    "razon": "Por qué esto impacta en ventas/UX con datos del análisis (1-2 oraciones)",
    "implementacion": "Archivo y cambio específico: src/components/X.tsx → agregar/modificar Y",
    "impacto_estimado": "Ej: +15% conversión checkout, -20% abandono carrito"
  }
]`;

    // 4. Llamar a Claude
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 4000,
      system:     SYSTEM_AGENTE,
      messages:   [{ role: "user", content: prompt }],
    });

    const textoRespuesta = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // 5. Parsear JSON
    const jsonMatch = textoRespuesta.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("El agente no devolvió JSON válido");

    const mejorasGeneradas = JSON.parse(jsonMatch[0]) as Omit<MejoraUX, "id" | "estado" | "ciclo" | "fecha">[];

    // 6. Guardar en Airtable
    const fecha = new Date().toISOString();
    const ids: string[] = [];

    for (const mejora of mejorasGeneradas) {
      try {
        const id = await crearMejora({
          ...mejora,
          estado: "pendiente",
          ciclo:  cicloActual,
          fecha,
        });
        ids.push(id);
      } catch {
        // Si falla una, continúa con las demás
      }
    }

    return NextResponse.json({
      ok:      true,
      ciclo:   cicloActual,
      total:   mejorasGeneradas.length,
      guardadas: ids.length,
      mejoras: mejorasGeneradas,
    });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
