export interface ItemCaja {
  nombre:   string;
  cantidad: string;   // "1 kg", "2 unidades", "1 atado"
  subtotal: number;   // precio individual de ese ítem
  imagen:   string;
}

export interface Caja {
  id:              string;
  nombre:          string;
  descripcion:     string;
  emoji:           string;
  precio:          number;   // precio con descuento
  precio_original: number;   // suma sin descuento
  ahorro:          number;   // % de ahorro
  items:           ItemCaja[];
  badge:           string;
  color:           string;
  imagen:          string;   // imagen del producto principal
}

export const CAJAS: Caja[] = [
  {
    id:    "caja-express",
    nombre: "Caja Express",
    descripcion: "Lo esencial de la semana en un solo pedido. Rápido, fácil y fresco.",
    emoji: "⚡",
    precio:          5415,
    precio_original: 5700,
    ahorro:          5,
    badge: "Básica",
    color: "bg-orange-50",
    imagen: "/images/productos/Tomate.png",
    items: [
      { nombre: "Tomate",           cantidad: "1 kg",       subtotal: 1500, imagen: "/images/productos/Tomate.png" },
      { nombre: "Lechuga Española", cantidad: "1 unidad",   subtotal:  800, imagen: "/images/productos/LechugaEspanola.png" },
      { nombre: "Zanahoria",        cantidad: "1 kg",       subtotal:  800, imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Naranja",          cantidad: "1 kg",       subtotal: 1000, imagen: "/images/productos/naranja.png" },
      { nombre: "Limón",            cantidad: "1 kg",       subtotal: 1600, imagen: "/images/productos/Limon.png" },
    ],
  },
  {
    id:    "caja-vegana",
    nombre: "Caja Vegana",
    descripcion: "Selección 100% plant-based con superfoods frescos del Valle de Aconcagua.",
    emoji: "🌱",
    precio:          8740,
    precio_original: 9200,
    ahorro:          5,
    badge: "Más vendida",
    color: "bg-emerald-50",
    imagen: "/images/productos/PaltaHass.png",
    items: [
      { nombre: "Espinaca",       cantidad: "1 atado",    subtotal: 1000, imagen: "/images/productos/Espinaca.png" },
      { nombre: "Brócoli",        cantidad: "1 kg",       subtotal: 1500, imagen: "/images/productos/Brocoli.png" },
      { nombre: "Pepino",         cantidad: "2 unidades", subtotal:  800, imagen: "/images/productos/Pepino.png" },
      { nombre: "Pimentón Verde", cantidad: "2 unidades", subtotal: 1000, imagen: "/images/productos/PimentonVerde.png" },
      { nombre: "Zanahoria",      cantidad: "1 kg",       subtotal:  800, imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Limón",          cantidad: "1 kg",       subtotal: 1600, imagen: "/images/productos/Limon.png" },
      { nombre: "Palta Hass",     cantidad: "1 palta",    subtotal: 2500, imagen: "/images/productos/PaltaHass.png" },
    ],
  },
  {
    id:    "caja-gym",
    nombre: "Caja Gym & Energía",
    descripcion: "Carbohidratos, vitaminas y energía para deportistas activos.",
    emoji: "🏋️",
    precio:          8835,
    precio_original: 9300,
    ahorro:          5,
    badge: "Proteína vegetal",
    color: "bg-blue-50",
    imagen: "/images/productos/Platano.png",
    items: [
      { nombre: "Espinaca",      cantidad: "1 atado",    subtotal: 1000, imagen: "/images/productos/Espinaca.png" },
      { nombre: "Brócoli",       cantidad: "1 kg",       subtotal: 1500, imagen: "/images/productos/Brocoli.png" },
      { nombre: "Zanahoria",     cantidad: "1 kg",       subtotal:  800, imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Plátano",       cantidad: "1 kg",       subtotal: 2000, imagen: "/images/productos/Platano.png" },
      { nombre: "Naranja",       cantidad: "1 kg",       subtotal: 1000, imagen: "/images/productos/naranja.png" },
      { nombre: "Manzana",       cantidad: "1 kg",       subtotal: 1200, imagen: "/images/productos/Manzanafuji.png" },
      { nombre: "Pimentón Rojo", cantidad: "2 unidades", subtotal: 1800, imagen: "/images/productos/PimentonRojo.png" },
    ],
  },
  {
    id:    "caja-familiar",
    nombre: "Caja Familiar",
    descripcion: "Variedad completa para toda la familia. Frutas, verduras y más para la semana.",
    emoji: "👨‍👩‍👧‍👦",
    precio:          11163,
    precio_original: 11750,
    ahorro:          5,
    badge: "Para 4 personas",
    color: "bg-yellow-50",
    imagen: "/images/productos/Manzanafuji.png",
    items: [
      { nombre: "Tomate",          cantidad: "2 kg",       subtotal: 3000, imagen: "/images/productos/Tomate.png" },
      { nombre: "Papas",           cantidad: "2 kg",       subtotal: 1400, imagen: "/images/productos/Papas.png" },
      { nombre: "Cebolla Guarda",  cantidad: "1 kg",       subtotal:  750, imagen: "/images/productos/Cebolla.png" },
      { nombre: "Zanahoria",       cantidad: "1 kg",       subtotal:  800, imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Lechuga Chilena", cantidad: "2 unidades", subtotal: 2000, imagen: "/images/productos/LechugaChilena.png" },
      { nombre: "Naranja",         cantidad: "1 kg",       subtotal: 1000, imagen: "/images/productos/naranja.png" },
      { nombre: "Manzana",         cantidad: "1 kg",       subtotal: 1200, imagen: "/images/productos/Manzanafuji.png" },
      { nombre: "Limón",           cantidad: "1 kg",       subtotal: 1600, imagen: "/images/productos/Limon.png" },
    ],
  },
  {
    id:    "caja-detox",
    nombre: "Caja Detox",
    descripcion: "Limpieza natural con verduras de hoja, raíces y cítricos del Valle.",
    emoji: "🍋",
    precio:          5890,
    precio_original: 6200,
    ahorro:          5,
    badge: "Limpieza natural",
    color: "bg-lime-50",
    imagen: "/images/productos/Limon.png",
    items: [
      { nombre: "Espinaca",       cantidad: "1 atado",    subtotal: 1000, imagen: "/images/productos/Espinaca.png" },
      { nombre: "Rabanitos",      cantidad: "1 atado",    subtotal: 1000, imagen: "/images/productos/Rabanitos.png" },
      { nombre: "Pepino",         cantidad: "2 unidades", subtotal:  800, imagen: "/images/productos/Pepino.png" },
      { nombre: "Limón",          cantidad: "1 kg",       subtotal: 1600, imagen: "/images/productos/Limon.png" },
      { nombre: "Zanahoria",      cantidad: "1 kg",       subtotal:  800, imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Pimentón Verde", cantidad: "2 unidades", subtotal: 1000, imagen: "/images/productos/PimentonVerde.png" },
    ],
  },
];
