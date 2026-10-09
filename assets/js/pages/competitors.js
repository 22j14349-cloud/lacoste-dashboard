/* Rivals page */
(function () {
  const { D, esc, chart, update, tooltip, ttRow, ttBox, axisCommon } = App;
  const fx = D.fx.usdPerEur;
  const rivals = D.rivals.map((r) => ({
    ...r,
    label: r.short || r.name,
    eur: r.currency === "EUR" ? r.revenue : +(r.revenue / fx).toFixed(2),
    native: r.currency === "EUR" ? `€${r.revenue.toFixed(2)}bn` : `$${r.revenue.toFixed(2)}bn`
  }));
  const state = { hl: "Lacoste" };
  const colorFor = (t, r) => (r.name === state.hl ? t.s1 : t.other);

  /* ---- KPIs ---- */
  const lac = rivals.find((r) => r.name === "Lacoste");
  const rl = rivals.find((r) => r.name === "Ralph Lauren");
  document.getElementById("kRatio").textContent = `${(rl.eur / lac.eur).toFixed(1)}×`;
  const others = rivals.filter((r) => r !== lac).map((r) => r.growth).sort((a, b) => a - b);
  const median = others[Math.floor(others.length / 2)];
  document.getElementById("kGrowth").textContent = `+${lac.growth}% vs +${median}%`;
  document.getElementById("kGrowthD").textContent = `Lacoste ${lac.period}; rivals' latest years`;

  /* ---- highlight pills ---- */
  const pills = document.getElementById("hlPills");
  pills.innerHTML = rivals.map((r) => `<button class="pill" type="button" data-hl="${esc(r.name)}" aria-pressed="${r.name === state.hl}">${esc(r.label)}</button>`).join("");
  pills.addEventListener("click", (e) => {
    const b = e.target.closest("[data-hl]");
    if (!b) return;
    state.hl = b.dataset.hl;
    pills.querySelectorAll("[data-hl]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    [revC, groC, ageC].forEach(update);
    renderTable();
  });

  /* ---- revenue ---- */
  const byRev = [...rivals].sort((a, b) => b.eur - a.eur);
  const revC = chart("rev", (t) => ({
    grid: { left: 8, right: 120, top: 4, bottom: 4, containLabel: true },
    tooltip: tooltip(t, { trigger: "item", formatter: (p) => { const r = byRev[p.dataIndex]; return ttBox(`${r.label} · ${r.period}`, ttRow(colorFor(t, r), `€${r.eur.toFixed(2)}bn`, r.currency === "USD" ? `(${r.native})` : "", true)); } }),
    xAxis: Object.assign(axisCommon(t), { type: "value", max: 9, interval: 3, axisLabel: { color: t.muted, formatter: "€{value}bn" }, axisLine: { show: false } }),
    yAxis: Object.assign(axisCommon(t), { type: "category", inverse: true, data: byRev.map((r) => r.label), axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 13 } }),
    series: [{
      type: "bar", barMaxWidth: 22,
      data: byRev.map((r) => ({ value: r.eur, itemStyle: { color: colorFor(t, r), borderRadius: [0, 4, 4, 0] } })),
      label: { show: true, position: "right", color: t.ink, fontWeight: 600, fontSize: 12, formatter: (p) => { const r = byRev[p.dataIndex]; return `€${r.eur.toFixed(1)}bn${r.currency === "USD" ? `  (${r.native.replace(/0bn$/, "bn")})` : ""}`; } }
    }]
  }), {
    table: () => ({ cols: [{ key: "n", label: "Company" }, { key: "p", label: "Period" }, { key: "v", label: "Revenue", num: true }, { key: "e", label: "In €", num: true }],
      rows: byRev.map((r) => ({ n: r.label, p: r.period, v: r.native, e: `€${r.eur.toFixed(2)}bn` })) })
  });

  /* ---- growth ---- */
  const byGro = [...rivals].sort((a, b) => b.growth - a.growth);
  const groC = chart("gro", (t) => ({
    grid: { left: 8, right: 48, top: 4, bottom: 4, containLabel: true },
    tooltip: tooltip(t, { trigger: "item", formatter: (p) => { const r = byGro[p.dataIndex]; return ttBox(`${r.label} · ${r.period}`, ttRow(colorFor(t, r), `${r.growth > 0 ? "+" : ""}${r.growth}%`, "reported", true), r.growthNote !== "reported" ? r.growthNote : ""); } }),
    xAxis: Object.assign(axisCommon(t), { type: "value", min: -5, max: 20, interval: 5, axisLabel: { color: t.muted, formatter: "{value}%" }, axisLine: { show: false } }),
    yAxis: Object.assign(axisCommon(t), { type: "category", inverse: true, data: byGro.map((r) => r.label), axisLine: { show: true, lineStyle: { color: t.axis } }, splitLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 13 } }),
    series: [{
      type: "bar", barMaxWidth: 22,
      data: byGro.map((r) => ({ value: r.growth, itemStyle: { color: colorFor(t, r), borderRadius: r.growth >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4] } })),
      label: { show: true, position: "right", color: t.ink, fontWeight: 600, fontSize: 12, formatter: (p) => `${p.value > 0 ? "+" : ""}${p.value}%` }
    }]
  }), {
    table: () => ({ cols: [{ key: "n", label: "Company" }, { key: "p", label: "Period" }, { key: "g", label: "Growth", num: true }, { key: "x", label: "Note" }],
      rows: byGro.map((r) => ({ n: r.label, p: r.period, g: `${r.growth > 0 ? "+" : ""}${r.growth}%`, x: r.growthNote })) })
  });

  /* ---- age vs size ---- */
  const ageC = chart("age", (t) => ({
    grid: { left: 8, right: 24, top: 16, bottom: 4, containLabel: true },
    tooltip: tooltip(t, { trigger: "item", formatter: (p) => { const r = rivals[p.dataIndex]; return ttBox(r.label, ttRow(colorFor(t, r), `€${r.eur.toFixed(1)}bn`, `founded ${r.founded}`, true)); } }),
    xAxis: Object.assign(axisCommon(t), { type: "value", min: 1870, max: 1990, interval: 30, name: "Founded", nameLocation: "middle", nameGap: 28, nameTextStyle: { color: t.muted }, axisLabel: { color: t.muted, formatter: (v) => String(v) } }),
    yAxis: Object.assign(axisCommon(t), { type: "value", min: 0, max: 9, interval: 3, axisLine: { show: false }, axisLabel: { color: t.muted, formatter: "€{value}bn" } }),
    series: [{
      type: "scatter", symbolSize: 16,
      data: rivals.map((r) => ({ value: [r.founded, r.eur], itemStyle: { color: colorFor(t, r), borderColor: t.surface, borderWidth: 2 } })),
      label: { show: true, position: "top", distance: 8, color: t.ink2, fontSize: 12, fontWeight: 600, formatter: (p) => rivals[p.dataIndex].label },
      emphasis: { scale: 1.3 }
    }]
  }), {
    table: () => ({ cols: [{ key: "n", label: "Company" }, { key: "f", label: "Founded", num: true }, { key: "e", label: "Revenue (€)", num: true }],
      rows: rivals.map((r) => ({ n: r.label, f: r.founded, e: `€${r.eur.toFixed(2)}bn` })) })
  });

  /* ---- sortable table ---- */
  const cols = [
    { key: "label", label: "Company" }, { key: "eur", label: "Revenue (€bn)", num: true, fmt: (r) => r.eur.toFixed(2) },
    { key: "native", label: "Reported", fmt: (r) => `${r.native} · ${r.period}` },
    { key: "growth", label: "Growth", num: true, fmt: (r) => `${r.growth > 0 ? "+" : ""}${r.growth}%` },
    { key: "founded", label: "Founded", num: true }, { key: "hq", label: "HQ" }, { key: "owner", label: "Ownership" }, { key: "emblem", label: "Emblem" }
  ];
  const sort = { key: "eur", dir: -1 };
  function renderTable() {
    const rows = [...rivals].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
    document.getElementById("cmp").innerHTML = `
      <thead><tr>${cols.map((c) => `<th class="${c.num ? "num" : ""}" aria-sort="${sort.key === c.key ? (sort.dir > 0 ? "ascending" : "descending") : "none"}"><button type="button" data-k="${c.key}">${esc(c.label)}${sort.key === c.key ? (sort.dir > 0 ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr class="${r.name === state.hl ? "hl" : ""}">${cols.map((c) => `<td class="${c.num ? "num" : ""}">${esc(c.fmt ? c.fmt(r) : r[c.key])}</td>`).join("")}</tr>`).join("")}</tbody>`;
  }
  document.getElementById("cmp").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    if (sort.key === b.dataset.k) sort.dir *= -1; else { sort.key = b.dataset.k; sort.dir = cols.find((c) => c.key === b.dataset.k).num ? -1 : 1; }
    renderTable();
  });
  renderTable();

  App.refresh();
})();
