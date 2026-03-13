# Frescón Delivery 🌿

> Plataforma de delivery de verduras y frutas frescas para Concón, Reñaca y Jardín del Mar.
> Directo del campo a tu puerta cada jueves.

---

## Descripción

**Frescón** es una tienda online de productos frescos con entrega semanal los jueves. Los clientes arman su pedido, pagan por transferencia y reciben confirmación automática por email. El repartidor gestiona su ruta desde el móvil. Celia, la asistente IA, atiende a clientes y genera reportes para el administrador.

---

## Demo

| Vista | URL | Descripción |
|-------|-----|-------------|
| Landing | `/` | Página principal con hero, productos estrella y Celia |
| Catálogo | `/catalogo` | Todos los productos con filtros por categoría |
| Cajas | `/cajas` | Selecciones creadas con descuento de hasta 18% |
| Checkout | `/checkout` | Formulario de pedido con selector de fecha |
| Confirmación | `/confirmacion` | Resumen del pedido + link de referido |
| Seguimiento | `/seguimiento` | Estado del pedido en tiempo real |
| Mi cuenta | `/cuenta` | Perfil del cliente |
| Repartidor | `/repartidor` | App móvil del repartidor |
| Admin | `/admin` | Panel de gestión interno |

---

## Stack tecnológico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 3
- **Estado carrito:** Zustand
- **Base de datos:** Airtable REST API
- **IA asistente:** Anthropic Claude (claude-sonnet-4-6) con tool use
- **Emails:** Resend
- **WhatsApp:** Twilio (estructura lista)
- **Deploy:** Vercel
- **Dominio:** [frescon.cl](https://www.frescon.cl)

---

## Estructura del proyecto

```
frescon/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout (fuentes, metadata)
│   │   ├── catalogo/page.tsx           # Catálogo de productos (ISR 60s)
│   │   ├── cajas/page.tsx              # Cajas Frescón (próximamente)
│   │   ├── checkout/page.tsx           # Formulario de pedido
│   │   ├── confirmacion/               # Confirmación post-pedido
│   │   ├── seguimiento/page.tsx        # Seguimiento de pedido
│   │   ├── cuenta/page.tsx             # Perfil del cliente
│   │   ├── repartidor/
│   │   │   ├── page.tsx                # Login repartidor
│   │   │   └── ruta/page.tsx           # Ruta del día + historial
│   │   ├── admin/                      # Panel admin (protegido)
│   │   └── api/
│   │       ├── pedidos/route.ts        # POST crear pedido
│   │       ├── referidos/route.ts      # GET/POST/PUT sistema de referidos
│   │       ├── ia/chat/route.ts        # Chat con Celia (Claude API)
│   │       └── repartidor/
│   │           ├── auth/route.ts       # Login repartidor
│   │           ├── ruta/route.ts       # GET pedidos / PATCH estado
│   │           └── chat/route.ts       # Chat admin-repartidor
│   ├── components/
│   │   ├── layout/Navbar.tsx
│   │   ├── sections/CatalogoCompleto.tsx
│   │   ├── products/ProductCard.tsx
│   │   └── checkout/CheckoutForm.tsx
│   ├── lib/
│   │   ├── airtable.ts                 # Todas las operaciones Airtable
│   │   ├── cajas.ts                    # Datos Cajas Frescón
│   │   ├── email.ts                    # Emails transaccionales (Resend)
│   │   └── whatsapp.ts                 # Notificaciones WhatsApp
│   ├── store/cartStore.ts              # Carrito global (Zustand)
│   └── types/index.ts                  # Interfaces TypeScript
├── public/images/productos/            # Imágenes PNG productos
├── .env.local                          # Variables de entorno (no subir)
└── next.config.mjs
```

---

## Variables de entorno

```env
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
REPARTIDOR_EMAIL=...
REPARTIDOR_WHATSAPP_NUMBER=56...
NEXT_PUBLIC_BANK_NAME=...
NEXT_PUBLIC_BANK_HOLDER=...
NEXT_PUBLIC_BANK_RUT=...
NEXT_PUBLIC_BANK_ACCOUNT=...
NEXT_PUBLIC_BANK_EMAIL=...
NEXT_PUBLIC_WHATSAPP_NUMBER=56...
ADMIN_PASSWORD=...
```

---

## Airtable — Tablas

| Tabla | Descripción |
|-------|-------------|
| `Productos` | Catálogo (nombre, precio, imagen, categoría, stock) |
| `Pedidos` | Pedidos (cliente, email, dirección, fecha, estado) |
| `PerfilesCeliaClientes` | Perfil IA por teléfono (código referido, descuento pendiente) |
| `CeliaMemoria` | Historial de conversaciones |
| `MejorasUX` | Sugerencias del agente UX |

### Campos clave — Productos

| Campo | Tipo | Notas |
|-------|------|-------|
| `nombre` | Text | |
| `precio` | Number | CLP |
| `categoria` | Select | `verduras` `frutas` `hierbas` `huevos` `kits` `frutos_secos` |
| `unidad` | Select | `kg` `unidad` `atado` `docena` `litro` |
| `imagen_url` | Text | `/images/productos/Nombre.png` |
| `activo` | Checkbox | Visible en catálogo |
| `es_estrella` | Checkbox | Badge "Temporada" |

### Campos clave — Pedidos

| Campo | Tipo | Notas |
|-------|------|-------|
| `nombre_cliente` | Text | |
| `email` | Email | Para Resend |
| `telefono` | Text | Para WhatsApp |
| `direccion` | Text | Debe mencionar Concón / Reñaca / Jardín del Mar |
| `fecha_entrega` | Date | Jueves |
| `total` | Number | CLP |
| `estado` | Select | `Pendiente` `Confirmado` `En camino` `Entregado` `Cancelado` |
| `orden_entrega` | Number | Orden en la ruta |

---

## Categorías de productos

| Categoría | Icono | Estado |
|-----------|-------|--------|
| Verduras | 🥦 | Activo |
| Frutas | 🍋 | Activo |
| Frutos Secos | 🥜 | Próximamente |
| Hierbas | 🌿 | Activo |
| Huevos | 🥚 | Activo |
| Cajas Frescón | 📦 | Próximamente |

---

## Funcionalidades

### Tienda
- Catálogo con filtros, buscador y paginación
- Carrito flotante persistente (Zustand)
- Checkout: nombre, email, teléfono, dirección, selector de jueves
- Validación de zona doble (cliente + servidor)
- Pedidos 24/7 — fecha mínima: próximo jueves
- Códigos de descuento: `FRESCON10` (10%) y `AMAMOSACELIA` (5%)
- Delivery gratis sobre $20.000

### Sistema de referidos
- Código único por cliente (`FRESC-NOM-1234`)
- 5% de descuento para el nuevo cliente
- 5% acumulado para el referidor (canjeable en siguiente pedido)

### Notificaciones automáticas

| Momento | Canal | Destinatario |
|---------|-------|-------------|
| Pedido confirmado | Email + WhatsApp | Cliente |
| Nuevo pedido | WhatsApp | Repartidor |
| En camino | Email | Cliente |
| Entregado | Email | Cliente |

### Celia — Asistente IA
- Chat con Claude (tool use): catálogo, pedidos, zonas, reporte de ventas
- Memoria por teléfono en Airtable
- Historia: nacida en Quillota, vive en Concón, ama las paltas

### App del repartidor
- Ruta del día ordenada
- Estados: Pendiente → En camino → Entregado
- Notificación automática al cliente al cambiar estado
- Pedidos visibles hasta que el repartidor avance manualmente
- Historial de pedidos anteriores
- Chat con admin

---

## Zonas de delivery

Regex de validación: `/conc[oó]n|re[nñ]aca|jard[ií]n del mar/i`

Validado en **CheckoutForm** (cliente) y **`/api/pedidos`** (servidor, 422 si no aplica).

---

## Paleta de colores

```css
--verde-principal: #3AAA35
--verde-oscuro:    #2A7A26
--amarillo:        #F9C514
--negro:           #1A1A1A
```

**Tipografías:** Nunito · Pacifico · Inter

---

## Deploy

```bash
npm install
npm run dev          # → http://localhost:3000

npm run build
npx vercel --prod
npx vercel alias frescon.cl www.frescon.cl   # ⚠️ siempre después de deploy
```

---

## Roadmap

### v1.0 ✅
- [x] Landing + catálogo + checkout + repartidor + admin

### v1.1 ✅
- [x] Celia IA · sistema de referidos · reporte admin · favicon

### v1.2 ✅
- [x] Zonas Concón/Reñaca/Jardín del Mar · Cajas Frescón · Frutos Secos
- [x] Emails Resend · historial repartidor · pedidos 24/7

### v1.3 — Próximo
- [ ] Dominio frescon.cl verificado en Resend
- [ ] Activar Cajas y Frutos Secos con precios
- [ ] Pagos online (Flow / Transbank)
- [ ] App móvil nativa

---

## Licencia

Proyecto privado — © 2026 Frescón Delivery, Concón Chile. Todos los derechos reservados.
