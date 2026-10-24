// Пыль в луче прожектора: мелкие пылинки и редкие размытые блики медленно всплывают
(() => {
  const cv = document.querySelector(".dust");
  if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener("resize", size);
  size();
  const ps = Array.from({ length: W < 700 ? 55 : 110 }, (_, k) => {
    const bokeh = k % 9 === 0;
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: bokeh ? 5 + Math.random() * 12 : 0.4 + Math.random() * 1.3,
      a: bokeh ? 0.025 + Math.random() * 0.03 : 0.12 + Math.random() * 0.5,
      vx: (Math.random() - 0.3) * 0.12, vy: -0.05 - Math.random() * 0.18, t: Math.random() * 6,
    };
  });
  (function frame() {
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = "#fff";
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy; p.t += 0.01;
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.x > W + 20) p.x = -20;
      cx.globalAlpha = p.a * (0.75 + Math.sin(p.t) * 0.25);
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, 6.283);
      cx.fill();
    }
    requestAnimationFrame(frame);
  })();
})();
