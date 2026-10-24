// Адрес в разметке — простой текст, страница читается и без JS. Скрипт рисует QR, выделяет края адреса,
// ведёт карусель (свайп, стрелки, колесо, клавиши, вкладки) и копирует адрес активной карточки.
const EDGE = 6;
const $ = (s, el = document) => el.querySelector(s);
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

function edges(el, raw) {
  const part = (cls, text) => {
    const s = document.createElement("span");
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  };
  el.replaceChildren(part("e", raw.slice(0, EDGE)), part("", raw.slice(EDGE, -EDGE)), part("e", raw.slice(-EDGE)));
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.append(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
}

const toastEl = $(".toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("on"), 1800);
}

const track = $(".track");
const cards = [...document.querySelectorAll(".card")];
const tabs = [...document.querySelectorAll(".tabs button")];
const prev = $(".prev"), next = $(".next"), copyBtn = $(".copy");
let active = 0;

for (const card of cards) {
  const { addr, name } = card.dataset;
  edges($(".a", card), addr);
  const qr = qrcode(0, "M");
  qr.addData(addr);
  qr.make();
  $(".qrimg", card).innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: `QR-код: ${name}` });
}

function go(i) {
  i = Math.max(0, Math.min(cards.length - 1, i));
  const c = cards[i];
  track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: still ? "auto" : "smooth" });
}

function setActive(i) {
  active = i;
  cards.forEach((c, k) => c.classList.toggle("on", k === i));
  tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
  const bar = tabs[i].parentElement, t = tabs[i];
  if (t.offsetLeft < bar.scrollLeft || t.offsetLeft + t.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: t.offsetLeft - 8, behavior: "smooth" });
  prev.disabled = i === 0;
  next.disabled = i === cards.length - 1;
  copyBtn.setAttribute("aria-label", `Скопировать адрес ${cards[i].dataset.name}`);
}

// Активная — ближайшая к центру
let ticking = false;
track.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((c, k) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = k; }
    });
    if (best !== active) setActive(best);
  });
}, { passive: true });

tabs.forEach((t, k) => t.addEventListener("click", () => go(k)));
prev.addEventListener("click", () => go(active - 1));
next.addEventListener("click", () => go(active + 1));
addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
});

// Колесо над колодой листает по одной карточке
let wheelLock = 0;
track.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  const edge = (e.deltaY < 0 && active === 0) || (e.deltaY > 0 && active === cards.length - 1);
  if (edge) return;
  e.preventDefault();
  const now = Date.now();
  if (now - wheelLock < 450 || Math.abs(e.deltaY) < 4) return;
  wheelLock = now;
  go(active + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

async function copyActive() {
  const card = cards[active];
  await copy(card.dataset.addr);
  card.classList.remove("flash");
  void card.offsetWidth;
  card.classList.add("flash");
  setTimeout(() => card.classList.remove("flash"), 700);
  copyBtn.textContent = "Скопировано";
  copyBtn.classList.add("done");
  clearTimeout(copyActive.t);
  copyActive.t = setTimeout(() => { copyBtn.textContent = "Скопировать адрес"; copyBtn.classList.remove("done"); }, 1600);
  toast(`Адрес ${card.dataset.name} скопирован`);
}
copyBtn.addEventListener("click", copyActive);
cards.forEach((c, k) => c.addEventListener("click", () => (k === active ? copyActive() : go(k))));

// Наклон и блик за курсором — только у активной карточки
if (!still && matchMedia("(hover: hover)").matches) {
  track.addEventListener("pointermove", (e) => {
    const card = cards[active], face = $(".face", card), r = face.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < -0.2 || x > 1.2 || y < -0.2 || y > 1.2) return;
    card.classList.add("tilting");
    face.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
    face.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
    face.style.setProperty("--sx", (x * 100).toFixed(1) + "%");
    face.style.setProperty("--sy", (y * 100).toFixed(1) + "%");
  });
  track.addEventListener("pointerleave", () => {
    for (const c of cards) {
      c.classList.remove("tilting");
      const f = $(".face", c);
      for (const p of ["--rx", "--ry", "--sx", "--sy"]) f.style.removeProperty(p);
    }
  });
}

setActive(0);
