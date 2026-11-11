/* VORIX checkout / enquiry page.
   Two ways in:
   - order.html?cart=1  -> the ticked items from the shopping bag (read from Cart in main.js)
   - order.html?product=ID&colour=NAME&size=SIZE&qty=N  -> one item ("Order Now")
   Every product detail and price comes from products.js. The finished order message opens in WhatsApp;
   the customer must press Send. */
document.addEventListener("DOMContentLoaded", () => {
  const q = new URLSearchParams(location.search);
  const f = id => $("#" + id), form = f("orderform");
  const cartMode = q.get("cart") === "1";
  const money = n => n == null ? "Price on request" : fmtPrice(n);
  const fee = typeof DELIVERY_FEE === "number" ? DELIVERY_FEE : null;
  const clampQty = n => Math.min(Cart.MAX_QTY, Math.max(1, Math.floor(Number(n)) || 1));

  let single = null, bagItems = [], size = null, qty = 1;
  if (cartMode) {
    bagItems = Cart.lines().filter(l => l.selected);
    if (!bagItems.length) { f("emptysel").hidden = false; return; }          // nothing ticked: no form
    f("edit-bag").hidden = false; f("notes-num").textContent = "03";
  } else {
    const idParam = q.get("product");
    const p = /^\d{1,6}$/.test(idParam || "") ? products.find(x => x.id === Number(idParam)) : null;
    if (!p) { f("notfound").hidden = false; return; }                        // missing / invalid / unknown product
    const colour = p.colours.find(c => norm(c.name) === norm(q.get("colour") || "")) || p.colours[0];
    const hasSizes = (p.sizes || []).length > 0;
    size = hasSizes ? (p.sizes.find(s => s.toLowerCase() === (q.get("size") || "").toLowerCase()) || null) : null;
    qty = clampQty(q.get("qty"));
    single = { p, c: colour, hasSizes };
    f("fs-single").hidden = false;
    f("ro-name").textContent = p.name; f("ro-cat").textContent = p.category; f("ro-colour").textContent = colour.name; f("ro-price").textContent = money(typeof p.price === "number" ? p.price : null);
    f("ro-size-row").hidden = !hasSizes; f("change-link").href = "collections.html?product=" + p.id;
    document.title = "Complete Your Enquiry | " + p.name + " | VORIX";
    if (hasSizes && !size) {                                                  // ask for the size here if it wasn't chosen yet
      f("size-pick").hidden = false;
      f("sizes").innerHTML = p.sizes.map(s => `<button type="button" class="size" data-s="${s}" aria-pressed="false">${s}</button>`).join("");
      f("sizes").addEventListener("click", e => { const b = e.target.closest(".size"); if (!b) return; size = b.dataset.s; f("e-size").textContent = ""; refresh(); });
    }
  }
  f("orderwrap").hidden = false;

  // the items being ordered, as one list for both modes
  function items() {
    if (cartMode) return bagItems.map(l => ({ p: l.p, c: l.c, size: l.size, qty: l.qty, unit: l.unit }));
    const unit = typeof single.p.price === "number" ? single.p.price : null;
    return [{ p: single.p, c: single.c, size: single.hasSizes ? size : "", qty, unit }];
  }
  function totals(its) {
    const priced = its.every(i => i.unit != null);
    const subtotal = priced ? its.reduce((n, i) => n + i.unit * i.qty, 0) : null;
    return { units: its.reduce((n, i) => n + i.qty, 0), subtotal, total: subtotal == null ? null : subtotal + (fee || 0) };
  }

  function refresh() {
    const its = items(), t = totals(its);
    f("sum-list").innerHTML = its.map(i => `<li><div class="sum-img">${pimg(i.c.image, i.p.name + " in " + i.c.name, i.c.bg)}</div>
      <div><h3>${i.p.name}</h3><p class="muted">${i.c.name}${(i.p.sizes || []).length ? " · " + (i.size ? "Size " + i.size : "Size not chosen") : ""} · Qty ${i.qty}</p><p class="muted">${money(i.unit)}${i.unit != null && i.qty > 1 ? " each" : ""}</p></div>
      <strong>${i.unit == null ? "—" : fmtPrice(i.unit * i.qty)}</strong></li>`).join("");
    f("sum-units").textContent = t.units;
    f("sum-sub").textContent = t.subtotal == null ? "To be confirmed" : fmtPrice(t.subtotal);
    f("sum-fee").textContent = fee == null ? "To be confirmed" : fmtPrice(fee);
    f("sum-total").textContent = f("ft").textContent = t.total == null ? "To be confirmed" : fmtPrice(t.total);
    if (single) {
      f("ro-size").textContent = size || "Please choose a size"; f("f-qty").value = qty;
      $$(".size", f("sizes")).forEach(b => b.setAttribute("aria-pressed", b.dataset.s === size));
      try { history.replaceState(null, "", orderURL(single.p, single.c.name, size, qty)); } catch (e) {}
    }
  }
  if (single) {
    const setQty = n => { qty = clampQty(n); refresh(); };
    f("q-minus").addEventListener("click", () => setQty(qty - 1));
    f("q-plus").addEventListener("click", () => setQty(qty + 1));
    f("f-qty").addEventListener("input", e => { if (e.target.value !== "") setQty(e.target.value); });
    f("f-qty").addEventListener("blur", () => setQty(f("f-qty").value));
  }

  // ---- validation ----
  function setErr(el, msg) {
    const box = el.id === "sizes" ? f("e-size") : f("e-" + el.id.replace("f-", ""));
    box.textContent = msg;
    if (el.id !== "sizes") { el.classList.toggle("bad", !!msg); el.setAttribute("aria-invalid", !!msg); }
    return !msg;
  }
  const digits = s => s.replace(/[\s\-().]/g, "");
  const rules = {
    "f-name": v => v.length < 2 ? "Please enter your full name." : "",
    "f-phone": v => !/^\+?\d{10,15}$/.test(digits(v)) ? "Please enter a valid phone number (for example 0707 631 6859)." : "",
    "f-email": v => v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "That email address doesn’t look right. Check it or leave it blank." : "",
    "f-state": v => !v ? "Please select your state." : "",
    "f-city": v => v.length < 2 ? "Please enter your city." : "",
    "f-address": v => v.length < 8 ? "Please enter your full delivery address." : ""
  };
  Object.keys(rules).forEach(id => {
    const el = f(id), check = () => { if (el.classList.contains("bad")) setErr(el, rules[id](el.value.trim())); };
    el.addEventListener("blur", () => { if (el.value.trim() || el.classList.contains("bad")) setErr(el, rules[id](el.value.trim())); });
    el.addEventListener("input", check); el.addEventListener("change", check);
  });

  // ---- WhatsApp message ----
  function buildMessage(v) {
    const its = items(), t = totals(its), lines = [
      "NEW VORIX ORDER", "",
      "CUSTOMER DETAILS", "Name: " + v.name, "Phone: " + v.phone, "Email: " + (v.email || "Not provided"), "",
      "DELIVERY DETAILS", "State: " + v.state, "City: " + v.city, "Address: " + v.address, "",
      "ORDER ITEMS", ""];
    its.forEach((i, n) => {
      lines.push(`${n + 1}. ${i.p.name}`, "Colour: " + i.c.name);
      if ((i.p.sizes || []).length) lines.push("Size: " + i.size);
      lines.push("Quantity: " + i.qty, "Unit Price: " + money(i.unit), "Subtotal: " + (i.unit == null ? "To be confirmed" : fmtPrice(i.unit * i.qty)), "");
    });
    lines.push("TOTAL SELECTED PRODUCTS: " + (t.subtotal == null ? "To be confirmed" : fmtPrice(t.subtotal)));
    if (fee != null) lines.push("Delivery Fee: " + fmtPrice(fee), "TOTAL WITH DELIVERY: " + (t.total == null ? "To be confirmed" : fmtPrice(t.total)));
    lines.push("", "Additional Notes: " + (v.notes || "None"), "", "Please assist me with this order.");
    return lines.join("\n");
  }
  form.addEventListener("submit", e => {
    e.preventDefault();
    let firstBad = null;
    Object.keys(rules).forEach(id => { const el = f(id); if (!setErr(el, rules[id](el.value.trim())) && !firstBad) firstBad = el; });
    if (single && single.hasSizes && !size) { setErr(f("sizes"), "Please choose a size."); if (!firstBad) firstBad = $(".size", f("sizes")); }
    if (firstBad) {
      const st = f("status"); st.hidden = false; st.className = "status warn";
      st.textContent = "Please check the highlighted fields and try again."; firstBad.focus(); return;
    }
    const v = { name: f("f-name").value.trim(), phone: f("f-phone").value.trim(), email: f("f-email").value.trim(),
      state: f("f-state").value, city: f("f-city").value.trim(), address: f("f-address").value.trim(), notes: f("f-notes").value.trim() };
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildMessage(v));
    const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); a.remove();
    const st = f("status"); st.hidden = false; st.className = "status ok";
    st.innerHTML = "WhatsApp should now open with your message ready. <strong>Please review it and press Send</strong>: your enquiry is only sent once you do. If nothing opened, <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"" + url + "\">open WhatsApp here</a>." +
      (cartMode ? "<br><button type=\"button\" class=\"textbtn\" id=\"clear-ordered\">I’ve sent my order: remove these items from my bag</button><span class=\"keep\">Your other bag items stay saved.</span>" : "");
    const clr = $("#clear-ordered");
    if (clr) clr.addEventListener("click", () => {
      Cart.removeKeys(bagItems.map(l => l.key));
      st.innerHTML = "Done. The items you ordered were removed from your bag. <a href=\"cart.html\">View your bag</a>.";
    });
  });

  refresh();
});
