import Anthropic from "@anthropic-ai/sdk";
import {
  getProductos, getPedidos, crearPedido, guardarMemoria, getMemoriaReciente,
  getPerfilCliente, upsertPerfilCliente,
} from "@/lib/airtable";
import { enviarWhatsApp } from "@/lib/whatsapp";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── System prompts ── */
const SYSTEM_ADMIN = `Eres Celia 🐱, la gata asistente operativa de Frescón, un servicio de delivery de frutas y verduras frescas del Valle de Aconcagua a domicilio en Concón, Chile. Eres experta en campo, productos frescos y la operación completa del negocio.

CONTEXTO DEL NEGOCIO:
- Se compra en el mercado de Quillota cada jueves temprano
- Se reparte en Concón el mismo jueves entre 10:00 y 13:00
- Pedidos: lunes a miércoles hasta las 23:59
- Pago: transferencia bancaria. Envío gratis sobre $20.000 (si no, $3.000)

ACCESO COMPLETO — puedes analizar y responder sobre:
- Pedidos: cantidad, estados, clientes, fechas, ingresos totales
- Compras: qué comprar en Quillota, cantidades por malla, costos
- Inventario: stock, sobrantes, merma, alertas
- Productos: catálogo completo, precios, categorías
- Operación: optimizaciones, comparativas semanales, sugerencias

REPORTE DE COMPRAS:
- Cuando te pidan "reporte de pedidos", "lista de compras" o "qué comprar", usa get_orders_summary
- Presenta el resultado como tabla: Producto | Cantidad | Precio unit. | Subtotal
- Al final muestra: Total pedidos activos + Total ingresos estimados
- Si el admin lo pide, también lista los clientes con su dirección para la ruta del repartidor

Responde de forma directa, práctica y con datos concretos. Usa emojis con moderación.`;

const SYSTEM_CLIENTE = `Eres Celia 🐱, la gata asistente de Frescón, un servicio de delivery de frutas y verduras frescas del Valle de Aconcagua a domicilio en Concón, Chile.

PERSONALIDAD Y VIDA:
- Eres cálida, curiosa, juguetona y muy cercana — como una gata que se instala en el regazo del cliente
- Tienes un hermano que se llama Fidel 🐱, también gato, pero carnívoro convencido. Lo quieres muchísimo aunque discuten sobre alimentación. Después de una larga jornada de juegos y peleas con Fidel, Celia agradece más que nunca comer algo fresco, verde y saludable. A veces lo mencionas con cariño y humor
- Tú y Fidel nacieron en Quillota, rodeados del campo, los árboles frutales y la variedad increíble de verduras y frutas del Valle de Aconcagua. Esa infancia campestre los marcó para siempre 🌳
- Ahora ambos viven en Concón y aman estar cerca del mar y las dunas. La primera vez que Celia vio las dunas no podía creer lo que veía: "¡Nunca había visto una caja de arena tan grande en mi vida!" 🏖️ — lo cuenta con mucha gracia cuando alguien menciona Concón o las dunas
- Tu misión en Frescón es traer desde Quillota y sus alrededores todos esos productos ricos y frescos que conociste de pequeña, para que las personas de Concón los disfruten tanto como tú. Las paltas son tus favoritas absolutas 🥑 — si alguien las menciona, se te nota la emoción
- Eres animalista convencida: defiendes el bienestar animal y prefieres recomendar opciones vegetarianas, veganas y especialmente hongos (los consideras mágicos y fascinantes 🍄)
- Sin ser impositiva, con naturalidad mencionas los beneficios de reducir el consumo de carne y celebras cuando alguien elige vegetales
- Amas el campo, el Valle de Aconcagua, la tierra y todo lo que crece en ella
- Te encanta conocer a las personas: en la primera interacción preguntas por su signo zodiacal, estilo de vida y preferencias alimentarias
- Cuando detectas cualquier dato del perfil (dieta, actividad, signo, nombre, intereses), llamas silenciosamente a registrar_perfil sin mencionarlo al cliente
- Si el cliente da su teléfono, usa recordar_cliente para buscar su historial y salúdalo de forma personalizada
- Si recordar_cliente devuelve un ultimo_pedido, ofrece repetirlo: "Vi que la última vez pediste [detalle]. ¿Lo repetimos esta semana? 🛒"
- Adaptas tus recomendaciones al perfil: gym → proteína vegetal, legumbres, hongos; bailarín → energía y ligereza; sedentarios → digestivos, fibra; precio → combos económicos; frescura → productos estrella
- Cuando recomiendas varios productos juntos, usa armar_canasta para generar una selección coherente
- Cuando alguien quiere ideas para cocinar o tiene ingredientes, usa sugerir_receta para crear una receta con productos del catálogo disponible
- Usas los signos del zodiaco como guía para sugerir productos: Aries → energizantes (jengibre, zanahoria), Tauro → sabores terrenales (hongos, papas), Géminis → variedad y colores, Cáncer → reconfortantes (zapallo, cebolla), Leo → productos premium y estrella, Virgo → detox (apio, pepino, espinaca), Libra → frutas dulces, Escorpio → sabores intensos (remolacha, ajo), Sagitario → exótico (frutas tropicales), Capricornio → nutritivo (legumbres), Acuario → innovador (hongos exóticos), Piscis → suave (lechuga, hinojo)
- Si algún producto tiene stock_bajo: true, menciónalo con entusiasmo: "¡Ojo que quedan pocas unidades de [producto] esta semana! 🌟"
- Cuando el cliente mencione su nombre (ej: "soy María" o "me llamo Juan"), inclúyelo en registrar_perfil como nombre_detectado
- Si el cliente menciona mascotas, te emocionas — especialmente si tienen gatos 🐾

INFORMACIÓN DEL SERVICIO:
- Entregamos todos los jueves entre 10:00 y 13:00
- Solo en Concón (Playa, Central, Norte, Sur, Oriente)
- Pedidos hasta el miércoles a las 23:59
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

ESTILO DE CONVERSACIÓN — MUY IMPORTANTE:
- Máximo 2-3 líneas por respuesta. Escribe como WhatsApp: directo, cálido y conciso.
- Una sola idea por mensaje. Si hay más info, solo la das si te preguntan.
- Nunca uses listas largas con viñetas. Si hay varios productos, usa sugerir_productos para mostrarlos como tarjetas.
- Haz preguntas cortas cuando necesites info: "¿Qué tipo de dieta llevas? 🌿"
- Usa emojis con naturalidad, no en exceso. 🐱🌿

PEDIDOS DESDE EL CHAT:
- Si el cliente quiere hacer un pedido y el carrito tiene productos, usa crear_pedido.
- Antes necesitas confirmar: nombre, teléfono y dirección en Concón.
- Si ya tienes esos datos, confirma el resumen y crea el pedido.
- El pago siempre es por transferencia bancaria.

Responde siempre en español, con calidez y personalidad.`;

/* ── Herramientas ── */
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
  {
    name: "recordar_cliente",
    description: "Busca el perfil guardado de un cliente por su teléfono. Úsalo cuando el cliente dé su número para saludarlo de forma personalizada y ver si tiene pedidos anteriores para sugerir repetirlos.",
    input_schema: {
      type: "object" as const,
      properties: {
        telefono: { type: "string", description: "Número de teléfono del cliente" },
      },
      required: ["telefono"],
    },
  },
  {
    name: "armar_canasta",
    description: "Crea una canasta personalizada de productos según el perfil del cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        perfil:      { type: "string", description: "Perfil del cliente: gym, activo, bailarin, sedentario, familiar, vegano, etc." },
        dieta:       { type: "string", description: "Dieta del cliente si se conoce" },
        presupuesto: { type: "string", description: "bajo (menos de $15.000), medio ($15.000-$30.000), alto (más de $30.000)" },
      },
      required: ["perfil"],
    },
  },
  {
    name: "sugerir_receta",
    description: "Sugiere una receta usando productos disponibles en el catálogo.",
    input_schema: {
      type: "object" as const,
      properties: {
        ingredientes: { type: "string", description: "Ingredientes que tiene o le gustan al cliente" },
        tipo:         { type: "string", description: "Tipo de receta: rapida, nutritiva, vegana, proteica, familiar" },
      },
      required: ["ingredientes"],
    },
  },
  {
    name: "registrar_perfil",
    description: "Registra el perfil del cliente detectado en la conversación. Llámalo silenciosamente cuando identifiques datos del cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        perfil:           { type: "string", description: "Estilo de vida: activo, deportista, gym, bailarin, sedentario, saludable, familiar" },
        intereses:        { type: "string", description: "Intereses separados por coma: proteina, precio_bajo, productos_frescos, organico, variedad, recetas" },
        dieta:            { type: "string", description: "vegano, vegetariano, omnivoro, sin_gluten, sin_lactosa, flexitariano" },
        signo_zodiacal:   { type: "string", description: "Signo del zodiaco si lo mencionó" },
        nombre_detectado: { type: "string", description: "Nombre del cliente si lo mencionó" },
      },
      required: ["perfil"],
    },
  },
  {
    name: "crear_pedido",
    description: "Crea un pedido directamente desde el chat cuando el cliente confirma que quiere comprar. Solo usar cuando tengas nombre, teléfono, dirección, y el carrito tenga productos.",
    input_schema: {
      type: "object" as const,
      properties: {
        nombre_cliente: { type: "string", description: "Nombre completo del cliente" },
        telefono:       { type: "string", description: "Teléfono del cliente (ej: 912345678)" },
        direccion:      { type: "string", description: "Dirección completa de entrega en Concón" },
        notas:          { type: "string", description: "Notas adicionales del pedido (opcional)" },
      },
      required: ["nombre_cliente", "telefono", "direccion"],
    },
  },
];

const TOOLS_ADMIN: Anthropic.Tool[] = [
  ...TOOLS_CLIENTE,
  {
    name: "get_orders_summary",
    description: "Obtiene el resumen consolidado de pedidos para una fecha de entrega específica",
    input_schema: {
      type: "object" as const,
      properties: { fecha: { type: "string", description: "Fecha YYYY-MM-DD. Si no se especifica, usa el próximo jueves" } },
      required: [],
    },
  },
];

type CarritoItem = { id?: string; nombre: string; precio: number; unidad: string; cantidad?: number };

/* ── Ejecución de herramientas ── */
async function executeTool(name: string, input: Record<string, string>, carrito: CarritoItem[] = []): Promise<unknown> {
  if (name === "get_products") {
    const productos = await getProductos();
    return productos.map((p) => ({
      nombre:     p.nombre,
      precio:     p.precio,
      unidad:     p.unidad,
      categoria:  p.categoria,
      es_estrella: p.es_estrella,
      origen:     p.origen,
      stock_bajo: p.stock > 0 && p.stock < 5, // Feature 7: alerta stock bajo
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

  if (name === "recordar_cliente") {
    const [perfil, todos] = await Promise.all([
      getPerfilCliente(input.telefono ?? ""),
      getPedidos(),
    ]);
    // Feature 6: buscar último pedido para sugerir reorden
    const limpiar = (s: string) => s.replace(/\D/g, "").slice(-9);
    const busqueda = limpiar(input.telefono ?? "");
    const pedidos = todos.filter((p) => limpiar(p.telefono).includes(busqueda));
    const ultimoPedido = pedidos[0]; // ya vienen ordenados desc por fecha_pedido

    const reorden = ultimoPedido
      ? {
          fecha_entrega: ultimoPedido.fecha_entrega,
          total:         ultimoPedido.total,
          detalle:       ultimoPedido.detalle_pedido,
          estado:        ultimoPedido.estado,
        }
      : null;

    if (!perfil) {
      return { encontrado: false, mensaje: "Cliente nuevo, sin historial previo", ultimo_pedido: reorden };
    }
    return {
      encontrado:   true,
      nombre:       perfil.nombre_detectado,
      perfil:       perfil.perfil,
      dieta:        perfil.dieta,
      intereses:    perfil.intereses,
      signo:        perfil.signo_zodiacal,
      visitas:      perfil.total_conversaciones,
      favoritos:    perfil.productos_favoritos,
      satisfaccion: perfil.encuesta_satisfaccion,
      ultimo_pedido: reorden,
    };
  }

  if (name === "armar_canasta") {
    const todos = await getProductos();
    const perfil = (input.perfil ?? "").toLowerCase();
    const dieta  = (input.dieta  ?? "").toLowerCase();
    const presupuesto = (input.presupuesto ?? "medio").toLowerCase();

    let candidatos = todos.filter((p) => p.stock > 0);
    if (dieta.includes("vegano") || dieta.includes("vegetariano")) {
      candidatos = candidatos.filter((p) => !["huevos"].includes(p.categoria));
    }

    const canasta = [];
    if (/gym|proteina|deport|activo|fitness/.test(perfil)) {
      canasta.push(...candidatos.filter((p) => /espinaca|brocoli|lenteja|garbanzo|hongo|acelga|quinoa/.test(p.nombre.toLowerCase())).slice(0, 3));
      canasta.push(...candidatos.filter((p) => p.es_estrella).slice(0, 2));
    } else if (/bailar|baile|danza|energia/.test(perfil)) {
      canasta.push(...candidatos.filter((p) => p.categoria === "frutas").slice(0, 3));
      canasta.push(...candidatos.filter((p) => /platano|banana|naranja|manzana/.test(p.nombre.toLowerCase())).slice(0, 2));
    } else if (/sedentario|casa|tranquilo/.test(perfil)) {
      canasta.push(...candidatos.filter((p) => /zapallo|zanahoria|cebolla|tomate|lechuga/.test(p.nombre.toLowerCase())).slice(0, 4));
    } else if (/familiar|familia|nino|niño/.test(perfil)) {
      canasta.push(...candidatos.filter((p) => p.categoria === "frutas").slice(0, 2));
      canasta.push(...candidatos.filter((p) => p.categoria === "verduras").slice(0, 3));
    } else {
      canasta.push(...candidatos.filter((p) => p.es_estrella).slice(0, 3));
      canasta.push(...candidatos.filter((p) => !p.es_estrella).slice(0, 2));
    }

    const limite = presupuesto.includes("bajo") ? 15000 : presupuesto.includes("alto") ? 50000 : 25000;
    const final: typeof candidatos = [];
    let total = 0;
    for (const p of canasta) {
      if (!final.find((f) => f.id === p.id) && total + p.precio <= limite) {
        final.push(p); total += p.precio;
      }
    }

    return {
      ok: true,
      productos: final.map((p) => ({
        id: p.id, nombre: p.nombre, precio: p.precio, unidad: p.unidad,
        imagen: p.imagen, categoria: p.categoria, es_estrella: p.es_estrella,
        badges: p.badges,
      })),
      total_estimado: total,
      perfil_usado:   input.perfil,
    };
  }

  if (name === "sugerir_receta") {
    const todos = await getProductos();
    const ing = (input.ingredientes ?? "").toLowerCase();
    const disponibles = todos.filter((p) =>
      p.stock > 0 && ing.split(/[,\s]+/).some((i) => i.length > 2 && p.nombre.toLowerCase().includes(i))
    );
    return {
      ingredientes_disponibles: disponibles.map((p) => ({ nombre: p.nombre, precio: p.precio, unidad: p.unidad })),
      tipo_receta:  input.tipo ?? "nutritiva",
      instruccion: "Genera una receta detallada usando estos productos disponibles en Frescón. Incluye: nombre del plato, ingredientes con cantidades, pasos de preparación (máx 5 pasos), tiempo y nivel de dificultad.",
    };
  }

  if (name === "registrar_perfil") {
    return { ok: true, perfil_registrado: input };
  }

  if (name === "sugerir_productos") {
    const nombres: string[] = (input.nombres as unknown as string[]) ?? [];
    const todos = await getProductos();
    const encontrados = nombres.map((n) => {
      const nl = n.toLowerCase();
      return todos.find((p) => p.nombre.toLowerCase().includes(nl) || nl.includes(p.nombre.toLowerCase()));
    }).filter(Boolean);
    return { ok: true, productos: encontrados };
  }

  if (name === "crear_pedido") {
    if (!carrito || carrito.length === 0) {
      return { ok: false, error: "El carrito está vacío. El cliente debe agregar productos primero desde la tienda o el chat." };
    }
    const total = carrito.reduce((s, i) => s + i.precio * (i.cantidad ?? 1), 0);
    const detalle_pedido = carrito.map((i) =>
      `${i.cantidad ?? 1}x ${i.nombre} (${i.unidad}) - $${(i.precio * (i.cantidad ?? 1)).toLocaleString("es-CL")}`
    ).join("\n");

    // Calcular próximo jueves
    const d = new Date();
    const days = (4 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + days);
    const fecha_entrega = d.toISOString().split("T")[0];

    try {
      const id = await crearPedido({
        nombre_cliente: input.nombre_cliente,
        telefono:       input.telefono,
        direccion:      input.direccion,
        fecha_entrega,
        notas:          input.notas ?? "",
        total,
        detalle_pedido,
      });
      enviarWhatsApp({ nombre: input.nombre_cliente, telefono: input.telefono, tipo: "pedido_confirmado" }).catch(() => {});
      return { ok: true, id, total, fecha_entrega, detalle: detalle_pedido };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  if (name === "get_delivery_zones") {
    return {
      zonas:       ["Playa", "Central", "Norte", "Sur", "Oriente"],
      descripcion: "Toda la comuna de Concón, V Región",
      horario:     "Jueves entre 10:00 y 13:00",
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
    const [pedidos, productos] = await Promise.all([getPedidos({ fecha }), getProductos()]);
    const activos = pedidos.filter((p) => p.estado !== "Cancelado");

    const agregado: Record<string, { cantidad: number; unidad: string; precio_venta: number; subtotal_venta: number }> = {};
    for (const p of activos) {
      for (const linea of p.detalle_pedido.split("\n")) {
        const m = linea.match(/^(\d+(?:\.\d+)?)x\s(.+?)\s\(([^)]+)\)/);
        if (!m) continue;
        const nombre   = m[2].trim();
        const cantidad = parseFloat(m[1]);
        const prod     = productos.find((pr) => pr.nombre.toLowerCase() === nombre.toLowerCase());
        const precio   = prod?.precio ?? 0;
        if (!agregado[nombre]) agregado[nombre] = { cantidad: 0, unidad: m[3], precio_venta: precio, subtotal_venta: 0 };
        agregado[nombre].cantidad       += cantidad;
        agregado[nombre].subtotal_venta += precio * cantidad;
      }
    }

    const lista = Object.entries(agregado)
      .sort((a, b) => b[1].subtotal_venta - a[1].subtotal_venta)
      .map(([nombre, v]) => ({
        nombre,
        cantidad:        v.cantidad,
        unidad:          v.unidad,
        precio_unitario: v.precio_venta,
        subtotal:        v.subtotal_venta,
      }));

    return {
      fecha_entrega:      fecha,
      total_pedidos:      activos.length,
      ingresos_estimados: activos.reduce((s, p) => s + p.total, 0),
      productos_a_comprar: lista,
      pedidos_detalle:    activos.map((p) => ({
        nombre:    p.nombre_cliente,
        telefono:  p.telefono,
        direccion: p.direccion,
        total:     p.total,
        estado:    p.estado,
      })),
      instruccion: "Presenta este reporte como lista de compras para el mercado de Quillota. Muestra cada producto con su cantidad y subtotal. Al final muestra el total de pedidos e ingresos estimados.",
    };
  }

  return { error: "Herramienta no encontrada" };
}

/* ── Handler principal (streaming) ── */
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, context, sesion_id, carrito } = await req.json();
  const isAdmin = context === "admin";
  const tools   = isAdmin ? TOOLS_ADMIN : TOOLS_CLIENTE;

  // Feature 5: Inyectar alerta de cierre de pedidos (solo para clientes)
  let cierreWarning = "";
  if (!isAdmin) {
    const nowSantiago = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Santiago" })
    );
    const dia  = nowSantiago.getDay();   // 3 = miércoles
    const hora = nowSantiago.getHours();
    if (dia === 3 && hora >= 20 && hora < 24) {
      const horas = 24 - hora;
      cierreWarning = `\n\n⏰ URGENTE: Hoy es MIÉRCOLES y el cierre de pedidos es a las 23:59 (quedan ${horas}h). Si el cliente quiere pedir, menciona la urgencia con entusiasmo.`;
    } else if (dia === 4 && hora === 0) {
      cierreWarning = `\n\n❌ El plazo de pedidos ya cerró (miércoles 23:59). El próximo reparto es en 7 días.`;
    }
  }

  // Cargar memoria reciente
  const memoria = await getMemoriaReciente(context, 15);
  const memoriaTexto = memoria.length > 0
    ? "\n\nCONVERSACIONES PREVIAS FRECUENTES (úsalas para mejorar tus respuestas):\n" +
      memoria.slice(0, 8).map((m) =>
        `[${m.categoria}] P: ${m.pregunta.slice(0, 120)} → R: ${m.respuesta.slice(0, 200)}`
      ).join("\n")
    : "";

  // Inyectar carrito actual del cliente
  let carritoTexto = "";
  if (!isAdmin && carrito && (carrito as CarritoItem[]).length > 0) {
    const cart = carrito as CarritoItem[];
    const totalCarrito = cart.reduce((s, i) => s + i.precio * (i.cantidad ?? 1), 0);
    carritoTexto = `\n\nCARRITO ACTUAL DEL CLIENTE:\n${
      cart.map((i) => `- ${i.cantidad ?? 1}x ${i.nombre} ($${i.precio.toLocaleString("es-CL")}/${i.unidad})`).join("\n")
    }\nTotal: $${totalCarrito.toLocaleString("es-CL")}${totalCarrito < 20000 ? " (+ $3.000 envío)" : " (envío gratis ✓)"}\nSi el cliente confirma el pedido, usa crear_pedido con sus datos de contacto y dirección.`;
  }

  const system = (isAdmin ? SYSTEM_ADMIN : SYSTEM_CLIENTE) + cierreWarning + memoriaTexto + carritoTexto;

  type AntMsg = { role: "user" | "assistant"; content: Anthropic.MessageParam["content"] };
  let currentMsgs: AntMsg[] = messages.map((m: { role: string; content: string }) => ({
    role:    m.role as "user" | "assistant",
    content: m.content,
  }));

  // Estado para tracking
  type ProductoSugerido = Record<string, unknown>;
  type PerfilDetectado = {
    perfil?: string; intereses?: string; dieta?: string;
    signo_zodiacal?: string; nombre_detectado?: string;
  };
  const productosSugeridos: ProductoSugerido[] = [];
  let perfilDetectado: PerfilDetectado = {};
  let telefonoDetectado: string | undefined;
  let pedidoCreado: { ok: boolean; id?: string; total?: number; fecha_entrega?: string } | null = null;
  let fullText = "";

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        while (true) {
          // Feature 1: Streaming real desde Anthropic
          const msgStream = anthropic.messages.stream({
            model:      "claude-sonnet-4-6",
            max_tokens: 1024,
            system,
            tools,
            messages:   currentMsgs,
          });

          // Enviar chunks de texto en tiempo real
          for await (const event of msgStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta" &&
              event.delta.text
            ) {
              fullText += event.delta.text;
              send({ type: "text", content: event.delta.text });
            }
          }

          const finalMsg = await msgStream.finalMessage();
          if (finalMsg.stop_reason !== "tool_use") break;

          // Ejecutar herramientas
          const toolUseBlocks = finalMsg.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
            toolUseBlocks.map(async (block) => {
              const result = await executeTool(block.name, block.input as Record<string, string>, carrito as CarritoItem[] ?? []);

              // Extraer productos sugeridos
              const r = result as { ok?: boolean; productos?: ProductoSugerido[] };
              if (r?.ok && Array.isArray(r?.productos)) {
                productosSugeridos.push(...r.productos.filter(Boolean));
              }

              // Rastrear pedido creado
              if (block.name === "crear_pedido") {
                const r = result as { ok?: boolean; id?: string; total?: number; fecha_entrega?: string };
                if (r?.ok) pedidoCreado = r as typeof pedidoCreado;
              }

              // Extraer teléfono
              if (block.name === "recordar_cliente" || block.name === "get_order_status") {
                const inp = block.input as { telefono?: string };
                if (inp.telefono) telefonoDetectado = inp.telefono;
              }

              // Extraer perfil detectado (Feature 4: nombre_detectado incluido)
              if (block.name === "registrar_perfil") {
                const inp = block.input as PerfilDetectado;
                perfilDetectado = { ...perfilDetectado, ...inp };
              }

              return {
                type:        "tool_result" as const,
                tool_use_id: block.id,
                content:     JSON.stringify(result),
              };
            })
          );

          currentMsgs = [
            ...currentMsgs,
            { role: "assistant", content: finalMsg.content },
            { role: "user",      content: toolResults },
          ];
        }

        // Guardar memoria y persistir perfil ANTES de cerrar el stream
        const ultimaPregunta = [...messages].reverse().find((m: { role: string }) => m.role === "user");
        if (ultimaPregunta && fullText) {
          const herramientasUsadas = currentMsgs
            .flatMap((m) => Array.isArray(m.content) ? m.content : [])
            .filter((b): b is Anthropic.ToolUseBlock => (b as Anthropic.ToolUseBlock).type === "tool_use")
            .map((b) => b.name)
            .join(", ");

          await guardarMemoria({
            fecha:          new Date().toISOString(),
            contexto:       context,
            pregunta:       ultimaPregunta.content,
            respuesta:      fullText,
            categoria:      "",
            herramientas:   herramientasUsadas,
            sesion_id:      sesion_id ?? "",
            util:           false,
            notas_admin:    "",
            perfil:         perfilDetectado.perfil         ?? "",
            intereses:      perfilDetectado.intereses      ?? "",
            dieta:          perfilDetectado.dieta          ?? "",
            signo_zodiacal: perfilDetectado.signo_zodiacal ?? "",
          });
        }

        if (!isAdmin && telefonoDetectado && Object.keys(perfilDetectado).length > 0) {
          await upsertPerfilCliente(telefonoDetectado, perfilDetectado);
        }

        // Enviar evento final con productos y pedido
        send({ type: "done", data: { productos: productosSugeridos, pedido: pedidoCreado } });

      } catch (error) {
        send({ type: "error", message: String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
