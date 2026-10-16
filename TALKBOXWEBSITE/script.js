/* =========================================================
   TalkBox | script.js
   ========================================================= */

/* ---------- CONFIGURAÇÃO DO FORMULÁRIO ----------
   Escolha UMA forma de receber os interesses:

   1) WhatsApp: coloque seu número com DDI e DDD, só dígitos.
      Ex.: "5511999998888". Ao enviar, abre o WhatsApp com a mensagem pronta.

   2) Endpoint (Formspree, Getform, Google Apps Script, sua API...):
      cole a URL. O form envia via POST com JSON.

   Se as duas ficarem vazias, o form só mostra a mensagem de sucesso (modo demo).
*/
const CONFIG = {
  whatsappNumber: "",
  formEndpoint: "",
};

document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Header: sombra ao rolar ---------- */
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Menu mobile ---------- */
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("menu");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  nav.classList.toggle("is-open", open);
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* ---------- Conversa do hero ----------
   Mostra "digitando…" e depois cada bolha, uma por vez. Roda uma vez quando aparece na tela. */
const chatList = document.querySelector(".chat-list");
const bubbles = [...document.querySelectorAll(".chat .bubble")];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function playChat() {
  if (prefersReducedMotion) { bubbles.forEach((b) => b.classList.add("is-in")); return; }
  await wait(200);
  for (const bubble of bubbles) {
    const typing = document.createElement("li");
    typing.className = "typing" + (bubble.classList.contains("from-student") ? " right" : "");
    typing.setAttribute("aria-hidden", "true");
    typing.innerHTML = "<i></i><i></i><i></i>";
    typing.style.top = bubble.offsetTop + "px";
    chatList.appendChild(typing);
    await wait(250 + Math.min(bubble.textContent.length * 4, 250));
    typing.remove();
    bubble.classList.add("is-in");
    await wait(150);
  }
}

if (chatList) {
  const chatObserver = new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { obs.disconnect(); playChat(); }
  }, { threshold: 0.35 });
  chatObserver.observe(chatList);
}

/* ---------- Loop infinito dos depoimentos ----------
   Duplica o conteúdo para a animação CSS (translateX -50%) não ter "pulo". */
document.querySelectorAll(".reviews-track").forEach((track) => {
  [...track.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
    track.appendChild(clone);
  });
});

/* ---------- FAQ: só uma pergunta aberta por vez ----------
   (navegadores novos já fazem isso com details[name]; aqui é o fallback) */
const faqItems = document.querySelectorAll(".faq details");
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) faqItems.forEach((other) => { if (other !== item) other.open = false; });
  });
});

/* ---------- Modalidades: slide Mensal / Fidelidade ---------- */
/* ---------- Animações dos planos ----------
   Números dos preços "rolam" até o valor, cards entram em cascata
   e um brilho segue o mouse sobre o card. */
let plansSeen = false;
function countTo(el, to, from) {
  if (!el) return;
  const start = from ?? (parseInt(el.textContent, 10) || 0);
  if (prefersReducedMotion || start === to) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 900;
  cancelAnimationFrame(el._raf);
  const step = (now) => {
    const k = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - k, 4);
    el.textContent = Math.round(start + (to - start) * e);
    if (k < 1) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}
function replayPlans(panel) {
  if (prefersReducedMotion || !panel) return;
  panel.classList.remove("is-entering");
  void panel.offsetWidth;
  panel.classList.add("is-entering");
  panel.querySelectorAll(".price-value").forEach((v) => countTo(v, parseInt(v.textContent, 10) || 0, 0));
}

/* ---------- Botões dos planos abrem o WhatsApp com mensagem do plano ---------- */
const WA_NUMBER = "5547989174783";
function waLink(a, term) {
  const modo = a.dataset.waMode === "fidelidade" ? `fidelidade de ${term || "1 ano"}` : "mensal";
  const msg = `Olá, vim do site da TalkBox e tenho interesse no plano ${a.dataset.waPlan} (${a.dataset.waFreq}), na modalidade ${modo}. Quero saber mais.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

const plansSwitch = document.querySelector(".plans-switch");
const plansSlider = document.querySelector(".plans-slider");
if (plansSwitch && plansSlider) {
  const tabs = [...plansSwitch.querySelectorAll("[role=tab]")];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  let active = 0;

  const fitHeight = () => { plansSlider.style.height = panels[active].offsetHeight + "px"; };

  function showPlans(i, focus) {
    active = i;
    const key = i === 0 ? "mensal" : "fidelidade";
    plansSwitch.dataset.active = key;
    plansSlider.dataset.active = key;
    tabs.forEach((t, n) => {
      t.setAttribute("aria-selected", String(n === i));
      t.tabIndex = n === i ? 0 : -1;
    });
    panels.forEach((p, n) => { p.inert = n !== i; });
    fitHeight();
    if (plansSeen) replayPlans(panels[i]);
    if (focus) tabs[i].focus();
  }

  tabs.forEach((t, i) => t.addEventListener("click", () => showPlans(i)));
  plansSwitch.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); showPlans(active ? 0 : 1, true); }
  });

  // Arrastar para o lado no celular
  let startX = null, startY = null;
  plansSlider.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  plansSlider.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showPlans(dx < 0 ? 1 : 0);
    startX = null;
  });

  if ("ResizeObserver" in window) new ResizeObserver(fitHeight).observe(panels[0].parentElement);
  window.addEventListener("resize", fitHeight);
  showPlans(0);

  /* Duração da fidelidade: troca preço e texto dos cards */
  const termBtns = [...document.querySelectorAll(".term-picker [role=radio]")];
  const fidPanel = document.getElementById("painel-fidelidade");
  function setTerm(btn, focus) {
    termBtns.forEach((b) => {
      const on = b === btn;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    const term = btn.dataset.term;
    fidPanel.querySelectorAll(".price[data-price-" + term + "]").forEach((p) => {
      countTo(p.querySelector(".price-value"), +p.getAttribute("data-price-" + term));
    });
    fidPanel.querySelectorAll("[data-off-" + term + "]").forEach((el) => {
      el.textContent = el.getAttribute("data-off-" + term);
    });
    fidPanel.querySelectorAll(".term-label").forEach((l) => { l.textContent = btn.dataset.label; });
    fidPanel.querySelectorAll("[data-plan]").forEach((a) => {
      a.dataset.plan = a.dataset.plan.replace(/\(Fidelidade.*\)/, `(Fidelidade ${btn.dataset.label})`);
    });
    fidPanel.querySelectorAll("[data-wa-plan]").forEach((a) => { a.href = waLink(a, btn.dataset.label); });
    if (focus) btn.focus();
  }
  termBtns.forEach((b, i) => {
    b.addEventListener("click", () => setTerm(b));
    b.addEventListener("keydown", (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      setTerm(termBtns[(i + dir + termBtns.length) % termBtns.length], true);
    });
  });
  if (termBtns[0]) setTerm(termBtns[0]);
}

if (document.getElementById("form-interesse")) {
/* ---------- Botões das modalidades preenchem o formulário ---------- */
const planInput = document.getElementById("modalidade");
const duvidas = document.getElementById("duvidas");
document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => {
    planInput.value = btn.dataset.plan;
    if (!duvidas.value.trim()) duvidas.value = `Tenho interesse na modalidade ${btn.dataset.plan}.`;
  });
});

/* ---------- Máscara de telefone (BR) ---------- */
const phone = document.getElementById("telefone");
phone.addEventListener("input", () => {
  const d = phone.value.replace(/\D/g, "").slice(0, 11);
  let out = d;
  if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 6) {
    const split = d.length === 11 ? 7 : 6; // celular (9 dígitos) ou fixo (8)
    out = `(${d.slice(0, 2)}) ${d.slice(2, split)}-${d.slice(split)}`;
  }
  phone.value = out;
});

/* ---------- Formulário de interesse ---------- */
const form = document.getElementById("form-interesse");
const statusEl = form.querySelector(".form-status");
const submitBtn = form.querySelector("button[type=submit]");

const rules = {
  nome: (v) => (v.trim().length >= 2 ? "" : "Digite seu nome."),
  telefone: (v) => {
    const n = v.replace(/\D/g, "").length;
    return n >= 10 && n <= 11 ? "" : "Digite um telefone com DDD, ex.: (11) 99999-8888.";
  },
  interesse: (v) => (v ? "" : "Escolha um tipo de aula."),
};

function validateField(name) {
  const field = form.elements[name];
  const msg = rules[name](field.value);
  const wrap = field.closest(".field");
  const err = document.getElementById(`${name}-erro`);
  wrap.classList.toggle("has-error", Boolean(msg));
  field.setAttribute("aria-invalid", msg ? "true" : "false");
  if (msg) field.setAttribute("aria-describedby", err.id); else field.removeAttribute("aria-describedby");
  err.textContent = msg;
  return !msg;
}

// Valida ao sair do campo e corrige ao vivo depois que já deu erro
Object.keys(rules).forEach((name) => {
  const field = form.elements[name];
  field.addEventListener("blur", () => validateField(name));
  field.addEventListener(field.tagName === "SELECT" ? "change" : "input", () => {
    if (field.closest(".field").classList.contains("has-error")) validateField(name);
  });
});

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = "form-status" + (type ? ` ${type}` : "");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("", "");

  const results = Object.keys(rules).map(validateField);
  if (results.includes(false)) {
    const firstInvalid = form.querySelector("[aria-invalid=true]");
    firstInvalid && firstInvalid.focus();
    return;
  }

  const data = Object.fromEntries(new FormData(form));

  // 1) WhatsApp
  if (CONFIG.whatsappNumber) {
    const lines = [
      "Olá! Tenho interesse nas aulas da TalkBox.",
      `Nome: ${data.nome}`,
      `Telefone: ${data.telefone}`,
      `Interesse: ${data.interesse}`,
      data.modalidade ? `Modalidade: ${data.modalidade}` : "",
      data.duvidas ? `Dúvidas: ${data.duvidas}` : "",
    ].filter(Boolean);
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
    form.reset();
    setStatus("Abrimos o WhatsApp com sua mensagem. É só enviar!", "ok");
    return;
  }

  // 2) Endpoint
  if (CONFIG.formEndpoint) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      setStatus("Recebemos seu interesse! Vamos te chamar em breve.", "ok");
    } catch {
      setStatus("Não foi possível enviar agora. Verifique sua conexão e tente de novo.", "fail");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar interesse";
    }
    return;
  }

  // 3) Modo demo
  console.info("[TalkBox] Dados do formulário (modo demo):", data);
  form.reset();
  setStatus("Recebemos seu interesse! Vamos te chamar em breve.", "ok");
});

}

/* ---------- Animação ao rolar a página ----------
   Os itens surgem quando entram na tela. Cada grupo revela seus itens
   em sequência (efeito cascata). Para animar algo novo, adicione aqui:
   [container, itens dentro dele (ou null = o próprio container), efeito]
   Efeitos: "up" (padrão), "left", "right", "zoom". */
const revealGroups = [
  [".hero-copy", "h1, .lead, .hero-actions", "up"],
  [".chat", null, "zoom"],
  [".section h2", null, "up"],
  [".section-lead", null, "up"],
  [".tracks-title", null, "up"],
  [".about-lead", null, "up"],
  [".call", null, "zoom"],
  [".about-body", "p, .facts li", "up"],
  [".tracks", "li", "zoom"],
  [".plans-switch", null, "up"],
  [".plans-slider", ".plans-intro, .term-picker", "up"],
  [".plans-slider", ".plan", "flip"],
  [".reviews", null, "up"],
  [".teachers", ".teacher:nth-child(odd)", "left"],
  [".teachers", ".teacher:nth-child(even)", "right"],
  [".faq", "details", "up"],
  [".contact-copy", null, "left"],
  [".form", null, "right"],
  [".footer-grid", ":scope > *", "up"],
];

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealObserver.unobserve(entry.target);
      entry.target._revealItems.forEach((el) => el.classList.add("is-visible"));
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  revealGroups.forEach(([containerSel, itemSel, effect]) => {
    document.querySelectorAll(containerSel).forEach((container) => {
      const items = itemSel ? [...container.querySelectorAll(itemSel)] : [container];
      if (!items.length) return;
      items.forEach((el, i) => {
        el.classList.add("reveal");
        el.dataset.reveal = effect;
        el.style.setProperty("--reveal-delay", `${Math.min(i, 6) * 90}ms`);
      });
      container._revealItems = (container._revealItems || []).concat(items);
      revealObserver.observe(container);
    });
  });
}

/* ---------- Videochamada decorativa (seção Sobre) ----------
   Cronômetro correndo e legendas trocando, só enquanto está na tela. */
const call = document.querySelector(".call");
if (call) {
  const timer = call.querySelector(".call-timer");
  const caption = call.querySelector(".call-caption");
  const captions = [
    "So, what are your goals with English?",
    "Great! Let's practice that together.",
    "Don't worry about mistakes. Keep talking!",
    "Nice! Your pronunciation is getting better.",
  ];
  let seconds = 12 * 60 + 34, line = 0, timerId = null;
  const tick = () => {
    seconds++;
    timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    if (!prefersReducedMotion && seconds % 4 === 0) {
      caption.classList.add("is-changing");
      setTimeout(() => {
        line = (line + 1) % captions.length;
        caption.textContent = captions[line];
        caption.classList.remove("is-changing");
      }, 350);
    }
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !timerId) timerId = setInterval(tick, 1000);
    if (!entry.isIntersecting && timerId) { clearInterval(timerId); timerId = null; }
  }).observe(call);
}

/* ---------- Ano no rodapé ---------- */
document.getElementById("ano").textContent = new Date().getFullYear();

/* ---------- Voltar ao topo ----------
   O menu fica fixo, então o link #topo leva sempre ao início da página. */
document.querySelectorAll('a[href="#topo"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    history.replaceState(null, "", location.pathname + location.search);
  });
});

/* ---------- Timeline da metodologia ----------
   A linha vai sendo preenchida conforme a seção passa na tela,
   e cada passo "acende" quando a linha chega nele. */
const timeline = document.querySelector("[data-timeline]");
if (timeline) {
  const steps = [...timeline.querySelectorAll(".step")];
  const track = timeline.querySelector(".tl-track");
  const section = timeline.closest("section") || timeline;
  const isVertical = () => window.matchMedia("(max-width: 1024px)").matches;

  const layout = () => {
    // No modo vertical a linha termina no centro do último ícone
    const last = steps[steps.length - 1];
    const node = last.querySelector(".step-node");
    const bottom = last.offsetHeight - (node.offsetTop + node.offsetHeight / 2);
    timeline.style.setProperty("--tl-bottom", `${Math.max(bottom, 0)}px`);
  };

  const update = () => {
    let p;
    const vh = window.innerHeight;
    const t = track.getBoundingClientRect();
    if (isVertical()) {
      // a "ponta" acompanha um ponto a 60% da altura da tela
      p = (vh * 0.6 - t.top) / Math.max(t.height, 1);
    } else {
      // começa quando a linha entra na tela e termina exatamente quando
      // o topo da seção "Como funciona" encosta no menu fixo
      const sec = section.getBoundingClientRect();
      const headerH = header ? header.offsetHeight : 0;
      const trackOffset = t.top - sec.top;               // distância do topo da seção até a linha
      const startTop = vh * 0.95 - trackOffset;          // topo da seção quando a linha aparece
      const range = Math.max(startTop - headerH, 1);
      p = (startTop - sec.top) / range;
    }
    p = Math.min(Math.max(p, 0), 1);
    timeline.style.setProperty("--p", p.toFixed(4));
    const n = steps.length;
    steps.forEach((step, i) => {
      const at = n === 1 ? 0 : i / (n - 1);
      step.classList.toggle("is-active", p >= at - 0.001 && p > 0);
    });
  };

  if (prefersReducedMotion) {
    timeline.style.setProperty("--p", 1);
    steps.forEach((s) => s.classList.add("is-active"));
    layout();
  } else {
    let ticking = false;
    const onScrollTl = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };
    window.addEventListener("scroll", onScrollTl, { passive: true });
    window.addEventListener("resize", () => { layout(); update(); });
    window.addEventListener("load", () => { layout(); update(); });
    layout(); update();
  }
}


/* Primeira vez que os planos aparecem: preços sobem do zero */
const plansBox = document.querySelector(".plans-slider");
if (plansBox && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    plansSeen = true;
    if (!prefersReducedMotion) {
      plansBox.querySelectorAll(".plans-panel:not([inert]) .price-value").forEach((v, i) => {
        const to = parseInt(v.textContent, 10) || 0;
        v.textContent = 0;
        setTimeout(() => countTo(v, to, 0), 250 + i * 140);
      });
    }
  }, { threshold: 0.25 });
  io.observe(plansBox);
} else { plansSeen = true; }

/* Brilho que acompanha o mouse nos cards */
document.querySelectorAll(".plan").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});
