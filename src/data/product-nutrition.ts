/**
 * Información nutricional real de los productos Frescon.
 * Fuentes: USDA FoodData Central, INTA Chile, FAO/OMS.
 * Valores por 100 g de porción comestible (salvo indicación).
 */

export interface ProductNutrition {
  vitaminas: string[];
  calorias: number;
  nivelEnergetico: "bajo" | "moderado" | "alto";
  beneficios: string[];
  frecuencia: string;
  porcion: string;
  receta: {
    nombre: string;
    ingredientes: string[];
    preparacion: string;
  };
}

const nutrition: Record<string, ProductNutrition> = {
  /* ─────────────── FRUTAS ─────────────── */
  Durazno: {
    vitaminas: ["Vitamina C", "Vitamina A", "Vitamina E", "Potasio", "Fibra"],
    calorias: 39,
    nivelEnergetico: "bajo",
    beneficios: [
      "Mejora la digestión gracias a su contenido de fibra soluble e insoluble",
      "Fortalece el sistema inmune por su aporte de vitamina C",
      "Hidratación natural: contiene un 89 % de agua",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 durazno mediano (~150 g)",
    receta: {
      nombre: "Smoothie de durazno y avena",
      ingredientes: [
        "1 durazno maduro",
        "½ taza de avena",
        "1 taza de leche o bebida vegetal",
        "Miel a gusto",
      ],
      preparacion:
        "Licúa todos los ingredientes por 30 segundos hasta obtener una textura cremosa. Sirve frío.",
    },
  },

  Frutilla: {
    vitaminas: ["Vitamina C", "Manganeso", "Folato", "Potasio", "Antioxidantes"],
    calorias: 32,
    nivelEnergetico: "bajo",
    beneficios: [
      "Alto poder antioxidante que combate el envejecimiento celular",
      "Fortalece el sistema inmune: 8 frutillas cubren la dosis diaria de vitamina C",
      "Favorece la salud cardiovascular reduciendo el colesterol LDL",
    ],
    frecuencia: "4–5 veces por semana",
    porcion: "~8 frutillas medianas (~150 g)",
    receta: {
      nombre: "Bowl de frutillas con yogurt",
      ingredientes: [
        "8 frutillas frescas",
        "1 taza de yogurt natural",
        "2 cdas de granola",
        "Miel a gusto",
      ],
      preparacion:
        "Corta las frutillas en mitades, colócalas sobre el yogurt, agrega granola y un hilo de miel.",
    },
  },

  "Limón": {
    vitaminas: ["Vitamina C", "Vitamina B6", "Potasio", "Ácido cítrico", "Flavonoides"],
    calorias: 29,
    nivelEnergetico: "bajo",
    beneficios: [
      "Refuerza las defensas: una de las frutas con mayor concentración de vitamina C",
      "Mejora la absorción de hierro de otros alimentos",
      "Alcalinizante natural que favorece el equilibrio del pH corporal",
    ],
    frecuencia: "Diario (en agua, aliños o preparaciones)",
    porcion: "Jugo de 1 limón (~30 ml)",
    receta: {
      nombre: "Limonada natural con menta",
      ingredientes: [
        "Jugo de 3 limones",
        "1 litro de agua fría",
        "Hojas de menta fresca",
        "Endulzante a gusto",
      ],
      preparacion:
        "Mezcla el jugo de limón con el agua, agrega las hojas de menta y endulza al gusto. Sirve con hielo.",
    },
  },

  "Manzana Verde": {
    vitaminas: ["Vitamina C", "Vitamina K", "Fibra (pectina)", "Potasio", "Quercetina"],
    calorias: 52,
    nivelEnergetico: "bajo",
    beneficios: [
      "Su pectina ayuda a regular el azúcar en sangre tras las comidas",
      "Mejora la digestión y promueve la salud intestinal",
      "Contribuye a la salud dental al estimular la producción de saliva",
    ],
    frecuencia: "1 al día (5–7 veces por semana)",
    porcion: "1 manzana mediana (~180 g)",
    receta: {
      nombre: "Ensalada de manzana verde con apio y nueces",
      ingredientes: [
        "1 manzana verde en cubos",
        "2 ramas de apio picado",
        "Un puñado de nueces",
        "Jugo de limón y aceite de oliva",
      ],
      preparacion:
        "Mezcla la manzana, el apio y las nueces. Aliña con limón y aceite de oliva. Ideal como entrada fresca.",
    },
  },

  "Manzana Fuji": {
    vitaminas: ["Vitamina C", "Vitamina A", "Fibra", "Potasio", "Quercetina"],
    calorias: 52,
    nivelEnergetico: "bajo",
    beneficios: [
      "Rica en quercetina, un antioxidante que protege las células",
      "Mejora la función cardiovascular al reducir el colesterol",
      "Su fibra genera saciedad prolongada, ideal para control de peso",
    ],
    frecuencia: "1 al día (5–7 veces por semana)",
    porcion: "1 manzana mediana (~180 g)",
    receta: {
      nombre: "Compota de manzana con canela",
      ingredientes: [
        "2 manzanas Fuji peladas y picadas",
        "½ taza de agua",
        "1 rama de canela",
        "Miel a gusto",
      ],
      preparacion:
        "Cocina las manzanas con el agua y la canela a fuego bajo por 15 minutos. Aplasta con tenedor y endulza.",
    },
  },

  Naranja: {
    vitaminas: ["Vitamina C", "Vitamina A", "Folato", "Calcio", "Fibra"],
    calorias: 47,
    nivelEnergetico: "bajo",
    beneficios: [
      "Una naranja cubre el 100 % de la vitamina C diaria recomendada",
      "Protege y regenera la piel gracias a sus antioxidantes",
      "Mejora la absorción de hierro, ideal para combatir la anemia",
    ],
    frecuencia: "1 al día (5–7 veces por semana)",
    porcion: "1 naranja mediana (~130 g)",
    receta: {
      nombre: "Jugo de naranja con zanahoria",
      ingredientes: [
        "2 naranjas",
        "1 zanahoria mediana",
        "½ cucharadita de jengibre rallado",
      ],
      preparacion:
        "Exprime las naranjas, licúa con la zanahoria pelada y el jengibre. Cuela si prefieres y sirve de inmediato.",
    },
  },

  "Palta Hass": {
    vitaminas: [
      "Vitamina K",
      "Vitamina E",
      "Vitamina C",
      "Potasio",
      "Ácido fólico",
      "Grasas monoinsaturadas",
    ],
    calorias: 160,
    nivelEnergetico: "alto",
    beneficios: [
      "Sus grasas monoinsaturadas protegen el corazón y reducen el colesterol malo",
      "Potente antiinflamatorio natural gracias a la vitamina E",
      "Mejora la absorción de vitaminas liposolubles (A, D, E, K) de otros alimentos",
    ],
    frecuencia: "3–5 veces por semana",
    porcion: "½ palta (~75 g)",
    receta: {
      nombre: "Tostada de palta con tomate y limón",
      ingredientes: [
        "½ palta madura",
        "1 rebanada de pan integral",
        "Tomate cherry cortado",
        "Jugo de limón, sal y pimienta",
      ],
      preparacion:
        "Aplasta la palta sobre el pan tostado, agrega los tomates, un chorrito de limón, sal y pimienta al gusto.",
    },
  },

  Pera: {
    vitaminas: ["Vitamina C", "Vitamina K", "Potasio", "Cobre", "Fibra"],
    calorias: 57,
    nivelEnergetico: "bajo",
    beneficios: [
      "Rica en fibra soluble que favorece el tránsito intestinal",
      "Hidratante natural con alto contenido de agua (84 %)",
      "Suave para el estómago: ideal para digestiones delicadas",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 pera mediana (~170 g)",
    receta: {
      nombre: "Pera al horno con miel y canela",
      ingredientes: [
        "2 peras cortadas por la mitad",
        "2 cdas de miel",
        "Canela en polvo",
        "Nueces picadas",
      ],
      preparacion:
        "Coloca las peras en una fuente, rocía con miel y canela. Hornea 20 min a 180 °C. Sirve con nueces.",
    },
  },

  "Plátano": {
    vitaminas: ["Vitamina B6", "Vitamina C", "Potasio", "Magnesio", "Fibra"],
    calorias: 89,
    nivelEnergetico: "moderado",
    beneficios: [
      "Fuente de energía rápida y sostenida, ideal antes del ejercicio",
      "Su alto potasio previene calambres musculares",
      "Contiene triptófano que ayuda a mejorar el estado de ánimo",
    ],
    frecuencia: "1 al día (5–7 veces por semana)",
    porcion: "1 plátano mediano (~120 g)",
    receta: {
      nombre: "Panqueques de plátano y avena",
      ingredientes: [
        "1 plátano maduro",
        "2 huevos",
        "½ taza de avena",
        "Canela al gusto",
      ],
      preparacion:
        "Aplasta el plátano, mezcla con los huevos y la avena. Cocina en sartén antiadherente por ambos lados.",
    },
  },

  Kiwi: {
    vitaminas: ["Vitamina C", "Vitamina K", "Vitamina E", "Potasio", "Folato", "Fibra"],
    calorias: 61,
    nivelEnergetico: "bajo",
    beneficios: [
      "Contiene más vitamina C que la naranja (93 mg vs 53 mg por 100 g)",
      "Su enzima actinidina mejora la digestión de proteínas",
      "Refuerza la inmunidad y ayuda a combatir resfríos",
    ],
    frecuencia: "1 al día (5–7 veces por semana)",
    porcion: "2 kiwis (~150 g)",
    receta: {
      nombre: "Bowl de kiwi con granola y yogurt",
      ingredientes: [
        "2 kiwis pelados y cortados",
        "1 taza de yogurt griego",
        "3 cdas de granola",
        "Semillas de chía",
      ],
      preparacion:
        "Coloca el yogurt en un bowl, agrega el kiwi, la granola y las semillas de chía por encima.",
    },
  },

  /* ─────────────── VERDURAS ─────────────── */
  Acelga: {
    vitaminas: ["Vitamina K", "Vitamina A", "Vitamina C", "Magnesio", "Hierro", "Potasio"],
    calorias: 19,
    nivelEnergetico: "bajo",
    beneficios: [
      "Fortalece los huesos gracias a su altísimo contenido de vitamina K",
      "Rica en hierro vegetal, ayuda a prevenir la anemia",
      "Su magnesio contribuye a la relajación muscular y al buen descanso",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 taza cocida (~175 g)",
    receta: {
      nombre: "Tortilla de acelga con queso",
      ingredientes: [
        "1 atado de acelga blanqueada y picada",
        "3 huevos batidos",
        "Queso rallado a gusto",
        "Sal y pimienta",
      ],
      preparacion:
        "Mezcla la acelga con los huevos y el queso. Vierte en sartén caliente y cocina por ambos lados hasta dorar.",
    },
  },

  Albahaca: {
    vitaminas: ["Vitamina K", "Vitamina A", "Manganeso", "Hierro", "Calcio"],
    calorias: 23,
    nivelEnergetico: "bajo",
    beneficios: [
      "Poderoso antiinflamatorio gracias a sus aceites esenciales (eugenol)",
      "Propiedades antibacterianas naturales comprobadas",
      "Favorece la digestión y reduce la hinchazón estomacal",
    ],
    frecuencia: "3–5 veces por semana (como hierba fresca)",
    porcion: "~10 hojas frescas (~5 g)",
    receta: {
      nombre: "Pesto casero de albahaca",
      ingredientes: [
        "2 tazas de hojas de albahaca",
        "⅓ taza de nueces o piñones",
        "½ taza de aceite de oliva",
        "2 dientes de ajo, sal y queso parmesano",
      ],
      preparacion:
        "Procesa la albahaca con las nueces, el ajo y el aceite. Agrega el queso y sal al gusto. Ideal para pastas.",
    },
  },

  Betarraga: {
    vitaminas: ["Folato", "Manganeso", "Potasio", "Vitamina C", "Hierro", "Fibra"],
    calorias: 43,
    nivelEnergetico: "bajo",
    beneficios: [
      "Sus nitratos naturales mejoran el rendimiento deportivo y la oxigenación muscular",
      "Ayuda a regular la presión arterial",
      "Desintoxicante natural que apoya la función hepática",
    ],
    frecuencia: "2–3 veces por semana",
    porcion: "1 betarraga mediana (~130 g)",
    receta: {
      nombre: "Ensalada de betarraga rallada con limón",
      ingredientes: [
        "2 betarragas crudas ralladas",
        "Jugo de 1 limón",
        "Cilantro fresco picado",
        "Aceite de oliva y sal",
      ],
      preparacion:
        "Ralla las betarragas crudas, aliña con limón, aceite de oliva y sal. Decora con cilantro fresco.",
    },
  },

  "Brócoli": {
    vitaminas: ["Vitamina C", "Vitamina K", "Vitamina A", "Folato", "Potasio", "Fibra"],
    calorias: 34,
    nivelEnergetico: "bajo",
    beneficios: [
      "Contiene sulforafano, un compuesto con propiedades anticancerígenas estudiadas",
      "Fortalece los huesos combinando vitamina K y calcio",
      "Apoya la desintoxicación natural del organismo",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 taza cocido (~150 g)",
    receta: {
      nombre: "Brócoli salteado con ajo y aceite de oliva",
      ingredientes: [
        "1 cabeza de brócoli en ramilletes",
        "3 dientes de ajo laminados",
        "2 cdas de aceite de oliva",
        "Sal, pimienta y limón",
      ],
      preparacion:
        "Blanquea el brócoli 2 min en agua hirviendo. Saltea el ajo en aceite, agrega el brócoli y cocina 3 min. Termina con limón.",
    },
  },

  "Cebolla Guarda": {
    vitaminas: ["Vitamina C", "Vitamina B6", "Folato", "Potasio", "Quercetina"],
    calorias: 40,
    nivelEnergetico: "bajo",
    beneficios: [
      "Antibacteriana natural que ayuda a combatir infecciones",
      "La quercetina mejora la circulación sanguínea",
      "Base esencial de la cocina que fortalece las defensas",
    ],
    frecuencia: "Diario (como base de cocina)",
    porcion: "½ cebolla mediana (~75 g)",
    receta: {
      nombre: "Cebolla caramelizada",
      ingredientes: [
        "3 cebollas grandes cortadas en pluma",
        "2 cdas de mantequilla o aceite",
        "1 pizca de azúcar",
        "Sal a gusto",
      ],
      preparacion:
        "Cocina las cebollas a fuego bajo con la mantequilla por 30–40 min, revolviendo ocasionalmente hasta que estén doradas y dulces.",
    },
  },

  "Cebolla Morada": {
    vitaminas: ["Vitamina C", "Antocianinas", "Quercetina", "Cromo", "Fibra"],
    calorias: 40,
    nivelEnergetico: "bajo",
    beneficios: [
      "Sus antocianinas (pigmento morado) le dan mayor poder antioxidante que la cebolla blanca",
      "Antiinflamatoria, beneficia articulaciones y sistema respiratorio",
      "El cromo ayuda a regular los niveles de azúcar en sangre",
    ],
    frecuencia: "3–5 veces por semana",
    porcion: "½ cebolla mediana (~75 g)",
    receta: {
      nombre: "Encurtido de cebolla morada",
      ingredientes: [
        "2 cebollas moradas en pluma fina",
        "Jugo de 3 limones",
        "1 cdta de sal",
        "Orégano seco",
      ],
      preparacion:
        "Coloca la cebolla en un frasco, cubre con jugo de limón, sal y orégano. Deja reposar 1 hora en el refrigerador.",
    },
  },

  "Cebollín": {
    vitaminas: ["Vitamina K", "Vitamina C", "Vitamina A", "Folato", "Fibra"],
    calorias: 30,
    nivelEnergetico: "bajo",
    beneficios: [
      "Excelente fuente de vitamina K que ayuda a la coagulación sanguínea",
      "Sus compuestos azufrados favorecen la digestión",
      "Bajo en calorías con sabor intenso, ideal como condimento saludable",
    ],
    frecuencia: "3–5 veces por semana",
    porcion: "2–3 tallos (~30 g)",
    receta: {
      nombre: "Omelette con cebollín y queso",
      ingredientes: [
        "3 huevos batidos",
        "2 tallos de cebollín picados fino",
        "Queso mantecoso en cubos",
        "Sal y pimienta",
      ],
      preparacion:
        "Vierte los huevos en sartén caliente, agrega el cebollín y el queso. Dobla al cuajar y sirve.",
    },
  },

  Choclo: {
    vitaminas: ["Vitamina B1", "Vitamina B5", "Folato", "Fósforo", "Magnesio", "Fibra"],
    calorias: 86,
    nivelEnergetico: "moderado",
    beneficios: [
      "Aporta energía sostenida de liberación lenta por sus carbohidratos complejos",
      "Buena fuente de fibra que favorece la salud intestinal",
      "Su fósforo y magnesio apoyan la función cerebral y muscular",
    ],
    frecuencia: "2–3 veces por semana",
    porcion: "1 choclo mediano (~90 g de grano)",
    receta: {
      nombre: "Pastel de choclo casero",
      ingredientes: [
        "6 choclos rallados",
        "Carne molida con cebolla y especias",
        "Huevo duro, aceitunas",
        "Albahaca fresca",
      ],
      preparacion:
        "Cocina la carne con cebolla y condimentos. Pon en fuente, agrega huevo y aceitunas. Cubre con la pasta de choclo y hornea 30 min a 200 °C.",
    },
  },

  Cilantro: {
    vitaminas: ["Vitamina K", "Vitamina A", "Vitamina C", "Potasio", "Manganeso"],
    calorias: 23,
    nivelEnergetico: "bajo",
    beneficios: [
      "Quelante natural: ayuda a eliminar metales pesados del organismo",
      "Excelente digestivo que reduce gases e hinchazón",
      "Propiedades antiinflamatorias que benefician al sistema nervioso",
    ],
    frecuencia: "4–6 veces por semana (como hierba fresca)",
    porcion: "¼ taza picado (~10 g)",
    receta: {
      nombre: "Pebre chileno tradicional",
      ingredientes: [
        "1 taza de cilantro picado fino",
        "1 tomate en cubitos",
        "½ cebolla picada fina",
        "Ají verde, aceite, limón y sal",
      ],
      preparacion:
        "Mezcla todos los ingredientes, aliña con aceite, limón y sal. Deja reposar 10 min antes de servir.",
    },
  },

  Espinaca: {
    vitaminas: ["Vitamina K", "Vitamina A", "Vitamina C", "Folato", "Hierro", "Magnesio"],
    calorias: 23,
    nivelEnergetico: "bajo",
    beneficios: [
      "Fortalece músculos y huesos: rica en hierro, calcio y magnesio",
      "Su hierro vegetal ayuda a combatir la anemia (mejor con vitamina C)",
      "La luteína y zeaxantina protegen la salud ocular",
    ],
    frecuencia: "4–5 veces por semana",
    porcion: "2 tazas cruda / 1 taza cocida (~180 g)",
    receta: {
      nombre: "Ensalada de espinaca con huevo y palta",
      ingredientes: [
        "2 tazas de espinaca fresca",
        "1 huevo duro",
        "¼ palta en láminas",
        "Aceite de oliva y limón",
      ],
      preparacion:
        "Coloca la espinaca en un plato, agrega el huevo picado y la palta. Aliña con aceite y limón.",
    },
  },

  "Lechuga Chilena": {
    vitaminas: ["Vitamina A", "Vitamina K", "Folato", "Potasio", "Fibra"],
    calorias: 15,
    nivelEnergetico: "bajo",
    beneficios: [
      "Ultra hidratante: compuesta en un 95 % de agua",
      "Suave para la digestión, ideal para estómagos sensibles",
      "Muy baja en calorías: excelente para control de peso",
    ],
    frecuencia: "Diario",
    porcion: "2–3 hojas grandes (~80 g)",
    receta: {
      nombre: "Ensalada chilena clásica",
      ingredientes: [
        "Hojas de lechuga chilena",
        "2 tomates en rodajas",
        "½ cebolla en pluma",
        "Aceite, sal y limón",
      ],
      preparacion:
        "Dispón las hojas de lechuga, agrega el tomate y la cebolla. Aliña con aceite, limón y sal al gusto.",
    },
  },

  "Lechuga Escarola": {
    vitaminas: ["Vitamina A", "Vitamina K", "Folato", "Fibra", "Manganeso"],
    calorias: 17,
    nivelEnergetico: "bajo",
    beneficios: [
      "Su sabor amargo estimula la producción de jugos digestivos",
      "Rica en fibra que favorece el tránsito intestinal",
      "Fuente importante de folato, esencial en el embarazo",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 taza (~50 g)",
    receta: {
      nombre: "Ensalada de escarola con nueces y parmesano",
      ingredientes: [
        "2 tazas de escarola troceada",
        "Un puñado de nueces",
        "Láminas de queso parmesano",
        "Vinagreta de limón y mostaza",
      ],
      preparacion:
        "Mezcla la escarola con las nueces y el parmesano. Aliña con la vinagreta justo antes de servir.",
    },
  },

  "Lechuga Española": {
    vitaminas: ["Vitamina A", "Vitamina K", "Vitamina C", "Folato", "Hierro"],
    calorias: 13,
    nivelEnergetico: "bajo",
    beneficios: [
      "Textura tierna y suave, excelente para wraps saludables",
      "Rica en folato y hierro, beneficiosa para la salud sanguínea",
      "Altamente hidratante y refrescante",
    ],
    frecuencia: "Diario",
    porcion: "3–4 hojas (~80 g)",
    receta: {
      nombre: "Wraps de lechuga con pollo",
      ingredientes: [
        "Hojas grandes de lechuga española",
        "Pollo cocido desmenuzado",
        "Zanahoria rallada y palta",
        "Salsa de soya o limón",
      ],
      preparacion:
        "Rellena cada hoja de lechuga con el pollo, la zanahoria y palta. Enrolla y disfruta como taco saludable.",
    },
  },

  "Lechuga Milanesa": {
    vitaminas: ["Vitamina A", "Vitamina K", "Potasio", "Fibra"],
    calorias: 14,
    nivelEnergetico: "bajo",
    beneficios: [
      "Textura crocante e hidratante, perfecta para sándwiches",
      "Muy bajo aporte calórico: aliada en dietas de control de peso",
      "Su agua y fibra generan saciedad con mínimas calorías",
    ],
    frecuencia: "Diario",
    porcion: "2–3 hojas (~80 g)",
    receta: {
      nombre: "Tacos en hoja de lechuga milanesa",
      ingredientes: [
        "Hojas de lechuga milanesa",
        "Carne molida sazonada",
        "Tomate picado y cebolla",
        "Palta y limón",
      ],
      preparacion:
        "Usa las hojas como base del taco. Rellena con la carne, tomate, cebolla y palta.",
    },
  },

  "Lechuga Marina": {
    vitaminas: ["Vitamina A", "Vitamina K", "Folato", "Hierro", "Fibra"],
    calorias: 15,
    nivelEnergetico: "bajo",
    beneficios: [
      "Hoja tierna y suave, de fácil digestión",
      "Buena fuente de folato para la formación celular",
      "Hidratante y ligera, ideal para ensaladas de verano",
    ],
    frecuencia: "Diario",
    porcion: "3–4 hojas (~80 g)",
    receta: {
      nombre: "Ensalada fresca con palta y tomate cherry",
      ingredientes: [
        "Hojas de lechuga marina",
        "Tomates cherry partidos",
        "¼ palta en cubos",
        "Aceite de oliva, sal y limón",
      ],
      preparacion:
        "Dispón las hojas en un plato, agrega los tomates cherry y la palta. Aliña al gusto.",
    },
  },

  "Lechuga Francesa": {
    vitaminas: ["Vitamina A", "Vitamina K", "Vitamina C", "Folato", "Hierro"],
    calorias: 13,
    nivelEnergetico: "bajo",
    beneficios: [
      "Textura mantecosa y sabor suave, la más tierna de las lechugas",
      "Rica en antioxidantes que protegen la piel",
      "Hidratante y de fácil digestión",
    ],
    frecuencia: "Diario",
    porcion: "3–4 hojas (~80 g)",
    receta: {
      nombre: "Ensalada francesa con vinagreta de mostaza",
      ingredientes: [
        "Hojas de lechuga francesa",
        "Huevo poché",
        "1 cda de mostaza Dijon",
        "Aceite de oliva y vinagre",
      ],
      preparacion:
        "Mezcla la mostaza con el vinagre y el aceite para la vinagreta. Dispón las hojas y corona con el huevo poché.",
    },
  },

  Papas: {
    vitaminas: ["Vitamina C", "Vitamina B6", "Potasio", "Manganeso", "Fósforo", "Fibra"],
    calorias: 77,
    nivelEnergetico: "moderado",
    beneficios: [
      "Fuente de energía compleja de liberación sostenida",
      "Más potasio que el plátano: regula presión arterial y función muscular",
      "Versátil y nutritiva: base de la alimentación chilena",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 papa mediana (~150 g)",
    receta: {
      nombre: "Papas doradas al horno con romero",
      ingredientes: [
        "4 papas cortadas en gajos",
        "2 cdas de aceite de oliva",
        "Romero fresco y ajo",
        "Sal y pimienta",
      ],
      preparacion:
        "Mezcla los gajos con aceite, romero, ajo, sal y pimienta. Hornea a 200 °C por 35 min hasta dorar.",
    },
  },

  Pepino: {
    vitaminas: ["Vitamina K", "Vitamina C", "Potasio", "Magnesio", "Sílice"],
    calorias: 16,
    nivelEnergetico: "bajo",
    beneficios: [
      "Ultra hidratante: un 96 % de su composición es agua",
      "El sílice fortalece piel, cabello y uñas",
      "Desinflamante natural, beneficioso para retención de líquidos",
    ],
    frecuencia: "Diario",
    porcion: "½ pepino (~100 g)",
    receta: {
      nombre: "Ensalada de pepino con yogurt",
      ingredientes: [
        "1 pepino en rodajas finas",
        "½ taza de yogurt natural",
        "Eneldo o menta fresca",
        "Sal, limón y aceite de oliva",
      ],
      preparacion:
        "Mezcla el pepino con el yogurt, agrega las hierbas y aliña con limón, sal y un hilo de aceite.",
    },
  },

  Perejil: {
    vitaminas: ["Vitamina K", "Vitamina C", "Vitamina A", "Hierro", "Folato"],
    calorias: 36,
    nivelEnergetico: "bajo",
    beneficios: [
      "Diurético natural que ayuda a eliminar toxinas",
      "Potente antioxidante: gramo a gramo supera a muchas frutas en vitamina C",
      "Refrescante del aliento gracias a su clorofila",
    ],
    frecuencia: "4–6 veces por semana (como hierba fresca)",
    porcion: "2–3 cucharadas picado (~10 g)",
    receta: {
      nombre: "Chimichurri casero",
      ingredientes: [
        "1 taza de perejil picado fino",
        "3 dientes de ajo picados",
        "½ taza de aceite de oliva",
        "2 cdas de vinagre, orégano, sal y ají",
      ],
      preparacion:
        "Mezcla todos los ingredientes en un frasco. Deja reposar mínimo 1 hora para que se integren los sabores.",
    },
  },

  "Pimentón Rojo": {
    vitaminas: ["Vitamina C", "Vitamina A", "Vitamina B6", "Vitamina E", "Folato"],
    calorias: 31,
    nivelEnergetico: "bajo",
    beneficios: [
      "Contiene el triple de vitamina C que una naranja (128 mg vs 53 mg por 100 g)",
      "Su betacaroteno protege la vista y la piel",
      "Potente antiinflamatorio que beneficia las articulaciones",
    ],
    frecuencia: "3–5 veces por semana",
    porcion: "½ pimentón mediano (~80 g)",
    receta: {
      nombre: "Pimentones rellenos con arroz",
      ingredientes: [
        "2 pimentones rojos sin semillas",
        "1 taza de arroz cocido",
        "Carne molida o legumbres",
        "Queso rallado, sal y especias",
      ],
      preparacion:
        "Rellena los pimentones con la mezcla de arroz y carne. Cubre con queso y hornea 25 min a 180 °C.",
    },
  },

  "Pimentón Verde": {
    vitaminas: ["Vitamina C", "Vitamina K", "Vitamina A", "Potasio", "Fibra"],
    calorias: 20,
    nivelEnergetico: "bajo",
    beneficios: [
      "El más bajo en calorías de los pimentones",
      "Rico en fibra que favorece la digestión",
      "Buena fuente de vitamina C aunque menor que el rojo (80 mg por 100 g)",
    ],
    frecuencia: "3–5 veces por semana",
    porcion: "½ pimentón mediano (~80 g)",
    receta: {
      nombre: "Salteado de pimentón verde con cebolla",
      ingredientes: [
        "2 pimentones verdes en tiras",
        "1 cebolla en pluma",
        "Aceite de oliva y ajo",
        "Sal, comino y pimienta",
      ],
      preparacion:
        "Saltea la cebolla y el ajo, agrega el pimentón y cocina a fuego alto 5 min. Condimenta al gusto.",
    },
  },

  Rabanitos: {
    vitaminas: ["Vitamina C", "Vitamina B6", "Potasio", "Fibra", "Folato"],
    calorias: 16,
    nivelEnergetico: "bajo",
    beneficios: [
      "Desintoxicante hepático: apoya la función del hígado",
      "Digestivo natural que estimula la producción de bilis",
      "Combate la retención de líquidos gracias a su efecto diurético",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "5–6 rabanitos (~100 g)",
    receta: {
      nombre: "Rabanitos con limón y sal de mar",
      ingredientes: [
        "1 atado de rabanitos en rodajas",
        "Jugo de 1 limón",
        "Sal de mar y pimienta",
        "Cilantro fresco",
      ],
      preparacion:
        "Corta los rabanitos en rodajas finas, aliña con limón y sal de mar. Decora con cilantro. Ideal como snack.",
    },
  },

  Repollo: {
    vitaminas: ["Vitamina K", "Vitamina C", "Vitamina B6", "Folato", "Manganeso", "Fibra"],
    calorias: 25,
    nivelEnergetico: "bajo",
    beneficios: [
      "Protege la mucosa gástrica: remedio tradicional para úlceras estomacales",
      "Antiinflamatorio natural que beneficia el sistema digestivo",
      "Rico en fibra y muy bajo en calorías, ideal para dietas",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 taza picado (~90 g)",
    receta: {
      nombre: "Ensalada de repollo con zanahoria",
      ingredientes: [
        "¼ repollo picado fino",
        "2 zanahorias ralladas",
        "Jugo de limón",
        "Aceite, sal y pimienta",
      ],
      preparacion:
        "Mezcla el repollo con la zanahoria, aliña con limón, aceite y sal. Deja reposar 10 min antes de servir.",
    },
  },

  Tomate: {
    vitaminas: ["Vitamina C", "Vitamina A", "Licopeno", "Potasio", "Vitamina K"],
    calorias: 18,
    nivelEnergetico: "bajo",
    beneficios: [
      "Su licopeno es un potente antioxidante con propiedades anticancerígenas estudiadas",
      "Protege la salud cardiovascular reduciendo el colesterol",
      "Beneficia la piel contra el daño solar gracias a sus carotenoides",
    ],
    frecuencia: "Diario",
    porcion: "1 tomate mediano (~120 g)",
    receta: {
      nombre: "Ensalada chilena de tomate",
      ingredientes: [
        "3 tomates en rodajas",
        "½ cebolla en pluma fina",
        "Cilantro fresco picado",
        "Aceite, sal y limón",
      ],
      preparacion:
        "Dispón los tomates con la cebolla, agrega cilantro generoso. Aliña con aceite, limón y sal.",
    },
  },

  Zanahoria: {
    vitaminas: [
      "Vitamina A (betacaroteno)",
      "Vitamina K",
      "Vitamina C",
      "Potasio",
      "Fibra",
    ],
    calorias: 41,
    nivelEnergetico: "bajo",
    beneficios: [
      "La mayor fuente vegetal de betacaroteno: protege y mejora la visión",
      "Mejora la salud de la piel, dándole luminosidad",
      "Fortalece el sistema inmune con su vitamina A y C",
    ],
    frecuencia: "Diario (5–7 veces por semana)",
    porcion: "1 zanahoria mediana (~60 g)",
    receta: {
      nombre: "Bastones de zanahoria con hummus",
      ingredientes: [
        "3 zanahorias en bastones",
        "1 taza de garbanzos cocidos",
        "2 cdas de tahini",
        "Jugo de limón, ajo, sal y aceite de oliva",
      ],
      preparacion:
        "Procesa los garbanzos con tahini, limón, ajo, sal y aceite hasta obtener el hummus. Sirve con los bastones de zanahoria.",
    },
  },

  "Zapallo Camote": {
    vitaminas: ["Vitamina A", "Vitamina C", "Vitamina E", "Potasio", "Magnesio", "Fibra"],
    calorias: 45,
    nivelEnergetico: "bajo",
    beneficios: [
      "Excelente fuente de betacaroteno que el cuerpo convierte en vitamina A",
      "Protege la vista y fortalece la inmunidad",
      "Su fibra ayuda a regular el tránsito intestinal y la saciedad",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 taza cocido (~200 g)",
    receta: {
      nombre: "Crema de zapallo camote con jengibre",
      ingredientes: [
        "½ zapallo camote en cubos",
        "1 cebolla picada",
        "1 trozo de jengibre fresco",
        "Caldo de verduras, sal y pimienta",
      ],
      preparacion:
        "Sofríe la cebolla con el jengibre, agrega el zapallo y el caldo. Cocina 20 min y licúa hasta obtener una crema suave.",
    },
  },

  "Zapallo Italiano": {
    vitaminas: ["Vitamina C", "Vitamina A", "Potasio", "Manganeso", "Folato", "Fibra"],
    calorias: 17,
    nivelEnergetico: "bajo",
    beneficios: [
      "Uno de los vegetales más bajos en calorías: aliado en dietas",
      "Hidratante y versátil: se puede usar como reemplazo de pastas",
      "Su potasio y magnesio benefician la función muscular",
    ],
    frecuencia: "4–5 veces por semana",
    porcion: "1 zapallo italiano (~200 g)",
    receta: {
      nombre: "Zapallo italiano relleno con queso y tomate",
      ingredientes: [
        "2 zapallos italianos cortados a lo largo",
        "Tomate picado y queso rallado",
        "Ajo, albahaca y aceite de oliva",
        "Sal y pimienta",
      ],
      preparacion:
        "Ahueca los zapallos, rellena con tomate, ajo y albahaca. Cubre con queso y hornea 20 min a 180 °C.",
    },
  },

  Ajo: {
    vitaminas: ["Vitamina C", "Vitamina B6", "Manganeso", "Selenio", "Alicina"],
    calorias: 149,
    nivelEnergetico: "bajo",
    beneficios: [
      "Antibiótico natural gracias a la alicina, activa al machacar o picar",
      "Ayuda a regular la presión arterial y el colesterol",
      "Fortalece las defensas inmunológicas contra resfríos y gripes",
    ],
    frecuencia: "Diario (como condimento)",
    porcion: "1–2 dientes (~6 g)",
    receta: {
      nombre: "Pan con ajo al horno",
      ingredientes: [
        "1 baguette o marraqueta",
        "4 dientes de ajo picados fino",
        "3 cdas de mantequilla blanda",
        "Perejil picado y sal",
      ],
      preparacion:
        "Mezcla la mantequilla con el ajo, perejil y sal. Unta sobre el pan cortado en rebanadas. Hornea 10 min a 180 °C.",
    },
  },

  Coliflor: {
    vitaminas: ["Vitamina C", "Vitamina K", "Vitamina B6", "Folato", "Potasio", "Fibra"],
    calorias: 25,
    nivelEnergetico: "bajo",
    beneficios: [
      "Contiene compuestos glucosinolatos con propiedades anticancerígenas",
      "Versátil en dietas bajas en carbohidratos (reemplaza arroz y masas)",
      "Rica en fibra y colina, beneficiosa para la memoria y el cerebro",
    ],
    frecuencia: "3–4 veces por semana",
    porcion: "1 taza (~125 g)",
    receta: {
      nombre: "Coliflor gratinada al horno",
      ingredientes: [
        "1 coliflor en ramilletes",
        "1 taza de salsa blanca",
        "Queso gratín rallado",
        "Sal, pimienta y nuez moscada",
      ],
      preparacion:
        "Blanquea la coliflor 5 min. Coloca en fuente, cubre con salsa blanca y queso. Hornea 15 min a 200 °C hasta dorar.",
    },
  },

  /* ─────────────── HUEVOS ─────────────── */
  "Huevos por 30": {
    vitaminas: [
      "Proteína completa",
      "Vitamina B12",
      "Vitamina D",
      "Selenio",
      "Colina",
      "Vitamina A",
    ],
    calorias: 155,
    nivelEnergetico: "moderado",
    beneficios: [
      "Proteína de la más alta calidad biológica: contiene los 9 aminoácidos esenciales",
      "La colina es esencial para el cerebro, la memoria y el sistema nervioso",
      "Su vitamina D fortalece huesos y dientes",
    ],
    frecuencia: "1–2 huevos diarios (7 veces por semana)",
    porcion: "1–2 huevos (~100 g)",
    receta: {
      nombre: "Huevos revueltos con tomate y cilantro",
      ingredientes: [
        "2 huevos",
        "1 tomate picado",
        "Cilantro fresco",
        "Sal y pimienta",
      ],
      preparacion:
        "Bate los huevos, vierte en sartén caliente con el tomate. Revuelve suavemente hasta cuajar. Agrega cilantro y sal.",
    },
  },

  "Huevos de Campo por 30": {
    vitaminas: [
      "Proteína completa",
      "Vitamina B12",
      "Vitamina D",
      "Omega-3",
      "Vitamina A",
      "Vitamina E",
    ],
    calorias: 155,
    nivelEnergetico: "moderado",
    beneficios: [
      "Hasta 3 veces más omega-3 que un huevo convencional, por la alimentación libre de las gallinas",
      "Mayor contenido de vitamina E y betacaroteno (yema más anaranjada)",
      "Proteína completa de alta calidad con mejor perfil nutricional",
    ],
    frecuencia: "1–2 huevos diarios (7 veces por semana)",
    porcion: "1–2 huevos (~100 g)",
    receta: {
      nombre: "Huevo de campo a la pobre",
      ingredientes: [
        "2 huevos de campo",
        "Papas fritas en cubos",
        "Cebolla caramelizada",
        "Sal y merkén",
      ],
      preparacion:
        "Fríe las papas hasta dorar, agrega la cebolla caramelizada y los huevos fritos encima. Termina con merkén.",
    },
  },

  /* ─────────────── FRUTOS SECOS ─────────────── */
  Nueces: {
    vitaminas: ["Omega-3 (ALA)", "Vitamina E", "Magnesio", "Fósforo", "Cobre", "Manganeso"],
    calorias: 654,
    nivelEnergetico: "alto",
    beneficios: [
      "La mejor fuente vegetal de omega-3 (ácido alfa-linolénico), esencial para el cerebro",
      "Mejora la función cognitiva y la memoria",
      "Protege la salud cardiovascular reduciendo colesterol LDL",
    ],
    frecuencia: "Diario (en porciones controladas)",
    porcion: "Un puñado (~30 g, ~7 nueces)",
    receta: {
      nombre: "Mix energético de frutos secos",
      ingredientes: [
        "½ taza de nueces",
        "½ taza de almendras",
        "¼ taza de pasas",
        "1 cda de miel",
      ],
      preparacion:
        "Mezcla todos los frutos secos con la miel. Guarda en un frasco hermético. Ideal como snack de media mañana.",
    },
  },

  "Nuez sin cáscara": {
    vitaminas: ["Omega-3 (ALA)", "Vitamina E", "Magnesio", "Fósforo", "Cobre", "Manganeso"],
    calorias: 654,
    nivelEnergetico: "alto",
    beneficios: [
      "Mismo poder nutricional que la nuez entera: rica en omega-3 para el cerebro",
      "Lista para consumir: ideal para agregar a ensaladas y recetas",
      "Sus antioxidantes combaten el estrés oxidativo celular",
    ],
    frecuencia: "Diario (en porciones controladas)",
    porcion: "Un puñado (~30 g)",
    receta: {
      nombre: "Ensalada verde con nueces y queso de cabra",
      ingredientes: [
        "Mix de lechugas frescas",
        "Un puñado de nueces peladas",
        "Queso de cabra desmenuzado",
        "Vinagreta de miel y mostaza",
      ],
      preparacion:
        "Dispón las lechugas, agrega las nueces y el queso. Aliña con la vinagreta de miel y mostaza.",
    },
  },

  Pistachos: {
    vitaminas: ["Vitamina B6", "Vitamina E", "Potasio", "Fósforo", "Proteína", "Fibra"],
    calorias: 562,
    nivelEnergetico: "alto",
    beneficios: [
      "Uno de los frutos secos con más proteína: 20 g por cada 100 g",
      "La luteína y zeaxantina protegen la salud ocular",
      "Su fibra mejora la flora intestinal y genera saciedad",
    ],
    frecuencia: "4–5 veces por semana",
    porcion: "Un puñado (~30 g, ~49 pistachos)",
    receta: {
      nombre: "Pistachos caramelizados con miel",
      ingredientes: [
        "1 taza de pistachos pelados",
        "2 cdas de miel",
        "Sal de mar",
        "Pimienta de cayena (opcional)",
      ],
      preparacion:
        "Tuesta los pistachos en sartén seca 3 min. Agrega la miel y revuelve hasta cubrir. Espolvorea sal de mar y deja enfriar.",
    },
  },

  Almendras: {
    vitaminas: ["Vitamina E", "Magnesio", "Proteína", "Fibra", "Calcio", "Riboflavina"],
    calorias: 579,
    nivelEnergetico: "alto",
    beneficios: [
      "Fuente destacada de vitamina E: el antioxidante liposoluble más importante",
      "Fortalece los huesos gracias a su calcio y magnesio de origen vegetal",
      "Ayuda a controlar los niveles de azúcar en sangre por su bajo índice glucémico",
    ],
    frecuencia: "Diario",
    porcion: "Un puñado (~23 almendras, ~30 g)",
    receta: {
      nombre: "Leche de almendras casera",
      ingredientes: [
        "1 taza de almendras remojadas (8 h)",
        "4 tazas de agua filtrada",
        "1 pizca de sal",
        "Vainilla o miel (opcional)",
      ],
      preparacion:
        "Licúa las almendras escurridas con el agua por 2 min. Cuela con malla fina o bolsa de leche. Endulza al gusto.",
    },
  },

  /* ─────────────── MIEL ─────────────── */
  "Miel de abeja": {
    vitaminas: [
      "Antioxidantes (flavonoides)",
      "Enzimas naturales",
      "Vitaminas del grupo B",
      "Hierro",
      "Calcio",
      "Zinc",
    ],
    calorias: 304,
    nivelEnergetico: "alto",
    beneficios: [
      "Antibacteriano natural con propiedades cicatrizantes comprobadas",
      "Alivia la irritación de garganta y calma la tos",
      "Endulzante natural con índice glucémico menor que el azúcar refinada",
    ],
    frecuencia: "Diario (con moderación: 1–2 cucharaditas)",
    porcion: "1–2 cucharaditas (~10–20 g)",
    receta: {
      nombre: "Infusión de jengibre con miel y limón",
      ingredientes: [
        "1 trozo de jengibre fresco rallado",
        "1 taza de agua caliente",
        "1 cda de miel",
        "Jugo de ½ limón",
      ],
      preparacion:
        "Hierve el agua con el jengibre 5 min. Cuela, agrega la miel y el limón. Ideal para resfríos y como digestivo.",
    },
  },
};

export function getNutrition(productName: string): ProductNutrition | null {
  return nutrition[productName] ?? null;
}

export default nutrition;
