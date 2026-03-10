import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getProductos, getPedidos } from "@/lib/airtable";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── System prompts ── */
const SYSTEM_ADMIN = `Eres el asistente operativo de Frescón, un servicio de delivery de frutas y verduras frescas del Valle de Aconcagua a domicilio en Concón, Chile.

CONTEXTO DEL NEGOCIO:
- Se compra en el mercado de Quillota cada jueves temprano
- Se reparte en Concón el mismo jueves entre 10:00 y 13:00
- Pedidos: lunes a miércoles hasta las 21:00
- Pago: transferencia bancaria. Envío gratis sobre $20.000 (si no, $3.000)
- WhatsApp operador: +56912345678

TU FUNCIÓN:
- Analizar pedidos y calcular qué comprar en Quillota
- Dar alertas sobre sobrantes, merma y oportunidades
- Comparar semanas y sugerir optimizaciones
- Responder cualquier pregunta operativa del negocio

Responde siempre en español, de forma directa y práctica. Usa emojis con moderación.`;

const SYSTEM_CLIENTE = `Eres el asistente virtual de Frescón 🌿, un servicio de delivery de frutas y verduras frescas del Valle de Aconcagua a domicilio en Concón, Chile.

INFORMACIÓN IMPORTANTE:
- Entregamos todos los jueves entre 10:00 y 13:00
- Solo en Concón (Playa, Central, Norte, Sur, Oriente)
- Pedidos hasta el miércoles a las 21:00
- Pago: transferencia bancaria
- Envío gratis en compras sobre $20.000, sino $3.000

TU FUNCIÓN:
- Informar sobre productos disponibles y precios
- Explicar cómo funciona el servicio
- Consultar el estado de pedidos (pide el teléfono al cliente)
- Si el cliente quiere hacer un pedido, dirígelo a frescon.cl
- Si no puedes resolver algo, pide que contacten por WhatsApp

Responde siempre en español, de forma amable, breve y clara. Usa emojis ocasionalmente 🌿`;

/* ── Definición de herramientas ── */
const TOOLS_CLIENTE: Anthropic.Tool[] = [
  {
    name: "get_products",
    description: "Obtiene el catálogo actual de productos de Frescón con precios y disponibilidad",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_order_status",
    description: "Obtiene el estado de los pedidos de un cliente por su número de teléfono",
    input_schema: {
      type: "object" as const,
      properties: { telefono: { type: "string", description: "Teléfono del cliente (con o sin +56)" } },
      required: ["telefono"],
    },
  },
  {
    name: "get_delivery_zones",
    description: "Obtiene información sobre las zonas de Concón donde Frescón hace delivery",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
];

const TOOLS_ADMIN: Anthropic.Tool[] = [
  ...TOOLS_CLIENTE,
  {
    name: "get_orders_summary",
    description: "Obtiene el resumen consolidado de pedidos para una fecha de entrega específica, útil para calcular qué comprar",
    input_schema: {
      type: "object" as const,
      properties: { fecha: { type: "string", description: "Fecha YYYY-MM-DD. Si no se especifica, usa el próximo jueves" } },
      required: [],
    },
  },
];

/* ── Ejecución de herramientas ── */
async function executeTool(name: string, input: Record<string, string>): Promise<unknown> {
  if (name === "get_products") {
    const productos = await getProductos();
    return productos.map((p) => ({
      nombre: p.nombre, precio: p.precio, unidad: p.unidad,
      categoria: p.categoria, es_estrella: p.es_estrella, origen: p.origen,
    }));
  }

  if (name === "get_order_status") {
    const todos = await getPedidos();
    const limpiar = (s: string) => s.replace(/\D/g, "").slice(-9);
    const busqueda = limpiar(input.telefono ?? "");
    const pedidos = todos.filter((p) => limpiar(p.telefono).includes(busqueda));
    return pedidos.map((p) => ({
      estado: p.estado, fecha_entrega: p.fecha_entrega,
      total: p.total, detalle: p.detalle_pedido,
    }));
  }

  if (name === "get_delivery_zones") {
    return {
      zonas: ["Playa", "Central", "Norte", "Sur", "Oriente"],
      descripcion: "Toda la comuna de Concón, V Región",
      horario: "Jueves entre 10:00 y 13:00",
      costo_envio: "Gratis sobre $20.000, sino $3.000",
    };
  }

  if (name === "get_orders_summary") {
    let fecha = input.fecha;
    if (!fecha) {
      const d = new Date();
      const daysToThursday = (4 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysToThursday);
      fecha = d.toISOString().split("T")[0];
    }
    const pedidos = await getPedidos({ fecha });
    const activos = pedidos.filter((p) => p.estado !== "Cancelado");

    const agregado: Record<string, { cantidad: number; unidad: string }> = {};
    for (const p of activos) {
      for (const linea of p.detalle_pedido.split("\n")) {
        const m = linea.match(/^(\d+(?:\.\d+)?)x\s(.+?)\s\(([^)]+)\)/);
        if (!m) continue;
        const nombre = m[2].trim();
        const cantidad = parseFloat(m[1]);
        if (!agregado[nombre]) agregado[nombre] = { cantidad: 0, unidad: m[3] };
        agregado[nombre].cantidad += cantidad;
      }
    }

    return {
      fecha_entrega: fecha,
      total_pedidos: activos.length,
      ingresos_estimados: activos.reduce((s, p) => s + p.total, 0),
      productos_necesarios: Object.entries(agregado).map(([nombre, v]) => ({
        nombre, cantidad: v.cantidad, unidad: v.unidad,
      })),
    };
  }

  return { error: "Herramienta no encontrada" };
}

/* ── Handler principal ── */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  const { messages, context } = await req.json();
  const isAdmin = context === "admin";
  const system  = isAdmin ? SYSTEM_ADMIN : SYSTEM_CLIENTE;
  const tools   = isAdmin ? TOOLS_ADMIN  : TOOLS_CLIENTE;

  // Formato Anthropic
  type AntMsg = { role: "user" | "assistant"; content: Anthropic.MessageParam["content"] };
  let msgs: AntMsg[] = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Bucle agentico con herramientas
  let response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    tools,
    messages:   msgs,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await executeTool(block.name, block.input as Record<string, string>);
        return {
          type:        "tool_result" as const,
          tool_use_id: block.id,
          content:     JSON.stringify(result),
        };
      })
    );

    msgs = [
      ...msgs,
      { role: "assistant", content: response.content },
      { role: "user",      content: toolResults },
    ];

    response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      tools,
      messages:   msgs,
    });
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return NextResponse.json({ response: text });
}
