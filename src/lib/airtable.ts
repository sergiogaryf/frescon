import Airtable from "airtable";
import { Product } from "@/types";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

export const productsTable = base("Productos");
export const ordersTable   = base("Pedidos");

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
    filters.push(`{fecha_entrega} = "${options.fecha}"`);
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
