/* Products page */
(function () {
  const { D, esc, icon, chart, tooltip, ttRow, ttBox, axisCommon } = App;
  const cats = D.categories;
  const pill = (m) => `<span class="model-pill ${m === "In-house" ? "in" : "lic"}">${esc(m)}</span>`;

  /* ---- explorer ---- */
  const grid = document.getElementById("cats");
  grid.innerHTML = cats.map((c, i) => `
    <button class="cat-btn" type="button" data-id="${c.id}" aria-pressed="${i === 0}">
      <span class="ci">${icon(c.icon)}</span>
      <span class="cn">${esc(c.name)}</span>
      <span class="cy">${c.id === "kids" ? "1950s" : "Since " + c.first} · ${esc(c.model)}</span>
    </button>`).join("");

  function show(id) {
    const c = cats.find((x) => x.id === id);
    grid.querySelectorAll(".cat-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    document.getElementById("catDetail").innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <h4>${esc(c.name)}</h4>${pill(c.model)}
      </div>
      <dl class="kv">
        <dt>First launch</dt><dd>${c.id === "kids" ? "1950s" : c.first}</dd>
        <dt>Partner</dt><dd>${esc(c.partner)}</dd>
        <dt>Note</dt><dd>${esc(c.detail)}</dd>
        <dt>Age</dt><dd>${2026 - c.first} year${2026 - c.first === 1 ? "" : "s"} in the range</dd>
      </dl>`;
    const src = document.getElementById("catSrc");
    src.dataset.src = c.src.join(" ");
    App.fillSources(src.parentElement);
  }
  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".cat-btn");
    if (b) show(b.dataset.id);
  });
  show(cats[0].id);

  /* ---- ages chart ---- */
  const rows = [...cats].sort((a, b) => a.first - b.first);
  chart("ages", (t) => ({
    grid: { left: 8, right: 110, top: 4, bottom: 4, containLabel: true },
    tooltip: tooltip(t, {
      trigger: "item",
      formatter: (p) => {
        const c = rows[p.dataIndex];
        return ttBox(c.name, ttRow(c.model === "In-house" ? t.s1 : t.s2, `${2026 - c.first} years`, c.model, true), c.partner);
      }
    }),
    xAxis: Object.assign(axisCommon(t), { type: "value", max: 100, interval: 25, axisLabel: { color: t.muted, formatter: "{value} yrs" }, axisLine: { show: false } }),
    yAxis: Object.assign(axisCommon(t), { type: "category", inverse: true, data: rows.map((c) => c.name), axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 13 } }),
    series: [{
      type: "bar", barMaxWidth: 18,
      data: rows.map((c) => ({ value: Math.max(2026 - c.first, 0.8), itemStyle: { color: c.model === "In-house" ? t.s1 : t.s2, borderRadius: [0, 4, 4, 0] } })),
      label: { show: true, position: "right", color: t.ink, fontWeight: 600, fontSize: 12, formatter: (p) => { const c = rows[p.dataIndex]; return `${c.id === "kids" ? "1950s" : "since " + c.first}`; } }
    }]
  }), {
    table: () => ({
      cols: [{ key: "n", label: "Category" }, { key: "f", label: "First launch", num: true }, { key: "a", label: "Years", num: true }, { key: "m", label: "Model" }, { key: "p", label: "Partner" }],
      rows: rows.map((c) => ({ n: c.name, f: c.id === "kids" ? "1950s" : c.first, a: 2026 - c.first, m: c.model, p: c.partner }))
    })
  });

  /* ---- make or license ---- */
  const nIn = cats.filter((c) => c.model === "In-house").length;
  const nLic = cats.length - nIn;
  const elIn = document.getElementById("nIn"), elLic = document.getElementById("nLic");
  elIn.textContent = nIn; elLic.textContent = nLic;
  const bar = document.getElementById("modelBar");
  bar.setAttribute("aria-label", `${nIn} in-house, ${nLic} licensed`);
  bar.innerHTML = `<span style="width:${(nIn / cats.length) * 100}%;background:var(--s1)"></span><span style="width:${(nLic / cats.length) * 100}%;background:var(--s2)"></span>`;

  /* ---- innovations ---- */
  document.getElementById("innos").innerHTML = D.innovations.map((n) => `
    <article class="card lift inno span-4" data-reveal>
      <span class="y">${n.year}</span>
      <p>${esc(n.text)}</p>
      <footer class="card-foot" data-src="${n.src.join(" ")}"></footer>
    </article>`).join("");

  App.refresh();
})();
