const state = { cat: "All", q: "" };
document.addEventListener("DOMContentLoaded", () => {
  const grid = $("#grid"), empty = $("#empty"), filters = $("#filters"),
        search = $("#search"), clear = $("#clear"), count = $("#count"), pv = $("#pv");
  const cats = ["All", ...(products.some(p => p.newArrival) ? ["New Arrivals"] : []),
                ...new Set(products.map(p => p.category))];
  filters.innerHTML = cats.map(c => `<button type="button" class="chip" data-cat="${c}">${c}</button>`).join("");

  const matchCat = p => state.cat === "All" || (state.cat === "New Arrivals" ? p.newArrival : p.category === state.cat);
  const matchQ = p => !state.q || norm([p.name, p.category, p.description, ...(p.keywords || []),
    ...p.colours.map(c => c.name), ...(p.sizes || [])].join(" ")).includes(norm(state.q));

  function render() {
    const list = products.filter(p => matchCat(p) && matchQ(p));
    grid.innerHTML = list.map(cardHTML).join("");
    empty.hidden = list.length > 0;
    count.textContent = list.length + (list.length === 1 ? " design" : " designs");
    clear.hidden = !state.q;
    $$(".chip", filters).forEach(b => {
      const on = b.dataset.cat === state.cat;
      b.classList.toggle("active", on); b.setAttribute("aria-pressed", on);
    });
    observeReveals();
  }
  const setParam = (k, v) => {
    const url = new URL(location); v == null ? url.searchParams.delete(k) : url.searchParams.set(k, v);
    try { history.replaceState(null, "", url); } catch (e) {}
  };
  function setCat(c) { state.cat = c; setParam("category", c === "All" ? null : c); setParam("product", null); render(); }

  const params = new URLSearchParams(location.search), want = params.get("category");
  if (want) { const hit = cats.find(c => norm(c) === norm(want)); if (hit) state.cat = hit; }
  filters.addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) setCat(b.dataset.cat); });
  search.addEventListener("input", () => { state.q = search.value; render(); });
  clear.addEventListener("click", () => { search.value = ""; state.q = ""; render(); search.focus(); });
  $("#reset").addEventListener("click", () => { search.value = ""; state.q = ""; setCat("All"); });

  // ===== Full-screen product view =====
  let cur, slides, idx, size, lastFocus, track, dots, sws, vqty = 1;
  // ----- Autoplay: advance every 3000 ms; one timer at most, owned by the open product view -----
  const AUTOPLAY_MS = 3000;
  const rm = matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");   // hover-pause only on devices that can really hover
  let timer = null, hovering = false, touching = false;
  function stopAuto() { clearTimeout(timer); timer = null; }
  function startAuto() {            // (re)starts the full 3 s countdown, or does nothing if autoplay shouldn't run
    stopAuto();
    if (pv.hidden || !slides || slides.length < 2 || hovering || touching || document.hidden || rm.matches) return;
    timer = setTimeout(() => go(idx + 1), AUTOPLAY_MS);
  }
  document.addEventListener("visibilitychange", startAuto);   // stops when the tab is hidden, resumes when visible
  rm.addEventListener("change", startAuto);
  const open = () => !pv.hidden;

  function openProduct(id) {
    const p = products.find(x => x.id === +id); if (!p) return;
    cur = p; size = null; vqty = 1; idx = 0; hovering = false; touching = false; if (pv.hidden) lastFocus = document.activeElement;
    const related = [...products.filter(x => x.id !== p.id && x.category === p.category), ...products.filter(x => x.id !== p.id && x.category !== p.category)].slice(0, 4);
    slides = []; p.colours.forEach((c, ci) => [c.image, ...(c.additionalImages || [])].forEach(src => slides.push({ src, ci, bg: c.bg })));
    const multi = slides.length > 1, many = p.colours.length > 1;
    pv.innerHTML = `
      <button class="pv-close" type="button" aria-label="Close product view"><span>Close</span><b aria-hidden="true">&times;</b></button>
      <div class="pv-grid"><div class="pv-media">
        <div class="pv-stage"><div class="pv-track">${slides.map((s, i) =>
          `<div class="pv-slide${i === 0 ? " on" : ""}" aria-hidden="${i !== 0}" style="background:${s.bg || "var(--sand)"}" aria-label="Image ${i + 1} of ${slides.length}"><img src="${s.src}" alt="${p.name} in ${p.colours[s.ci].name}" draggable="false" onerror="imgFallback(this)"></div>`).join("")}</div>
          ${multi ? `<button class="pv-arrow prev" type="button" aria-label="Previous photo">&#8249;</button><button class="pv-arrow next" type="button" aria-label="Next photo">&#8250;</button>
          <div class="pv-dots">${slides.map((s, i) => `<button type="button" data-i="${i}" aria-label="Photo ${i + 1}"></button>`).join("")}</div>` : ""}
        </div>
        ${many ? `<div class="pv-sw" role="group" aria-label="Choose colour">${p.colours.map((c, i) =>
          `<button type="button" class="sw" data-c="${i}" style="background:${swatchCSS(c.swatch)}" title="${c.name}" aria-label="${c.name}"></button>`).join("")}</div>` : ""}
      </div>
      <div class="pv-info">
        <p class="eyebrow">${p.category}</p>
        <h2 id="pv-title">${p.name}</h2>
        <p class="pv-price">${fmtPrice(p.price)}</p>
        <p class="pv-desc">${p.description}</p>
        <div class="pv-block"><span class="pv-label">Colour</span><span id="pv-colour" class="pv-val"></span>${many ? `<span class="pv-sub">Available in ${p.colours.map(c => c.name).join(", ")}</span>` : ""}</div>
        ${(p.sizes || []).length ? `<div class="pv-block"><span class="pv-label">Size</span><div class="sizes" role="group" aria-label="Choose size">${p.sizes.map(s => `<button type="button" class="size" data-s="${s}" aria-pressed="false">${s}</button>`).join("")}</div><p class="err" id="pv-size-err" role="alert"></p></div>` : ""}
        <div class="pv-block"><span class="pv-label">Quantity</span><div class="qty vq"><button type="button" data-vq="-1" aria-label="Decrease quantity">&minus;</button><span id="pv-qty" aria-live="polite">1</span><button type="button" data-vq="1" aria-label="Increase quantity">+</button></div></div>
        <div class="pv-block"><span class="pv-label">Availability</span><span class="pv-val">${p.availability}</span></div>
        <div class="pv-cta"><div class="pv-btns"><button type="button" id="pv-add" class="btn pv-wa">Add to Cart</button><a id="pv-order" class="btn btn-ghost pv-wa">Order Now</a></div><a id="pv-wa" class="pv-ask" target="_blank" rel="noopener">Or ask a quick question on WhatsApp</a></div>
      </div></div>
      <section class="pv-more"><span class="eyebrow">You may also like</span><h3>More from VORIX</h3><div class="grid">${related.map(cardHTML).join("")}</div></section>`;
    track = $(".pv-track", pv); dots = $$(".pv-dots button", pv); sws = $$(".sw", pv);
    pv.hidden = false; pv.scrollTop = 0; observeReveals(); document.body.classList.add("lock");
    const stage = $(".pv-stage", pv);   // desktop: pause while the pointer is over the photo
    stage.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && canHover.matches) { hovering = true; stopAuto(); } });
    stage.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { hovering = false; startAuto(); } });
    sync(); startAuto(); setParam("product", p.id); $(".pv-close", pv).focus();
  }
  function sync() {
    const s = slides[idx], c = cur.colours[s.ci];
    $$(".pv-slide", pv).forEach((el, k) => { el.classList.toggle("on", k === idx); el.setAttribute("aria-hidden", k !== idx); });
    $("#pv-colour").textContent = c.name;
    dots.forEach((d, k) => { d.classList.toggle("on", k === idx); d.setAttribute("aria-current", k === idx); });
    sws.forEach((b, k) => b.setAttribute("aria-pressed", k === s.ci));
    $("#pv-wa").href = waURL(cur, c.name, size);
    $("#pv-order").href = orderURL(cur, c.name, size, vqty);
  }
  const go = i => { idx = (i + slides.length) % slides.length; sync(); startAuto(); };
  function closeProduct() {
    stopAuto(); hovering = false; touching = false;
    pv.hidden = true; pv.innerHTML = ""; document.body.classList.remove("lock"); setParam("product", null);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", e => {
    const d = e.target.closest("[data-detail]"); if (d) { e.preventDefault(); openProduct(d.dataset.detail); return; }
    if (!open()) return;
    if (e.target.closest(".pv-close")) closeProduct();
    else if (e.target.closest(".prev")) go(idx - 1);
    else if (e.target.closest(".next")) go(idx + 1);
    else if (e.target.closest(".pv-dots button")) go(+e.target.closest("button").dataset.i);
    else if (e.target.closest(".sw")) go(slides.findIndex(s => s.ci === +e.target.closest(".sw").dataset.c));
    else if (e.target.closest("[data-vq]")) {
      vqty = Math.min(Cart.MAX_QTY, Math.max(1, vqty + Number(e.target.closest("[data-vq]").dataset.vq))); $("#pv-qty").textContent = vqty; sync();
    }
    else if (e.target.closest("#pv-add")) {
      if ((cur.sizes || []).length && !size) {
        const box = $("#pv-size-err"); box.textContent = "Please choose a size to add this to your bag.";
        const first = $(".size", pv); if (first) { first.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); first.focus({ preventScroll: true }); }
        return;
      }
      addAndToast(Cart.add(cur.id, cur.colours[slides[idx].ci].name, size || "", vqty));
    }
    else if (e.target.closest(".size")) {
      const b = e.target.closest(".size"); size = size === b.dataset.s ? null : b.dataset.s;
      const er = $("#pv-size-err"); if (er) er.textContent = "";
      $$(".size", pv).forEach(x => x.setAttribute("aria-pressed", x.dataset.s === size)); sync();
    }
  });
  document.addEventListener("keydown", e => {
    if (!open()) return;
    if (e.key === "Escape") closeProduct();
    else if (e.key === "ArrowLeft" && slides.length > 1) go(idx - 1);
    else if (e.key === "ArrowRight" && slides.length > 1) go(idx + 1);
  });
  // Touch swipe (pauses autoplay while a finger is down)
  let sx = 0, sy = 0;
  pv.addEventListener("touchstart", e => {
    if (!e.target.closest(".pv-stage")) return;
    touching = true; stopAuto(); sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
  }, { passive: true });
  const endTouch = e => {
    if (!touching) return; touching = false;
    if (e.type === "touchend" && slides.length > 1) {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { go(idx + (dx < 0 ? 1 : -1)); return; }
    }
    startAuto();
  };
  pv.addEventListener("touchend", endTouch, { passive: true });
  pv.addEventListener("touchcancel", endTouch, { passive: true });

  render();
  if (params.get("product")) openProduct(params.get("product"));
});
