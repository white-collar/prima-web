// PRIMA web UI: tree menu, editable tables, language and theme switching.
// Results are computed live by js/geodesy.js; tables are saved in the browser.
(function () {
  "use strict";
  const t = PRIMA.t;
  const $ = (sel, root = document) => root.querySelector(sel);

  // ---------- Persistent preferences (localStorage may be unavailable) ----------
  const store = {
    get(k, def) { try { const v = localStorage.getItem("prima." + k); return v === null ? def : JSON.parse(v); } catch { return def; } },
    set(k, v) { try { localStorage.setItem("prima." + k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  const browserLang = (navigator.language || "en").slice(0, 2).toLowerCase();
  PRIMA.lang = store.get("lang", browserLang === "ua" ? "uk" : (PRIMA.LANGS.includes(browserLang) ? browserLang : "en"));
  let secDecimals = store.get("secDecimals", 3);
  const expanded = store.get("expanded", { "g.ellipsoid": true, "g.radii": true, "g.arcs": true, "g.problems": true, "g.coords": true });

  // Rows per screen: { inputs: [raw strings] }. Saved per screen in localStorage;
  // a screen that was never edited starts with its example rows.
  const tables = {};
  const examples = id => PRIMA.SCREENS[id].sample.map(inp => ({ inputs: inp.slice() }));
  for (const id of Object.keys(PRIMA.SCREENS)) {
    const saved = store.get("table." + id, null);
    tables[id] = Array.isArray(saved) ? saved.map(inputs => ({ inputs })) : examples(id);
  }
  const save = () => store.set("table." + current, tables[current].map(r => r.inputs));

  // ---------- Angle parsing and formatting ----------
  // Accepts "55 45 10.5", "55°45'10.5\"", "55:45:10.5", "-12 3 4" or decimal degrees "55.7529".
  function parseAngle(text) {
    const s = String(text).trim();
    if (!s) return null;
    const neg = s.startsWith("-");
    const parts = s.replace(/^[-+]/, "").replace(/[°º'′"″:,;]/g, " ").trim().split(/\s+/);
    if (parts.length > 3 || parts.some(p => !/^\d+(\.\d+)?$/.test(p))) return undefined;
    const [d, m = 0, sec = 0] = parts.map(Number);
    if (parts.length > 1 && (m >= 60 || sec >= 60)) return undefined;
    return (neg ? -1 : 1) * (d + m / 60 + sec / 3600);
  }
  function formatAngle(deg) {
    const neg = deg < 0;
    let x = Math.abs(deg);
    let d = Math.floor(x);
    let m = Math.floor((x - d) * 60);
    let s = ((x - d) * 60 - m) * 60;
    if (Number(s.toFixed(secDecimals)) >= 60) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    const ss = s.toFixed(secDecimals).padStart(secDecimals ? secDecimals + 3 : 2, "0");
    return `${neg ? "−" : ""}${d}°${String(m).padStart(2, "0")}′${ss}″`;
  }
  function parseNumber(text) {
    const s = String(text).trim().replace(",", ".").replace(/\s+/g, "");
    if (!s) return null;
    return /^[-+]?\d+(\.\d+)?$/.test(s) ? Number(s) : undefined;
  }
  const validate = (col, raw) => (col.kind === "angle" ? parseAngle(raw) : parseNumber(raw));
  function displayInput(col, raw) {
    const v = validate(col, raw);
    if (v === null || v === undefined) return raw;
    return col.kind === "angle" ? formatAngle(v) : raw.trim();
  }
  // Computes a row: returns display strings, or null if the inputs are incomplete.
  function computeRow(s, row) {
    const vals = s.inputs.map((c, i) => validate(c, row.inputs[i] || ""));
    if (vals.some(v => v == null)) return null;
    let out;
    try { out = s.compute(vals.map((v, i) => (s.inputs[i].kind === "angle" ? PRIMA.geo.deg2rad(v) : v))); }
    catch { return s.outputs.map(() => "—"); }
    return s.outputs.map((c, i) => displayOutput(c, out[i]));
  }
  function displayOutput(col, value) {
    if (value == null || !Number.isFinite(value)) return "—";
    if (col.kind === "angle") return formatAngle(PRIMA.geo.rad2deg(value));
    const txt = value.toFixed(col.dec);
    return Number(txt) === 0 ? (0).toFixed(col.dec) : txt.replace("-", "−");
  }

  // ---------- Elements ----------
  const app = $("#app"), tree = $("#tree"), view = $("#view");

  // ---------- Static text ----------
  function applyStaticI18n() {
    document.documentElement.lang = PRIMA.lang;
    document.title = t("app.title");
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      el.dataset.i18nAttr.split(";").forEach(pair => { const [attr, key] = pair.split(":"); el.setAttribute(attr, t(key)); });
    });
    document.querySelectorAll(".lang-switch button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === PRIMA.lang)));
  }

  // ---------- Tree menu ----------
  const chevron = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const parents = {}; // screen id -> [group keys]

  function buildTree() {
    tree.innerHTML = "";
    const render = (items, ul, prefix, path, depth) => {
      items.forEach((item, i) => {
        const numStr = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
        const li = document.createElement("li");
        li.setAttribute("role", "none");
        if (typeof item === "string") {
          parents[item] = path;
          li.className = "tree-leaf";
          const label = item === "about" ? t("g.about") : t("s." + item);
          const showNum = item !== "about";
          li.innerHTML = `<button class="tree-row${depth === 0 ? " top-level" : ""}" role="treeitem" data-screen="${item}">
            ${showNum ? `<span class="num">${numStr}</span>` : ""}<span class="lbl">${label}</span></button>`;
        } else {
          const open = !!expanded[item.group];
          li.className = "tree-group";
          li.innerHTML = `<button class="tree-row" role="treeitem" aria-expanded="${open}" data-group="${item.group}">
            ${chevron}<span class="num">${numStr}</span><span class="lbl">${t(item.group)}</span></button>`;
          const sub = document.createElement("ul");
          sub.setAttribute("role", "group");
          sub.hidden = !open;
          li.appendChild(sub);
          render(item.children, sub, numStr, path.concat(item.group), depth + 1);
        }
        ul.appendChild(li);
      });
    };
    render(PRIMA.MENU, tree, "", [], 0);
    markCurrent();
  }

  function markCurrent() {
    tree.querySelectorAll("[data-screen]").forEach(b => {
      if (b.dataset.screen === current) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  tree.addEventListener("click", e => {
    const row = e.target.closest(".tree-row");
    if (!row) return;
    if (row.dataset.group) {
      const open = row.getAttribute("aria-expanded") !== "true";
      row.setAttribute("aria-expanded", String(open));
      row.nextElementSibling.hidden = !open;
      expanded[row.dataset.group] = open;
      store.set("expanded", expanded);
    } else {
      location.hash = row.dataset.screen;
      closeNav();
    }
  });

  // ---------- Screens ----------
  let current = null;

  function route() {
    const id = location.hash.slice(1);
    current = (id in PRIMA.SCREENS || id === "about") ? id : "radii";
    // Make sure the active item is visible in the tree.
    (parents[current] || []).forEach(g => {
      if (!expanded[g]) { expanded[g] = true; }
    });
    buildTree();
    renderView();
    $("#main").scrollTop = 0;
  }

  function renderView() {
    if (current === "about") return renderAbout();
    const s = PRIMA.SCREENS[current];
    const crumbs = (parents[current] || []).map(t).join(" › ");
    const help = PRIMA.HELP[current];
    helpPinned = false;
    view.innerHTML = `
      <div class="crumbs">${crumbs}</div>
      <div class="screen-head">
        <h1>${t("s." + current + ".long")}<button type="button" class="help-btn" aria-expanded="false"
            aria-controls="helpPop" aria-label="${t("ui.help")}" title="${t("ui.help")}">?</button></h1>
        <div class="help-pop" id="helpPop" role="tooltip" hidden>
          <p>${help[PRIMA.lang] || help.en}</p>
          ${diagramHTML(current)}
          <div class="help-formula-title">${t("ui.formulas")}</div>
          <div class="help-formula">${help.formula.map(f => `<div>${f}</div>`).join("")}</div>
        </div>
      </div>
      <div class="toolbar">
        <button class="btn primary" data-act="add"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span class="lbl">${t("ui.addRow")}</span></button>
        <button class="btn" data-act="clear"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg><span class="lbl">${t("ui.clear")}</span></button>
        <button class="btn" data-act="examples"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h16M9 9v11"/></svg><span class="lbl">${t("ui.examples")}</span></button>
        <button class="btn" data-act="import"><svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg><span class="lbl">${t("ui.import")}</span></button>
        <button class="btn" data-act="export"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg><span class="lbl">${t("ui.export")}</span></button>
        <button class="btn" data-act="print"><svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z"/></svg><span class="lbl">${t("ui.print")}</span></button>
        <span class="spacer"></span>
        <label class="field-inline">${t("ui.secDecimals")}
          <select data-act="decimals">${[0, 1, 2, 3, 4].map(n => `<option value="${n}"${n === secDecimals ? " selected" : ""}>${n}</option>`).join("")}</select>
        </label>
        <input type="file" accept=".csv,text/csv" hidden data-act="file">
      </div>
      <div class="table-card">${tableHTML(s)}</div>
      <div class="table-foot">
        <span><kbd>Enter</kbd> ${t("ui.hintEnter")}</span>
        <span>${t("ui.hintAngle")}</span>
        <span><span class="legend-swatch" style="background:var(--result-bg);border:1px solid var(--border)"></span>${t("ui.legendResult")}</span>
      </div>`;
  }

  // Schematic figure for the popover, with its few words translated.
  function diagramHTML(id) {
    const svg = PRIMA.DIAGRAMS && PRIMA.DIAGRAMS[id];
    if (!svg) return "";
    const words = PRIMA.DIAGRAM_WORDS[PRIMA.lang] || PRIMA.DIAGRAM_WORDS.en;
    return `<div class="help-figure">${svg.replace(/\{(\w+)\}/g, (m, k) => words[k] ?? m)}</div>`;
  }

  // ---------- "?" help popover: opens on hover, stays open after a click ----------
  let helpPinned = false, helpTimer = null;
  const helpEls = () => [$(".help-btn", view), $("#helpPop", view)];
  function showHelp() {
    const [btn, pop] = helpEls();
    if (!btn) return;
    clearTimeout(helpTimer);
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
  }
  function hideHelp(force) {
    const [btn, pop] = helpEls();
    if (!btn || (helpPinned && !force)) return;
    helpPinned = false;
    pop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }
  const canHover = matchMedia("(hover: hover)").matches;
  view.addEventListener("mouseover", e => {
    if (canHover && e.target.closest(".help-btn, .help-pop")) showHelp();
  });
  view.addEventListener("mouseout", e => {
    if (!canHover || !e.target.closest(".help-btn, .help-pop")) return;
    if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".help-btn, .help-pop")) return;
    helpTimer = setTimeout(() => hideHelp(false), 200);
  });
  document.addEventListener("click", e => {
    if (e.target.closest(".help-btn")) {
      const open = helpPinned;
      helpPinned = !open;
      if (open) hideHelp(true); else showHelp();
    } else if (!e.target.closest(".help-pop")) {
      hideHelp(true);
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") hideHelp(true); });

  function unitLabel(col) { return t("unit." + col.unit); }

  function tableHTML(s) {
    const rows = tables[current];
    const head1 = `<tr>
        <th rowspan="2">${t("ui.no")}</th>
        <th class="grp" colspan="${s.inputs.length}">${t("ui.input")}</th>
        <th class="grp res" colspan="${s.outputs.length}">${t("ui.result")}</th>
        <th rowspan="2" aria-label="${t("ui.deleteRow")}"></th></tr>`;
    const th = (c, res) => `<th class="${res ? "res" : ""}" title="${t(c.tip)}"><span class="sym">${c.sym}</span><span class="unit">${unitLabel(c)}</span></th>`;
    const head2 = `<tr>${s.inputs.map(c => th(c, false)).join("")}${s.outputs.map(c => th(c, true)).join("")}</tr>`;

    const body = rows.concat([{ inputs: s.inputs.map(() => ""), blank: true }]).map((r, ri) => {
      const ins = s.inputs.map((c, ci) => {
        const raw = r.inputs[ci] || "";
        const bad = raw && validate(c, raw) === undefined;
        const ph = c.kind === "angle" ? "° ′ ″" : "0.000";
        return `<td class="in${c.kind === "angle" ? " angle" : ""}"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
          data-r="${ri}" data-c="${ci}" value="${escapeAttr(displayInput(c, raw))}" placeholder="${ri === rows.length ? ph : ""}"
          aria-label="${t(c.tip)} (${ri + 1})"${bad ? ' class="invalid"' : ""}></td>`;
      }).join("");
      const res = r.blank ? null : computeRow(s, r);
      const outs = s.outputs.map((c, ci) => {
        const v = res ? res[ci] : "—";
        return `<td class="out${v === "—" ? " empty" : ""}">${v}</td>`;
      }).join("");
      const del = r.blank ? "" : `<button class="row-del" data-del="${ri}" aria-label="${t("ui.deleteRow")} ${ri + 1}" title="${t("ui.deleteRow")}">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
      return `<tr><td class="n">${ri + 1}</td>${ins}${outs}<td class="act">${del}</td></tr>`;
    }).join("");
    return `<table class="grid"><thead>${head1}${head2}</thead><tbody>${body}</tbody></table>`;
  }

  function escapeAttr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

  function rerenderTable(focus) {
    const s = PRIMA.SCREENS[current];
    $(".table-card", view).innerHTML = tableHTML(s);
    if (focus) {
      const el = view.querySelector(`input[data-r="${focus.r}"][data-c="${focus.c}"]`);
      if (el) { el.focus(); el.select(); }
    }
  }

  // ---------- Table editing ----------
  view.addEventListener("focusin", e => {
    const inp = e.target.closest("td.in input");
    if (!inp) return;
    const r = +inp.dataset.r, c = +inp.dataset.c;
    const row = tables[current][r];
    if (row) inp.value = row.inputs[c] || ""; // show raw text while editing
    inp.select();
  });

  view.addEventListener("change", e => {
    const inp = e.target.closest("td.in input");
    if (inp) return commitCell(inp);
    if (e.target.matches('[data-act="decimals"]')) {
      secDecimals = +e.target.value; store.set("secDecimals", secDecimals); rerenderTable();
    }
    if (e.target.matches('[data-act="file"]')) importCsv(e.target.files[0]);
  });

  view.addEventListener("focusout", e => {
    const inp = e.target.closest("td.in input");
    if (!inp) return;
    const s = PRIMA.SCREENS[current];
    const col = s.inputs[+inp.dataset.c];
    inp.value = displayInput(col, inp.value);
  });

  function commitCell(inp) {
    const s = PRIMA.SCREENS[current];
    const r = +inp.dataset.r, c = +inp.dataset.c;
    const rows = tables[current];
    if (r === rows.length) {
      if (!inp.value.trim()) return;
      rows.push({ inputs: s.inputs.map(() => "") });
      inp.closest("tr").querySelector(".n").textContent = r + 1;
    }
    rows[r].inputs[c] = inp.value;
    save();
    const bad = inp.value.trim() && validate(s.inputs[c], inp.value) === undefined;
    inp.classList.toggle("invalid", !!bad);
    // Update the results of this row in place without re-rendering (keeps focus).
    const res = computeRow(s, rows[r]);
    inp.closest("tr").querySelectorAll("td.out").forEach((td, i) => {
      td.textContent = res ? res[i] : "—";
      td.classList.toggle("empty", !res || res[i] === "—");
    });
    if (r === rows.length - 1 && !view.querySelector(`input[data-r="${rows.length}"]`)) {
      const active = document.activeElement;
      const pos = active && active.dataset ? { r: +active.dataset.r, c: +active.dataset.c } : null;
      rerenderTable(pos && !isNaN(pos.r) ? pos : null);
    }
  }

  view.addEventListener("keydown", e => {
    const inp = e.target.closest("td.in input");
    if (!inp) return;
    const s = PRIMA.SCREENS[current];
    let r = +inp.dataset.r, c = +inp.dataset.c;
    const move = () => {
      inp.dispatchEvent(new Event("change", { bubbles: true }));
      const el = view.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
      if (el) el.focus();
    };
    if (e.key === "Enter") {
      e.preventDefault();
      if (c < s.inputs.length - 1) c++; else { c = 0; r++; }
      move();
    } else if (e.key === "ArrowDown") { e.preventDefault(); r++; move(); }
    else if (e.key === "ArrowUp" && r > 0) { e.preventDefault(); r--; move(); }
    else if (e.key === "Escape") { inp.value = (tables[current][r] || { inputs: [] }).inputs[c] || ""; inp.blur(); }
  });

  view.addEventListener("click", e => {
    const del = e.target.closest("[data-del]");
    if (del) { tables[current].splice(+del.dataset.del, 1); save(); rerenderTable(); return; }
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.tagName === "SELECT" || btn.tagName === "INPUT") return;
    const s = PRIMA.SCREENS[current];
    switch (btn.dataset.act) {
      case "add":
        tables[current].push({ inputs: s.inputs.map(() => "") });
        rerenderTable({ r: tables[current].length - 1, c: 0 });
        break;
      case "clear":
        if (confirm(t("ui.confirmClear"))) { tables[current] = []; save(); rerenderTable({ r: 0, c: 0 }); }
        break;
      case "examples":
        tables[current] = tables[current].concat(examples(current)); save(); rerenderTable();
        break;
      case "import": $('[data-act="file"]', view).click(); break;
      case "export": exportCsv(); break;
      case "print": window.print(); break;
    }
  });

  // ---------- CSV ----------
  function exportCsv() {
    const s = PRIMA.SCREENS[current];
    const head = s.inputs.concat(s.outputs).map(c => `${c.sym} (${unitLabel(c)})`);
    const lines = [head].concat(tables[current].map(r =>
      s.inputs.map((c, i) => displayInput(c, r.inputs[i] || "")).concat(
        (computeRow(s, r) || s.outputs.map(() => "")).map(v => (v === "—" ? "" : v)))));
    const csv = lines.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `prima-${current}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importCsv(file) {
    if (!file) return;
    const s = PRIMA.SCREENS[current];
    file.text().then(text => {
      const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
      const sep = lines[0] && lines[0].includes(";") ? ";" : ",";
      const rows = lines.map(l => l.split(sep).map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"').trim()));
      const data = rows.filter(r => r.slice(0, s.inputs.length).every((v, i) => validate(s.inputs[i], v) != null));
      data.forEach(r => tables[current].push({ inputs: r.slice(0, s.inputs.length) }));
      save();
      rerenderTable();
    });
  }

  // ---------- About ----------
  function renderAbout() {
    const g = t("about.group");
    view.innerHTML = `
      <div class="about">
        <h1>${t("s.about")}</h1>
        <p>${t("about.intro")}</p>
        <h2>${t("about.authors")}</h2>
        <table class="credits">
          <thead><tr><th>${t("about.role")}</th><th>${t("about.person")}</th></tr></thead>
          <tbody>
            <tr><td>${t("about.r1")}</td><td><strong>Бартенева А.В.</strong>, ${g} ПГ-90</td></tr>
            <tr><td>${t("about.r2")}</td><td><strong>Воронова В.И.</strong>, ${g} ПГ-88</td></tr>
            <tr><td>${t("about.r2")}</td><td><strong>Котолуп Т.Ф.</strong>, ${g} ПГ-88</td></tr>
            <tr><td>${t("about.r3")}</td><td><strong>Гавриленко Ю.Н.</strong>, ${t("about.sup")}</td></tr>
          </tbody>
        </table>
        <h2>${t("about.constants")}</h2>
        <div class="const-list">
          a = 6 378 245 m<br>b = 6 356 863.0188 m<br>c = a²/b = 6 399 698.9018 m<br>
          e² = 0.0066934216<br>e′² = 0.0067385254
        </div>
        <h2>${t("about.source")}</h2>
        <p><a href="https://github.com/white-collar/prima-web" target="_blank" rel="noopener">github.com/white-collar/prima-web</a> · <a href="https://github.com/white-collar/prima-go" target="_blank" rel="noopener">github.com/white-collar/prima-go</a></p>
      </div>`;
  }

  // ---------- Language, theme, navigation ----------
  document.querySelector(".lang-switch").addEventListener("click", e => {
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    PRIMA.lang = b.dataset.lang;
    store.set("lang", PRIMA.lang);
    applyStaticI18n();
    buildTree();
    renderView();
  });

  const root = document.documentElement;
  const savedTheme = store.get("theme", null);
  if (savedTheme) root.dataset.theme = savedTheme;
  $("#themeToggle").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    store.set("theme", root.dataset.theme);
  });

  const scrim = $("#scrim"), toggle = $("#menuToggle");
  function openNav() { app.classList.add("nav-open"); scrim.hidden = false; toggle.setAttribute("aria-expanded", "true"); }
  function closeNav() { app.classList.remove("nav-open"); scrim.hidden = true; toggle.setAttribute("aria-expanded", "false"); }
  toggle.addEventListener("click", () => (app.classList.contains("nav-open") ? closeNav() : openNav()));
  scrim.addEventListener("click", closeNav);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav(); });

  window.addEventListener("hashchange", route);
  applyStaticI18n();
  route();
})();
