// Вид страницы: переключатель внизу (выбор помнится в браузере, ссылка — ?env=), подписи «чертежа», сдвиг гиганта, пыль
const root = document.documentElement;
const bar = [...document.querySelectorAll(".envbar button")];
const marks = document.querySelector(".marks");
let dustOn = false;

function activeIndex() { return [...document.querySelectorAll(".card")].findIndex((c) => c.classList.contains("on")); }
function sync() {
  const i = Math.max(0, activeIndex());
  const tab = document.querySelectorAll(".tabs button")[i];
  marks.dataset.fig = `FIG. 0${i + 1} — ${tab ? tab.textContent : ""}`;
  root.style.setProperty("--shift", (2 - i) * 5 + "vw");
}
new MutationObserver(sync).observe(document.querySelector(".track"), { subtree: true, attributes: true, attributeFilter: ["class"] });

function setEnv(name) {
  root.dataset.env = name;
  bar.forEach((b) => { b.classList.toggle("on", b.dataset.env === name); b.setAttribute("aria-checked", String(b.dataset.env === name)); });
  if (name === "dust" && !dustOn) startDust();
  const u = new URL(location.href);
  u.searchParams.set("env", name);
  history.replaceState(null, "", u);
  try { localStorage.setItem("env", name); } catch {}
  sync();
}
bar.forEach((b) => {
  b.setAttribute("role", "radio");
  b.type = "button";
  b.addEventListener("click", () => setEnv(b.dataset.env));
});

function startDust() {
  dustOn = true;
  const cv = document.querySelector(".dust"), cx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
  let W, H;
  const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener("resize", size); size();
  const n = W < 700 ? 55 : 110;
  const ps = Array.from({ length: n }, (_, k) => {
    const bokeh = k % 9 === 0;
    return { x: Math.random() * W, y: Math.random() * H, r: bokeh ? 5 + Math.random() * 12 : .4 + Math.random() * 1.3,
      a: bokeh ? .025 + Math.random() * .03 : .12 + Math.random() * .5, vx: (Math.random() - .3) * .12, vy: -.05 - Math.random() * .18, t: Math.random() * 6 };
  });
  (function frame() {
    cx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy; p.t += .01;
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.x > W + 20) p.x = -20;
      cx.globalAlpha = p.a * (.75 + Math.sin(p.t) * .25);
      cx.fillStyle = "#fff";
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
    }
    if (root.dataset.env === "dust") requestAnimationFrame(frame); else dustOn = false;
  })();
}

const names = bar.map((b) => b.dataset.env);
let start = new URLSearchParams(location.search).get("env");
if (!names.includes(start)) { try { start = localStorage.getItem("env"); } catch { start = null; } }
setEnv(names.includes(start) ? start : "vitrina");
