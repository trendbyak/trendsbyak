import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function listingIdFromUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (!u.hostname.toLowerCase().endsWith("etsy.com")) return null;
    return u.pathname.match(/\/listing\/(\d+)(?:\/|$)/i)?.[1] ?? null;
  } catch { return null; }
}
function apiKey(): string {
  const configured = Deno.env.get("ETSY_API_KEY")?.trim() || "";
  const shared = Deno.env.get("ETSY_SHARED_SECRET")?.trim() || "";
  if (configured.includes(":")) return configured;
  if (configured && shared) return `${configured}:${shared}`;
  const key = Deno.env.get("ETSY_KEYSTRING")?.trim() || Deno.env.get("ETSY_API_KEYSTRING")?.trim() || "";
  const secret = shared || Deno.env.get("ETSY_API_SECRET")?.trim() || "";
  return key && secret ? `${key}:${secret}` : "";
}
function amount(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}
function priceFrom(value: any): number | null {
  if (value && typeof value === "object" && value.amount != null) {
    const a = amount(value.amount); const d = amount(value.divisor) || 1;
    return a == null ? null : a / d;
  }
  return amount(value);
}
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function decodeHtml(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function jsonLdFromHtml(html: string): any[] {
  const out: any[] = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(m[1].trim()));
      if (Array.isArray(parsed)) out.push(...parsed); else out.push(parsed);
    } catch { /* ignore malformed JSON-LD */ }
  }
  return out;
}
function publicPageData(url: string, listingId: string, html: string): any {
  const ld = jsonLdFromHtml(html);
  const product = ld.find((x) => x?.['@type'] === 'Product' || (Array.isArray(x?.['@type']) && x['@type'].includes('Product'))) || {};
  const offer = Array.isArray(product.offers) ? product.offers[0] : (product.offers || {});
  const title = product.name || html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  const description = product.description || html.match(/<meta[^>]+(?:name|property)=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || "";
  const currency = offer.priceCurrency || product?.offers?.priceCurrency || html.match(/priceCurrency[^\w]+["']([^"']+)["']/i)?.[1] || "USD";
  const price = priceFrom(offer.price ?? product.price);
  const imageValues = Array.isArray(product.image) ? product.image : product.image ? [product.image] : [];
  const metaImages = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/gi)].map((m) => m[1]);
  const images = [...new Set([...imageValues, ...metaImages].filter((x) => /^https?:\/\//i.test(String(x))))].slice(0, 5);
  return {
    source_url: url,
    source: "etsy",
    listing_id: Number(listingId),
    name: decodeHtml(stripHtml(String(title))),
    description: decodeHtml(stripHtml(String(description))),
    sku: `ETSY-${listingId}`,
    price,
    sale_price: null,
    currency,
    availability: "",
    stock: null,
    images,
    image_url: images[0] || "",
    variants: [],
    shop: null,
    extracted_from: "etsy-public-page",
  };
}
async function fetchPublicPage(url: string, listingId: string) {
  const page = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    },
  });
  const html = await page.text();
  if (!page.ok) throw new Error(`Etsy webpage returned HTTP ${page.status}`);
  const data = publicPageData(url, listingId, html);
  if (!data.name && !data.images.length) throw new Error("Etsy page did not expose product data to the importer.");
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    const body = await req.json();
    const url = String(body?.url ?? "").trim();
    const listingId = listingIdFromUrl(url);
    if (!listingId) return json({ error: "Please provide a valid Etsy listing URL." }, 400);

    // Prefer the official Etsy API when the app credentials work.
    // If Etsy rejects the API key, fall back to the public listing page so the
    // bulk scraper can still import public product information.
    const key = apiKey();
    if (key) {
      const endpoint = `https://api.etsy.com/v3/application/listings/${listingId}?includes=Images,Shop`;
      const r = await fetch(endpoint, { headers: { "x-api-key": key, "Accept": "application/json" } });
      const text = await r.text();
      let data: any; try { data = JSON.parse(text); } catch { data = null; }
      if (r.ok) {
        const images = (data?.images ?? [])
          .sort((a: any, b: any) => Number(a?.rank ?? 0) - Number(b?.rank ?? 0))
          .map((x: any) => x?.url_fullxfull || x?.url_570xN || x?.url_170x135)
          .filter(Boolean).slice(0, 5);
        const priceObj = data?.price;
        const price = priceFrom(priceObj);
        const currency = priceObj?.currency_code || priceObj?.currency || "USD";
        return json({ source_url: data?.url || url, source: "etsy", listing_id: data?.listing_id ?? Number(listingId), name: data?.title || "", description: data?.description || "", sku: `ETSY-${listingId}`, price, sale_price: null, currency, availability: data?.state || "", stock: null, images, image_url: images[0] || "", variants: [], shop: data?.shop?.shop_name || data?.shop?.title || null, extracted_from: "etsy-open-api-v3", http_status: r.status });
      }
    }

    try {
      return json(await fetchPublicPage(url, listingId));
    } catch (fallbackError) {
      return json({ error: `Etsy API could not be used and public-page import also failed: ${fallbackError instanceof Error ? fallbackError.message : "unknown error"}`, listing_id: listingId }, 502);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Could not import this Etsy listing." }, 500);
  }
});
