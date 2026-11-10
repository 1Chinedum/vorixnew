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
      <a class="btn btn-ghost btn-block" href="collections.html?product=${p.id}" data-detail="${p.id}">View Product</a>
    </div></article>`;
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
  };
  document.addEventListener("mouseover", swap); document.addEventListener("focusin", swap); document.addEventListener("click", swap);

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
