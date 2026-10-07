// Tests for js/geodesy.js. Run with:  node --test tests/
//
// 1. golden-go.json         — reference results from the Go port (prima-go),
//                             must match to near machine precision.
// 2. original-prima-exe.json — results displayed by the original PRIMA.EXE,
//                             must match within its display rounding.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const g = require("../js/geodesy.js");

const load = f => require(path.join(__dirname, f));
const SEC = Math.PI / 180 / 3600;
const dms = ([d, m, s]) => g.deg2rad(d + m / 60 + s / 3600);

// ---------- 1. Against the Go port ----------
const FNS = {
  radii: ([B]) => [g.N(B), g.M(B), g.R(B), g.parallelRadius(B), g.V(B), g.W(B)],
  RA: ([B, A]) => [g.RA(B, A)],
  meridianArcProgram: ([B1, B2]) => [g.meridianArcProgram(B1, B2)],
  meridianArc: ([B]) => [g.meridianArc(B)],
  parallelArc: ([B, L1, L2]) => [g.parallelArc(B, L1, L2)],
  trapezoidArea: a => [g.trapezoidArea(...a)],
  trapezoidFrame: a => { const f = g.trapezoidFrame(...a); return [f.side, f.north, f.south]; },
  directSchreiber: a => { const r = g.directSchreiber(...a); return [r.B2, r.L2, r.A21]; },
  directRKM: a => { const r = g.directRKM(...a); return [r.B2, r.L2, r.A21]; },
  inverse: a => { const r = g.inverse(...a); return [r.S, r.A12, r.A21, r.Am]; },
  geoToPlane: ([B, l]) => { const r = g.geoToPlane(B, l); return [r.x, r.y]; },
  planeToGeo: ([x, y]) => { const r = g.planeToGeo(x, y); return [r.B, r.l]; },
  convergence: ([B, l]) => [g.convergence(B, l)],
  reductionToPlane: a => { const r = g.reductionToPlane(...a); return [r.delta12, r.delta21, r.ds]; },
};

test("matches the Go port (golden-go.json)", async t => {
  const cases = load("golden-go.json");
  for (const fn of Object.keys(FNS)) {
    await t.test(fn, () => {
      const rows = cases.filter(c => c.fn === fn);
      assert.ok(rows.length > 0, "no golden cases for " + fn);
      for (const c of rows) {
        const got = FNS[fn](c.in);
        c.out.forEach((want, i) => {
          const tol = 1e-11 * Math.max(1, Math.abs(want));
          assert.ok(Math.abs(got[i] - want) <= tol,
            `${fn}(${c.in}) output ${i}: got ${got[i]}, want ${want}`);
        });
      }
    });
  }
});

// ---------- 2. Against the original PRIMA.EXE ----------
const SCREENS = {
  radii: ([B]) => [g.N(dms(B)), g.M(dms(B)), g.R(dms(B)), g.parallelRadius(dms(B))],
  RA: ([B, A]) => [g.RA(dms(B), dms(A))],
  merid: ([B1, B2]) => [g.meridianArcProgram(dms(B1), dms(B2))],
  paral: ([B, dL]) => [g.parallelArc(dms(B), 0, dms(dL))],
  frames: ([B1, L1, m, B2, L2]) => { const f = g.trapezoidFrame(dms(B1), dms(B2), dms(L1), dms(L2), m); return [f.side, f.north, f.south]; },
  area: ([B1, B2, L1, L2]) => [g.trapezoidArea(dms(B1), dms(B2), dms(L1), dms(L2))],
  schreib: ([B1, L1, A, S]) => { const r = g.directSchreiber(dms(B1), dms(L1), dms(A), S); return [r.B2 / SEC, r.L2 / SEC, r.A21 / SEC]; },
  rkm: ([B1, L1, A, S]) => { const r = g.directRKM(dms(B1), dms(L1), dms(A), S); return [r.B2 / SEC, r.L2 / SEC, r.A21 / SEC]; },
  // The original screen takes B1, B2, L1, L2 and shows A12, A21, Am, S.
  inverse: ([B1, B2, L1, L2]) => { const r = g.inverse(dms(B1), dms(L1), dms(B2), dms(L2)); return [r.A12 / SEC, r.A21 / SEC, r.Am / SEC, r.S]; },
  // The original passes |Y − Y0|, so l is always positive there.
  xy2bl: ([X, Y, Y0]) => { const r = g.planeToGeo(X, Math.abs(Y - Y0)); return [r.B / SEC, r.l / SEC]; },
  bl2xy: ([B, L, L0]) => { const r = g.geoToPlane(dms(B), dms(L) - dms(L0)); return [r.x, r.y]; },
  gamma: ([B, L, L0]) => [g.convergence(dms(B), dms(L) - dms(L0)) / SEC],
  corr: ([x1, y1, x2, y2]) => { const r = g.reductionToPlane(x1 * 1e3, y1 * 1e3, x2 * 1e3, y2 * 1e3); return [r.delta12, r.delta21, r.ds]; },
};

test("matches the original PRIMA.EXE within display rounding", async t => {
  const { rows } = load("original-prima-exe.json");
  for (const screen of Object.keys(SCREENS)) {
    await t.test(screen, () => {
      const mine = rows.filter(r => r.screen === screen);
      assert.ok(mine.length > 0);
      for (const r of mine) {
        const got = SCREENS[screen](r.inputs);
        r.expected.forEach((want, i) => {
          assert.ok(Math.abs(got[i] - want) <= r.tolerance + 1e-9,
            `${screen} ${JSON.stringify(r.inputs)} output ${i}: got ${got[i]}, original shows ${want}`);
        });
      }
    });
  }
});

// ---------- 3. Sanity checks ----------
test("known values of the Krasovsky ellipsoid", () => {
  assert.ok(Math.abs(g.meridianArc(Math.PI / 2) - 10002137.5) < 0.1, "quarter meridian");
  const area = 2 * g.trapezoidArea(0, Math.PI / 2, 0, 2 * Math.PI);
  assert.ok(Math.abs(area - 510083000) < 1000, "ellipsoid surface");
});
