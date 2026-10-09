/* Brand & sport page */
(function () {
  const { D, esc, chart, tooltip, ttRow, ttBox, axisCommon } = App;
  const CAT_KEY = { brand: "s1", sport: "s2", company: "s3" };
  const NOW = 2026.85;

  /* ---- timeline ---- */
  const tl = document.getElementById("timeline");
  tl.innerHTML = D.timeline.map((e) => `
    <li data-cat="${e.cat}" style="--dot:var(--${CAT_KEY[e.cat]})">
      <span class="yr">${e.year === 1950 ? "1950s" : e.year}</span><span class="tt">${esc(e.title)}</span><span class="cat">${esc(D.timelineCats[e.cat])}</span>
      <p>${esc(e.text)}</p>
    </li>`).join("");
  const count = document.getElementById("tlCount");
  const setCat = (cat) => {
    let n = 0;
    tl.querySelectorAll("li").forEach((li) => {
      const show = cat === "all" || li.dataset.cat === cat;
      li.classList.toggle("hidden", !show);
      if (show) n++;
    });
    count.textContent = `${n} milestone${n === 1 ? "" : "s"}`;
    document.querySelectorAll("#tlFilter [data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
  };
  document.getElementById("tlFilter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (b) setCat(b.dataset.cat);
  });
  setCat("all");

  /* ---- sponsorship longevity ---- */
  const sp = D.sponsorships.map((s) => ({ name: s.name, since: s.since, years: 2026 - s.since }));
  chart("sponsor", (t) => ({
    grid: { left: 8, right: 92, top: 4, bottom: 4, containLabel: true },
    tooltip: tooltip(t, { trigger: "item", formatter: (p) => ttBox(p.name, ttRow(t.s2, `${sp[p.dataIndex].years} years`, `since ${sp[p.dataIndex].since}`, true)) }),
    xAxis: { type: "value", show: false, max: 60 },
    yAxis: Object.assign(axisCommon(t), { type: "category", inverse: true, data: sp.map((s) => s.name), axisLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 13 } }),
    series: [{
      type: "bar", barMaxWidth: 20,
      data: sp.map((s) => ({ value: Math.max(s.years, 0.6), itemStyle: { color: t.s2, borderRadius: [0, 4, 4, 0] } })),
      label: { show: true, position: "right", color: t.ink, fontWeight: 600, fontSize: 12, formatter: (p) => `${sp[p.dataIndex].years} yrs · ${sp[p.dataIndex].since}` }
    }]
  }), {
    table: () => ({ cols: [{ key: "n", label: "Tournament" }, { key: "s", label: "Since", num: true }, { key: "y", label: "Years", num: true }], rows: sp.map((s) => ({ n: s.name, s: s.since, y: s.years })) })
  });

  /* ---- collaborations ---- */
  document.getElementById("collabs").innerHTML = D.collabs.map((c) => `<div class="collab"><b>${esc(c.name)}</b><span>${esc(c.years)}</span></div>`).join("");

  /* ---- ambassadors ---- */
  const fields = ["All"].concat([...new Set(D.ambassadors.map((a) => a.field))]);
  const af = document.getElementById("ambFilter");
  af.innerHTML = fields.map((f, i) => `<button class="pill" type="button" data-f="${esc(f)}" aria-pressed="${i === 0}">${esc(f)}${f === "All" ? "" : ` <span class="muted">${D.ambassadors.filter((a) => a.field === f).length}</span>`}</button>`).join("");
  const initials = (n) => n.replace(/\(.*\)/, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  document.getElementById("amb").innerHTML = [...D.ambassadors].sort((a, b) => a.since - b.since).map((a) => `
    <div class="amb" data-f="${esc(a.field)}">
      <span class="avatar" aria-hidden="true">${esc(initials(a.name))}</span>
      <div><div class="n">${esc(a.name)}</div><div class="m">${esc(a.field)} · since ${a.since}</div><div class="m">${esc(a.note)}</div></div>
    </div>`).join("");
  af.addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    af.querySelectorAll("[data-f]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    document.querySelectorAll("#amb .amb").forEach((el) => el.classList.toggle("hidden", b.dataset.f !== "All" && el.dataset.f !== b.dataset.f));
  });

  /* ---- leadership gantt ---- */
  const roles = ["Chief executive", "Creative direction"];
  const ROLE_KEY = { "Chief executive": "s1", "Creative direction": "s2" };
  const lum = (hex) => {
    const c = hex.replace("#", "").match(/.{2}/g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const textOn = (hex) => { const L = lum(hex); return (1.05) / (L + 0.05) >= (L + 0.05) / 0.05 ? "#ffffff" : "#0f1a14"; };
  const yearLabel = (v) => {
    if (v == null) return "present";
    const y = Math.floor(v), m = Math.round((v - y) * 12);
    return m ? `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}` : String(y);
  };
  const ten = D.tenures.map((x) => ({ ...x, endV: x.end == null ? NOW : x.end }));

  chart("tenure", (t) => ({
    grid: { left: 8, right: 16, top: 8, bottom: 4, containLabel: true },
    tooltip: tooltip(t, {
      trigger: "item",
      formatter: (p) => {
        const x = ten[p.dataIndex];
        return ttBox(x.role, ttRow(t[ROLE_KEY[x.role]], x.person, `${yearLabel(x.start)} – ${yearLabel(x.end)}`));
      }
    }),
    xAxis: Object.assign(axisCommon(t), { type: "value", min: 2000, max: 2027, interval: 5, axisLabel: { color: t.muted, formatter: (v) => String(v) } }),
    yAxis: Object.assign(axisCommon(t), {
      type: "category", data: roles, axisLine: { show: false }, splitLine: { show: false },
      axisLabel: { color: t.ink2, fontSize: 13, formatter: (v) => (document.getElementById("tenure").offsetWidth < 560 ? (v === "Chief executive" ? "CEO" : "Creative") : v) }
    }),
    series: [{
      type: "custom",
      encode: { x: [1, 2], y: 0 },
      data: ten.map((x) => [roles.indexOf(x.role), x.start, x.endV]),
      renderItem: (params, api) => {
        const x = ten[params.dataIndex];
        const color = t[ROLE_KEY[x.role]];
        const a = api.coord([api.value(1), api.value(0)]);
        const b = api.coord([api.value(2), api.value(0)]);
        const h = Math.min(api.size([0, 1])[1] * 0.56, 34);
        const cs = params.coordSys;
        const rect = echarts.graphic.clipRectByRect(
          { x: a[0], y: a[1] - h / 2, width: Math.max(b[0] - a[0] - 2, 2), height: h },
          { x: cs.x, y: cs.y, width: cs.width, height: cs.height });
        if (!rect) return null;
        const label = x.person.replace(" (again)", "");
        const fits = rect.width > label.length * 7 + 18;
        return {
          type: "group",
          children: [
            { type: "rect", shape: Object.assign({ r: 4 }, rect), style: { fill: color }, emphasis: { style: { opacity: 0.85 } } },
            fits ? { type: "text", style: { text: label, x: rect.x + 9, y: a[1], verticalAlign: "middle", fill: textOn(color), font: "600 12px Inter, system-ui, sans-serif" }, silent: true } : null
          ].filter(Boolean)
        };
      }
    }]
  }), {
    table: () => ({
      cols: [{ key: "r", label: "Role" }, { key: "p", label: "Person" }, { key: "f", label: "From" }, { key: "to", label: "To" }],
      rows: D.tenures.map((x) => ({ r: x.role, p: x.person, f: yearLabel(x.start), to: yearLabel(x.end) }))
    })
  });

  App.refresh();
})();
