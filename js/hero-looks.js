/* Hero mannequin: spins like a turntable and swaps outfits while edge-on, so the change is never seen. Automatic; swipe or dots also work. */
(function () {
  var photo = document.getElementById("looks");
  if (!photo) return;
  var imgs = [].slice.call(photo.querySelectorAll(".look")),
      dots = [].slice.call(photo.querySelectorAll(".look-dots button")),
      cap = photo.querySelector("figcaption"), idx = photo.querySelector(".idx b"),
      reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
      n = imgs.length, cur = 0, busy = false, timer = null, visible = true, HOLD = 3200;

  function ui(i) {
    dots.forEach(function (d, k) { k === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current"); });
    cap.textContent = imgs[i].dataset.name;
    idx.textContent = ("0" + (i + 1)).slice(-2);
  }

  function go(i, dir) {
    if (busy || i === cur) return;
    dir = dir || 1; busy = true;
    var a = imgs[cur], b = imgs[i];
    function swap() { a.classList.remove("is-active"); b.classList.add("is-active"); cur = i; ui(i); }
    if (reduced || !a.animate) { swap(); busy = false; return; }
    var out = a.animate(
      [{ transform: "rotateY(0deg)", filter: "blur(0px)" }, { transform: "rotateY(" + dir * 90 + "deg)", filter: "blur(3px)" }],
      { duration: 480, easing: "cubic-bezier(.55,0,.9,.5)", fill: "forwards" });
    out.onfinish = function () {
      swap(); // the mannequin is edge-on here, so the swap is invisible
      var inn = b.animate(
        [{ transform: "rotateY(" + -dir * 90 + "deg)", filter: "blur(3px)" }, { transform: "rotateY(0deg)", filter: "blur(0px)" }],
        { duration: 650, easing: "cubic-bezier(.1,.6,.3,1)" });
      out.cancel();
      inn.onfinish = function () { busy = false; };
    };
  }

  function next() { go((cur + 1) % n, 1); }
  function stop() { clearInterval(timer); timer = null; }
  function start() { if (!timer && visible && !document.hidden) timer = setInterval(next, HOLD + 1100); }
  function restart() { stop(); start(); }

  dots.forEach(function (d, k) {
    d.addEventListener("click", function () { go(k, k > cur ? 1 : -1); restart(); });
  });

  var x0 = 0, y0 = 0;
  photo.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  photo.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    dx < 0 ? go((cur + 1) % n, 1) : go((cur - 1 + n) % n, -1);
    restart();
  }, { passive: true });

  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if ("IntersectionObserver" in window)
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.25 }).observe(photo);
  start();
})();
