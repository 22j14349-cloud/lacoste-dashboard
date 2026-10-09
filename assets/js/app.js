/* Lacoste dashboard — shared shell, theme, chart registry and helpers. */
(function () {
  "use strict";
  const D = window.LACOSTE_DATA;

  const PAGES = [
    { id: "overview",       file: "index.html",          title: "Overview",          icon: "layout-dashboard", blurb: "Headline numbers, latest news and the road to €4bn." },
    { id: "financials",     file: "financials.html",     title: "Financials",        icon: "trending-up",      blurb: "Sales since 2019, growth, the €4bn target and where the money comes from." },
    { id: "global",         file: "global.html",         title: "Global presence",   icon: "globe-2",          blurb: "Interactive world map of key markets, flagships and tournaments." },
    { id: "brand",          file: "brand.html",          title: "Brand & sport",     icon: "trophy",           blurb: "Ninety years of history, ambassadors, Roland-Garros and leadership." },
    { id: "products",       file: "products.html",       title: "Products",          icon: "shirt",            blurb: "From the 1933 polo to padel — categories, licences and launches." },
    { id: "sustainability", file: "sustainability.html", title: "Sustainability",    icon: "leaf",             blurb: "Durable Elegance: climate targets, milestones and the critics." },
    { id: "competitors",    file: "competitors.html",    title: "Rivals",            icon: "swords",           blurb: "Lacoste next to Hugo Boss, Ralph Lauren and PVH." },
    { id: "sources",        file: "sources.html",        title: "Sources & method",  icon: "book-open",        blurb: "Every source, and how estimates were derived." }
  ];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;

  /* ---------------- theme ---------------- */
  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("lc-theme", t); } catch (e) { /* storage unavailable */ }
    rerenderAll();
  }

  /* ---------------- tokens ---------------- */
  function tok() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    return {
      dark: currentTheme() === "dark",
      surface: v("--surface"), surface2: v("--surface-2"), ink: v("--ink"), ink2: v("--ink-2"), muted: v("--muted"),
      line: v("--line"), axis: v("--axis"), brand: v("--brand"), red: v("--red"), ochre: v("--ochre"), est: v("--est"),
      s1: v("--s1"), s2: v("--s2"), s3: v("--s3"), other: v("--s-other"),
      seq: [v("--seq-1"), v("--seq-2"), v("--seq-3"), v("--seq-4"), v("--seq-5")],
      mapEmpty: v("--map-empty"), mapBorder: v("--map-border"),
      font: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    };
  }

  /* ---------------- shell ---------------- */
  function buildShell() {
    const body = document.body;
    const pageId = body.dataset.page;
    const page = document.getElementById("page");
    const meta = PAGES.find((p) => p.id === pageId) || PAGES[0];

    const app = document.createElement("div");
    app.className = "app";

    const nav = PAGES.map((p, i) => {
      const label = i === PAGES.length - 1 ? `<div class="nav-label">About</div>` : "";
      return `${label}<a href="${p.file}"${p.id === pageId ? ' aria-current="page"' : ""}>${icon(p.icon)}<span>${esc(p.title)}</span>${i < PAGES.length - 1 ? `<span class="num">0${i + 1}</span>` : ""}</a>`;
    }).join("");

    app.innerHTML = `
      <aside class="sidebar" id="sidebar" aria-label="Main navigation">
        <a class="brand-badge" href="index.html" aria-label="Lacoste dashboard home">
          <img src="assets/img/lacoste-logo.webp" alt="Lacoste logo">
        </a>
        <div class="brand-caption">Brand intelligence dashboard</div>
        <nav class="nav"><div class="nav-label">Dashboard</div>${nav}</nav>
        <div class="sidebar-foot"><strong>Data as of ${esc(D.asOf)}</strong><br>Public sources only. Figures marked
          <span class="badge estimate" style="padding:1px 6px">Estimate</span> are derived.</div>
      </aside>
      <div class="scrim" data-close-nav></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" type="button" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">${icon("menu")}</button>
          <div class="crumbs"><span>Lacoste</span>${icon("chevron-right")}<b>${esc(meta.title)}</b></div>
          <div class="spacer"></div>
          <span class="chip asof"><span class="dot"></span>Updated ${esc(D.asOf)}</span>
          <button class="icon-btn theme-btn" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">
            <span class="moon">${icon("moon")}</span><span class="sun">${icon("sun")}</span>
          </button>
        </header>
        <div class="page-slot"></div>
        <footer class="site-foot">
          <span>Independent portfolio project — not affiliated with Lacoste S.A. The crocodile logo is a trademark of Lacoste.</span>
          <span>Built with Apache ECharts · <a href="sources.html">Sources & method</a></span>
        </footer>
      </div>`;

    body.prepend(app);
    app.querySelector(".page-slot").replaceWith(page);

    // pager
    const idx = PAGES.findIndex((p) => p.id === pageId);
    const prev = PAGES[idx - 1], next = PAGES[idx + 1];
    const pager = document.createElement("nav");
    pager.className = "pager";
    pager.setAttribute("aria-label", "Page navigation");
    pager.innerHTML =
      (prev ? `<a class="prev" href="${prev.file}"><small>← Previous</small><b>${esc(prev.title)}</b></a>` : "") +
      (next ? `<a class="next" href="${next.file}"><small>Next →</small><b>${esc(next.title)}</b></a>` : "");
    page.appendChild(pager);

    // interactions
    const menuBtn = app.querySelector(".menu-btn");
    const toggleNav = (open) => {
      body.classList.toggle("nav-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };
    menuBtn.addEventListener("click", () => toggleNav(!body.classList.contains("nav-open")));
    app.querySelector("[data-close-nav]").addEventListener("click", () => toggleNav(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleNav(false); });
    app.querySelector(".theme-btn").addEventListener("click", () => setTheme(currentTheme() === "dark" ? "light" : "dark"));
  }

  /* ---------------- sources & badges ---------------- */
  function srcLinks(ids) {
    const list = ids.filter((id) => D.sources[id]);
    const pubCount = {};
    list.forEach((id) => { const p = D.sources[id].pub; pubCount[p] = (pubCount[p] || 0) + 1; });
    return list.map((id) => {
      const s = D.sources[id];
      // same publisher twice in one footer: add the page title so links are distinguishable
      const name = pubCount[s.pub] > 1 ? `${s.pub}: ${s.title}` : s.pub;
      return `<a href="sources.html#${id}" title="${esc(s.title)}">${esc(name)}${s.date && !/accessed|undated/.test(s.date) ? ", " + esc(s.date) : ""}</a>`;
    }).join("");
  }
  function fillSources(root) {
    (root || document).querySelectorAll("[data-src]").forEach((el) => {
      const ids = el.dataset.src.split(/[\s,]+/).filter(Boolean);
      el.innerHTML = `${esc(el.dataset.srcLabel || "Sources")}: <span class="src-list">${srcLinks(ids)}</span>`;
    });
  }
  function badge(status) {
    if (status === "reported") return `<span class="badge reported" title="Stated by the company, a named executive or a filing">Reported</span>`;
    if (status === "estimate") return `<span class="badge estimate" title="Derived by this dashboard from reported figures — see Sources & method">Estimate</span>`;
    return `<span class="badge neutral">${esc(status)}</span>`;
  }

  /* ---------------- formatting ---------------- */
  const fmt = {
    eurbn: (v) => v == null ? "n/d" : `€${v.toFixed(v % 1 === 0 ? 1 : 2).replace(/0$/, "")}bn`,
    pct: (v, signed) => v == null ? "n/d" : `${signed && v > 0 ? "+" : ""}${v}%`,
    int: (v) => new Intl.NumberFormat("en-GB").format(v)
  };

  /* ---------------- chart registry ---------------- */
  const registry = [];

  function baseOption(t) {
    return {
      backgroundColor: "transparent",
      textStyle: { fontFamily: t.font, color: t.ink2 },
      animationDuration: 1000,
      animationEasing: "cubicOut",
      animationDurationUpdate: 600,
      tooltip: tooltip(t)
    };
  }
  function tooltip(t, extra) {
    return Object.assign({
      backgroundColor: t.surface,
      borderColor: t.line,
      borderWidth: 1,
      padding: [10, 12],
      textStyle: { color: t.ink, fontFamily: t.font, fontSize: 13 },
      extraCssText: "border-radius:12px;box-shadow:0 12px 32px -12px rgba(0,0,0,.35);",
      confine: true
    }, extra || {});
  }
  // tooltip row: value leads, label follows; line key (or dot key for point marks)
  function ttRow(color, value, label, dot) {
    return `<div class="tt-r"><i class="${dot ? "dot" : ""}" style="background:${color}"></i><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  }
  function ttBox(head, rows, note) {
    return `<div class="tt-box">${head ? `<div class="tt-h">${esc(head)}</div>` : ""}${rows}${note ? `<div class="tt-n">${esc(note)}</div>` : ""}</div>`;
  }
  function axisCommon(t) {
    return {
      axisLine: { lineStyle: { color: t.axis, width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: t.muted, fontSize: 12, fontFamily: t.font },
      splitLine: { lineStyle: { color: t.line, width: 1, type: "solid" } }
    };
  }

  function renderTable(spec) {
    const { cols, rows } = spec;
    return `<table class="data"><thead><tr>${cols.map((c) => `<th class="${c.num ? "num" : ""}">${esc(c.label)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c.num ? "num" : ""}">${c.html ? r[c.key] : esc(r[c.key])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  /**
   * Register a chart.
   * @param {string} id   container element id
   * @param {(t, state) => object} build  returns an ECharts option for the current theme tokens
   * @param {{table?: () => {cols, rows}, onReady?: (inst) => void, renderer?: string}} opts
   */
  function chart(id, build, opts) {
    opts = opts || {};
    const el = document.getElementById(id);
    if (!el) return null;
    if (!window.echarts) {
      el.style.minHeight = "0";
      el.style.height = "auto";
      el.innerHTML = `<p class="small muted">The chart library could not load (offline?).${opts.table ? " Showing the data table instead." : ""}</p>`;
      if (opts.table) el.insertAdjacentHTML("beforeend", `<div style="overflow-x:auto">${renderTable(opts.table())}</div>`);
      return null;
    }
    const entry = { id, el, build, opts, inst: null };
    registry.push(entry);
    // mount when scrolled into view so the entrance animation is seen
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((ens) => {
        if (ens.some((en) => en.isIntersecting)) { io.disconnect(); if (!entry.inst) mount(entry); }
      }, { rootMargin: "0px 0px -4% 0px" });
      io.observe(el);
      setTimeout(() => { if (!entry.inst) { io.disconnect(); mount(entry); } }, 3000);
    } else {
      mount(entry);
    }

    // chart / table toggle
    if (opts.table) {
      const card = el.closest(".card");
      const tools = card && card.querySelector(".card-tools");
      const tv = document.createElement("div");
      tv.className = "table-view";
      el.after(tv);
      if (tools) {
        const seg = document.createElement("div");
        seg.className = "seg";
        seg.setAttribute("role", "group");
        seg.setAttribute("aria-label", "View as");
        seg.innerHTML = `<button type="button" aria-pressed="true" data-v="chart">${icon("bar-chart-3")}Chart</button><button type="button" aria-pressed="false" data-v="table">${icon("table-2")}Table</button>`;
        tools.appendChild(seg);
        seg.addEventListener("click", (e) => {
          const b = e.target.closest("button");
          if (!b) return;
          const showTable = b.dataset.v === "table";
          seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          if (showTable) tv.innerHTML = renderTable(opts.table());
          card.classList.toggle("show-table", showTable);
          if (!showTable) entry.inst && entry.inst.resize();
        });
        if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2 } });
      }
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => entry.inst && entry.inst.resize()).observe(el);
    }
    return entry;
  }
  function mount(entry) {
    if (entry.inst) entry.inst.dispose();
    entry.inst = window.echarts.init(entry.el, null, { renderer: entry.opts.renderer || "canvas" });
    const t = tok();
    entry.inst.setOption(Object.assign(baseOption(t), entry.build(t)));
    if (entry.opts.onReady) entry.opts.onReady(entry.inst, t);
  }
  function update(entry) {
    if (!entry || !entry.inst) return;
    const t = tok();
    entry.inst.setOption(Object.assign(baseOption(t), entry.build(t)), { notMerge: true });
    if (entry.opts.onReady) entry.opts.onReady(entry.inst, t);
  }
  function rerenderAll() {
    registry.forEach((e) => { if (e.inst) mount(e); });
    document.dispatchEvent(new CustomEvent("themechange", { detail: currentTheme() }));
  }

  /* ---------------- count-up & reveal ---------------- */
  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const nf = new Intl.NumberFormat("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = pre + nf.format(end) + suf; return; }
    const dur = 1300, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + nf.format(end * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const showEl = (el) => {
    if (el.classList.contains("in")) return;
    el.classList.add("in");
    el.querySelectorAll("[data-count]").forEach(countUp);
    el.querySelectorAll(".meter > span[data-w]").forEach((m) => { m.style.width = m.dataset.w + "%"; });
  };
  const revealIO = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { showEl(en.target); revealIO.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 })
    : null;
  function reveal(root) {
    const items = [...(root || document).querySelectorAll("[data-reveal]:not([data-observed])")];
    items.forEach((el, i) => {
      el.dataset.observed = "1";
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
      if (revealIO) revealIO.observe(el); else showEl(el);
    });
    // safety net: never leave content invisible
    setTimeout(() => items.forEach(showEl), 2500);
  }

  /** Re-run after a page script injects markup: sources, icons, reveal. */
  function refresh(root) {
    fillSources(root);
    if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2 } });
    reveal(root);
  }

  /* ---------------- init ---------------- */
  function init() {
    buildShell();
    refresh();
  }

  window.App = {
    D, PAGES, esc, icon, tok, chart, update, badge, fmt, srcLinks, fillSources,
    tooltip, ttRow, ttBox, axisCommon, renderTable, currentTheme, refresh,
    icons: () => window.lucide && window.lucide.createIcons({ attrs: { "stroke-width": 2 } })
  };

  // app.js is loaded at the end of <body>, after #page, so the shell can be built now;
  // page scripts that follow then render into their final layout.
  init();
})();
