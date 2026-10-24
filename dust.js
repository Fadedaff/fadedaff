// Пыль в луче прожектора: мелкие пылинки и редкие размытые блики медленно всплывают.
// Рисуем в обычном разрешении и не чаще 30 кадров в секунду — на фоне разницы не видно, а нагрузка в разы меньше.
(() => {
  const cv = document.querySelector(".dust");
  if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cx = cv.getContext("2d");
  let W = 0, H = 0;
  const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  addEventListener("resize", size);
  size();
  const ps = Array.from({ length: W < 700 ? 40 : 70 }, (_, k) => {
    const bokeh = k % 9 === 0;
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: bokeh ? 5 + Math.random() * 12 : 0.5 + Math.random() * 1.3,
      a: bokeh ? 0.025 + Math.random() * 0.03 : 0.12 + Math.random() * 0.5,
      vx: (Math.random() - 0.3) * 0.12, vy: -0.05 - Math.random() * 0.18, t: Math.random() * 6,
    };
  });
  let last = 0;
  (function frame(now) {
    requestAnimationFrame(frame);
    const dt = now - last;
    if (dt < 33) return;
    const k = Math.min(dt, 100) / 16.7;
    last = now;
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = "#fff";
    for (const p of ps) {
      p.x += p.vx * k; p.y += p.vy * k; p.t += 0.01 * k;
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.x > W + 20) p.x = -20;
      cx.globalAlpha = p.a * (0.75 + Math.sin(p.t) * 0.25);
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, 6.283);
      cx.fill();
    }
  })(0);
})();
