import Airtable from "airtable";
import { Product } from "@/types";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

export const productsTable = base("Productos");
export const ordersTable   = base("Pedidos");

/* ── Helpers ── */

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

export interface OrderPayload {
  nombre_cliente: string;
  telefono:       string;
  direccion:      string;
  fecha_entrega:  string; // ISO date YYYY-MM-DD
  notas?:         string;
  total:          number;
  detalle_pedido: string;
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
