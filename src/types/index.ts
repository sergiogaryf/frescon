export interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  origen: string;
  stock: number;
  badges: string[];
  categoria: "verduras" | "frutas" | "huevos" | "hierbas" | "kits" | "frutos_secos";
  es_estrella: boolean;
  imagen: string;
  unidad: "kg" | "unidad" | "litro" | "atado" | "docena";
}

export interface CartItem {
  product: Product;
  cantidad: number;
}

export interface OrderData {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  comuna: string;
  fecha_entrega: string;
  metodo_pago: "transferencia";
  items: CartItem[];
  total: number;
  estado: "pendiente" | "pagado" | "enviado";
}
