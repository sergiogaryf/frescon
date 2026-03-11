import Airtable from "airtable";
import { Product } from "@/types";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

export const productsTable  = base("Productos");
export const ordersTable    = base("Pedidos");
export const memoriaTable   = base("CeliaMemoria");

/* ── Productos ── */

export async function getProductos(): Promise<Product[]> {
  const records = await productsTable
    .select({ filterByFormula: "{activo} = TRUE()", sort: [{ field: "nombre" }] })
    .all();

  return records.map((r) => ({
    id:          r.id,
    nombre:      String(r.fields.nombre      ?? ""),
    precio:      Number(r.fields.precio      ?? 0),
    categoria:   (r.fields.categoria as Product["categoria"]) ?? "verduras",
    unidad:      (r.fields.unidad    as Product["unidad"])    ?? "kg",
    es_estrella: Boolean(r.fields.es_estrella),
    stock:       Number(r.fields.stock       ?? 0),
    origen:      String(r.fields.origen      ?? ""),
    descripcion: String(r.fields.descripcion ?? ""),
    imagen:      String(r.fields.imagen_url  ?? ""),
    badges:      (r.fields.badges as string[]) ?? [],
  }));
}

/* ── Pedidos ── */

export interface OrderPayload {
  nombre_cliente: string;
  telefono:       string;
  direccion:      string;
  fecha_entrega:  string;
  notas?:         string;
  total:          number;
  detalle_pedido: string;
}

export interface PedidoAdmin {
  id:             string;
  nombre_cliente: string;
  telefono:       string;
  direccion:      string;
  fecha_entrega:  string;
  fecha_pedido:   string;
  total:          number;
  estado:         string;
  notas:          string;
  detalle_pedido: string;
  orden_entrega:  number;
}

export async function crearPedido(data: OrderPayload) {
  const record = await ordersTable.create({
    nombre_cliente: data.nombre_cliente,
    telefono:       data.telefono,
    direccion:      data.direccion,
    fecha_entrega:  data.fecha_entrega,
    notas:          data.notas ?? "",
    estado:         "Pendiente",
    total:          data.total,
    detalle_pedido: data.detalle_pedido,
    fecha_pedido:   new Date().toISOString(),
  });
  return record.id;
}

export async function getPedidos(options: {
  estado?: string;
  fecha?:  string;
} = {}): Promise<PedidoAdmin[]> {
  const filters: string[] = [];
  if (options.estado && options.estado !== "Todos") {
    filters.push(`{estado} = "${options.estado}"`);
  }
  if (options.fecha) {
    filters.push(`IS_SAME({fecha_entrega}, "${options.fecha}")`);
  }
  const filterByFormula =
    filters.length === 0 ? "" :
    filters.length === 1 ? filters[0] :
    `AND(${filters.join(", ")})`;

  const records = await ordersTable
    .select({
      filterByFormula,
      sort: [{ field: "fecha_pedido", direction: "desc" }],
    })
    .all();

  return records.map((r) => ({
    id:             r.id,
    nombre_cliente: String(r.fields.nombre_cliente ?? ""),
    telefono:       String(r.fields.telefono       ?? ""),
    direccion:      String(r.fields.direccion      ?? ""),
    fecha_entrega:  String(r.fields.fecha_entrega  ?? ""),
    fecha_pedido:   String(r.fields.fecha_pedido   ?? ""),
    total:          Number(r.fields.total          ?? 0),
    estado:         String(r.fields.estado         ?? "Pendiente"),
    notas:          String(r.fields.notas          ?? ""),
    detalle_pedido: String(r.fields.detalle_pedido ?? ""),
    orden_entrega:  Number(r.fields.orden_entrega  ?? 0),
  }));
}

export async function updatePedido(id: string, fields: Record<string, unknown>) {
  await ordersTable.update(id, fields as Record<string, string | number | boolean>);
}

/* ── Celia Memoria ── */

export interface MemoriaEntry {
  id:             string;
  fecha:          string;
  contexto:       string;
  pregunta:       string;
  respuesta:      string;
  categoria:      string;
  herramientas:   string;
  sesion_id:      string;
  util:           boolean;
  notas_admin:    string;
  perfil:         string;
  intereses:      string;
  dieta:          string;
  signo_zodiacal: string;
}

function detectarCategoria(pregunta: string): string {
  const q = pregunta.toLowerCase();
  if (/precio|costo|cuánto|cuanto|valor/.test(q))           return "precios";
  if (/pedido|orden|compra|estado/.test(q))                 return "pedidos";
  if (/entreg|reparto|jueves|horario|cuando|cuándo/.test(q)) return "entregas";
  if (/zona|barrio|concón|concon|sector/.test(q))           return "zonas";
  if (/product|fruta|verdura|catálog|catalogo/.test(q))     return "productos";
  if (/comprar|quillota|mayorista|malla/.test(q))           return "compras_admin";
  if (/sobrante|merma|inventario|stock/.test(q))            return "inventario";
  if (/ingreso|venta|ganancia|revenue/.test(q))             return "finanzas";
  return "general";
}

export async function guardarMemoria(entry: Omit<MemoriaEntry, "id">) {
  try {
    await memoriaTable.create({
      fecha:          entry.fecha,
      contexto:       entry.contexto,
      pregunta:       entry.pregunta.slice(0, 2000),
      respuesta:      entry.respuesta.slice(0, 2000),
      categoria:      entry.categoria || detectarCategoria(entry.pregunta),
      herramientas:   entry.herramientas,
      sesion_id:      entry.sesion_id,
      util:           false,
      ...(entry.perfil         ? { perfil:         entry.perfil }         : {}),
      ...(entry.intereses      ? { intereses:      entry.intereses }      : {}),
      ...(entry.dieta          ? { dieta:          entry.dieta }          : {}),
      ...(entry.signo_zodiacal ? { signo_zodiacal: entry.signo_zodiacal } : {}),
    });
  } catch (e) {
    console.error("Error guardando memoria Celia:", e);
  }
}

export async function getMemoriaReciente(contexto: string, limite = 20): Promise<MemoriaEntry[]> {
  try {
    const records = await memoriaTable
      .select({
        filterByFormula: `{contexto} = "${contexto}"`,
        sort:            [{ field: "fecha", direction: "desc" }],
        maxRecords:      limite,
      })
      .all();
    return records.map((r) => ({
      id:             r.id,
      fecha:          String(r.fields.fecha          ?? ""),
      contexto:       String(r.fields.contexto       ?? ""),
      pregunta:       String(r.fields.pregunta       ?? ""),
      respuesta:      String(r.fields.respuesta      ?? ""),
      categoria:      String(r.fields.categoria      ?? ""),
      herramientas:   String(r.fields.herramientas   ?? ""),
      sesion_id:      String(r.fields.sesion_id      ?? ""),
      util:           Boolean(r.fields.util),
      notas_admin:    String(r.fields.notas_admin    ?? ""),
      perfil:         String(r.fields.perfil         ?? ""),
      intereses:      String(r.fields.intereses      ?? ""),
      dieta:          String(r.fields.dieta          ?? ""),
      signo_zodiacal: String(r.fields.signo_zodiacal ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function getMemoriaStats(): Promise<{
  total: number;
  por_categoria: Record<string, number>;
  por_contexto:  Record<string, number>;
  frecuentes:    Array<{ pregunta: string; categoria: string; fecha: string }>;
}> {
  try {
    const records = await memoriaTable
      .select({ sort: [{ field: "fecha", direction: "desc" }], maxRecords: 200 })
      .all();

    const por_categoria: Record<string, number> = {};
    const por_contexto:  Record<string, number> = {};

    for (const r of records) {
      const cat = String(r.fields.categoria ?? "general");
      const ctx = String(r.fields.contexto  ?? "cliente");
      por_categoria[cat] = (por_categoria[cat] ?? 0) + 1;
      por_contexto[ctx]  = (por_contexto[ctx]  ?? 0) + 1;
    }

    const frecuentes = records.slice(0, 10).map((r) => ({
      pregunta:  String(r.fields.pregunta  ?? "").slice(0, 100),
      categoria: String(r.fields.categoria ?? ""),
      fecha:     String(r.fields.fecha     ?? ""),
    }));

    return { total: records.length, por_categoria, por_contexto, frecuentes };
  } catch {
    return { total: 0, por_categoria: {}, por_contexto: {}, frecuentes: [] };
  }
}
