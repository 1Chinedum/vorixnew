/* VORIX storefront catalogue sync (read-only).
   If js/supabase-config.js is filled in, the published products are loaded from Supabase every time a page opens,
   so adding, editing or deleting a product in /admin/ shows up with NO new deployment. If Supabase is not configured,
   or cannot be reached, the website quietly keeps using the products in js/products.js.
   Uses the public anon key with plain fetch (no SDK needed): the database's Row Level Security only ever returns
   PUBLISHED products. Every page script waits for this through onStoreReady(). */
(function () {
  "use strict";
  const url = (typeof SUPABASE_URL === "string" ? SUPABASE_URL.trim().replace(/\/+$/, "") : "");
  const key = (typeof SUPABASE_ANON_KEY === "string" ? SUPABASE_ANON_KEY.trim() : "");
  const configured = /^https:\/\/[^\s/]+$/i.test(url) && key.length > 20;
  const useStaticIfEmpty = typeof USE_STATIC_WHEN_EMPTY === "boolean" ? USE_STATIC_WHEN_EMPTY : true;

  window.CATALOGUE_SOURCE = "static";

  const clean = s => String(s == null ? "" : s).replace(/[<>]/g, "").replace(/"/g, "”").trim();   // product text is placed into page markup: never allow tags or attribute breaks
  const safeImg = u => (typeof u === "string" && /^(https:\/\/|assets\/)/i.test(u.trim()) && !/\s/.test(u.trim())) ? u.trim() : null;
  const hex = c => (typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c.trim())) ? c.trim() : "#BDB5A8";
  const sand = "#E8E2D9", PLACEHOLDER = "assets/images/logo.png";

  function mapRow(r, lowAt) {
    const imgs = (Array.isArray(r.product_images) ? r.product_images : [])
      .map(i => ({ src: safeImg(i.image_url), colour: i.colour ? clean(i.colour).toLowerCase() : "", primary: !!i.is_primary, order: Number(i.display_order) || 0 }))
      .filter(i => i.src)
      .sort((a, b) => (b.primary - a.primary) || (a.order - b.order));      // primary photo first, then the chosen order
    let defs = (Array.isArray(r.colours) ? r.colours : [])
      .filter(c => c && typeof c.name === "string" && clean(c.name))
      .map(c => ({ name: clean(c.name), swatch: Array.isArray(c.swatch) && c.swatch.length >= 2 ? [hex(c.swatch[0]), hex(c.swatch[1])] : hex(Array.isArray(c.swatch) ? c.swatch[0] : c.swatch) }));
    if (!defs.length) defs = [{ name: "Standard", swatch: "#BDB5A8" }];
    const byColour = defs.map(() => []);
    imgs.forEach(i => {
      let k = i.colour ? defs.findIndex(d => d.name.toLowerCase() === i.colour) : -1;
      if (k < 0) k = 0;                                                       // photos without a colour belong to the first colour
      byColour[k].push(i.src);
    });
    let colours = defs.map((d, k) => byColour[k].length ? { name: d.name, swatch: d.swatch, image: byColour[k][0], bg: sand, additionalImages: byColour[k].slice(1) } : null).filter(Boolean);
    if (!colours.length) colours = [{ name: defs[0].name, swatch: defs[0].swatch, image: PLACEHOLDER, bg: sand, additionalImages: [] }];
    const stock = Math.max(0, Math.floor(Number(r.stock_quantity)) || 0), sold = stock === 0;
    const price = Number(r.price), prev = r.previous_price == null ? null : Number(r.previous_price);
    const out = {
      id: Number(r.id), name: clean(r.name), category: clean(r.categories && r.categories.name) || "Collection",
      price: Number.isFinite(price) ? price : null,
      previousPrice: Number.isFinite(prev) && prev > price ? prev : null,
      description: clean(r.description), colours,
      sizes: (Array.isArray(r.sizes) ? r.sizes : []).map(clean).filter(Boolean),
      availability: sold ? "Out of stock" : (stock <= lowAt ? "Low stock: only " + stock + " left" : "Available to order on WhatsApp"),
      soldOut: sold, stock, featured: !!r.is_featured, newArrival: !!r.is_new_arrival,
      keywords: r.sku ? [clean(r.sku)] : []
    };
    return typeof applySale === "function" ? applySale(out) : out;      // the site-wide sale (DISCOUNT_PERCENT in products.js) also applies to products from Supabase
  }

  async function load() {
    const ctl = typeof AbortController === "function" ? new AbortController() : null, t = setTimeout(() => ctl && ctl.abort(), 6000);
    const h = { apikey: key, Authorization: "Bearer " + key }, opt = { headers: h, signal: ctl ? ctl.signal : undefined };
    try {
      const sel = "id,name,description,price,previous_price,stock_quantity,sku,is_featured,is_new_arrival,sizes,colours,categories(name),product_images(image_url,colour,is_primary,display_order)";
      const [pr, st] = await Promise.all([
        fetch(url + "/rest/v1/products?select=" + encodeURIComponent(sel) + "&status=eq.published&order=created_at.desc,id.asc", opt),
        fetch(url + "/rest/v1/store_settings?select=value&key=eq.low_stock_threshold", opt).catch(() => null)
      ]);
      if (!pr.ok) throw new Error("Catalogue request failed (" + pr.status + ")");
      const rows = await pr.json(); if (!Array.isArray(rows)) throw new Error("Unexpected catalogue response");
      let low = 5; try { const s = st && st.ok ? await st.json() : null; if (s && s[0] && Number.isFinite(Number(s[0].value))) low = Number(s[0].value); } catch (e) {}
      return rows.map(r => mapRow(r, low)).filter(p => Number.isFinite(p.id));
    } finally { clearTimeout(t); }
  }

  const domReady = document.readyState !== "loading" ? Promise.resolve() : new Promise(r => document.addEventListener("DOMContentLoaded", r, { once: true }));
  const catalogue = !configured ? Promise.resolve() : load().then(list => {
    if (!list.length && useStaticIfEmpty) return;                              // empty database: keep the built-in products
    products.splice(0, products.length, ...list);                              // swap the catalogue in place; every page script reads this same array
    window.CATALOGUE_SOURCE = "supabase";
  }).catch(e => { console.warn("VORIX: using the built-in product list.", e && e.message); });

  const ready = Promise.all([domReady, catalogue]);
  window.onStoreReady = fn => { ready.then(fn).catch(e => setTimeout(() => { throw e; })); };
})();
