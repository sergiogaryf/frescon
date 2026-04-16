# Frescon

## Stack
- Framework: Next.js 14.2.35 + React 18 + TypeScript
- DB: Airtable (airtable 0.12.2)
- CSS: Tailwind 3.4.1
- Integraciones: Anthropic SDK, Recharts, Resend (emails), JsPDF, Vercel Blob
- Deploy: Vercel → frescon.cl

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run build` — verificar antes de deploy
- `npm run lint` — verificar errores de linting
- `npx vercel --prod --yes` — deploy a producción

## Contexto
App de delivery de frutas y verduras en la zona Concón-Reñaca. Incluye catálogo de productos, gestión de pedidos, seguimiento de entregas y panel de administración.

## Reglas
- Leer antes de editar. Grep antes de Read.
- Toda lógica de negocio en el servidor (API routes), nunca en cliente
- Variables de entorno en `.env.local`, nunca hardcodeadas en código
- Antes de deploy: `npm run build` debe pasar sin errores ni warnings críticos
- No modificar estructura de tablas Airtable sin revisar todos los campos relacionados
- Emails via Resend — no agregar otras librerías de email
- Archivos/PDFs via Vercel Blob — no usar filesystem local
- Respetar tipado TypeScript estricto, sin `any` salvo justificación

## Contacto
- Owner: Sergio Gary (sergiogaryf@gmail.com)

## Equipo Micelia OS

Agentes disponibles para este proyecto:

| Agente | Skill | Uso |
|--------|-------|-----|
| Manuel | `/manuel` | Construir features, escribir código |
| Fidel | `/fidel` | Diseñar arquitectura antes de construir |
| Vee | `/vee` `/lint` | QA pre-deploy, verificar tipos y lint |
| Guillermito | `/guillermito` `/deps` | Auditoría de seguridad y dependencias |
| Nico | `/deploy frescon` `/health` | Deploy a producción, health check |
| Camila | `/costos frescon` `/rentabilidad frescon` | Costos y rentabilidad |
| Kaizen | `/kaizen` | Detectar mejoras y optimizaciones |

Atajos: `/ask [pregunta]` (Router) · `/active` (dashboard) · `/startup` (arranque)
