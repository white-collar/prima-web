// Screen definitions: menu tree, table columns, example rows and the
// calculation each screen performs (see js/geodesy.js). Theory and formulas
// for the "?" popover are in js/help.js.
// compute(v) receives the parsed inputs — angles in radians, numbers as given —
// and returns the outputs: angles in radians, lengths in the column's unit.
window.PRIMA = window.PRIMA || {};

// Column helpers. kind: "angle" (D M S) or "number"; unit is an i18n key suffix.
const G = PRIMA.geo;
const ang = (sym, tip) => ({ sym, tip, kind: "angle", unit: "dms" });
const num = (sym, tip, unit, dec = 3) => ({ sym, tip, kind: "number", unit, dec });

PRIMA.SCREENS = {
  radii: {
    compute: v => { const [B] = v; return [G.N(B), G.M(B), G.R(B), G.parallelRadius(B)]; },
    inputs: [ang("B", "c.B")],
    outputs: [num("N", "c.N", "m"), num("M", "c.M", "m"), num("R", "c.R", "m"), num("rB", "c.rB", "m")],
    sample: [
      ["10 15 20"],
      ["35 0 0"],
      ["55 45 10.5"],
      ["72 30 0"],
    ],
  },
  ra: {
    compute: ([B, A]) => [G.RA(B, A)],
    inputs: [ang("B", "c.B"), ang("A", "c.A")],
    outputs: [num("RA", "c.RA", "m")],
    sample: [
      ["55 45 10.5", "30 0 0"],
      ["40 0 0", "135 20 0"],
      ["10 0 0", "90 0 0"],
    ],
  },
  meridian: {
    compute: ([B1, B2]) => [G.meridianArcProgram(B1, B2)],
    inputs: [ang("B1", "c.B1"), ang("B2", "c.B2")],
    outputs: [num("Sm", "c.Sm", "m")],
    sample: [
      ["50 0 0", "51 0 0"],
      ["10 0 0", "40 0 0"],
      ["55 45 10.5", "55 50 0"],
    ],
  },
  parallel: {
    compute: ([B, dL]) => [G.parallelArc(B, 0, dL)],
    inputs: [ang("B", "c.B"), ang("ΔL", "c.dL")],
    outputs: [num("Sп", "c.Sp", "m")],
    sample: [
      ["55 45 10.5", "1 0 0"],
      ["30 0 0", "6 0 0"],
      ["70 0 0", "0 30 0"],
    ],
  },
  frames: {
    compute: ([B1, B2, L1, L2, m]) => { const f = G.trapezoidFrame(B1, B2, L1, L2, m); return [f.side, f.north, f.south]; },
    inputs: [ang("B1", "c.B1"), ang("B2", "c.B2"), ang("L1", "c.L1"), ang("L2", "c.L2"), num("m", "c.m", "scale", 0)],
    outputs: [num("c", "c.c", "cm"), num("a2", "c.a2", "cm"), num("a1", "c.a1", "cm")],
    sample: [
      ["54 40 0", "55 0 0", "37 30 0", "38 0 0", "100000"],
      ["52 0 0", "52 20 0", "30 0 0", "30 30 0", "10000"],
    ],
  },
  area: {
    compute: ([B1, B2, L1, L2]) => [G.trapezoidArea(B1, B2, L1, L2)],
    inputs: [ang("B1", "c.B1"), ang("B2", "c.B2"), ang("L1", "c.L1"), ang("L2", "c.L2")],
    outputs: [num("P", "c.P", "km2", 2)],
    sample: [
      ["54 40 0", "55 0 0", "37 30 0", "38 0 0"],
      ["60 0 0", "64 0 0", "30 0 0", "36 0 0"],
    ],
  },
  schreiber: {
    compute: ([B1, L1, A12, S]) => { const r = G.directSchreiber(B1, L1, A12, S); return [r.B2, r.L2, r.A21]; },
    inputs: [ang("B1", "c.B1"), ang("L1", "c.L1"), ang("A12", "c.A12"), num("S12", "c.S12", "m")],
    outputs: [ang("B2", "c.B2"), ang("L2", "c.L2"), ang("A21", "c.A21")],
    sample: [
      ["55 45 10.5", "37 37 0", "45 0 0", "100000"],
      ["40 0 0", "20 0 0", "200 30 0", "30000"],
      ["60 0 0", "30 0 0", "300 0 0", "250000"],
    ],
  },
  rkm: {
    compute: ([B1, L1, A12, S]) => { const r = G.directRKM(B1, L1, A12, S, 1); return [r.B2, r.L2, r.A21]; },
    inputs: [ang("B1", "c.B1"), ang("L1", "c.L1"), ang("A12", "c.A12"), num("S12", "c.S12", "m")],
    outputs: [ang("B2", "c.B2"), ang("L2", "c.L2"), ang("A21", "c.A21")],
    sample: [
      ["55 45 10.5", "37 37 0", "45 0 0", "100000"],
      ["40 0 0", "20 0 0", "200 30 0", "30000"],
      ["60 0 0", "30 0 0", "300 0 0", "250000"],
    ],
  },
  inverse: {
    compute: ([B1, L1, B2, L2]) => { const r = G.inverse(B1, L1, B2, L2); return [r.S, r.A12, r.A21, r.Am]; },
    inputs: [ang("B1", "c.B1"), ang("L1", "c.L1"), ang("B2", "c.B2"), ang("L2", "c.L2")],
    outputs: [num("S12", "c.S12", "m"), ang("A12", "c.A12"), ang("A21", "c.A21"), ang("Am", "c.Am")],
    sample: [
      ["55 45 10.5", "37 37 0", "56 22 57.79", "38 45 40.787"],
      ["40 0 0", "20 0 0", "39 45 0", "19 50 0"],
      ["60 0 0", "30 0 0", "60 10 0", "29 40 0"],
    ],
  },
  xy2bl: {
    compute: ([X, Y, Y0, L0]) => { const r = G.planeToGeo(X, Y - Y0); return [r.B, r.l, L0 + r.l]; },
    inputs: [num("X", "c.X", "m"), num("Y", "c.Y", "m"), num("Y0", "c.Y0", "m"), ang("L0", "c.L0")],
    outputs: [ang("B", "c.B"), ang("l", "c.l"), ang("L", "c.L")],
    sample: [
      ["6181703.261", "413135.322", "500000", "39 0 0"],
      ["5540000", "650000", "500000", "33 0 0"],
    ],
  },
  bl2xy: {
    compute: ([B, L, L0]) => { const r = G.geoToPlane(B, L - L0); return [r.x, r.y]; },
    inputs: [ang("B", "c.B"), ang("L", "c.L"), ang("L0", "c.L0")],
    outputs: [num("X", "c.X", "m"), num("Y", "c.Y", "m")],
    sample: [
      ["55 45 10.5", "37 37 0", "39 0 0"],
      ["50 0 0", "31 30 0", "33 0 0"],
      ["45 0 0", "36 0 0", "33 0 0"],
    ],
  },
  gamma: {
    compute: ([B, L, L0]) => [G.convergence(B, L - L0)],
    inputs: [ang("B", "c.B"), ang("L", "c.L"), ang("L0", "c.L0")],
    outputs: [ang("γ", "c.gamma")],
    sample: [
      ["55 45 10.5", "37 37 0", "39 0 0"],
      ["50 0 0", "31 30 0", "33 0 0"],
      ["45 0 0", "36 0 0", "33 0 0"],
    ],
  },
  corr: {
    compute: ([x1, y1, x2, y2]) => { const r = G.reductionToPlane(x1 * 1e3, y1 * 1e3, x2 * 1e3, y2 * 1e3); return [r.delta12, r.delta21, r.ds]; },
    inputs: [num("x1", "c.x1", "km"), num("y1", "c.y1", "km"), num("x2", "c.x2", "km"), num("y2", "c.y2", "km")],
    outputs: [num("δ12", "c.d12", "sec"), num("δ21", "c.d21", "sec"), num("Δs", "c.ds", "m")],
    sample: [
      ["6000", "200", "6010", "200"],
      ["5500", "150", "5530", "180"],
      ["6300", "-120", "6290", "-100"],
    ],
  },
};

// Menu tree, mirroring the menus of the original program.
PRIMA.MENU = [
  { group: "g.ellipsoid", children: [
    { group: "g.radii", children: ["radii", "ra"] },
    { group: "g.arcs", children: ["meridian", "parallel"] },
    "frames",
    "area",
  ] },
  { group: "g.problems", children: ["schreiber", "rkm", "inverse"] },
  { group: "g.coords", children: ["xy2bl", "bl2xy", "gamma", "corr"] },
  "about",
];
