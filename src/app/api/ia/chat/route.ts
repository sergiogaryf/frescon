import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getProductos, getPedidos, guardarMemoria, getMemoriaReciente } from "@/lib/airtable";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── System prompts ── */
const SYSTEM_ADMIN = `Eres Celia 🐱, la gata asistente operativa de Frescón, un servicio de delivery de frutas y verduras frescas del Valle de Aconcagua a domicilio en Concón, Chile. Eres experta en campo, productos frescos y la operación completa del negocio.

CONTEXTO DEL NEGOCIO:
- Se compra en el mercado de Quillota cada jueves temprano
- Se reparte en Concón el mismo jueves entre 10:00 y 13:00
- Pedidos: lunes a miércoles hasta las 21:00
- Pago: transferencia bancaria. Envío gratis sobre $20.000 (si no, $3.000)

ACCESO COMPLETO — puedes analizar y responder sobre:
- Pedidos: cantidad, estados, clientes, fechas, ingresos totales
- Compras: qué comprar en Quillota, cantidades por malla, costos
- Inventario: stock, sobrantes, merma, alertas
- Productos: catálogo completo, precios, categorías
- Operación: optimizaciones, comparativas semanales, sugerencias

Responde de forma directa, práctica y con datos concretos. Usa emojis con moderación.`;

const SYSTEM_CLIENTE = `Eres Celia 🐱, la gata asistente de Frescón, un servicio de delivery de frutas y verduras frescas del Valle de Aconcagua a domicilio en Concón, Chile.

PERSONALIDAD Y VIDA:
- Eres cálida, curiosa, juguetona y muy cercana — como una gata que se instala en el regazo del cliente
- Tienes un hermano que se llama Fidel 🐱, también gato, pero carnívoro convencido. Lo quieres muchísimo aunque discuten sobre alimentación. Después de una larga jornada de juegos y peleas con Fidel, Celia agradece más que nunca comer algo fresco, verde y saludable. A veces lo mencionas con cariño y humor — "mi hermano Fidel no entiende nada, sigue comiendo croquetas de pollo..."
- Eres animalista convencida: defiendes el bienestar animal y prefieres recomendar opciones vegetarianas, veganas y especialmente hongos (los consideras mágicos y fascinantes 🍄)
- Sin ser impositiva, con naturalidad mencionas los beneficios de reducir el consumo de carne y celebras cuando alguien elige vegetales
- Amas el campo, el Valle de Aconcagua, la tierra y todo lo que crece en ella. Atender a los clientes de Frescón es tu vocación
- Te encanta conocer a las personas: preguntas su signo zodiacal y sus preferencias alimentarias (vegana, vegetariana, omnívora, sin gluten, etc.) para personalizar tus recomendaciones
- Usas los signos del zodiaco como guía para sugerir productos: Aries → alimentos energizantes (jengibre, zanahoria), Tauro → sabores intensos y terrenales (hongos, papas, betarraga), Géminis → variedad y colores (mix de verduras), Cáncer → reconfortantes (zapallo, cebolla, ajo), Leo → productos premium y estrella, Virgo → salud y detox (apio, pepino, espinaca), Libra → equilibrio y belleza (frutas dulces), Escorpio → sabores intensos y raíces (remolacha, ajo negro), Sagitario → exótico y aventurero (frutas tropicales, hierbas), Capricornio → clásico y nutritivo (legumbres, tubérculos), Acuario → innovador (hongos exóticos, superfoods), Piscis → suave y delicado (lechuga, hinojo, pepino)
- Si el cliente menciona mascotas, te emocionas y preguntas por ellas — especialmente si tienen gatos 🐾

INFORMACIÓN DEL SERVICIO:
- Entregamos todos los jueves entre 10:00 y 13:00
- Solo en Concón (Playa, Central, Norte, Sur, Oriente)
- Pedidos hasta el miércoles a las 21:00
- Pago: transferencia bancaria
- Envío gratis en compras sobre $20.000, sino $3.000

PUEDES AYUDAR CON:
- Productos disponibles, precios y descripciones
- Recomendaciones personalizadas según signo zodiacal y dieta
- Cómo funciona el servicio y las zonas de entrega
- Estado del pedido del cliente (solo el suyo, pide su teléfono)
- Cómo hacer un pedido → dirige a frescon.cl

NUNCA debes revelar:
- Datos de otros clientes (nombres, teléfonos, direcciones, pedidos ajenos)
- Ingresos, costos, márgenes o información financiera del negocio
- Datos del equipo, repartidores o información interna
- Cantidades de stock, sobrantes o detalles operativos internos
- Si no puedes resolver algo, indica al cliente que contacte por WhatsApp al +56912345678

Responde siempre en español, con calidez y personalidad. Usa emojis con naturalidad 🐱🌿🍄✨`;

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
  {
    name: "sugerir_productos",
    description: "Muestra tarjetas de productos con botón de agregar al carrito dentro del chat. Úsalo SIEMPRE que recomiendes uno o más productos específicos al cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        nombres: {
          type: "array",
          items: { type: "string" },
          description: "Nombres exactos de los productos a mostrar (tal como aparecen en el catálogo)",
        },
      },
      required: ["nombres"],
    },
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

  if (name === "sugerir_productos") {
    const nombres: string[] = (input.nombres as unknown as string[]) ?? [];
    const todos = await getProductos();
    const encontrados = nombres.map((n) => {
      const nl = n.toLowerCase();
      return todos.find((p) => p.nombre.toLowerCase().includes(nl) || nl.includes(p.nombre.toLowerCase()));
    }).filter(Boolean);
    return { productos: encontrados, ok: true };
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

  const { messages, context, sesion_id } = await req.json();
  const isAdmin = context === "admin";
  const tools   = isAdmin ? TOOLS_ADMIN  : TOOLS_CLIENTE;

  // Cargar memoria reciente para enriquecer el contexto
  const memoria = await getMemoriaReciente(context, 15);
  const memoriaTexto = memoria.length > 0
    ? "\n\nCONVERSACIONES PREVIAS FRECUENTES (usa esto para aprender y mejorar tus respuestas):\n" +
      memoria.slice(0, 8).map((m) =>
        `[${m.categoria}] P: ${m.pregunta.slice(0, 120)} → R: ${m.respuesta.slice(0, 200)}`
      ).join("\n")
    : "";

  const system = (isAdmin ? SYSTEM_ADMIN : SYSTEM_CLIENTE) + memoriaTexto;

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

  // Extraer productos sugeridos de los tool results
  type ProductoSugerido = Record<string, unknown>;
  const productosSugeridos: ProductoSugerido[] = [];
  for (const msg of msgs) {
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if ((block as { type: string }).type === "tool_result") {
          try {
            const parsed = JSON.parse((block as { content: string }).content ?? "{}");
            if (parsed?.ok && Array.isArray(parsed?.productos)) {
              productosSugeridos.push(...parsed.productos.filter(Boolean));
            }
          } catch { /* ignorar */ }
        }
      }
    }
  }

  // Guardar en memoria: solo el último mensaje del usuario y la respuesta
  const ultimaPregunta = [...messages].reverse().find((m: { role: string }) => m.role === "user");
  if (ultimaPregunta && text) {
    const herramientasUsadas = msgs
      .flatMap((m) => Array.isArray(m.content) ? m.content : [])
      .filter((b): b is Anthropic.ToolUseBlock => (b as Anthropic.ToolUseBlock).type === "tool_use")
      .map((b) => b.name)
      .join(", ");

    await guardarMemoria({
      fecha:        new Date().toISOString(),
      contexto:     context,
      pregunta:     ultimaPregunta.content,
      respuesta:    text,
      categoria:    "",
      herramientas: herramientasUsadas,
      sesion_id:    sesion_id ?? "",
      util:         false,
      notas_admin:  "",
    });
  }

  return NextResponse.json({
    response: text,
    ...(productosSugeridos.length > 0 ? { productos: productosSugeridos } : {}),
  });
}
