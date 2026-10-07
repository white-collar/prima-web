// Spheroidal geodesy on the Krasovsky 1940 ellipsoid.
//
// A line-by-line JavaScript port of the Go package
// github.com/white-collar/prima-go/geodesy, which in turn reproduces the
// formulas of the DOS program PRIMA.EXE ("Решение задач сфероидической
// геодезии"). Comments "orig XXXX:YYYY" name the procedure in PRIMA.EXE.
//
// Conventions: angles in radians, lengths in metres unless stated otherwise.
(function (root) {
  "use strict";

  const { sin, cos, tan, atan, atan2, sqrt, abs, hypot, PI } = Math;
  const TWO_PI = 2 * PI;

  // Constants exactly as stored in PRIMA.EXE.
  const A = 6378245.0;      // semi-major axis a
  const B_AXIS = 6356863.0188; // semi-minor axis b
  const C = 6399698.9018;   // polar radius of curvature c = a²/b
  const E2 = 0.0066934216;  // first eccentricity squared
  const EP2 = 0.0067385254; // second eccentricity squared
  const RHO = 206265.0;     // arc seconds per radian (corrections)
  const XM0 = 6367558.4969; // mean radius for the footpoint latitude
  const EP2_RKM = 0.00673853; // truncated e'² used by the original RKM routine

  // ---------- Angles ----------
  const deg2rad = d => d * PI / 180;
  const rad2deg = r => r * 180 / PI;
  function normAz(a) {
    a %= TWO_PI;
    return a < 0 ? a + TWO_PI : a;
  }
  // Direction of the vector (dx north, dy east) in [0, 2π) (orig 2821:002c).
  const azimuth = (dx, dy) => normAz(atan2(dy, dx));
  // Reverse azimuth: add or subtract 180° the way the original does.
  const reverse = a => (a >= PI ? a - PI : a + PI);

  // ---------- Ellipsoid ----------
  function eta2(B) { const c = cos(B); return EP2 * c * c; }           // orig 2821:19a9
  const V = B => sqrt(1 + eta2(B));                                     // orig 2821:03a8
  function W(B) { const s = sin(B); return sqrt(1 - E2 * s * s); }      // orig 2821:03f7
  const N = B => C / V(B);                                              // orig 2821:0442
  function M(B) { const v = V(B); return C / (v * v * v); }             // orig 2821:0486
  const R = B => sqrt(M(B) * N(B));                                     // orig 257a:03a4
  const parallelRadius = B => A * cos(B) / W(B);                        // orig 2821:04f0
  function RA(B, az) {                                                  // orig 235d:038c
    const m = M(B), n = N(B), ca = cos(az), sa = sin(az);
    return m * n / (n * ca * ca + m * sa * sa);
  }

  // ---------- Arcs ----------
  // Short-arc formula used by the meridian arc screen (orig 214c:038c).
  const meridianArcProgram = (B1, B2) => abs(B2 - B1) * M((B1 + B2) / 2);

  // Meridian arc from the equator, full series (orig 2821:20d7).
  function meridianArc(B) {
    const m0 = C * sqrt(1 - E2) * (1 - E2);
    const m2 = 1.5 * E2 * m0;
    const m4 = 1.25 * E2 * m2;
    const m6 = 7.0 / 6 * E2 * m4;
    const m8 = 1.125 * E2 * m6;
    const a0 = m0 + m2 / 2 + 3.0 / 8 * m4 + 5.0 / 16 * m6 + 35.0 / 128 * m8;
    const a2 = m2 / 2 + m4 / 2 + 15.0 / 32 * m6 + 7.0 / 16 * m8;
    const a4 = m4 / 8 + 3.0 / 16 * m6 + 7.0 / 32 * m8;
    const a6 = m6 / 32 + m8 / 16;
    const s = sin(B), c = cos(B), s2 = s * s;
    return a0 * B - s * c * ((a2 - a4 + a6) + (2 * a4 - 16.0 / 3 * a6) * s2 + 16.0 / 3 * a6 * s2 * s2);
  }

  const parallelArc = (B, L1, L2) => N(B) * cos(B) * abs(L2 - L1);  // orig 1f3c:038c

  // ---------- Trapezoids ----------
  function trapezoidArea(B1, B2, L1, L2) {                           // orig 1710:002c, km²
    if (B1 > B2) [B1, B2] = [B2, B1];
    const s1 = sin(B1), s2 = sin(B2);
    const p3 = x => x * x * x, p5 = x => x * x * x * x * x;
    const sum = (s2 - s1) + 2.0 / 3 * E2 * (p3(s2) - p3(s1)) + 0.6 * E2 * E2 * (p5(s2) - p5(s1));
    return B_AXIS * B_AXIS * abs(L2 - L1) * sum / 1e6;
  }

  function trapezoidFrame(B1, B2, L1, L2, scale) {                   // orig 1a8c:07de, cm
    if (B1 > B2) [B1, B2] = [B2, B1];
    const dl = abs(L2 - L1), toCm = 100 / scale;
    return {
      side: meridianArcProgram(B1, B2) * toCm,
      north: N(B2) * cos(B2) * dl * toCm,
      south: N(B1) * cos(B1) * dl * toCm,
    };
  }

  // ---------- Direct and inverse problems ----------
  function directSchreiber(B1, L1, A12, S) {                         // orig 2821:0573
    const n1 = N(B1);
    const u = S * cos(A12) / n1;
    const v = S * sin(A12) / n1;
    const b = u * (1 + v * v / 3);
    const w = v * (1 - u * u / 6);
    const phi = B1 + b;
    const t = tan(phi) * w;
    const l = w / cos(phi);
    const dA = t * (1 - l * l / 6 - t * t / 6);
    const dL = l * (1 - t * t / 3);
    const k = w * t * (1 - l * l / 12 - t * t / 6) / 2;
    const db = b - k;
    const v1 = V(B1), v2 = v1 * v1;
    const dB = v2 * db * (1 - 3 * EP2 * sin(2 * B1) * db / 4 - EP2 * cos(2 * B1) * db * db / 2);
    const corr = b * w / 2 / v2;
    let A21 = A12 + PI + dA - corr;
    if (A21 >= TWO_PI) A21 -= TWO_PI;
    return { B2: B1 + dB, L2: L1 + dL, A21 };
  }

  function geodesicODE(B, az, h) {
    const cb = cos(B);
    const v2 = 1 + EP2_RKM * cb * cb;
    const v = sqrt(v2);
    const dB = h * cos(az) * v2 * v / C;
    const dL = h * sin(az) * v / (C * cb);
    return [dB, dL, sin(B) * dL];
  }

  // Runge–Kutta–Merson; the original takes one step (orig 2821:0c23).
  function directRKM(B1, L1, A12, S, steps = 1) {
    steps = Math.max(1, steps | 0);
    const h = S / steps;
    let B = B1, L = L1, az = A12;
    for (let i = 0; i < steps; i++) {
      const [b1, l1, a1] = geodesicODE(B, az, h);
      const [b2, , a2] = geodesicODE(B + b1 / 3, az + a1 / 3, h);
      const [b3, , a3] = geodesicODE(B + b1 / 6 + b2 / 6, az + a1 / 6 + a2 / 6, h);
      const [b4, l4, a4] = geodesicODE(B + b1 / 8 + 3 * b3 / 8, az + a1 / 8 + 3 * a3 / 8, h);
      const [b5, l5, a5] = geodesicODE(B + b1 / 2 - 3 * b3 / 2 + 2 * b4, az + a1 / 2 - 3 * a3 / 2 + 2 * a4, h);
      B += (b1 + 4 * b4 + b5) / 6;
      L += (l1 + 4 * l4 + l5) / 6;
      az += (a1 + 4 * a4 + a5) / 6;
    }
    return { B2: B, L2: L, A21: reverse(az) };
  }

  // Gauss's mid-latitude formulas (orig 2821:0899).
  function inverse(B1, L1, B2, L2) {
    const b = B2 - B1, l = L2 - L1, Bm = (B1 + B2) / 2;
    const e2 = eta2(Bm);
    const n = C / sqrt(1 + e2);
    const mm = n / (1 + e2);
    const sm = sin(Bm), cm = cos(Bm);
    const ls = l * sm, lc = l * cm, b2 = b * b;
    const P = b * mm * (1 - (EP2 - 2 * e2) * b2 / 8 - (1 + e2) * lc * lc / 12 - (1 - 2 * e2) * ls * ls / 12 - ls * ls / 24);
    const dA = ls * (1 + (3 + 2 * e2) * b2 / 24 + (1 + e2) * lc * lc / 12);
    // The original writes the b² coefficient as (1 − 9e'²) + 8η²; kept unchanged.
    const Q = lc * n * (1 + (8 * e2 + (1 - 9 * EP2)) * b2 / 24 - ls * ls / 24);
    const Am = azimuth(P, Q);
    return { S: hypot(P, Q), A12: normAz(Am - dA / 2), A21: reverse(Am + dA / 2), Am };
  }

  // ---------- Gauss–Krüger ----------
  // (B, l = L − L0) → (x, y), y without false easting (orig 2821:233f).
  function geoToPlane(B, l) {
    const n = N(B), e2 = eta2(B);
    const s = sin(B), c = cos(B), t = s / c;
    const t2 = t * t, t4 = t * t * t * t, t6 = Math.pow(t, 6);
    const c3 = c * c * c, c5 = Math.pow(c, 5), c7 = Math.pow(c, 7);
    const l2 = l * l;
    const a2 = n * s * c / 2;
    const a4 = n * s * c3 / 24 * (5 - t2 + 9 * e2 + 4 * e2 * e2);
    const a6 = n * s * c5 / 720 * (61 - 58 * t2 + t4 + 270 * e2 - 330 * e2 * t2);
    const a8 = n * s * c7 / 40320 * (1385 - 3111 * t2 + 543 * t4 - t6);
    const b1 = n * c;
    const b3 = n * c3 / 6 * (1 - t2 + e2);
    const b5 = n * c5 / 120 * (5 - 18 * t2 + t4 + 14 * e2 - 58 * e2 * t2);
    const b7 = n * c7 / 5040 * (61 - 479 * t2 + 179 * t4 - t6);
    return {
      x: meridianArc(B) + l2 * (a2 + l2 * (a4 + l2 * (a6 + l2 * a8))),
      y: l * (b1 + l2 * (b3 + l2 * (b5 + l2 * b7))),
    };
  }

  function footpointLatitude(x) {                                     // orig 2821:18f1
    const beta = x / XM0;
    const s = sin(beta), c = cos(beta), s2 = s * s;
    return beta + s * c * (50517738 - (298373 - 2382 * s2) * s2) * 1e-10;
  }

  // (x, y from the central meridian) → (B, l) (orig 2821:1a55).
  // The original passed |Y − Y0|; this port keeps the sign of y.
  function planeToGeo(x, y) {
    const bx = footpointLatitude(x);
    const e2 = eta2(bx), v2 = 1 + e2;
    const n = N(bx), n2 = n * n, n4 = n2 * n2;
    const t = tan(bx), t2 = t * t, t4 = t * t * t * t, t6 = Math.pow(t, 6);
    const b2 = -v2 * t / (2 * n2);
    const b4 = -b2 / (12 * n2) * (5 + 3 * t2 + e2 - 9 * e2 * t2 - 4 * e2 * e2);
    const b6 = b2 / (360 * n4) * (61 + 90 * t2 + 45 * t4 + 46 * e2 - 252 * e2 * t2 - 90 * e2 * t4);
    const b8 = -b2 / (20160 * n4 * n2) * (1385 + 3633 * t2 + 4095 * t4 + 1575 * t6);
    const a1 = 1 / (n * cos(bx));
    const a3 = -a1 / (6 * n2) * (1 + 2 * t2 + e2);
    const a5 = a1 / (120 * n4) * (5 + 28 * t2 + 24 * t4 + 6 * e2 + 8 * e2 * t2);
    const a7 = -a1 / (5040 * n4 * n2) * (61 + 662 * t2 + 1320 * t4 + 720 * t6);
    const y2 = y * y;
    return {
      B: bx + y2 * (b2 + y2 * (b4 + y2 * (b6 + y2 * b8))),
      l: y * (a1 + y2 * (a3 + y2 * (a5 + y2 * a7))),
    };
  }

  // Meridian convergence γ; sign follows l (orig 2821:124a).
  function convergence(B, l) {
    let sign = 1;
    if (l < 0) { sign = -1; l = -l; }
    const cb = cos(B), c2 = cb * cb, e2 = EP2 * c2, sb = sin(B);
    const k = 1 + 2.0 / 3 * e2 + c2 * l * l;
    return sign * atan(sb * tan(l) + sb * e2 * c2 * l * l * l * k);
  }

  // Corrections for reducing the line (x1,y1)–(x2,y2) [m] to the plane (orig 2821:1488).
  function reductionToPlane(x1, y1, x2, y2) {
    const r0 = C / 1000; // km
    const p1 = planeToGeo(x1, y1), p2 = planeToGeo(x2, y2);
    const xm = (x1 + x2) / 2;
    let ym = (y1 + y2) / 2;
    const Bm = planeToGeo(xm, ym).B;
    const S = inverse(p1.B, p1.l, p2.B, p2.l).S;
    const dx = (x2 - x1) / 1000, dy = (y2 - y1) / 1000;
    ym /= 1000;
    const v2 = 1 + eta2(Bm);
    const k = v2 * v2 * RHO / (12 * r0) * ym / r0 * dx;
    const q = RHO * EP2 / (2 * r0) * sin(2 * Bm) * (ym / r0) * (ym / r0) * dy;
    const u = (ym / r0) * (ym / r0);
    let d12 = 0, d21 = 0;
    if (ym !== 0) {
      d12 = -k * (6 - 2 * u - dy / ym) - q;
      d21 = k * (6 - 2 * u + dy / ym) + q;
    }
    const rm = R(Bm) / 1000;
    const w = ym * ym / (rm * rm);
    const m = 1 + w / 2 + dy * dy / (24 * rm * rm) + w * w / 24 + w * w * w / 720;
    return { delta12: d12, delta21: d21, ds: S * m - S };
  }

  const geodesy = {
    A, B_AXIS, C, E2, EP2, RHO,
    deg2rad, rad2deg,
    eta2, V, W, N, M, R, parallelRadius, RA,
    meridianArc, meridianArcProgram, parallelArc,
    trapezoidArea, trapezoidFrame,
    directSchreiber, directRKM, inverse,
    geoToPlane, planeToGeo, footpointLatitude, convergence, reductionToPlane,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = geodesy;
  else { root.PRIMA = root.PRIMA || {}; root.PRIMA.geo = geodesy; }
})(typeof window !== "undefined" ? window : globalThis);
