export interface ItemCaja {
  nombre:   string;
  cantidad: string;   // "1 kg", "2 unidades", "1 atado"
  imagen:   string;
}

export interface Caja {
  id:          string;
  nombre:      string;
  descripcion: string;
  emoji:       string;
  ahorro:      number;   // % de ahorro
  items:       ItemCaja[];
  badge:       string;
  color:       string;
  imagen:      string;
}

export const CAJAS: Caja[] = [
  {
    id:    "caja-express",
    nombre: "Caja Express",
    descripcion: "Lo esencial de la semana en un solo pedido. Rapido, facil y fresco.",
    emoji: "⚡",
    ahorro: 5,
    badge: "Basica",
    color: "bg-orange-50",
    imagen: "/images/productos/Tomate.png",
    items: [
      { nombre: "Tomate",           cantidad: "1 kg",       imagen: "/images/productos/Tomate.png" },
      { nombre: "Lechuga Española", cantidad: "1 unidad",   imagen: "/images/productos/LechugaEspanola.png" },
      { nombre: "Zanahoria",        cantidad: "1 kg",       imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Naranja",          cantidad: "1 kg",       imagen: "/images/productos/naranja.png" },
      { nombre: "Limón",            cantidad: "1 kg",       imagen: "/images/productos/Limon.png" },
    ],
  },
  {
    id:    "caja-vegana",
    nombre: "Caja Vegana",
    descripcion: "Seleccion 100% plant-based con superfoods frescos del Valle de Aconcagua.",
    emoji: "🌱",
    ahorro: 5,
    badge: "Mas vendida",
    color: "bg-emerald-50",
    imagen: "/images/productos/PaltaHass.png",
    items: [
      { nombre: "Espinaca",       cantidad: "1 atado",    imagen: "/images/productos/Espinaca.png" },
      { nombre: "Brócoli",        cantidad: "1 kg",       imagen: "/images/productos/Brocoli.png" },
      { nombre: "Pepino",         cantidad: "2 unidades", imagen: "/images/productos/Pepino.png" },
      { nombre: "Pimentón Verde", cantidad: "2 unidades", imagen: "/images/productos/PimentonVerde.png" },
      { nombre: "Zanahoria",      cantidad: "1 kg",       imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Limón",          cantidad: "1 kg",       imagen: "/images/productos/Limon.png" },
      { nombre: "Palta Hass",     cantidad: "1 unidad",   imagen: "/images/productos/PaltaHass.png" },
    ],
  },
  {
    id:    "caja-gym",
    nombre: "Caja Gym & Energia",
    descripcion: "Carbohidratos, vitaminas y energia para deportistas activos.",
    emoji: "🏋️",
    ahorro: 5,
    badge: "Proteina vegetal",
    color: "bg-blue-50",
    imagen: "/images/productos/Platano.png",
    items: [
      { nombre: "Espinaca",       cantidad: "1 atado",    imagen: "/images/productos/Espinaca.png" },
      { nombre: "Brócoli",        cantidad: "1 kg",       imagen: "/images/productos/Brocoli.png" },
      { nombre: "Zanahoria",      cantidad: "1 kg",       imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Plátano",        cantidad: "1 kg",       imagen: "/images/productos/Platano.png" },
      { nombre: "Naranja",        cantidad: "1 kg",       imagen: "/images/productos/naranja.png" },
      { nombre: "Manzana Fuji",   cantidad: "1 kg",       imagen: "/images/productos/Manzanafuji.png" },
      { nombre: "Pimentón Rojo",  cantidad: "2 unidades", imagen: "/images/productos/PimentonRojo.png" },
    ],
  },
  {
    id:    "caja-familiar",
    nombre: "Caja Familiar",
    descripcion: "Variedad completa para toda la familia. Frutas, verduras y mas para la semana.",
    emoji: "👨‍👩‍👧‍👦",
    ahorro: 5,
    badge: "Para 4 personas",
    color: "bg-yellow-50",
    imagen: "/images/productos/Manzanafuji.png",
    items: [
      { nombre: "Tomate",          cantidad: "2 kg",       imagen: "/images/productos/Tomate.png" },
      { nombre: "Papas",           cantidad: "2 kg",       imagen: "/images/productos/Papas.png" },
      { nombre: "Cebolla Guarda",  cantidad: "1 kg",       imagen: "/images/productos/Cebolla.png" },
      { nombre: "Zanahoria",       cantidad: "1 kg",       imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Lechuga Chilena", cantidad: "2 unidades", imagen: "/images/productos/LechugaChilena.png" },
      { nombre: "Naranja",         cantidad: "1 kg",       imagen: "/images/productos/naranja.png" },
      { nombre: "Manzana Fuji",    cantidad: "1 kg",       imagen: "/images/productos/Manzanafuji.png" },
      { nombre: "Limón",           cantidad: "1 kg",       imagen: "/images/productos/Limon.png" },
    ],
  },
  {
    id:    "caja-detox",
    nombre: "Caja Detox",
    descripcion: "Limpieza natural con verduras de hoja, raices y citricos del Valle.",
    emoji: "🍋",
    ahorro: 5,
    badge: "Limpieza natural",
    color: "bg-lime-50",
    imagen: "/images/productos/Limon.png",
    items: [
      { nombre: "Espinaca",       cantidad: "1 atado",    imagen: "/images/productos/Espinaca.png" },
      { nombre: "Rabanitos",      cantidad: "1 atado",    imagen: "/images/productos/Rabanitos.png" },
      { nombre: "Pepino",         cantidad: "2 unidades", imagen: "/images/productos/Pepino.png" },
      { nombre: "Limón",          cantidad: "1 kg",       imagen: "/images/productos/Limon.png" },
      { nombre: "Zanahoria",      cantidad: "1 kg",       imagen: "/images/productos/Zanahoria.png" },
      { nombre: "Pimentón Verde", cantidad: "2 unidades", imagen: "/images/productos/PimentonVerde.png" },
    ],
  },
];
