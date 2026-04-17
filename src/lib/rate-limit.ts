/**
 * Rate limiter simple basado en Map en memoria.
 * En Vercel serverless cada instancia tiene su propio Map,
 * pero sigue siendo útil para prevenir ráfagas desde la misma IP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

interface RateLimitConfig {
  /** Identificador del limiter (ej: "login", "forgot-password") */
  name: string;
  /** Máximo de requests permitidos en la ventana */
  maxRequests: number;
  /** Ventana de tiempo en segundos */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function checkRateLimit(
  config: RateLimitConfig,
  key: string
): RateLimitResult {
  if (!stores.has(config.name)) {
    stores.set(config.name, new Map());
  }
  const store = stores.get(config.name)!;

  const now = Date.now();
  const entry = store.get(key);

  // Limpiar entradas expiradas periódicamente
  if (store.size > 1000) {
    const keys = Array.from(store.keys());
    for (let i = 0; i < keys.length; i++) {
      const entry2 = store.get(keys[i]);
      if (entry2 && entry2.resetAt < now) store.delete(keys[i]);
    }
  }

  if (!entry || entry.resetAt < now) {
    // Nueva ventana
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowSeconds,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/** Extrae IP del request (compatible con Vercel) */
export function getClientIP(req: Request): string {
  const headers = new Headers(req.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
