/* Sources page */
(function () {
  const { D, esc } = App;
  const entries = Object.entries(D.sources);
  document.getElementById("asof").textContent = D.asOf;

  // how many times each source is cited in data.js
  const uses = {};
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => ((k === "src" || /Src$/.test(k)) && Array.isArray(x) ? x.forEach((id) => (uses[id] = (uses[id] || 0) + 1)) : walk(x)));
  };
  walk(D);

  const table = document.getElementById("srcTable");
  function render(q) {
    const rows = entries.filter(([id, s]) => !q || `${id} ${s.pub} ${s.title} ${s.date}`.toLowerCase().includes(q));
    table.innerHTML = `<thead><tr><th>#</th><th>Source</th><th>Date</th><th class="num">Cited</th></tr></thead>
      <tbody>${rows.map(([id, s]) => `
        <tr id="${id}">
          <td>${id.slice(1)}</td>
          <td><b>${esc(s.pub)}</b><br><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></td>
          <td>${esc(s.date)}</td>
          <td class="num">${uses[id] || "—"}</td>
        </tr>`).join("")}</tbody>`;
    document.getElementById("srcCount").textContent = `${rows.length} of ${entries.length} sources`;
  }
  render("");
  document.getElementById("q").addEventListener("input", (e) => render(e.target.value.trim().toLowerCase()));

  // jump to an anchored source after the shell has been built
  if (location.hash) {
    const row = document.getElementById(location.hash.slice(1));
    if (row) setTimeout(() => row.scrollIntoView({ block: "center" }), 300);
  }

  App.refresh();
})();
