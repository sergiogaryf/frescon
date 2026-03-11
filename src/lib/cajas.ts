export interface Caja {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  precio: number;
  ahorro: number; // % de ahorro vs compra individual
  productos: string[]; // nombres de productos incluidos
  badge: string;
  color: string; // color Tailwind bg
}

export const CAJAS: Caja[] = [
  {
    id: "caja-vegana",
    nombre: "Caja Vegana",
    descripcion: "Selección 100% plant-based con superfoods y hongos del Valle de Aconcagua",
    emoji: "🌱",
    precio: 22900,
    ahorro: 15,
    productos: ["Espinaca", "Brócoli", "Hongos", "Palta Hass", "Zanahoria", "Betarraga", "Pepino"],
    badge: "Más vendida",
    color: "bg-emerald-50",
  },
  {
    id: "caja-gym",
    nombre: "Caja Gym & Proteína",
    descripcion: "Proteína vegetal, energía y recuperación muscular para deportistas",
    emoji: "🏋️",
    precio: 24900,
    ahorro: 12,
    productos: ["Espinaca", "Brócoli", "Hongos", "Zanahoria", "Betarraga", "Naranja", "Manzana"],
    badge: "Proteína vegetal",
    color: "bg-blue-50",
  },
  {
    id: "caja-familiar",
    nombre: "Caja Familiar",
    descripcion: "Variedad completa para toda la familia. Frutas, verduras y más por una semana",
    emoji: "👨‍👩‍👧‍👦",
    precio: 28900,
    ahorro: 18,
    productos: ["Tomate", "Papa", "Cebolla", "Zanahoria", "Lechuga", "Manzana", "Naranja", "Limón"],
    badge: "Para 4 personas",
    color: "bg-yellow-50",
  },
  {
    id: "caja-express",
    nombre: "Caja Express",
    descripcion: "Lo esencial de la semana en un solo pedido. Rápido, fácil y fresco",
    emoji: "⚡",
    precio: 15900,
    ahorro: 10,
    productos: ["Tomate", "Lechuga", "Zanahoria", "Naranja", "Limón"],
    badge: "Básica",
    color: "bg-orange-50",
  },
  {
    id: "caja-detox",
    nombre: "Caja Detox",
    descripcion: "Limpieza natural con verduras de hoja, raíces y cítricos del Valle",
    emoji: "🍋",
    precio: 19900,
    ahorro: 13,
    productos: ["Espinaca", "Apio", "Pepino", "Limón", "Betarraga", "Zanahoria"],
    badge: "Limpieza natural",
    color: "bg-lime-50",
  },
];
