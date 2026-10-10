// Desktop app (Tauri) integration. In a normal browser this file does nothing.
//
// Inside the app window some browser features are unavailable, so the page
// uses small native commands instead (see src-tauri/src/lib.rs):
//   - printing            → print_page
//   - downloading the CSV → save_to_downloads (saved to the Downloads folder)
//   - links to other sites → open_external (opened in the default browser)
window.PRIMA = window.PRIMA || {};

(function () {
  "use strict";
  const core = window.__TAURI__ && window.__TAURI__.core;

  PRIMA.desktop = {
    active: !!core,
    print: () => core.invoke("print_page"),
    save: (fileName, contents) => core.invoke("save_to_downloads", { fileName, contents }),
    openExternal: url => core.invoke("open_external", { url }),
  };
  if (!core) return;

  document.documentElement.classList.add("is-desktop");

  // Links to other sites open in the default browser instead of the app window.
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || !/^https?:\/\//.test(a.getAttribute("href"))) return;
    e.preventDefault();
    PRIMA.desktop.openExternal(a.href).catch(err => console.error(err));
  });

  // ---------- Smoke test (PRIMA_SELF_TEST=1): checks the page and exits ----------
  core.invoke("self_test_enabled").then(enabled => {
    if (!enabled) return;
    const results = [];
    const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    (async () => {
      try {
        await wait(300);
        check("engine loaded", PRIMA.geo && typeof PRIMA.geo.directSchreiber === "function");
        const r = PRIMA.geo.directSchreiber(PRIMA.geo.deg2rad(55 + 45 / 60 + 10.5 / 3600), PRIMA.geo.deg2rad(37 + 37 / 60), PRIMA.geo.deg2rad(45), 100000);
        const sec = PRIMA.geo.rad2deg(r.B2) * 3600;
        check("Schreiber result matches PRIMA.EXE", Math.abs(sec - 202977.79) < 0.0005, sec.toFixed(4));
        for (const id of Object.keys(PRIMA.SCREENS)) {
          location.hash = id;
          await wait(40);
          const outs = [...document.querySelectorAll(".grid tbody td.out")].map(td => td.textContent);
          check(`screen ${id} renders`, document.querySelector(".grid") && outs.length > 0, `${outs.length} cells`);
        }
        location.hash = "home";
        await wait(40);
        check("title page", document.querySelector(".title-name"));
        localStorage.setItem("prima.selftest", "1");
        check("storage", localStorage.getItem("prima.selftest") === "1");
        localStorage.removeItem("prima.selftest");
      } catch (err) {
        check("no exceptions", false, String(err));
      }
      const failed = results.filter(x => !x.ok);
      const report = failed.length
        ? failed.map(x => `${x.name} (${x.detail})`).join("; ")
        : `${results.length} checks`;
      core.invoke("self_test_done", { ok: failed.length === 0, report });
    })();
  });
})();
