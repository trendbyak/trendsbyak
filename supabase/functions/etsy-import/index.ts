import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
function listingIdFromUrl(raw: string): string | null { try { const u = new URL(raw); if (!u.hostname.toLowerCase().endsWith("etsy.com")) return null; return u.pathname.match(/\/listing\/(\d+)(?:\/|$)/i)?.[1] ?? null; } catch { return null; } }
function apiKey(): string { const combined = Deno.env.get("ETSY_API_KEY")?.trim(); if (combined) return combined; const key = Deno.env.get("ETSY_KEYSTRING")?.trim(); const secret = Deno.env.get("ETSY_SHARED_SECRET")?.trim(); return key && secret ? `${key}:${secret}` : ""; }
function amount(v: unknown): number | null { if (v == null) return null; const n = Number(String(v).replace(/,/g, "").trim()); return Number.isFinite(n) ? n : null; }
function offeringPrice(offering: any): number | null { const p = offering?.price; if (p && typeof p === "object" && p.amount != null) { const a = amount(p.amount), d = amount(p.divisor) || 1; return a == null ? null : a / d; } return amount(p); }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    const body = await req.json(); const url = String(body?.url ?? "").trim(); const listingId = listingIdFromUrl(url);
    if (!listingId) return json({ error: "Please provide a valid Etsy listing URL." }, 400);
    const key = apiKey(); if (!key) return json({ error: "Etsy API credentials are not configured in Supabase secrets. Expected ETSY_API_KEY (keystring:shared_secret), or ETSY_KEYSTRING + ETSY_SHARED_SECRET." }, 500);
    const endpoint = `https://api.etsy.com/v3/application/listings/${listingId}?includes=Images,Inventory,Shop`;
    const r = await fetch(endpoint, { headers: { "x-api-key": key, "Accept": "application/json" } });
    const text = await r.text(); let data: any; try { data = JSON.parse(text); } catch { data = null; }
    if (!r.ok) { const detail = data?.error || data?.message || text.slice(0, 300); return json({ error: `Etsy API returned HTTP ${r.status}: ${detail}`, listing_id: listingId }, r.status >= 400 && r.status < 500 ? r.status : 502); }
    const inv = data?.inventory?.products ?? []; const variants: any[] = []; let basePrice: number | null = null; let stock = 0; let currency = "USD";
    for (const product of inv) { const props = Array.isArray(product?.property_values) ? product.property_values : []; const size = props.find((p: any) => /size/i.test(String(p?.property_name ?? "")))?.values?.[0] ?? null; const color = props.find((p: any) => /color|colour/i.test(String(p?.property_name ?? "")))?.values?.[0] ?? null; for (const offering of product?.offerings ?? []) { if (offering?.is_deleted) continue; const price = offeringPrice(offering); const currencyCode = offering?.price?.currency_code || offering?.price?.currency || null; if (currencyCode) currency = currencyCode; if (price != null && basePrice == null) basePrice = price; const qty = Number(offering?.quantity ?? 0) || 0; stock += qty; variants.push({ size, color, price, stock: qty, sku: product?.sku || null, enabled: offering?.is_enabled !== false }); } }
    const images = (data?.images ?? []).sort((a: any, b: any) => Number(a?.rank ?? 0) - Number(b?.rank ?? 0)).map((x: any) => x?.url_fullxfull || x?.url_570xN || x?.url_170x135).filter(Boolean).slice(0, 3);
    return json({ source_url: data?.url || url, source: "etsy", listing_id: data?.listing_id ?? Number(listingId), name: data?.title || "", description: data?.description || "", sku: variants.find(v => v.sku)?.sku || `ETSY-${listingId}`, price: basePrice, sale_price: null, currency, availability: data?.state || "", stock, images, image_url: images[0] || "", variants, shop: data?.shop?.shop_name || data?.shop?.title || null, extracted_from: "etsy-open-api-v3", http_status: r.status });
  } catch (e) { return json({ error: e instanceof Error ? e.message : "Could not import this Etsy listing." }, 500); }
});
