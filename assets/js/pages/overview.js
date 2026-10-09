/* Overview page */
(function () {
  const { D, esc, badge, chart, tooltip, ttRow, ttBox, axisCommon } = App;

  /* ---- KPI tiles ---- */
  const kpiIcons = { sales: "banknote", boutiques: "store", countries: "globe", employees: "users", instagram: "heart", target: "target" };
  document.getElementById("kpis").innerHTML = D.kpis.map((k) => `
    <article class="card kpi lift span-2" data-reveal>
      <div class="kpi-top"><span class="kpi-icon">${App.icon(kpiIcons[k.id] || "circle")}</span>${badge(k.status)}</div>
      <div class="label">${esc(k.label)}</div>
      <div class="value" data-count="${k.value}" data-decimals="${k.decimals}" data-prefix="${esc(k.prefix)}" data-suffix="${esc(k.suffix)}">${esc(k.prefix)}0${esc(k.suffix)}</div>
      <div class="delta ${k.delta && k.delta.startsWith("+") ? "up" : ""}">${esc(k.delta || " ")}</div>
    </article>`).join("");

  /* ---- trajectory chart ---- */
  const years = [];
  for (let y = 2019; y <= 2030; y++) years.push(y);
  const byYear = Object.fromEntries(D.revenue.map((r) => [r.year, r]));
  const T = D.target;
  const cagr2030 = Math.pow(T.value / T.base, 1 / (2030 - T.baseYear)) - 1;
  const path = years.map((y) => (y < T.baseYear ? null : +(T.base * Math.pow(1 + cagr2030, y - T.baseYear)).toFixed(2)));

  chart("trajectory", (t) => ({
    grid: { left: 8, right: 48, top: 28, bottom: 4, containLabel: true },
    tooltip: tooltip(t, {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: t.axis, width: 1 } },
      formatter: (ps) => {
        const y = +ps[0].axisValue;
        const r = byYear[y];
        let rows = "";
        if (r) rows += ttRow(t.s1, r.value == null ? "Not disclosed" : `€${r.value.toFixed(2)}bn`, r.status === "n/d" ? "" : r.status, true);
        const p = ps.find((x) => x.seriesName === "Path to target");
        if (p && p.value != null && y > T.baseYear) rows += ttRow(t.ink2, `€${p.value.toFixed(2)}bn`, "illustrative path");
        return ttBox(String(y), rows, r ? r.note : (y >= T.from ? "Target window: €4bn in 2028–30" : ""));
      }
    }),
    xAxis: Object.assign(axisCommon(t), { type: "category", data: years.map(String), boundaryGap: false, splitLine: { show: false } }),
    yAxis: Object.assign(axisCommon(t), { type: "value", min: 0, max: 4.5, interval: 1, axisLine: { show: false }, axisLabel: { color: t.muted, formatter: "€{value}bn" } }),
    series: [
      {
        name: "Sales", type: "line", connectNulls: false, smooth: 0.25, showAllSymbol: true,
        data: years.map((y) => {
          const r = byYear[y];
          if (!r || r.value == null) return null;
          const est = r.status === "estimate";
          return {
            value: r.value,
            symbol: "circle",
            symbolSize: est ? 10 : 9,
            itemStyle: { color: est ? t.surface : t.s1, borderColor: est ? t.s1 : t.surface, borderWidth: 2 }
          };
        }),
        lineStyle: { width: 2, color: t.s1, cap: "round", join: "round" },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: t.s1 + "40" }, { offset: 1, color: t.s1 + "05" }]) },
        endLabel: { show: true, formatter: () => "≈ €3.0bn", color: t.ink, fontWeight: 600, fontSize: 12, distance: 6 },
        markArea: {
          silent: true,
          itemStyle: { color: t.dark ? "rgba(201,133,0,0.10)" : "rgba(224,161,0,0.10)" },
          label: { color: t.est, fontSize: 11, fontWeight: 600, position: "insideTop" },
          data: [[{ name: "€4bn target window", xAxis: String(T.from) }, { xAxis: String(T.to) }]]
        },
        z: 3
      },
      {
        name: "Path to target", type: "line", data: path, symbol: "none", smooth: false,
        lineStyle: { width: 2, type: [6, 5], color: t.muted },
        endLabel: { show: true, formatter: "€4bn", color: t.ink2, fontWeight: 600, fontSize: 12 },
        z: 2
      }
    ]
  }), {
    table: () => ({
      cols: [{ key: "year", label: "Year" }, { key: "v", label: "Sales", num: true }, { key: "s", label: "Status", html: true }, { key: "n", label: "Note" }],
      rows: D.revenue.map((r) => ({ year: r.year, v: r.value == null ? "n/d" : `€${r.value.toFixed(2)}bn`, s: r.status === "n/d" ? "—" : badge(r.status), n: r.note }))
        .concat([{ year: "2028–30", v: "€4.00bn", s: badge("reported"), n: "Company target (5–10% annual growth)." }])
    })
  });

  /* ---- gauge ---- */
  const pct = Math.round((T.base / T.value) * 100);
  chart("gauge", (t) => ({
    tooltip: { show: false },
    series: [{
      type: "gauge", startAngle: 210, endAngle: -30, min: 0, max: 100, radius: "92%", center: ["50%", "56%"],
      progress: { show: true, roundCap: true, width: 16, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: t.s1 }, { offset: 1, color: t.dark ? "#72c595" : "#0b5c34" }]) } },
      axisLine: { roundCap: true, lineStyle: { width: 16, color: [[1, t.dark ? "rgba(42,165,101,0.14)" : "#e3f1e8"]] } },
      pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      anchor: { show: false }, title: { show: true, offsetCenter: [0, "34%"], color: t.muted, fontSize: 12 },
      detail: { valueAnimation: true, offsetCenter: [0, "-2%"], fontSize: 38, fontWeight: 700, color: t.ink, formatter: "{value}%", fontFamily: t.font },
      data: [{ value: pct, name: "€3.0bn of €4.0bn" }]
    }]
  }));

  /* ---- news feed ---- */
  const news = [
    { d: "Oct 2026", t: "Guibert back as CEO", x: "Éric Vallat dismissed days before Paris Fashion Week; Thierry Guibert reinstated.", hot: true },
    { d: "Oct 2026", t: "SS27 runway: “don't wear white”", x: "Guests asked to avoid the brand's signature colour.", hot: true },
    { d: "Sep 2026", t: "Padel debut", x: "First padel collection and Club Lacoste Bali." },
    { d: "Sep 2026", t: "Lacoste × Mackintosh", x: "Collaboration with the British outerwear label." },
    { d: "Jun 2026", t: "Lacoste × Alpine", x: "Capsule blending performance and elegance." },
    { d: "Jun 2026", t: "A logo for Novak", x: "Redesigned crocodile celebrating Djokovic." },
    { d: "May 2026", t: "Hong Kong flagship", x: "Opens in the Pedder Building." },
    { d: "Apr 2026", t: "New visual identity", x: "Serif wordmark, founding green, ochre and off-white." },
    { d: "Apr 2026", t: "Pierre Gasly joins", x: "F1 driver named ambassador." },
    { d: "Mar 2026", t: "KAI of EXO joins", x: "Ambassador; FW26 show “Washed Out Match”." },
    { d: "Feb 2026", t: "First Lacoste Café", x: "Opens in Paris." },
    { d: "Jan 2026", t: "Adrien Brody for eyewear", x: "Global eyewear ambassador." },
    { d: "Jan 2026", t: "Cortina 1956 collection", x: "Olympic-heritage alpine capsule." }
  ];
  document.getElementById("feed").innerHTML = news.map((n) =>
    `<li class="${n.hot ? "hot" : ""}"><time>${esc(n.d)}</time><div><div class="t">${esc(n.t)}</div><div class="d">${esc(n.x)}</div></div></li>`).join("");

  /* ---- at a glance ---- */
  const glance = [
    ["Founded", "1933, France — René Lacoste & André Gillier"],
    ["Headquarters", "Paris"],
    ["Owner", "MF Brands Group (Maus Frères, Geneva) — 100% since Nov 2012"],
    ["CEO", "Thierry Guibert (reinstated Oct 2026)"],
    ["Creative", "Pelagia Kolotouros, since 2023"],
    ["Signature", "The petit piqué polo and the green crocodile"]
  ];
  document.getElementById("glance").innerHTML = glance.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");

  /* ---- explore cards ---- */
  document.getElementById("explore").innerHTML = App.PAGES.filter((p) => p.id !== "overview").map((p) => `
    <a class="card lift explore span-3" href="${p.file}" data-reveal>
      <span class="ico">${App.icon(p.icon)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.blurb)}</p>
      <span class="go">Open ${App.icon("arrow-right")}</span>
    </a>`).join("");

  App.refresh();
})();
