/**
 * Instagram Graph API helper para @frescon.cl
 * Se usa en API routes (servidor). No importar en componentes cliente.
 * Docs: https://developers.facebook.com/docs/instagram-api
 */

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.instagram.com/${API_VERSION}`;

function getConfig() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) {
    throw new Error("Faltan variables INSTAGRAM_ACCESS_TOKEN o INSTAGRAM_USER_ID en .env.local");
  }
  return { token, userId };
}

// ── Tipos ──────────────────────────────────────────────

export interface IGResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface IGInsights {
  plays?: number;
  reach?: number;
  saves?: number;
  shares?: number;
  likes?: number;
  comments?: number;
}

// ── Publicar foto ──────────────────────────────────────

export async function postPhoto(imageUrl: string, caption: string): Promise<IGResult> {
  try {
    const { token, userId } = getConfig();

    // Paso 1: Crear container
    const containerRes = await fetch(`${BASE_URL}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: token,
      }),
    });
    const container = await containerRes.json();
    if (container.error) return { success: false, error: container.error.message };

    // Paso 2: Publicar
    await delay(2000);
    const publishRes = await fetch(`${BASE_URL}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    });
    const published = await publishRes.json();
    if (published.error) return { success: false, error: published.error.message };

    return { success: true, id: published.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Publicar reel (video) ──────────────────────────────

export async function postReel(videoUrl: string, caption: string): Promise<IGResult> {
  try {
    const { token, userId } = getConfig();

    // Paso 1: Crear container de video
    const containerRes = await fetch(`${BASE_URL}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: videoUrl,
        caption,
        media_type: "REELS",
        access_token: token,
      }),
    });
    const container = await containerRes.json();
    if (container.error) return { success: false, error: container.error.message };

    // Paso 2: Esperar procesamiento del video
    const ready = await pollContainerStatus(container.id, token);
    if (!ready) return { success: false, error: "Timeout esperando procesamiento del video" };

    // Paso 3: Publicar
    const publishRes = await fetch(`${BASE_URL}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    });
    const published = await publishRes.json();
    if (published.error) return { success: false, error: published.error.message };

    return { success: true, id: published.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Publicar carousel (2-10 imagenes) ──────────────────

export async function postCarousel(imageUrls: string[], caption: string): Promise<IGResult> {
  try {
    const { token, userId } = getConfig();
    if (imageUrls.length < 2 || imageUrls.length > 10) {
      return { success: false, error: "Carousel requiere entre 2 y 10 imagenes" };
    }

    // Paso 1: Crear containers individuales
    const childIds: string[] = [];
    for (const url of imageUrls) {
      const res = await fetch(`${BASE_URL}/${userId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: token,
        }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      childIds.push(data.id);
      await delay(2000);
    }

    // Paso 2: Crear container carousel
    const carouselRes = await fetch(`${BASE_URL}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        caption,
        children: childIds,
        access_token: token,
      }),
    });
    const carousel = await carouselRes.json();
    if (carousel.error) return { success: false, error: carousel.error.message };

    // Paso 3: Publicar
    await delay(2000);
    const publishRes = await fetch(`${BASE_URL}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carousel.id,
        access_token: token,
      }),
    });
    const published = await publishRes.json();
    if (published.error) return { success: false, error: published.error.message };

    return { success: true, id: published.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Obtener insights de un post ────────────────────────

export async function getInsights(mediaId: string): Promise<IGInsights> {
  const { token } = getConfig();
  const metrics = "plays,reach,saved,shares,comments,likes";
  const res = await fetch(
    `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) return {};

  const insights: IGInsights = {};
  for (const metric of data.data || []) {
    const key = metric.name as keyof IGInsights;
    insights[key] = metric.values?.[0]?.value ?? 0;
  }
  return insights;
}

// ── Utilidades internas ────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollContainerStatus(containerId: string, token: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    await delay(10000);
    const res = await fetch(
      `${BASE_URL}/${containerId}?fields=status_code&access_token=${token}`
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") return true;
    if (data.status_code === "ERROR") return false;
  }
  return false;
}
