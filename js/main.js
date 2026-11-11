const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const norm = s => String(s).toLowerCase().replace(/['’]/g, "").trim();

const mainImg = p => p.colours[0].image;
const swatchCSS = s => Array.isArray(s) ? `linear-gradient(135deg,${s[0]} 50%,${s[1]} 50%)` : s;
function pimg(src, alt, bg) {
  return `<img src="${src}" alt="${alt}" loading="lazy" data-bg="${bg || ""}" onload="fitImg(this)" onerror="imgFallback(this)">`;
}
function dotsHTML(p, max = 4) {
  if (p.colours.length < 2) return "";
  const shown = p.colours.slice(0, max).map((c, i) =>
    `<button type="button" class="dot${i === 0 ? " on" : ""}" data-colour="${i}" style="background:${swatchCSS(c.swatch)}" title="${c.name}" aria-label="Show ${c.name}"></button>`).join("");
  return `<span class="dots" role="group" aria-label="Available in ${p.colours.map(c => c.name).join(", ")}">${shown}${p.colours.length > max ? `<span class="more">+${p.colours.length - max}</span>` : ""}</span>`;
}
function cardHTML(p) {
  const c = p.colours[0];
  return `<article class="card reveal" data-id="${p.id}">
    <a class="card-img" href="collections.html?product=${p.id}" data-detail="${p.id}" aria-label="View ${p.name}">${pimg(c.image, p.name, c.bg)}${p.newArrival ? '<span class="tag">New</span>' : ""}</a>
    <div class="card-body">
      <p class="muted">${p.category}</p><h3>${p.name}</h3>
      <div class="row"><p class="price">${fmtPrice(p.price)}</p>${dotsHTML(p)}</div>
      <div class="card-actions">
        <a class="btn btn-ghost btn-sm" href="collections.html?product=${p.id}" data-detail="${p.id}">View Product</a>
        <button type="button" class="btn btn-sm" data-add aria-expanded="false">Add to Cart</button>
      </div>
    </div></article>`;
}


/* ===== Shopping bag =====
   Stored in localStorage as {id, colour, size, qty, selected}. Names, photos and PRICES are never stored:
   they are always read from products.js, so a price edit shows up in the bag straight away. */
const Cart = (() => {
  const KEY = "vorix_cart_v1", MAX_QTY = 20, useWN = location.protocol === "file:";
  const readLS = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const readWN = () => { if (!useWN) return null; try { const m = /^VORIX_CART:([\s\S]*)$/.exec(window.name || ""); return m ? JSON.parse(m[1]) : null; } catch (e) { return null; } };
  function read() {                      // newest copy wins (window.name only backs up opening the files straight from disk)
    const a = readLS(), b = readWN(), ok = x => x && Array.isArray(x.items);
    const best = ok(a) && ok(b) ? (b.t > a.t ? b : a) : (ok(a) ? a : (ok(b) ? b : null));
    return best ? best.items : [];
  }
  function clean(arr) {                  // validate every saved line against products.js; merge duplicates
    const out = new Map();
    (Array.isArray(arr) ? arr : []).forEach(l => {
      if (!l || typeof l !== "object") return;
      const p = products.find(x => x.id === Number(l.id)); if (!p) return;
      const c = p.colours.find(c => norm(c.name) === norm(l.colour || "")); if (!c) return;
      let size = "";
      if ((p.sizes || []).length) { size = p.sizes.find(s => s.toLowerCase() === String(l.size || "").toLowerCase()); if (!size) return; }
      const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(l.qty)) || 1));
      const key = [p.id, c.name, size].join("|"), prev = out.get(key);
      if (prev) prev.qty = Math.min(MAX_QTY, prev.qty + qty);
      else out.set(key, { key, id: p.id, colour: c.name, size, qty, selected: l.selected !== false });
    });
    return [...out.values()];
  }
  function persist(list) {
    const data = { t: Date.now(), items: list.map(({ id, colour, size, qty, selected }) => ({ id, colour, size, qty, selected })) };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    if (useWN) { try { window.name = "VORIX_CART:" + JSON.stringify(data); } catch (e) {} }
    window.dispatchEvent(new Event("cart:change"));
  }
  const load = () => clean(read());
  function lines() {
    return load().map(l => {
      const p = products.find(x => x.id === l.id), c = p.colours.find(c => c.name === l.colour);
      const unit = typeof p.price === "number" ? p.price : null;
      return { ...l, p, c, unit, sub: unit == null ? null : unit * l.qty };
    });
  }
  function add(id, colour, size, qty) {
    const p = products.find(x => x.id === Number(id)); if (!p) return { ok: false, error: "That product could not be found." };
    const c = p.colours.find(c => norm(c.name) === norm(colour || "")); if (!c) return { ok: false, error: "Please choose a colour." };
    let s = "";
    if ((p.sizes || []).length) { s = p.sizes.find(x => x.toLowerCase() === String(size || "").toLowerCase()); if (!s) return { ok: false, error: "Please choose a size." }; }
    const n = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(qty)) || 1)), list = load(), key = [p.id, c.name, s].join("|");
    const ex = list.find(l => l.key === key);
    if (ex) { ex.qty = Math.min(MAX_QTY, ex.qty + n); ex.selected = true; } else list.push({ key, id: p.id, colour: c.name, size: s, qty: n, selected: true });
    persist(list); return { ok: true, product: p, colour: c.name, size: s, qty: n };
  }
  const edit = (key, fn) => { const list = load(), l = list.find(x => x.key === key); if (l) { fn(l); persist(list); } };
  const setQty = (key, n) => edit(key, l => { l.qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(n)) || 1)); });
  const setSelected = (key, on) => edit(key, l => { l.selected = !!on; });
  const setAllSelected = on => { const list = load(); list.forEach(l => { l.selected = !!on; }); persist(list); };
  const remove = key => persist(load().filter(l => l.key !== key));
  const removeKeys = keys => persist(load().filter(l => !keys.includes(l.key)));
  const count = () => load().reduce((n, l) => n + l.qty, 0);
  function summary(ls = lines()) {
    const sel = ls.filter(l => l.selected), fee = typeof DELIVERY_FEE === "number" ? DELIVERY_FEE : null;
    const subtotal = sel.length === 0 ? 0 : (sel.every(l => l.unit != null) ? sel.reduce((n, l) => n + l.sub, 0) : null);
    return { units: ls.reduce((n, l) => n + l.qty, 0), selectedCount: sel.length, selectedUnits: sel.reduce((n, l) => n + l.qty, 0),
             subtotal, fee, total: subtotal == null ? null : subtotal + (fee || 0) };
  }
  return { MAX_QTY, lines, add, setQty, setSelected, setAllSelected, remove, removeKeys, count, summary };
})();

/* Badge on the bag icon + "added" confirmation */
let lastCount = null;
function updateBadge() {
  const n = Cart.count();
  $$(".cart-badge").forEach(b => { b.textContent = n > 99 ? "99+" : n; b.hidden = n === 0;
    if (lastCount !== null && n > lastCount && !reduced) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); } });
  $$(".cart-link").forEach(a => a.setAttribute("aria-label", n ? `Shopping bag, ${n} ${n === 1 ? "item" : "items"}` : "Shopping bag, empty"));
  lastCount = n;
}
window.addEventListener("cart:change", updateBadge);
window.addEventListener("storage", e => { if (e.key === "vorix_cart_v1") { updateBadge(); window.dispatchEvent(new Event("cart:external")); } });
function showToast(title, sub, link = true) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
  t.innerHTML = `<span class="t-main"><strong>${title}</strong>${sub ? `<span>${sub}</span>` : ""}</span>${link ? '<a href="cart.html">View bag</a>' : ""}`;
  void t.offsetWidth; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3400);
}
function addAndToast(res) {
  if (!res.ok) { showToast(res.error, "", false); return res; }
  showToast("ADDED TO YOUR BAG", `${res.product.name} · ${res.colour}${res.size ? " · " + res.size : ""}${res.qty > 1 ? " × " + res.qty : ""}`);
  return res;
}

let io;
function observeReveals() {
  const els = $$(".reveal:not(.in)");
  if (reduced || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  io = io || new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = $(".menu-btn"), nav = $("#nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); btn.setAttribute("aria-expanded", false); }));
  const hd = $(".site-header"), onScroll = () => hd.classList.toggle("scrolled", scrollY > 8);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });
  $$(".year").forEach(y => y.textContent = new Date().getFullYear());
  $$("[data-wa]").forEach(a => a.href = "https://wa.me/" + WHATSAPP_NUMBER +
    "?text=" + encodeURIComponent("Hello VORIX, I'd like to make an inquiry."));

  // Colour dots on cards: hover / focus / tap swaps the card photo (the price never changes)
  const swap = e => {
    const d = e.target.closest(".dot"); if (!d) return;
    const card = d.closest(".card"), p = products.find(x => x.id === +card.dataset.id), c = p.colours[+d.dataset.colour];
    const im = $(".card-img img", card); im.dataset.bg = c.bg || ""; im.src = c.image; im.alt = p.name + " in " + c.name;
    $$(".dot", card).forEach(x => x.classList.toggle("on", x === d));
    const o = $("[data-order]", card); if (o) o.href = orderURL(p, c.name);
  };
  document.addEventListener("mouseover", swap); document.addEventListener("focusin", swap); document.addEventListener("click", swap);

  $$("[data-social]").forEach(a => {   // profile links come from SOCIAL_LINKS in products.js
    const url = typeof SOCIAL_LINKS === "object" && SOCIAL_LINKS[a.dataset.social];
    if (url && /^https?:\/\//i.test(url)) a.href = url;
  });

  // Add to Cart on cards: sizeless products are added straight away; others ask for a size first
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]"), qs = e.target.closest("[data-qa-size]");
    if (!add && !qs) return;
    const card = (add || qs).closest(".card"), p = products.find(x => x.id === +card.dataset.id), dot = $(".dot.on", card);
    const colour = p.colours[dot ? +dot.dataset.colour : 0].name;
    if (qs) { $(".qa", card).remove(); $("[data-add]", card).setAttribute("aria-expanded", "false"); addAndToast(Cart.add(p.id, colour, qs.dataset.qaSize, 1)); return; }
    if (!(p.sizes || []).length) { addAndToast(Cart.add(p.id, colour, "", 1)); return; }
    const open = $(".qa", card); $$(".qa").forEach(x => { x.closest(".card").querySelector("[data-add]").setAttribute("aria-expanded", "false"); x.remove(); });
    if (open) return;
    $(".card-actions", card).insertAdjacentHTML("afterend", `<div class="qa" role="group" aria-label="Choose a size for ${p.name}"><span>Choose your size</span><div>${p.sizes.map(s => `<button type="button" data-qa-size="${s}">${s}</button>`).join("")}</div></div>`);
    add.setAttribute("aria-expanded", "true"); $(".qa button", card).focus();
  });
  updateBadge();

  const colBox = $("#home-collections");
  if (colBox) {
    const cats = [...new Set(products.map(p => p.category))];
    const tiles = cats.map(c => ({ name: c, items: products.filter(p => p.category === c) }));
    const fresh = products.filter(p => p.newArrival);
    if (fresh.length) tiles.unshift({ name: "New Arrivals", items: fresh });
    const used = new Set();
    colBox.innerHTML = tiles.map(t => {
      const cover = t.items.find(p => !used.has(mainImg(p))) || t.items[0]; used.add(mainImg(cover));
      return `
      <a class="tile reveal" href="collections.html?category=${encodeURIComponent(t.name)}">
        ${pimg(mainImg(cover), t.name, cover.colours[0].bg)}
        <span class="tile-text"><strong>${t.name}</strong><small>${t.items.length} ${t.items.length === 1 ? "design" : "designs"}</small></span>
      </a>`; }).join("");
    $("#home-featured").innerHTML = products.filter(p => p.featured).slice(0, 8).map(cardHTML).join("");
  }
  observeReveals();
});
