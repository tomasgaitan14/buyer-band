# band

## Descripción

Buyer Band — app de barra de anuncio para tiendas Tiendanube. Permite al comerciante configurar un banner rotativo en el header de su tienda con texto, colores y link opcional, sin tocar código.

## Contexto

Personal — bajo la empresa Buyer (carpeta padre: `Desarrollos/Buyer/`).

## Stack

- **Frontend + Backend:** Next.js (App Router) + TypeScript + Tailwind
- **DB:** Supabase (cuenta `tomasgaitan14` — 1 slot libre)
- **Deploy:** Vercel (cuenta `tomasagustingaitan@gmail.com`, slug `tomasgaitans-projects`)
- **Widget del storefront:** Vanilla JS (compilado con Vite), hosteado en `/public/widget.js`

## Tiendanube

- **App ID:** 37703
- **Client Secret:** en `.env` (nunca commitear)
- **Scopes requeridos:** `read_store`, `write_scripts`
- **Redirect URI:** `https://{dominio}/api/auth/callback`
- **Script:** registrado en Partner Portal, auto-instalado al instalar la app

## Proyectos relacionados

Ninguno por ahora. Primera app bajo Buyer.

## Cuentas

| Servicio | Cuenta |
|----------|--------|
| GitHub | `tomasgaitan14` |
| Vercel | `tomasagustingaitan@gmail.com` (`tomasgaitans-projects`) |
| Supabase | `tomasgaitan14@gmail.com` (org `tomasgaitan14`) |

## Modelo de negocio

- 30 días de prueba gratis (sin tarjeta)
- Suscripción mensual vía Tiendanube Billing API
- Países: AR, MX, CO, CL (arrancar con AR)

## Estado actual

Scaffold de Next.js listo. Próximo paso: setup Supabase + flujo OAuth.

## Decisiones tomadas

- Next.js fullstack (dashboard + API routes en un solo deploy) en lugar de Vite separado, porque el proyecto requiere OAuth, API pública para el widget y billing webhooks
- Script del storefront en Vanilla JS (no React) para mínimo peso en el frontend del comerciante
- Widget cargado con evento `onfirstinteraction` (default de TN) — si necesitamos `onload` hay que solicitar aprobación a TN vía email
- Supabase como DB principal (plan free, cuenta `tomasgaitan14`)
- Billing vía Tiendanube Billing API (suscripción integrada en el ecosistema TN)

## Schema de Supabase

```sql
stores (
  id bigint PK,           -- store_id de TN
  access_token text,
  store_url text,
  plan text,              -- 'trial' | 'active' | 'cancelled'
  trial_started_at timestamptz,
  created_at timestamptz
)

widget_configs (
  id uuid PK,
  store_id bigint → stores.id,
  widget_type text,       -- 'announcement-bar'
  config jsonb,           -- texto, colores, link, velocidad, etc.
  enabled boolean,
  updated_at timestamptz
)
```

## Flujo de instalación

```
Comerciante → "Instalar" en marketplace TN
  → TN redirige a /api/auth/callback?code=XXX&store_id=XXX
  → Intercambiamos code por access_token
  → Guardamos tienda en Supabase (plan: 'trial')
  → Registramos script en TN (auto-instalado)
  → Redirigimos al dashboard
  → Comerciante configura Band
  → Script activo en su tienda
```

## Próximos pasos

1. ~~Scaffold de Next.js~~ ✓
2. Setup Supabase (proyecto + migraciones)
3. Flujo OAuth con Tiendanube
4. API `/api/widget-config` (consumida por el script)
5. Script del storefront (announcement bar)
6. Dashboard del comerciante
7. Billing API de TN
8. Deploy a Vercel

## Archivos clave

- `src/app/api/auth/callback/route.ts` — OAuth callback
- `src/app/api/widget-config/route.ts` — config consumida por el script del storefront
- `src/app/api/billing/route.ts` — webhooks de Tiendanube Billing
- `src/app/(dashboard)/page.tsx` — configurador del widget
- `widget-src/announcement-bar.ts` — JS del storefront
- `public/widget.js` — bundle compilado del widget
- `supabase/migrations/` — migraciones de DB
