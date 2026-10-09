/* Sustainability page */
(function () {
  const { D, esc, chart, tooltip, ttRow, ttBox, axisCommon } = App;

  /* ---- target rings (target size, not progress) ---- */
  const wrap = document.getElementById("targets");
  wrap.innerHTML = D.climateTargets.map((c) => `
    <article class="card lift target-tile span-3" data-reveal>
      <div class="ring chart" id="ring-${c.id}" style="min-height:150px"></div>
      <div class="tl">${esc(c.label)}</div>
      <div class="tb">Target by ${c.by} · ${esc(c.basis)}</div>
      <span class="badge reported">Reported target</span>
    </article>`).join("");
  D.climateTargets.forEach((c) => {
    const cut = c.unit.includes("cut");
    chart(`ring-${c.id}`, (t) => ({
      tooltip: { show: false },
      series: [{
        type: "gauge", startAngle: 90, endAngle: -270, min: 0, max: 100, radius: "88%",
        pointer: { show: false },
        progress: { show: true, roundCap: true, width: 12, itemStyle: { color: t.s1 } },
        axisLine: { lineStyle: { width: 12, color: [[1, t.dark ? "rgba(42,165,101,0.14)" : "#e3f1e8"]] } },
        splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
        title: { show: true, offsetCenter: [0, "34%"], color: t.muted, fontSize: 11 },
        detail: { valueAnimation: true, offsetCenter: [0, "-6%"], fontSize: 26, fontWeight: 700, color: t.ink, fontFamily: t.font, formatter: (v) => `${cut ? "−" : ""}${Math.round(v)}%` },
        data: [{ value: c.value, name: cut ? "cut" : "share" }]
      }]
    }));
  });

  /* ---- pathways ---- */
  const years = [];
  for (let y = 2019; y <= 2030; y++) years.push(y);
  const lines = [
    { name: "Scope 1 & 2 (absolute)", end: 100 - 47, key: "s1" },
    { name: "Scope 3 per product", end: 100 - 37, key: "s3" }
  ];
  const lerp = (end) => years.map((y) => +(100 + ((end - 100) * (y - 2019)) / 11).toFixed(1));
  chart("pathway", (t) => ({
    grid: { left: 8, right: 76, top: 40, bottom: 4, containLabel: true },
    legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 14, itemHeight: 3, textStyle: { color: t.ink2, fontSize: 12 } },
    tooltip: tooltip(t, {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: t.axis } },
      formatter: (ps) => ttBox(ps[0].axisValue, ps.map((p) => ttRow(p.color, String(p.value), p.seriesName)).join(""), "Index, 2019 = 100. Straight-line path to the 2030 target.")
    }),
    xAxis: Object.assign(axisCommon(t), { type: "category", boundaryGap: false, data: years.map(String), splitLine: { show: false } }),
    yAxis: Object.assign(axisCommon(t), { type: "value", min: 40, max: 110, interval: 10, axisLine: { show: false } }),
    series: lines.map((l, i) => ({
      name: l.name, type: "line", data: lerp(l.end), symbol: "circle", symbolSize: 8, showSymbol: false,
      lineStyle: { width: 2, type: [6, 5], color: t[l.key] }, itemStyle: { color: t[l.key], borderColor: t.surface, borderWidth: 2 },
      endLabel: { show: true, formatter: () => `${l.end} in 2030`, color: t.ink2, fontWeight: 600, fontSize: 12 },
      markLine: i === 0 ? {
        symbol: "none", silent: true, lineStyle: { color: t.axis, width: 1, type: "solid" },
        label: { formatter: "Today", color: t.muted, fontSize: 11, position: "insideEndTop" },
        data: [{ xAxis: "2026" }]
      } : undefined,
      markPoint: { symbol: "circle", symbolSize: 9, itemStyle: { color: t[l.key], borderColor: t.surface, borderWidth: 2 }, label: { show: false }, data: [{ coord: ["2019", 100] }] }
    }))
  }), {
    table: () => ({
      cols: [{ key: "y", label: "Year" }].concat(lines.map((l, i) => ({ key: "l" + i, label: l.name, num: true }))),
      rows: years.map((y, j) => Object.assign({ y }, ...lines.map((l, i) => ({ ["l" + i]: lerp(l.end)[j] }))))
    })
  });

  /* ---- milestones & critiques ---- */
  document.getElementById("miles").innerHTML = D.climateMilestones.map((m) =>
    `<li><span class="y ${m.year <= 2025 ? "past" : ""}">${m.year}</span><p>${esc(m.text)}</p></li>`).join("");
  document.getElementById("crit").innerHTML = D.critiques.map((c) =>
    `<li><span class="y">${c.year || "Now"}</span><span>${esc(c.text)}</span></li>`).join("");

  App.refresh();
})();
