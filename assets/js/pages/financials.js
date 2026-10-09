/* Financials page */
(function () {
  const { D, chart, update, tooltip, ttRow, ttBox, axisCommon, badge } = App;
  const state = { range: "all", showEst: true };

  const inRange = (y) => state.range === "all" || y >= 2021;
  const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, "0");

  /* ---- annual sales (columns) ---- */
  const sales = chart("sales", (t) => {
    const rows = D.revenue.filter((r) => inRange(r.year));
    return {
      grid: { left: 8, right: 12, top: 30, bottom: 4, containLabel: true },
      tooltip: tooltip(t, {
        trigger: "item",
        formatter: (p) => {
          const r = rows[p.dataIndex];
          const v = r.value == null ? "Not disclosed" : `${r.status === "estimate" ? "≈ " : ""}€${r.value.toFixed(2)}bn`;
          return ttBox(String(r.year), ttRow(t.s1, v, r.status === "n/d" ? "" : r.status, true), r.note);
        }
      }),
      xAxis: Object.assign(axisCommon(t), { type: "category", data: rows.map((r) => String(r.year)), splitLine: { show: false } }),
      yAxis: Object.assign(axisCommon(t), { type: "value", min: 0, max: 3.5, interval: 0.5, axisLine: { show: false }, axisLabel: { color: t.muted, formatter: (v) => `€${v}bn` } }),
      series: [{
        type: "bar", barMaxWidth: 24,
        data: rows.map((r) => {
          const hide = r.status === "estimate" && !state.showEst;
          if (r.value == null || hide) {
            return { value: 0, itemStyle: { color: "transparent" }, label: { show: true, position: "insideBottom", offset: [0, -6], formatter: hide ? "est. hidden" : "n/d", color: t.muted, fontSize: 11 } };
          }
          const est = r.status === "estimate";
          return {
            value: r.value,
            itemStyle: { color: est ? alpha(t.s1, 0.35) : t.s1, borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: "top", formatter: `${est ? "≈ " : ""}€${r.value.toFixed(r.value % 0.5 ? 2 : 1)}bn`, color: t.ink, fontWeight: 600, fontSize: 12 }
          };
        }),
        emphasis: { itemStyle: { color: t.brand } }
      }]
    };
  }, {
    table: () => ({
      cols: [{ key: "y", label: "Year" }, { key: "v", label: "Sales", num: true }, { key: "s", label: "Status", html: true }, { key: "n", label: "How we know" }],
      rows: D.revenue.map((r) => ({ y: r.year, v: r.value == null ? "n/d" : `€${r.value.toFixed(2)}bn`, s: r.status === "n/d" ? "—" : badge(r.status), n: r.note }))
    })
  });

  /* ---- YoY growth ---- */
  const growth = chart("growth", (t) => {
    const rows = D.growth.filter((r) => inRange(r.year));
    return {
      grid: { left: 8, right: 12, top: 30, bottom: 4, containLabel: true },
      tooltip: tooltip(t, {
        trigger: "item",
        formatter: (p) => {
          const r = rows[p.dataIndex];
          return ttBox(String(r.year), ttRow(t.s1, r.value == null ? "Not disclosed" : `+${r.value}%`, r.status === "n/d" ? "" : r.status, true),
            r.status === "estimate" ? "Implied from 2024 sales ÷ 1.08 vs 2022's €2.5bn." : "");
        }
      }),
      xAxis: Object.assign(axisCommon(t), { type: "category", data: rows.map((r) => String(r.year)), splitLine: { show: false } }),
      yAxis: Object.assign(axisCommon(t), { type: "value", min: 0, max: 30, interval: 10, axisLine: { show: false }, axisLabel: { color: t.muted, formatter: "{value}%" } }),
      series: [{
        type: "bar", barMaxWidth: 24,
        data: rows.map((r) => {
          const hide = r.status === "estimate" && !state.showEst;
          if (r.value == null || hide) {
            return { value: 0, itemStyle: { color: "transparent" }, label: { show: true, position: "insideBottom", offset: [0, -6], formatter: hide ? "est." : "n/d", color: t.muted, fontSize: 11 } };
          }
          const est = r.status === "estimate";
          return {
            value: r.value,
            itemStyle: { color: est ? alpha(t.s1, 0.35) : t.s1, borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: "top", formatter: `${est ? "≈ " : ""}+${r.value}%`, color: t.ink, fontWeight: 600, fontSize: 12 }
          };
        })
      }]
    };
  }, {
    table: () => ({
      cols: [{ key: "y", label: "Year" }, { key: "v", label: "Growth", num: true }, { key: "s", label: "Status", html: true }],
      rows: D.growth.map((r) => ({ y: r.year, v: r.value == null ? "n/d" : `+${r.value}%`, s: r.status === "n/d" ? "—" : badge(r.status) }))
    })
  });

  /* ---- scenarios ---- */
  const T = D.target;
  const yrs = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const rates = [
    { name: "10% a year", r: 0.10, key: "s1" },
    { name: "7.5% a year", r: 0.075, key: "s3" },
    { name: "5% a year", r: 0.05, key: "s2" }
  ];
  const project = (r) => yrs.map((y) => +(T.base * Math.pow(1 + r, y - T.baseYear)).toFixed(2));
  const crosses = (r) => yrs.find((y) => T.base * Math.pow(1 + r, y - T.baseYear) >= T.value - 0.01);

  chart("scenarios", (t) => ({
    grid: { left: 8, right: 84, top: 36, bottom: 4, containLabel: true },
    legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 14, itemHeight: 3, textStyle: { color: t.ink2, fontSize: 12 }, data: rates.map((s) => s.name) },
    tooltip: tooltip(t, {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: t.axis } },
      formatter: (ps) => ttBox(ps[0].axisValue, ps.map((p) => ttRow(p.color, `€${p.value.toFixed(2)}bn`, p.seriesName)).join(""), "Illustrative compounding, not a forecast.")
    }),
    xAxis: Object.assign(axisCommon(t), { type: "category", boundaryGap: false, data: yrs.map(String), splitLine: { show: false } }),
    yAxis: Object.assign(axisCommon(t), { type: "value", min: 2.5, max: 6, interval: 0.5, axisLine: { show: false }, axisLabel: { color: t.muted, formatter: (v) => `€${v}bn` } }),
    series: rates.map((s, i) => ({
      name: s.name, type: "line", data: project(s.r), symbol: "circle", symbolSize: 8, showSymbol: false,
      lineStyle: { width: 2, color: t[s.key] }, itemStyle: { color: t[s.key], borderColor: t.surface, borderWidth: 2 },
      endLabel: { show: true, formatter: () => `${s.name.split(" ")[0]} a year\n€4bn in ${crosses(s.r)}`, color: t.ink2, fontSize: 11, fontWeight: 600, lineHeight: 15 },
      labelLayout: { moveOverlap: "shiftY" },
      markLine: i === 0 ? {
        symbol: "none", silent: true,
        lineStyle: { color: t.red, width: 1, type: "solid" },
        label: { formatter: "€4bn target", color: t.ink2, fontSize: 11, position: "insideStartTop" },
        data: [{ yAxis: T.value }]
      } : undefined
    }))
  }), {
    table: () => ({
      cols: [{ key: "y", label: "Year" }].concat(rates.map((s, i) => ({ key: "r" + i, label: s.name, num: true }))),
      rows: yrs.map((y, j) => Object.assign({ y }, ...rates.map((s, i) => ({ ["r" + i]: `€${project(s.r)[j].toFixed(2)}bn` }))))
    })
  });

  /* ---- filters ---- */
  document.querySelectorAll("[data-range]").forEach((b) => b.addEventListener("click", () => {
    state.range = b.dataset.range;
    document.querySelectorAll("[data-range]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    update(sales); update(growth);
  }));
  document.getElementById("showEst").addEventListener("change", (e) => {
    state.showEst = e.target.checked;
    update(sales); update(growth);
  });

  App.refresh();
})();
