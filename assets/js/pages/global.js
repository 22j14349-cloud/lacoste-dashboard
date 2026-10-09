/* Global presence page */
(function () {
  const { D, esc, chart, update, tooltip, ttRow, ttBox, axisCommon, badge } = App;
  const state = { mode: "share" };
  const BOUNDS = [[-170, 80], [190, -56]];
  const TYPE_KEY = { store: "s1", tournament: "s2", experience: "s3" };
  // approximate centres used to zoom onto a country from the list
  const CENTRES = {
    "United States": [[-98, 39], 2.6], "France": [[2.5, 46.6], 6], "Italy": [[12.6, 42.6], 5.5], "China": [[104, 35], 2.6],
    "United Kingdom": [[-2.5, 54.2], 5.5], "Japan": [[138, 37.5], 4.5], "Korea": [[127.8, 36.3], 7], "Spain": [[-3.7, 40.2], 5.5],
    "Germany": [[10.4, 51.1], 5.5], "Brazil": [[-52, -12], 2.6]
  };
  const shares = [...D.marketShare2011].sort((a, b) => b.value - a.value);
  const pieces = [...new Set(shares.map((s) => s.value))].sort((a, b) => a - b);

  const mapEntry = chart("map", (t) => {
    const base = {
      itemStyle: { areaColor: t.mapEmpty, borderColor: t.mapBorder, borderWidth: 0.6 },
      boundingCoords: BOUNDS, roam: true, scaleLimit: { min: 1, max: state.mode === "share" ? 14 : 320 }
    };
    if (state.mode === "share") {
      return {
        tooltip: tooltip(t, {
          trigger: "item",
          formatter: (p) => {
            const d = p.data;
            if (!d) return ttBox(p.name, `<div class="tt-r"><span>No published share</span></div>`);
            return ttBox(d.country, ttRow(p.color, `${d.value}%`, "of 2011 worldwide sales", true));
          }
        }),
        visualMap: {
          type: "piecewise", orient: "horizontal", left: 4, bottom: 4, itemWidth: 14, itemHeight: 10, itemGap: 8,
          pieces: pieces.map((v, i) => ({ value: v, label: `${v}%`, color: t.seq[i] })),
          textStyle: { color: t.ink2, fontSize: 12 }, outOfRange: { color: t.mapEmpty }, selectedMode: false
        },
        series: [Object.assign({
          type: "map", map: "world", name: "Share",
          emphasis: { label: { show: false }, itemStyle: { areaColor: t.ochre } },
          select: { disabled: true },
          data: shares.map((s) => ({ name: s.map, value: s.value, country: s.country }))
        }, base)]
      };
    }
    return {
      tooltip: tooltip(t, {
        trigger: "item",
        formatter: (p) => {
          const l = p.data && p.data.l;
          if (!l) return "";
          // Paris landmarks sit within a few km of each other: list them all
          const near = D.landmarks.filter((x) => x.city === l.city);
          const rows = [l].concat(near.filter((x) => x !== l))
            .map((x) => ttRow(t[TYPE_KEY[x.type]], x.name, x.year ? String(x.year) : "", true)).join("");
          return ttBox(near.length > 1 ? `${l.city} · ${near.length} landmarks` : l.city, rows);
        }
      }),
      legend: {
        left: 4, bottom: 4, icon: "circle", itemWidth: 10, itemHeight: 10,
        textStyle: { color: t.ink2, fontSize: 12 }, data: Object.values(D.landmarkTypes)
      },
      geo: Object.assign({ map: "world", silent: true, emphasis: { disabled: true } }, base),
      series: Object.keys(D.landmarkTypes).map((type) => ({
        type: "effectScatter", coordinateSystem: "geo", name: D.landmarkTypes[type],
        symbolSize: 11, showEffectOn: "render", rippleEffect: { scale: 3.2, brushType: "stroke", period: 3.5 },
        itemStyle: { color: t[TYPE_KEY[type]], borderColor: t.surface, borderWidth: 2 },
        emphasis: { scale: 1.6, label: { show: true, formatter: (p) => p.data.l.name, position: "right", color: t.ink, fontWeight: 600, fontSize: 12, backgroundColor: t.surface, padding: [4, 6], borderRadius: 6 } },
        data: D.landmarks.filter((l) => l.type === type).map((l) => ({ name: l.name, value: [l.lng, l.lat], l })),
        zlevel: 1
      }))
    };
  }, {
    table: () => state.mode === "share"
      ? { cols: [{ key: "c", label: "Country" }, { key: "v", label: "Share of 2011 sales", num: true }], rows: shares.map((s) => ({ c: s.country, v: `${s.value}%` })) }
      : { cols: [{ key: "n", label: "Landmark" }, { key: "c", label: "City" }, { key: "t", label: "Type" }, { key: "y", label: "Year", num: true }],
          rows: D.landmarks.map((l) => ({ n: l.name, c: l.city, t: D.landmarkTypes[l.type], y: l.year || "—" })) }
  });

  function zoomTo(center, zoom, name) {
    const inst = mapEntry && mapEntry.inst;
    if (!inst) return;
    if (state.mode === "share") {
      inst.setOption({ series: [{ center, zoom }] });
      inst.dispatchAction({ type: "downplay", seriesIndex: 0 });
      inst.dispatchAction({ type: "highlight", seriesIndex: 0, name });
      inst.dispatchAction({ type: "showTip", seriesIndex: 0, name });
    } else {
      inst.setOption({ geo: { center, zoom } });
      const si = Object.values(D.landmarkTypes).indexOf(name.typeLabel);
      inst.dispatchAction({ type: "showTip", seriesIndex: si, name: name.name });
    }
  }

  /* ---- side list ---- */
  function renderList() {
    const list = document.getElementById("list");
    const max = shares[0].value;
    if (state.mode === "share") {
      document.getElementById("listTitle").textContent = "Ranking";
      document.getElementById("listSub").textContent = "Click a country to zoom";
      list.innerHTML = shares.map((s, i) => `
        <li><button type="button" data-name="${esc(s.map)}">
          <span class="nm">${i + 1}. ${esc(s.country)}</span><span class="vl">${s.value}%</span>
          <span class="bar"><span style="width:${(s.value / max) * 100}%"></span></span>
        </button></li>`).join("");
    } else {
      document.getElementById("listTitle").textContent = "Landmarks";
      document.getElementById("listSub").textContent = "Click a place to fly there";
      list.innerHTML = Object.entries(D.landmarkTypes).map(([type, label]) => `
        <li class="group-h">${esc(label)}</li>` + D.landmarks.filter((l) => l.type === type).map((l) => `
        <li><button type="button" data-lm="${esc(l.name)}">
          <span class="nm"><i class="k" style="background:var(--${TYPE_KEY[type]})"></i>${esc(l.name)}</span><span class="vl small muted">${l.year || ""}</span>
          <span class="sb">${esc(l.city)}</span>
        </button></li>`).join("")).join("");
    }
  }
  document.getElementById("list").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.name) {
      const c = CENTRES[b.dataset.name];
      zoomTo(c[0], c[1], b.dataset.name);
    } else if (b.dataset.lm) {
      const l = D.landmarks.find((x) => x.name === b.dataset.lm);
      zoomTo([l.lng, l.lat], l.city === "Paris" ? 260 : 9, { name: l.name, typeLabel: D.landmarkTypes[l.type] });
    }
  });

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mode === mode)));
    const share = mode === "share";
    document.getElementById("mapTitle").textContent = share ? "Top markets by share of worldwide sales" : "Flagships, tournaments and experiences";
    document.getElementById("mapSub").textContent = share
      ? "2011 snapshot — the latest full country split published · drag to pan, scroll to zoom"
      : "Hover a pulse for details · drag to pan, scroll to zoom · Paris locations sit close together — use the list";
    const foot = document.getElementById("mapFoot");
    foot.dataset.src = share ? "s19" : "s27 s26 s3 s28 s2 s1";
    App.fillSources(foot.parentElement);
    renderList();
    const card = document.getElementById("map").closest(".card");
    if (card.classList.contains("show-table")) card.querySelector('.seg [data-v="table"]').click();
    update(mapEntry);
  }
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  document.getElementById("resetMap").addEventListener("click", () => update(mapEntry));
  renderList();

  /* ---- region growth ---- */
  const regions = [...D.regionGrowth2022].sort((a, b) => b.value - a.value);
  chart("regions", (t) => ({
    grid: { left: 8, right: 52, top: 8, bottom: 4, containLabel: true },
    tooltip: tooltip(t, { trigger: "item", formatter: (p) => ttBox(p.name, ttRow(t.s1, `+${p.value}%`, "growth in 2022", true)) }),
    xAxis: Object.assign(axisCommon(t), { type: "value", max: 70, axisLabel: { color: t.muted, formatter: "{value}%" }, axisLine: { show: false } }),
    yAxis: Object.assign(axisCommon(t), { type: "category", inverse: true, data: regions.map((r) => r.region), splitLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 13 } }),
    series: [{
      type: "bar", barMaxWidth: 22,
      data: regions.map((r, i) => ({ value: r.value, itemStyle: { color: t.s1, borderRadius: [0, 4, 4, 0], opacity: i === 0 ? 1 : 0.82 } })),
      label: { show: true, position: "right", formatter: "+{c}%", color: t.ink, fontWeight: 600 },
      emphasis: { itemStyle: { opacity: 1 } }
    }]
  }), {
    table: () => ({ cols: [{ key: "r", label: "Region" }, { key: "v", label: "Growth, 2022", num: true }], rows: regions.map((r) => ({ r: r.region, v: `+${r.value}%` })) })
  });

  /* ---- spotlight ---- */
  document.getElementById("spot").innerHTML = D.countrySpotlight.map((c) => `
    <div class="row">
      <span class="c">${esc(c.country)} ${badge(c.status)}</span><span class="f">${esc(c.figure)}</span>
      <span class="d">${esc(c.detail)}</span><span class="y">${esc(c.year)}</span>
    </div>`).join("");

  App.refresh();
})();
