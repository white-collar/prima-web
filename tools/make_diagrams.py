#!/usr/bin/env python3
"""Generates js/diagrams.js: one schematic SVG per screen for the "?" popover.

The figures are schematic (the flattening is exaggerated), but their geometry
is computed: normals, radii of curvature, arcs and grid lines are where they
should be. Words in {braces} are replaced by translations in the browser
(see PRIMA.DIAGRAM_WORDS in js/help.js).

Colour classes: "in" = given quantities (blue), "out" = computed (green).

Run:  python3 tools/make_diagrams.py
"""
import json
import math
import os

W, H = 480, 270
D = math.radians


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


class Svg:
    def __init__(self):
        self.items = []

    def add(self, s):
        self.items.append(s)

    def line(self, x1, y1, x2, y2, cls="ln"):
        self.add(f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" class="{cls}"/>')

    def path(self, d, cls="ln"):
        self.add(f'<path d="{d}" class="{cls}"/>')

    def poly(self, pts, cls="ln", closed=False):
        d = "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + (" Z" if closed else "")
        self.path(d, cls)

    def ellipse(self, cx, cy, rx, ry, cls="ln"):
        self.add(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" class="{cls}"/>')

    def dot(self, x, y, cls="dot", r=3.5):
        self.add(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" class="{cls}"/>')

    def text(self, x, y, s, cls="tx", anchor="middle"):
        self.add(f'<text x="{f(x)}" y="{f(y)}" class="{cls}" text-anchor="{anchor}">{s}</text>')

    def arrow(self, x, y, ang, cls="ah", size=8):
        """Arrowhead with its tip at (x, y), pointing along ang (radians, screen coords)."""
        a1, a2 = ang + math.pi - 0.38, ang + math.pi + 0.38
        p = [(x, y), (x + size * math.cos(a1), y + size * math.sin(a1)), (x + size * math.cos(a2), y + size * math.sin(a2))]
        self.add('<path d="M{} {} L{} {} L{} {} Z" class="{}"/>'.format(*[f(v) for pt in p for v in pt], cls))

    def angle(self, cx, cy, r, a0, a1, cls="in"):
        """Arc around (cx, cy) from screen angle a0 to a1 (radians, clockwise positive)."""
        large = 1 if abs(a1 - a0) > math.pi else 0
        sweep = 1 if a1 > a0 else 0
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        self.path(f"M{f(x0)} {f(y0)} A{f(r)} {f(r)} 0 {large} {sweep} {f(x1)} {f(y1)}", cls)

    def legend(self):
        y = H - 10
        self.dot(16, y - 4, "dot-in", 4)
        self.text(26, y, "{given}", "tx-sm", "start")
        self.dot(110, y - 4, "dot-out", 4)
        self.text(120, y, "{computed}", "tx-sm", "start")

    def render(self):
        return f'<svg class="dg" viewBox="0 0 {W} {H}" role="img">' + "".join(self.items) + "</svg>"


# ---------- Meridian section of an exaggerated ellipsoid ----------
class Ell:
    def __init__(self, cx, cy, a, b):
        self.cx, self.cy, self.a, self.b = cx, cy, a, b
        self.e2 = 1 - (b / a) ** 2

    def N(self, B):
        return self.a / math.sqrt(1 - self.e2 * math.sin(B) ** 2)

    def M(self, B):
        return self.a * (1 - self.e2) / (1 - self.e2 * math.sin(B) ** 2) ** 1.5

    def pt(self, B, side=1):
        n = self.N(B)
        return self.cx + side * n * math.cos(B), self.cy - n * (1 - self.e2) * math.sin(B)

    def normal_axis(self, B):
        """Where the normal at latitude B meets the polar axis."""
        return self.cx, self.cy + self.N(B) * self.e2 * math.sin(B)


def radii():
    s = Svg()
    e = Ell(175, 140, 150, 105)
    B = D(40)
    s.line(e.cx, 22, e.cx, 258, "faint")                 # polar axis
    s.line(10, e.cy, 345, e.cy, "faint")                 # equator
    s.text(350, e.cy + 4, "{eq}", "tx-sm", "start")
    s.ellipse(e.cx, e.cy, e.a, e.b)
    px, py = e.pt(B)
    nx, ny = e.normal_axis(B)
    ux, uy = (nx - px) / e.N(B), (ny - py) / e.N(B)      # unit normal, pointing inside
    # normal line, extended slightly outside the ellipse
    s.line(px - 30 * ux, py - 30 * uy, nx, ny, "ln dash")
    # tangent at P
    s.line(px - 45 * uy, py + 45 * ux, px + 45 * uy, py - 45 * ux, "faint")
    # angle B where the normal crosses the equator
    t = (e.cy - py) / uy
    qx = px + t * ux
    s.angle(qx, e.cy, 24, -B, 0, "in")
    s.text(qx + 34, e.cy - 7, "B", "tx-in")
    # dimension lines for N and M along the normal, on both sides of it
    ox, oy = -uy, ux                                      # perpendicular
    m = e.M(B)
    for length, off, lab in ((e.N(B), 9, "N"), (m, -9, "M")):
        x1, y1 = px + off * ox, py + off * oy
        x2, y2 = x1 + length * ux, y1 + length * uy
        s.line(x1, y1, x2, y2, "out")
        s.arrow(x2, y2, math.atan2(uy, ux), "ah-out")
        s.arrow(x1, y1, math.atan2(-uy, -ux), "ah-out")
        tx, ty = x1 + 0.62 * length * ux + 2.0 * off * ox, y1 + 0.62 * length * uy + 2.0 * off * oy
        s.text(tx, ty + 4, lab, "tx-out")
    mx, my = px + m * ux, py + m * uy
    s.dot(mx, my, "dot-out", 3)
    s.dot(nx, ny, "dot-out", 3)
    # radius of the parallel
    s.line(e.cx, py, px, py, "out")
    s.arrow(px, py, 0, "ah-out")
    s.text((e.cx + px) / 2, py - 7, "rB", "tx-out")
    s.dot(px, py, "dot-in")
    s.text(px + 10, py - 8, "P", "tx-strong", "start")
    # side note
    s.text(360, 70, "M ≤ R ≤ N", "tx-out", "start")
    s.text(360, 94, "R = √(M·N)", "tx-out", "start")
    s.legend()
    return s.render()


def ra():
    s = Svg()
    cx, cy, rx, ry = 230, 140, 135, 95                    # Dupin indicatrix (schematic)
    s.ellipse(cx, cy, rx, ry, "faint")
    s.line(cx, cy + ry + 10, cx, 18, "ln")
    s.arrow(cx, 18, -math.pi / 2, "ah")
    s.text(cx, 13, "A = 0°  ({merid})", "tx-sm")
    s.text(cx + 8, cy - ry + 18, "M", "tx-out", "start")
    s.line(cx - rx - 10, cy, cx + rx + 25, cy, "ln")
    s.arrow(cx + rx + 25, cy, 0, "ah")
    s.text(cx + rx + 28, cy + 18, "A = 90°", "tx-sm", "end")
    s.text(cx + rx - 14, cy - 8, "N", "tx-out")
    A = D(52)
    dx, dy = math.sin(A), -math.cos(A)
    # radius of the indicatrix in this direction
    r = 1 / math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    s.line(cx, cy, cx + r * dx, cy + r * dy, "out")
    s.arrow(cx + r * dx, cy + r * dy, math.atan2(dy, dx), "ah-out")
    s.text(cx + r * dx + 14, cy + r * dy - 2, "RA", "tx-out", "start")
    s.angle(cx, cy, 38, -math.pi / 2, math.atan2(dy, dx))
    s.text(cx + 22, cy - 46, "A", "tx-in")
    s.dot(cx, cy, "dot-in")
    s.text(cx - 10, cy + 18, "B", "tx-in")
    s.legend()
    return s.render()


def meridian():
    s = Svg()
    e = Ell(110, 225, 300, 195)
    s.line(e.cx, 20, e.cx, 240, "faint")
    s.line(e.cx, e.cy, 440, e.cy, "faint")
    s.text(380, e.cy - 7, "{eq}", "tx-sm")
    s.text(e.cx - 6, 34, "{merid}", "tx-sm", "end")
    pts = [e.pt(D(b)) for b in range(0, 91, 2)]
    s.poly(pts)
    B1, B2 = D(22), D(52)
    arc = [e.pt(B1 + (B2 - B1) * i / 40) for i in range(41)]
    s.poly(arc, "out thick")
    for B, lab in ((B1, "B1"), (B2, "B2")):
        px, py = e.pt(B)
        nx, ny = e.normal_axis(B)
        t = (e.cy - py) / (ny - py)
        qx = px + t * (nx - px)
        s.line(px, py, qx, e.cy, "ln dash")
        s.angle(qx, e.cy, 26, -B, 0, "in")
        s.text(qx + 40 * math.cos(-B / 2), e.cy + 40 * math.sin(-B / 2) + 4, lab, "tx-in")
        s.dot(px, py, "dot-in")
    mx, my = e.pt((B1 + B2) / 2)
    s.text(mx + 16, my, "Sm", "tx-out", "start")
    s.text(mx + 16, my + 18, "≈ M(Bm)·ΔB", "tx-sm", "start")
    s.legend()
    return s.render()


def parallel():
    s = Svg()
    cx, cy, a, b = 240, 132, 165, 108
    s.ellipse(cx, cy, a, b)
    s.line(cx, cy - b - 12, cx, cy + b + 12, "faint")
    s.ellipse(cx, cy, a, 26, "faint")                     # equator (perspective)
    s.text(cx + a - 6, cy + 40, "{eq}", "tx-sm", "end")
    B = D(42)
    r = a * math.cos(B)
    zy = cy - b * math.sin(B)
    k = 26 / a                                           # perspective factor
    s.ellipse(cx, zy, r, r * k, "ln")
    s.text(cx - r - 6, zy + 4, "{par} B", "tx-sm", "end")
    # arc between L1 and L2 on the front side of the parallel
    t1, t2 = D(25), D(115)
    arc = [(cx + r * math.cos(t1 + (t2 - t1) * i / 40), zy + r * k * math.sin(t1 + (t2 - t1) * i / 40)) for i in range(41)]
    s.poly(arc, "out thick")
    for t, lab in ((t1, "L1"), (t2, "L2")):
        x, y = cx + r * math.cos(t), zy + r * k * math.sin(t)
        s.line(cx, zy, x, y, "in")
        s.dot(x, y, "dot-in")
        s.text(x + (12 if t == t1 else -12), y + 16, lab, "tx-in")
    s.angle(cx, zy, 16, t1, t2, "in")
    s.text(cx + 3, zy + 34, "ΔL", "tx-in")
    s.text(cx + 24, zy + r * k + 24, "Sп", "tx-out")
    # radius r = N cosB to the back side
    s.line(cx, zy, cx + r * math.cos(D(-35)), zy + r * k * math.sin(D(-35)), "out dash")
    s.text(cx + r * math.cos(D(-35)) + 6, zy + r * k * math.sin(D(-35)) - 8, "r = N·cosB", "tx-out", "start")
    s.legend()
    return s.render()


def frames():
    s = Svg()
    x0, y0, w1, w2, h = 120, 210, 250, 214, 160          # south width w1, north width w2
    bl, br = (x0, y0), (x0 + w1, y0)
    tl, tr = (x0 + (w1 - w2) / 2, y0 - h), (x0 + (w1 + w2) / 2, y0 - h)
    s.add(f'<path d="M{f(bl[0])} {f(bl[1])} L{f(br[0])} {f(br[1])} L{f(tr[0])} {f(tr[1])} L{f(tl[0])} {f(tl[1])} Z" class="sheet"/>')
    s.text(x0 + w1 / 2, y0 - h / 2 + 5, "1 : m", "tx-sm")
    for (x, y), lab, dx, dy, anc in ((tl, "B2, L1", -8, -6, "end"), (tr, "B2, L2", 8, -6, "start"),
                                     (bl, "B1, L1", -8, 14, "end"), (br, "B1, L2", 8, 14, "start")):
        s.dot(x, y, "dot-in", 3)
        s.text(x + dx, y + dy, lab, "tx-in", anc)
    # dimensions
    s.line(tl[0], tl[1] - 16, tr[0], tr[1] - 16, "out")
    s.arrow(tl[0], tl[1] - 16, math.pi, "ah-out"); s.arrow(tr[0], tr[1] - 16, 0, "ah-out")
    s.text((tl[0] + tr[0]) / 2, tl[1] - 22, "a2", "tx-out")
    s.line(bl[0], bl[1] + 26, br[0], br[1] + 26, "out")
    s.arrow(bl[0], bl[1] + 26, math.pi, "ah-out"); s.arrow(br[0], br[1] + 26, 0, "ah-out")
    s.text((bl[0] + br[0]) / 2, bl[1] + 42, "a1", "tx-out")
    ang = math.atan2(tr[1] - br[1], tr[0] - br[0])
    ox, oy = 18 * math.sin(ang), -18 * math.cos(ang)
    s.line(br[0] - ox, br[1] - oy, tr[0] - ox, tr[1] - oy, "out")
    s.arrow(tr[0] - ox, tr[1] - oy, ang, "ah-out"); s.arrow(br[0] - ox, br[1] - oy, ang + math.pi, "ah-out")
    s.text((br[0] + tr[0]) / 2 + 26, (br[1] + tr[1]) / 2 + 4, "c", "tx-out")
    s.text(x0 + w1 / 2, y0 - h / 2 - 16, "{sheet}", "tx-sm")
    s.legend()
    return s.render()


def area():
    s = Svg()
    cx, cy, a, b = 240, 130, 150, 110

    def P(lon, lat):  # front orthographic view
        return cx + a * math.cos(D(lat)) * math.sin(D(lon)), cy - b * math.sin(D(lat))

    s.ellipse(cx, cy, a, b)
    for lat in (-30, 0, 30, 60):
        x1, y = P(-90, lat)
        x2, _ = P(90, lat)
        s.line(x1, y, x2, y, "faint" if lat else "ln")
    for lon in (-60, -30, 0, 30, 60):
        s.poly([P(lon, la) for la in range(-90, 91, 5)], "faint")
    s.text(cx - a + 30, cy - 6, "{eq}", "tx-sm", "start")
    lat1, lat2, lon1, lon2 = 18, 48, 12, 50
    region = [P(lon1 + (lon2 - lon1) * i / 20, lat1) for i in range(21)] + \
             [P(lon2, lat1 + (lat2 - lat1) * i / 20) for i in range(21)] + \
             [P(lon2 - (lon2 - lon1) * i / 20, lat2) for i in range(21)] + \
             [P(lon1, lat2 - (lat2 - lat1) * i / 20) for i in range(21)]
    s.poly(region, "region", closed=True)
    for lat, lab in ((lat1, "B1"), (lat2, "B2")):
        x, y = P(lon1, lat)
        s.text(x - 8, y + 4, lab, "tx-in", "end")
    for lon, lab in ((lon1, "L1"), (lon2, "L2")):
        x, y = P(lon, lat2)
        s.text(x, y - 8, lab, "tx-in")
    mx, my = P((lon1 + lon2) / 2, (lat1 + lat2) / 2)
    s.text(mx, my + 5, "P", "tx-out big")
    s.legend()
    return s.render()


def geodesic_scene(mode):
    """Direct (mode 'direct' / 'rkm') or inverse ('inverse') problem."""
    s = Svg()
    # graticule: meridians converge slightly to the north
    K = 0.14                                             # convergence of meridians

    def merid(x):
        return [(x - (x - 240) * K * (1 - y / 250), y) for y in range(20, 251, 10)]

    def north(p, length):
        return p[0] - (p[0] - 240) * K * length / 250, p[1] - length
    for x in (80, 240, 400):
        s.poly(merid(x), "faint")
    for y in (60, 140, 220):
        s.path(f"M30 {y} Q240 {y - 18} 450 {y}", "faint")
    p1, p2 = (120, 205), (370, 78)
    c = (215, 105)                                       # control point: line bends poleward
    s.path(f"M{p1[0]} {p1[1]} Q{c[0]} {c[1]} {p2[0]} {p2[1]}", "out thick" if mode == "inverse" else "in thick")
    given, comp = ("tx-in", "tx-out") if mode != "inverse" else ("tx-in", "tx-in")
    # north directions (local meridians)
    n1p, n2p = north(p1, 70), north(p2, 60)
    s.line(*p1, *n1p, "ln")
    s.arrow(*n1p, math.atan2(n1p[1] - p1[1], n1p[0] - p1[0]), "ah")
    s.line(*p2, *n2p, "ln")
    s.arrow(*n2p, math.atan2(n2p[1] - p2[1], n2p[0] - p2[0]), "ah")
    s.text(p1[0] - 8, p1[1] - 74, "{merid}", "tx-sm", "end")
    # azimuth A12 at P1: from north (clockwise) to the tangent of the line
    t1 = math.atan2(c[1] - p1[1], c[0] - p1[0])
    n1 = math.atan2(n1p[1] - p1[1], n1p[0] - p1[0])
    a12 = "in" if mode != "inverse" else "out"
    s.angle(p1[0], p1[1], 34, n1, t1, a12)
    s.text(p1[0] + 26, p1[1] - 40, "A12", "tx-" + a12, "start")
    # reverse azimuth A21 at P2: from north (clockwise) to the direction back to P1
    t2 = math.atan2(c[1] - p2[1], c[0] - p2[0])
    n2 = math.atan2(n2p[1] - p2[1], n2p[0] - p2[0])
    s.angle(p2[0], p2[1], 26, n2, t2 + 2 * math.pi, "out")
    s.text(p2[0] + 36, p2[1] + 24, "A21", "tx-out", "start")
    # length label
    s.text(250, 152, "S", "tx-out big" if mode == "inverse" else "tx-in big")
    if mode == "rkm":   # Merson stages along the line
        for tt in (1 / 3, 1 / 2, 1):
            x = (1 - tt) ** 2 * p1[0] + 2 * (1 - tt) * tt * c[0] + tt ** 2 * p2[0]
            y = (1 - tt) ** 2 * p1[1] + 2 * (1 - tt) * tt * c[1] + tt ** 2 * p2[1]
            if tt < 1:
                s.dot(x, y, "dot-stage", 3)
        s.text(300, 152, "h = S", "tx-sm", "start")
    if mode == "inverse":   # mid point and Am
        x = 0.25 * p1[0] + 0.5 * c[0] + 0.25 * p2[0]
        y = 0.25 * p1[1] + 0.5 * c[1] + 0.25 * p2[1]
        nm = north((x, y), 52)
        s.line(x, y, *nm, "ln dash")
        tan = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
        s.angle(x, y, 22, math.atan2(nm[1] - y, nm[0] - x), tan, "out")
        s.text(x + 4, y - 30, "Am", "tx-out", "start")
        s.dot(x, y, "dot-out", 3)
    s.dot(*p1, "dot-in")
    s.text(p1[0] - 10, p1[1] + 20, "B1, L1", "tx-in", "end")
    s.dot(*p2, "dot-out" if mode != "inverse" else "dot-in")
    s.text(p2[0] - 14, p2[1] - 10, "B2, L2", "tx-out" if mode != "inverse" else "tx-in", "end")
    s.legend()
    return s.render()


def gk_scene(mode):
    """Gauss–Krüger zone: 'bl2xy', 'xy2bl' or 'gamma'."""
    s = Svg()
    ax, eqy = 200, 240                                   # central meridian x, equator y

    def mer(dl, y):          # image of a meridian: converges to the pole
        k = (eqy - y) / 235.0
        return ax + dl * math.cos(k * math.pi / 2) ** 0.9

    def parallel(y0):        # image of a parallel: bends towards the pole away from the axis
        return [(x, y0 - 0.0016 * (x - ax) ** 2) for x in range(ax - 190, ax + 251, 8)]

    for dl in (-150, 150, 240):
        s.poly([(mer(dl, y), y) for y in range(eqy, 10, -6)], "faint")
    for y0 in (80, 160):
        s.poly(parallel(y0), "faint")
    # axes: x = central meridian, y = equator
    s.line(ax, eqy + 10, ax, 16, "ln")
    s.arrow(ax, 16, -math.pi / 2, "ah")
    s.text(ax - 8, 24, "x", "tx-strong", "end")
    s.text(ax + 8, 30, "L0", "tx-in", "start")
    s.line(ax - 190, eqy, ax + 268, eqy, "ln")
    s.arrow(ax + 268, eqy, 0, "ah")
    s.text(ax + 262, eqy - 8, "y", "tx-strong", "end")
    s.text(ax - 185, eqy - 6, "{eq}", "tx-sm", "start")
    # point P on the parallel y0
    y0 = 165 if mode == "gamma" else 125
    px = ax + 155
    py = y0 - 0.0016 * (px - ax) ** 2
    # the meridian through P (computed so it passes through P)
    k = (px - ax) / math.cos((eqy - py) / 235.0 * math.pi / 2) ** 0.9
    mp = [(ax + k * math.cos((eqy - y) / 235.0 * math.pi / 2) ** 0.9, y) for y in range(eqy, 12, -6)]
    s.poly(mp, "ln")
    s.poly(parallel(y0), "ln")
    if mode == "gamma":
        # grid north at P vs the meridian tangent at P
        s.line(px, py, px, py - 75, "ln dash")
        s.arrow(px, py - 75, -math.pi / 2, "ah")
        s.text(px + 6, py - 70, "x", "tx-sm", "start")
        dy = 6
        y2 = py - dy
        x2 = ax + k * math.cos((eqy - y2) / 235.0 * math.pi / 2) ** 0.9
        ang = math.atan2(y2 - py, x2 - px)
        s.line(px, py, px + 70 * math.cos(ang), py + 70 * math.sin(ang), "in")
        s.arrow(px + 70 * math.cos(ang), py + 70 * math.sin(ang), ang, "ah-in")
        s.text(px + 70 * math.cos(ang) - 6, py + 70 * math.sin(ang) - 8, "{merid}", "tx-sm", "end")
        s.angle(px, py, 52, ang, -math.pi / 2, "out")
        s.text(px - 4, py - 58, "γ", "tx-out big", "end")
        s.dot(px, py, "dot-in")
        s.text(px + 10, py + 18, "B, L", "tx-in", "start")
    else:
        xy = "out" if mode == "bl2xy" else "in"
        bl = "in" if mode == "bl2xy" else "out"
        s.line(px, py, ax, py, xy + " dash")
        s.line(px, py, px, eqy, xy + " dash")
        s.text((px + ax) / 2, py - 7, "y", "tx-" + xy)
        s.text(px + 8, (py + eqy) / 2 + 4, "x", "tx-" + xy, "start")
        s.dot(px, py, "dot-" + bl)
        s.text(px - 10, py + 20, "B, L", "tx-" + bl, "end")
        if mode == "xy2bl":
            s.dot(ax, py, "dot-out", 3)
            s.text(ax - 8, py + 4, "Bx", "tx-out", "end")
            s.text(ax + 268, 60, "Y = Y0 + y", "tx-in", "end")
        s.text(ax + 262, 22, "l = L − L0" if mode == "bl2xy" else "L = L0 + l", "tx-sm", "end")
    s.legend()
    return s.render()


def corr():
    s = Svg()
    ax = 70
    s.line(ax, 250, ax, 16, "ln")
    s.arrow(ax, 16, -math.pi / 2, "ah")
    s.text(ax - 8, 26, "x", "tx-strong", "end")
    s.text(ax + 8, 30, "L0", "tx-sm", "start")
    p1, p2 = (250, 212), (320, 52)
    # image of the geodesic: a curve bulging away from the central meridian
    c = ((p1[0] + p2[0]) / 2 + 48, (p1[1] + p2[1]) / 2)
    s.line(*p1, *p2, "ln dash")
    s.path(f"M{p1[0]} {p1[1]} Q{c[0]} {c[1]} {p2[0]} {p2[1]}", "in thick")
    chord = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    tan1 = math.atan2(c[1] - p1[1], c[0] - p1[0])
    s.angle(p1[0], p1[1], 46, chord, tan1, "out")
    s.text(p1[0] + 44, p1[1] - 14, "δ12", "tx-out", "start")
    tan2 = math.atan2(c[1] - p2[1], c[0] - p2[0])
    s.angle(p2[0], p2[1], 46, tan2, chord + math.pi, "out")
    s.text(p2[0] + 30, p2[1] + 44, "δ21", "tx-out", "start")
    mid = ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)
    apex = (0.25 * p1[0] + 0.5 * c[0] + 0.25 * p2[0], 0.25 * p1[1] + 0.5 * c[1] + 0.25 * p2[1])
    s.text(mid[0] - 12, mid[1] + 6, "s", "tx-strong big", "end")
    s.text(mid[0] - 12, mid[1] + 24, "{chord}", "tx-sm", "end")
    s.text(apex[0] + 10, apex[1] + 2, "S", "tx-in big", "start")
    s.text(apex[0] + 10, apex[1] + 20, "{geod}", "tx-sm", "start")
    # ym: distance of the line from the central meridian
    my = 236
    s.line(ax, my, mid[0], my, "ln")
    s.arrow(mid[0], my, 0, "ah")
    s.arrow(ax, my, math.pi, "ah")
    s.text((ax + mid[0]) / 2, my - 7, "ym", "tx-strong")
    s.line(mid[0], my + 4, *mid, "faint")
    for (x, y), lab in ((p1, "x1, y1"), (p2, "x2, y2")):
        s.dot(x, y, "dot-in")
        s.text(x - 12, y + 4, lab, "tx-in", "end")
    s.text(470, 236, "Δs = s − S", "tx-out", "end")
    s.legend()
    return s.render()


DIAGRAMS = {
    "radii": radii(),
    "ra": ra(),
    "meridian": meridian(),
    "parallel": parallel(),
    "frames": frames(),
    "area": area(),
    "schreiber": geodesic_scene("direct"),
    "rkm": geodesic_scene("rkm"),
    "inverse": geodesic_scene("inverse"),
    "xy2bl": gk_scene("xy2bl"),
    "bl2xy": gk_scene("bl2xy"),
    "gamma": gk_scene("gamma"),
    "corr": corr(),
}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js", "diagrams.js")
with open(out, "w", encoding="utf-8") as fh:
    fh.write("// Generated by tools/make_diagrams.py — do not edit by hand.\n")
    fh.write("// Schematic SVG figures for the \"?\" popover of each screen.\n")
    fh.write("window.PRIMA = window.PRIMA || {};\n")
    fh.write("PRIMA.DIAGRAMS = " + json.dumps(DIAGRAMS, ensure_ascii=False, indent=1) + ";\n")
print("wrote", os.path.normpath(out))
