/* ImpactHub Job Dashboard — rendering & interaction */
(function () {
  "use strict";

  const $ = (sel, el) => (el || document).querySelector(sel);
  const catColor = (key) => `var(--cat-${key})`;

  /* ---------- expand each application's matched traits ---------- */
  const apps = APPLICATIONS.map((a, i) => {
    const seen = new Set();
    const matched = [];
    (a.sets || []).forEach((k) =>
      (SKILL_SETS[k] || []).forEach((t) => {
        if (!seen.has(t)) { seen.add(t); matched.push(t); }
      })
    );
    (a.traits || []).forEach((t) => {
      if (!seen.has(t)) { seen.add(t); matched.push(t); }
    });
    return { ...a, id: i, matched };
  }).sort((x, y) => y.date.localeCompare(x.date));

  /* ---------- header ---------- */
  $("#asOf").textContent = AS_OF;

  /* ---------- theme toggle ---------- */
  const root = document.documentElement;
  $("#themeToggle").addEventListener("click", () => {
    const dark = root.dataset.theme === "dark" ||
      (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = dark ? "light" : "dark";
  });

  /* ---------- stat tiles ---------- */
  const count = (fn) => apps.filter(fn).length;
  const offers = count((a) => a.status === "offer");
  const interviews = count((a) => a.status === "interview" || a.status === "offer");
  const actions = count((a) => a.status === "action" || a.status === "assessment");
  const tiles = [
    { v: apps.length, l: "Applications tracked", d: "Mar 1 – Jul 17, 2026" },
    { v: interviews, l: "Reached interview stage", d: `${Math.round((interviews / apps.length) * 100)}% of applications` },
    { v: offers, l: "Offers accepted", d: "Cook — FLIK / Compass Group", win: true },
    { v: actions, l: "Need your action", d: "Assessments & incomplete steps" },
    { v: Object.keys(CATEGORIES).length, l: "Career tracks in play", d: "AI/software is the growth track" }
  ];
  $("#tiles").innerHTML = tiles.map((t) =>
    `<div class="tile${t.win ? " win" : ""}"><div class="v">${t.v}</div><div class="l">${t.l}</div><div class="d">${t.d}</div></div>`
  ).join("");

  /* ---------- tooltip ---------- */
  const tip = $("#tip");
  function showTip(evt, title, sub) {
    tip.innerHTML = `<div class="t-title">${title}</div><div class="t-sub">${sub}</div>`;
    tip.style.display = "block";
    moveTip(evt);
  }
  function moveTip(evt) {
    const pad = 14;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    const r = tip.getBoundingClientRect();
    if (x + r.width > innerWidth - 8) x = evt.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = evt.clientY - r.height - pad;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => (tip.style.display = "none");

  /* ---------- chart: applications by category ---------- */
  const byCat = Object.keys(CATEGORIES).map((key) => ({
    key, label: CATEGORIES[key].label, n: count((a) => a.category === key)
  })).sort((a, b) => b.n - a.n);
  const maxCat = Math.max(...byCat.map((c) => c.n));
  $("#catChart").innerHTML = byCat.map((c) => `
    <div class="hbar-row" data-key="${c.key}">
      <div class="lbl">${c.label}</div>
      <div class="hbar-track"><div class="hbar" style="width:${(c.n / maxCat) * 100}%;background:${catColor(c.key)}"></div></div>
      <div class="val">${c.n}</div>
    </div>`).join("");
  byCat.forEach((c) => {
    const row = $(`#catChart .hbar-row[data-key="${c.key}"]`);
    const iv = apps.filter((a) => a.category === c.key && (a.status === "interview" || a.status === "offer")).length;
    row.addEventListener("mousemove", (e) => showTip(e, c.label, `${c.n} applications · ${iv} reached interview/offer`));
    row.addEventListener("mouseleave", hideTip);
  });

  /* ---------- chart: applications per month ---------- */
  const MONTHS = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
  const MLABEL = { "2026-03": "Mar", "2026-04": "Apr", "2026-05": "May", "2026-06": "Jun", "2026-07": "Jul" };
  const byMonth = MONTHS.map((m) => ({ m, n: count((a) => a.date.startsWith(m)) }));
  const maxM = Math.max(...byMonth.map((x) => x.n));
  $("#monthChart").innerHTML =
    `<div class="vbars">` + byMonth.map((x) =>
      `<div class="vbar-col" data-m="${x.m}"><div class="vbar-num">${x.n}</div><div class="vbar" style="height:${(x.n / maxM) * 100}%"></div></div>`
    ).join("") + `</div><div class="vbar-labels">` +
    byMonth.map((x) => `<span>${MLABEL[x.m]}</span>`).join("") + `</div>`;
  byMonth.forEach((x) => {
    const col = $(`#monthChart .vbar-col[data-m="${x.m}"]`);
    col.addEventListener("mousemove", (e) => showTip(e, `${MLABEL[x.m]} 2026`, `${x.n} applications submitted`));
    col.addEventListener("mouseleave", hideTip);
  });

  /* ---------- skills profile ---------- */
  const GROUP_META = [
    { name: "AI & Development", cat: "ai", sets: ["AI_CORE", "DEV", "CLOUD_OPS", "DATA_AI"] },
    { name: "Culinary & Food Safety", cat: "culinary", sets: ["COOKING", "FOOD_SAFETY", "KITCHEN_LEAD", "CULINARY_EXP"] },
    { name: "Teaching & Coaching", cat: "education", sets: ["TEACHING", "MARTIAL_ARTS"] },
    { name: "Customer Service", cat: "service", sets: ["CUSTOMER"] },
    { name: "Security & Facilities", cat: "facilities", sets: ["SECURITY", "LABOR"] },
    { name: "Core Strengths", cat: "civic", sets: ["CORE"] }
  ];
  const LIMIT = 12;
  $("#skillGroups").innerHTML = GROUP_META.map((g, gi) => {
    const all = [...new Set(g.sets.flatMap((s) => SKILL_SETS[s]))];
    const head = all.slice(0, LIMIT), rest = all.length - head.length;
    return `<div class="skill-group">
      <div class="sg-name"><span class="swatch" style="background:${catColor(g.cat)}"></span>${g.name} <span style="color:var(--muted);font-weight:400">(${all.length})</span></div>
      <div class="chips" data-gi="${gi}">
        ${head.map((t) => `<span class="chip">${t}</span>`).join("")}
        ${rest > 0 ? `<span class="chip more" data-rest='${JSON.stringify(all.slice(LIMIT)).replace(/'/g, "&#39;")}'>+${rest} more</span>` : ""}
      </div></div>`;
  }).join("");
  $("#skillGroups").addEventListener("click", (e) => {
    const m = e.target.closest(".chip.more");
    if (!m) return;
    const rest = JSON.parse(m.dataset.rest);
    m.outerHTML = rest.map((t) => `<span class="chip">${t}</span>`).join("");
  });
  $("#certChips").innerHTML = PROFILE.certifications.map((c) => `<span class="chip cert">${c}</span>`).join("");
  $("#expLines").innerHTML = PROFILE.workHistory.map((w) =>
    `<div class="exp-line"><strong>${w.role}</strong> — ${w.org} <span class="when">· ${w.when}</span></div>`).join("");
  $("#prefLine").textContent =
    `Preferred titles: ${PROFILE.preferredTitles.join(", ")} · ${PROFILE.minSalary} · ${PROFILE.location}`;

  /* ---------- top matched traits ---------- */
  const traitCount = new Map();
  apps.forEach((a) => a.matched.forEach((t) => traitCount.set(t, (traitCount.get(t) || 0) + 1)));
  const topTraits = [...traitCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxT = topTraits[0][1];
  $("#topTraits").innerHTML = topTraits.map(([t, n]) => `
    <div class="hbar-row">
      <div class="lbl" title="${t}">${t}</div>
      <div class="hbar-track"><div class="hbar" style="width:${(n / maxT) * 100}%;background:var(--cat-ai)"></div></div>
      <div class="val">${n}</div>
    </div>`).join("");

  /* ---------- interview timeline (calendar-verified) ---------- */
  $("#interviewList").innerHTML = [...INTERVIEWS].reverse().map((iv) => `
    <div class="exp-line">
      <span class="when" style="font-variant-numeric:tabular-nums">${iv.date} · ${iv.time}</span> —
      <strong>${iv.company}</strong>: ${iv.title}
      <span class="when">(${iv.where})</span>
      ${iv.outcome ? `<span style="color:var(--good-text);font-weight:600"> · ${iv.outcome}</span>` : ""}
    </div>`).join("");

  /* ---------- filters + application cards ---------- */
  const state = { cat: "all", status: "all", q: "" };

  const catBtns = `<button class="fbtn on" data-cat="all">All</button>` +
    Object.entries(CATEGORIES).map(([k, c]) =>
      `<button class="fbtn" data-cat="${k}"><span class="swatch" style="background:${catColor(k)}"></span>${c.label}</button>`).join("");
  const statusBtns = `<button class="fbtn on" data-status="all">Any status</button>` +
    Object.entries(STATUSES).sort((a, b) => b[1].rank - a[1].rank).map(([k, s]) =>
      `<button class="fbtn" data-status="${k}">${s.label}</button>`).join("");
  $("#catFilters").innerHTML = catBtns;
  $("#statusFilters").innerHTML = statusBtns;

  function bindFilterRow(rowSel, attr) {
    $(rowSel).addEventListener("click", (e) => {
      const b = e.target.closest(".fbtn");
      if (!b) return;
      $(rowSel).querySelectorAll(".fbtn").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      state[attr] = b.dataset[attr];
      renderApps();
    });
  }
  bindFilterRow("#catFilters", "cat");
  bindFilterRow("#statusFilters", "status");
  $("#search").addEventListener("input", (e) => { state.q = e.target.value.toLowerCase(); renderApps(); });

  const fmtDate = (d) => {
    const [y, m, day] = d.split("-");
    return `${MLABEL[y + "-" + m] || m}/${+day}`;
  };

  function renderApps() {
    const rows = apps.filter((a) => {
      if (state.cat !== "all" && a.category !== state.cat) return false;
      if (state.status !== "all" && a.status !== state.status) return false;
      if (state.q) {
        const hay = `${a.role} ${a.company} ${a.matched.join(" ")}`.toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
    $("#appCount").textContent = `${rows.length} of ${apps.length} applications`;
    $("#appList").innerHTML = rows.map((a) => {
      const cert = a.certs || [], exp = a.exp || [];
      const nQual = a.matched.length + cert.length + exp.length;
      return `<div class="card app-card" style="border-left-color:${catColor(a.category)}" data-id="${a.id}">
        <div class="app-head">
          <span class="role">${a.role}</span>
          <span class="co">${a.company}</span>
          <span class="meta">
            <span class="badge ${a.status}">${STATUSES[a.status].label}</span>
            <span class="match-count">${nQual} qualifying traits</span>
            <span>${fmtDate(a.date)}</span>
          </span>
        </div>
        <div class="app-body">
          ${a.note ? `<div class="block note">${a.note}</div>` : ""}
          <div class="block">
            <h4>Your exact qualifying traits (from your Indeed skills, as of ${AS_OF})</h4>
            <div class="chips">${a.matched.map((t) => `<span class="chip">${t}</span>`).join("")}</div>
          </div>
          ${cert.length ? `<div class="block"><h4>Certifications you hold that this role asks for</h4>
            <div class="chips">${cert.map((c) => `<span class="chip cert">${c}</span>`).join("")}</div></div>` : ""}
          ${exp.length ? `<div class="block"><h4>Directly relevant experience</h4>
            ${exp.map((x) => `<div class="exp-line">${x}</div>`).join("")}</div>` : ""}
          ${a.gap ? `<div class="block gap-note"><strong>Stretch area:</strong> ${a.gap}</div>` : ""}
          <div class="src">Source: ${a.source} · Applied ${a.date}</div>
        </div>
      </div>`;
    }).join("") || `<p class="note">No applications match these filters.</p>`;
  }
  $("#appList").addEventListener("click", (e) => {
    const card = e.target.closest(".app-card");
    if (card && !e.target.closest("a")) card.classList.toggle("open");
  });
  renderApps();
})();
