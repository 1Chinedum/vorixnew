/* VORIX shopping bag page. Reads the bag from Cart (main.js); every price comes from products.js. */
document.addEventListener("DOMContentLoaded", () => {
  const list = $("#cart-list"), empty = $("#empty"), wrap = $("#cartwrap"), selAll = $("#sel-all"), btn = $("#checkout"), live = $("#live");
  const money = n => n == null ? "Price on request" : fmtPrice(n);
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const label = l => `${l.p.name}, ${l.c.name}${l.size ? ", size " + l.size : ""}`;

  function lineHTML(l) {
    return `<li class="ci${l.selected ? "" : " off"}" data-key="${esc(l.key)}">
      <label class="chk"><input type="checkbox" data-sel ${l.selected ? "checked" : ""} aria-label="Select ${esc(label(l))} for this order"><span class="box" aria-hidden="true"></span></label>
      <a class="ci-img" href="collections.html?product=${l.p.id}" aria-label="View ${esc(l.p.name)}">${pimg(l.c.image, l.p.name + " in " + l.c.name, l.c.bg)}</a>
      <div class="ci-info"><h3><a href="collections.html?product=${l.p.id}">${l.p.name}</a></h3><p class="muted">${l.p.category}</p>
        <p class="ci-var"><span class="sw-dot" style="background:${swatchCSS(l.c.swatch)}"></span>${l.c.name}${l.size ? " · Size " + l.size : ""}</p>
        <p class="ci-unit">${money(l.unit)}${l.unit != null ? " each" : ""}</p></div>
      <p class="ci-sub" data-sub>${money(l.sub)}</p>
      <div class="ci-qty"><div class="qty"><button type="button" data-q="-1" aria-label="Decrease quantity of ${esc(label(l))}">&minus;</button><input type="number" data-qin inputmode="numeric" min="1" max="${Cart.MAX_QTY}" value="${l.qty}" aria-label="Quantity of ${esc(label(l))}"><button type="button" data-q="1" aria-label="Increase quantity of ${esc(label(l))}">+</button></div></div>
      <button type="button" class="ci-rm" data-rm aria-label="Remove ${esc(label(l))} from your bag">Remove</button>
    </li>`;
  }

  function summary() {
    const ls = Cart.lines(), s = Cart.summary(ls);
    $("#s-units").textContent = s.units;
    $("#s-selected").textContent = s.selectedCount;
    $("#s-sub").textContent = s.subtotal == null ? "To be confirmed" : fmtPrice(s.subtotal);
    $("#s-fee").textContent = s.fee == null ? "To be confirmed" : fmtPrice(s.fee);
    $("#s-total").textContent = s.total == null ? "To be confirmed" : fmtPrice(s.total);
    selAll.checked = ls.length > 0 && s.selectedCount === ls.length;
    selAll.indeterminate = s.selectedCount > 0 && s.selectedCount < ls.length;
    btn.disabled = s.selectedCount === 0;
    $("#hint").textContent = s.selectedCount === 0 ? "Select at least one product to continue."
      : `${s.selectedCount} ${s.selectedCount === 1 ? "product" : "products"} selected. Unselected items stay in your bag.`;
  }

  function render() {
    const ls = Cart.lines();
    empty.hidden = ls.length > 0; wrap.hidden = ls.length === 0;
    list.innerHTML = ls.map(lineHTML).join("");
    summary();
  }
  const rowOf = el => { const li = el.closest(".ci"); return { li, key: li.dataset.key }; };
  const refreshRow = li => {                         // update one row in place (keeps keyboard focus)
    const l = Cart.lines().find(x => x.key === li.dataset.key); if (!l) return;
    $("[data-qin]", li).value = l.qty; $("[data-sub]", li).textContent = money(l.sub); li.classList.toggle("off", !l.selected);
  };

  list.addEventListener("change", e => {
    if (e.target.matches("[data-sel]")) { const { li, key } = rowOf(e.target); Cart.setSelected(key, e.target.checked); li.classList.toggle("off", !e.target.checked); summary(); }
    else if (e.target.matches("[data-qin]")) { const { li, key } = rowOf(e.target); Cart.setQty(key, e.target.value); refreshRow(li); summary(); }
  });
  list.addEventListener("click", e => {
    const q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]");
    if (q) { const { li, key } = rowOf(q); Cart.setQty(key, Number($("[data-qin]", li).value) + Number(q.dataset.q)); refreshRow(li); summary(); }
    else if (rm) {
      const { li, key } = rowOf(rm), l = Cart.lines().find(x => x.key === key), items = $$(".ci", list), i = items.indexOf(li);
      Cart.remove(key); render(); live.textContent = (l ? l.p.name : "Item") + " removed from your bag.";
      const next = $$(".ci", list)[Math.min(i, $$(".ci", list).length - 1)]; if (next) $("[data-rm]", next).focus();
    }
  });
  selAll.addEventListener("change", () => { Cart.setAllSelected(selAll.checked); $$(".ci", list).forEach(li => { $("[data-sel]", li).checked = selAll.checked; li.classList.toggle("off", !selAll.checked); }); summary(); });
  $("#desel").addEventListener("click", () => { Cart.setAllSelected(false); $$(".ci", list).forEach(li => { $("[data-sel]", li).checked = false; li.classList.add("off"); }); summary(); });
  btn.addEventListener("click", () => { if (Cart.summary().selectedCount > 0) location.href = "order.html?cart=1"; });
  window.addEventListener("cart:external", render);         // changed in another tab
  render();
});
