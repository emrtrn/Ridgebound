"""V0 Derekavak scene plan (approval 1): a top-down plan drawn only from
docs/world/derekavak/RIDGEBOUND_SPATIAL_MASTER_v0.3.json, over the master's own
analytic terrain (the frozen v0.2 producer, as in RIDGEBOUND_generate_v0_site_v0.3.py).

Measures what the greybox must solve: road grades against the master's targets
and the cut/fill each building pad needs. Values marked ASSUMPTION are not in the
master and wait for approval.

Usage: python -I tools/world/derekavak_plan.py
Writes docs/world/derekavak/DEREKAVAK_V0_SAHNE_PLANI.png and derekavak_plan_measurements.json.
"""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import LineString, Point

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/world/derekavak"
MASTER = json.loads((OUT / "RIDGEBOUND_SPATIAL_MASTER_v0.3.json").read_text(encoding="utf-8"))

# ---- ASSUMPTIONS (not in the master) -------------------------------------------------
RIVER_WATER_WIDTH = 10.0           # H-01 water width, m
LOCAL_ROAD_WIDTH = {               # widths of local roads, m (old board: settlement 4-5, service 3-4)
    "Konut terası": 4.5, "Merkez erişimi": 4.5, "İşletme kolu": 5.0, "Depo girişi": 5.0,
    "R03 → J1": 5.0, "Dış bağlantı": 5.0, "R01 Köprü yaklaşımı": 6.0,
}
LOCAL_ROAD_MAX_GRADE = {"İşletme kolu": 10.0, "Depo girişi": 10.0}  # truck service; others 12
POI01_FOOTPRINT = (12.0, 7.5)      # user decision 2026-11-07: design board, not master 16x12
PAD_MARGIN = 2.0                   # level ground around a footprint, m
# --------------------------------------------------------------------------------------

X0, X1, Y0, Y1 = MASTER["site_extent_m"]
SIDE = [tuple(p) for p in MASTER["hydrology"]["H-02"]["pts"]]


def terrain(x, y):
    """The master's analytic ground (vectorised copy of z() in the v0.3 producer)."""
    x = np.asarray(x, float); y = np.asarray(y, float)
    rx = 3430 + 125 * np.sin(2 * np.pi * y / 3100 + .8) + .03 * (y - 1000)
    dm = np.abs(x - rx)
    seg = [math.dist(a, b) for a, b in zip(SIDE[:-1], SIDE[1:])]
    cum = np.insert(np.cumsum(seg), 0, 0.); total = cum[-1]
    best = np.full(x.shape, np.inf); remaining = np.zeros(x.shape)
    for i, ((ax, ay), (bx, by)) in enumerate(zip(SIDE[:-1], SIDE[1:])):
        vx, vy = bx - ax, by - ay
        t = np.clip(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy), 0, 1)
        ds2 = (x - ax - t * vx) ** 2 + (y - ay - t * vy) ** 2
        closer = ds2 < best
        best = np.where(closer, ds2, best); remaining = np.where(closer, total - (cum[i] + t * seg[i]), remaining)
    base = 148 + .0525 * y + 149 * (1 - np.exp(-(dm / 930) ** 2))
    hills = (62 * np.exp(-(((x - 800) / 1000) ** 2 + ((y - 5400) / 1450) ** 2))
             + 39 * np.exp(-(((x - 4950) / 770) ** 2 + ((y - 2460) / 1200) ** 2))
             + 25 * np.exp(-(((x - 1560) / 850) ** 2 + ((y - 2550) / 900) ** 2)))
    return np.minimum.reduce([base + hills, 140 + .0525 * y + .002 * dm ** 2, 140 + .0525 * 3200 + .05 * remaining + .003 * best])


def river_x(y):
    return 3430 + 125 * np.sin(2 * np.pi * np.asarray(y, float) / 3100 + .8) + .03 * (np.asarray(y, float) - 1000)


# ---- roads ---------------------------------------------------------------------------
roads = []
routes = MASTER["routes"]
roads.append({"id": "R01", "pts": routes["R01"]["pts"], "width": routes["R01"]["design_width_m"], "limit": routes["R01"]["target_max_abs_grade_percent"], "source": "master"})
roads.append({"id": "R03", "pts": routes["R03"]["pts"], "width": routes["R03"]["design_width_m"], "limit": routes["R03"]["target_max_abs_grade_percent"], "source": "master"})
for name, pts in MASTER["local_roads"].items():
    if name in ("R01 Köprü yaklaşımı", "R03 → J1"):
        continue  # same line as R01 / R03 above
    roads.append({"id": name, "pts": pts, "width": LOCAL_ROAD_WIDTH[name], "limit": LOCAL_ROAD_MAX_GRADE.get(name, 12.0), "source": "master line, ASSUMPTION width"})

site = LineString([(X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1), (X0, Y0)]).convex_hull


def grade_profile(pts, step=2.0, window=10.0):
    line = LineString(pts).intersection(site)
    if line.is_empty:
        return [], 0.0
    lines = list(line.geoms) if hasattr(line, "geoms") else [line]
    out = []
    for part in lines:
        n = max(2, int(part.length / step) + 1)
        d = np.linspace(0, part.length, n)
        xy = np.array([part.interpolate(v).coords[0] for v in d])
        z = terrain(xy[:, 0], xy[:, 1])
        k = max(1, int(window / step))
        for i in range(0, n - k):
            run = d[i + k] - d[i]
            out.append((xy[i], xy[i + k], abs(z[i + k] - z[i]) / run * 100))
    return out, sum(p.length for p in lines)


road_report = []
for road in roads:
    profile, length = grade_profile(road["pts"])
    over = [g for _, _, g in profile if g > road["limit"]]
    road["profile"] = profile
    road_report.append({"id": road["id"], "width_m": road["width"], "limit_percent": road["limit"], "length_in_site_m": round(length),
                        "max_grade_percent": round(max((g for _, _, g in profile), default=0), 1),
                        "over_limit_m": round(len(over) * 2.0), "width_source": road["source"]})

# ---- buildings -----------------------------------------------------------------------
buildings = []
for pid, p in MASTER["poi"].items():
    fp = POI01_FOOTPRINT if pid == "POI-01" else p["building_footprint_candidate_wh_m"]
    buildings.append({"id": pid, "name": p["name"], "xy": p["xy"], "parcel": p["parcel_wh_m"], "footprint": fp, "kind": "poi"})
for h in MASTER["settlement_fabric"]["residences"]:
    buildings.append({"id": h["id"], "name": h["quarter_id"], "xy": h["xy_m"], "parcel": None, "footprint": h["building_footprint_candidate_wh_m"], "kind": "house"})
for s in MASTER["settlement_fabric"]["outbuildings"]:
    buildings.append({"id": s["id"], "name": s["residence_id"], "xy": s["xy_m"], "parcel": None, "footprint": s["building_footprint_candidate_wh_m"], "kind": "outbuilding"})

for b in buildings:
    x, y = b["xy"]
    if b["footprint"] is None:  # POI-06 square: level the open space
        w, h = b["parcel"]; margin = 0
    else:
        w, h = b["footprint"]; margin = PAD_MARGIN
    gx, gy = np.meshgrid(np.arange(x - w / 2 - margin, x + w / 2 + margin + .01, 1.0), np.arange(y - h / 2 - margin, y + h / 2 + margin + .01, 1.0))
    z = terrain(gx, gy)
    pad = float(z.mean())
    b["pad_z"] = round(pad, 2)
    b["cut_m"] = round(float(z.max() - pad), 2)
    b["fill_m"] = round(float(pad - z.min()), 2)
    b["level_diff_m"] = round(float(z.max() - z.min()), 2)

# ---- drawing -------------------------------------------------------------------------
S = 1.5  # px per metre
MAP_W, MAP_H = int((X1 - X0) * S), int((Y1 - Y0) * S)
PAD_L, PAD_T, PANEL_W = 70, 110, 760
W, H = PAD_L + MAP_W + 40 + PANEL_W, PAD_T + MAP_H + 120
FONT = "C:/Windows/Fonts/arial.ttf"; BOLD = "C:/Windows/Fonts/arialbd.ttf"
f = lambda size, bold=False: ImageFont.truetype(BOLD if bold else FONT, size)


def px(x, y):
    return PAD_L + (x - X0) * S, PAD_T + (Y1 - y) * S


xs = X0 + (np.arange(MAP_W) + .5) / S
ys = Y1 - (np.arange(MAP_H) + .5) / S
GX, GY = np.meshgrid(xs, ys)
Z = terrain(GX, GY)
dzdx = np.gradient(Z, axis=1) * S; dzdy = -np.gradient(Z, axis=0) * S
slope = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
light = np.array([-1, 1, 1.4]); light /= np.linalg.norm(light)
nx, ny, nz = -dzdx, -dzdy, np.ones_like(Z)
shade = (nx * light[0] + ny * light[1] + nz * light[2]) / np.sqrt(nx ** 2 + ny ** 2 + 1)
t = (Z - Z.min()) / (Z.max() - Z.min())
low, high = np.array([96, 128, 88]), np.array([196, 190, 150])
rgb = (low[None, None] * (1 - t[..., None]) + high[None, None] * t[..., None]) * (0.55 + 0.45 * shade[..., None])
steep = np.clip((slope - 15) / 15, 0, 1)[..., None]  # >30° slopes turn rocky grey
rgb = rgb * (1 - steep * .6) + np.array([150, 145, 138]) * steep * .6
c5 = np.floor(Z / 5); c25 = np.floor(Z / 25)
edge5 = (np.diff(c5, axis=0, prepend=c5[:1]) != 0) | (np.diff(c5, axis=1, prepend=c5[:, :1]) != 0)
edge25 = (np.diff(c25, axis=0, prepend=c25[:1]) != 0) | (np.diff(c25, axis=1, prepend=c25[:, :1]) != 0)
rgb[edge5] = rgb[edge5] * .82
rgb[edge25] = rgb[edge25] * .55
img = Image.new("RGB", (W, H), (241, 240, 234))
img.paste(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)), (PAD_L, PAD_T))
d = ImageDraw.Draw(img)

# grid + ticks
for gx in range(int(math.ceil(X0 / 100) * 100), int(X1) + 1, 100):
    a = px(gx, Y0); b = px(gx, Y1)
    d.line([a, b], fill=(255, 255, 255), width=1)
    d.text((a[0] - 14, a[1] + 6), str(gx), font=f(14), fill=(60, 60, 60))
for gy in range(int(math.ceil(Y0 / 100) * 100), int(Y1) + 1, 100):
    a = px(X0, gy); b = px(X1, gy)
    d.line([a, b], fill=(255, 255, 255), width=1)
    d.text((a[0] - 48, a[1] - 8), str(gy), font=f(14), fill=(60, 60, 60))

# river
yy = np.linspace(Y0, Y1, 400)
left = [px(river_x(v) - RIVER_WATER_WIDTH / 2, v) for v in yy]
right = [px(river_x(v) + RIVER_WATER_WIDTH / 2, v) for v in yy[::-1]]
d.polygon(left + right, fill=(70, 130, 170))
lbl = px(river_x(1600) + 12, 1600)
d.text(lbl, "H-01 Ana Dere\n(su ~10 m, VARSAYIM)", font=f(15, True), fill=(30, 70, 110))

# roads (over-limit stretches outlined red)
def clipped(pts):
    line = LineString(pts).intersection(site)
    parts = [] if line.is_empty else (list(line.geoms) if hasattr(line, "geoms") else [line])
    return [[px(*c) for c in part.coords] for part in parts]

for road in roads:
    w = max(2, int(road["width"] * S))
    for pts in clipped(road["pts"]):
        d.line(pts, fill=(70, 55, 40), width=w + 4, joint="curve")
for road in roads:
    for pts in clipped(road["pts"]):
        d.line(pts, fill=(222, 196, 150), width=max(2, int(road["width"] * S)), joint="curve")
for road in roads:
    for a, b, g in road["profile"]:
        if g > road["limit"]:
            d.line([px(*a), px(*b)], fill=(200, 40, 40), width=max(2, int(road["width"] * S * .45)))

# bridge B1
bx, by = MASTER["nodes"]["B1"]["xy"]
d.rectangle([px(bx - 14, by + 4), px(bx + 14, by - 4)], fill=(150, 150, 150), outline=(40, 40, 40), width=2)
d.text(px(bx - 30, by + 26), "B1 Köprü (R01)\ntabliye ~5,5 m", font=f(15, True), fill=(20, 20, 20))

# buildings: parcels, pads coloured by level difference
def sev_color(diff):
    return (60, 160, 80) if diff < 1.0 else (230, 180, 40) if diff < 2.5 else (210, 60, 50)

for b in buildings:
    x, y = b["xy"]
    if b["parcel"]:
        pw, ph = b["parcel"]
        a, c = px(x - pw / 2, y + ph / 2), px(x + pw / 2, y - ph / 2)
        for i in range(int(a[0]), int(c[0]), 8):
            d.line([(i, a[1]), (min(i + 4, c[0]), a[1])], fill=(255, 255, 255), width=2)
            d.line([(i, c[1]), (min(i + 4, c[0]), c[1])], fill=(255, 255, 255), width=2)
        for j in range(int(a[1]), int(c[1]), 8):
            d.line([(a[0], j), (a[0], min(j + 4, c[1]))], fill=(255, 255, 255), width=2)
            d.line([(c[0], j), (c[0], min(j + 4, c[1]))], fill=(255, 255, 255), width=2)
    if b["footprint"] is None:
        continue
    w, h = b["footprint"]
    m = PAD_MARGIN
    d.rectangle([px(x - w / 2 - m, y + h / 2 + m), px(x + w / 2 + m, y - h / 2 - m)], outline=sev_color(b["level_diff_m"]), width=3)
    fill = {"poi": (160, 70, 50), "house": (183, 114, 85), "outbuilding": (149, 130, 105)}[b["kind"]]
    d.rectangle([px(x - w / 2, y + h / 2), px(x + w / 2, y - h / 2)], fill=fill, outline=(245, 230, 205), width=1)

for b in buildings:
    x, y = b["xy"]
    if b["kind"] == "poi":
        text = f'{b["id"]} {b["name"]}'
        bbox = d.textbbox((0, 0), text, font=f(15, True))
        p = px(x, y + (b["parcel"][1] / 2) + 6)
        d.rectangle([p[0] - 4, p[1] - bbox[3] - 6, p[0] + bbox[2] + 4, p[1] - 2], fill=(255, 252, 240), outline=(60, 60, 60))
        d.text((p[0], p[1] - bbox[3] - 4), text, font=f(15, True), fill=(20, 20, 20))
    elif b["kind"] == "house":
        d.text(px(x + 8, y + 4), b["id"][-3:], font=f(12), fill=(30, 30, 30))

# road labels
for road in roads:
    line = LineString(road["pts"]).intersection(site)
    if line.is_empty:
        continue
    mid = (line.geoms[0] if hasattr(line, "geoms") else line).interpolate(.5, normalized=True)
    d.text(px(mid.x + 6, mid.y + 6), f'{road["id"]} ({road["width"]:g} m)', font=f(13, True), fill=(60, 40, 20))

# north + scale
nx0, ny0 = PAD_L + MAP_W - 50, PAD_T + 40
d.polygon([(nx0, ny0 - 26), (nx0 - 10, ny0), (nx0 + 10, ny0)], fill=(30, 30, 30))
d.text((nx0 - 6, ny0 + 4), "K", font=f(18, True), fill=(30, 30, 30))
sx, sy = PAD_L + 30, PAD_T + MAP_H - 40
for i in range(4):
    d.rectangle([sx + i * 25 * S, sy, sx + (i + 1) * 25 * S, sy + 8], fill=(30, 30, 30) if i % 2 == 0 else (250, 250, 250), outline=(30, 30, 30))
d.text((sx, sy + 12), "0      25      50      75     100 m", font=f(13), fill=(30, 30, 30))

# header
d.rectangle([0, 0, W, 84], fill=(24, 48, 52))
d.text((30, 14), "RIDGEBOUND  V0 DEREKAVAK — GREYBOX SAHNE PLANI (ONAY 1)", font=f(30, True), fill=(250, 245, 230))
d.text((30, 54), "Kaynak: SPATIAL_MASTER v0.3 (SHA 04bf826f…) + masterın analitik arazisi • 1010 × 920 m • eş yükselti 5 m / kalın 25 m", font=f(16), fill=(190, 205, 200))

# side panel
px0 = PAD_L + MAP_W + 40
y = PAD_T
def line_text(text, size=16, bold=False, color=(30, 30, 30), gap=6):
    global y
    d.text((px0, y), text, font=f(size, bold), fill=color)
    y += size + gap

line_text("Lejant", 22, True)
for color, text in [((60, 160, 80), "Zemin farkı < 1 m: ped yeterli"), ((230, 180, 40), "1–2,5 m: kazı/dolgu + basamak"), ((210, 60, 50), "> 2,5 m: taş istinat duvarı")]:
    d.rectangle([px0, y + 3, px0 + 18, y + 17], outline=color, width=3); d.text((px0 + 28, y), text, font=f(16), fill=(30, 30, 30)); y += 24
d.rectangle([px0, y + 3, px0 + 40, y + 13], fill=(222, 196, 150), outline=(70, 55, 40)); d.text((px0 + 50, y), "Yol (kırmızı: eğim hedefin üstünde)", font=f(16), fill=(30, 30, 30)); y += 34

line_text("Yollar — eğim ölçümü (10 m pencere)", 20, True)
for r in road_report:
    color = (180, 40, 40) if r["over_limit_m"] > 0 else (30, 110, 50)
    line_text(f'{r["id"]}: {r["length_in_site_m"]} m, en dik %{r["max_grade_percent"]} (hedef %{r["limit_percent"]:g}), aşan ~{r["over_limit_m"]} m', 15, False, color, 4)
y += 12
line_text("Yapı zeminleri", 20, True)
poi = [b for b in buildings if b["kind"] == "poi"]
for b in poi:
    fp = "açık alan" if b["footprint"] is None else f'{b["footprint"][0]:g}×{b["footprint"][1]:g} m'
    line_text(f'{b["id"]} {b["name"]}: {fp}, ped Z {b["pad_z"]:.0f} m, fark {b["level_diff_m"]:.1f} m', 15, False, (30, 30, 30), 4)
houses = [b for b in buildings if b["kind"] == "house"]
sheds = [b for b in buildings if b["kind"] == "outbuilding"]
for label, group in [("24 ev", houses), ("12 müştemilat", sheds)]:
    counts = [sum(1 for b in group if b["level_diff_m"] < 1), sum(1 for b in group if 1 <= b["level_diff_m"] < 2.5), sum(1 for b in group if b["level_diff_m"] >= 2.5)]
    line_text(f'{label}: {counts[0]} ped / {counts[1]} kazı-dolgu / {counts[2]} istinat; en çok {max(b["level_diff_m"] for b in group):.1f} m', 15, False, (30, 30, 30), 4)
y += 12
line_text("Varsayımlar (masterda yok, onay bekler)", 20, True, (150, 70, 30))
for text in [f"• Dere su genişliği ~{RIVER_WATER_WIDTH:g} m",
             "• Yerel yollar 4,5 m; depo/servis kolları 5 m, eğim hedefi %10",
             "• POI-01 aile evi 12×7,5 m (tasarım panosu)",
             "• Ped = ayak izi + 2 m düz alan, kotu zemin ortalaması",
             "• Yapılar kuzeye hizalı (dönüş masterda yok)",
             "• Cami/minare yok (sonra karar)"]:
    line_text(text, 15, False, (90, 60, 30), 4)
y += 12
line_text("Kapsam dışı (bu sahnede yok)", 20, True)
for text in ["• V1–V4, R02/R04–R06, B2, H-02 (6×6 km vadi)", "• Yol kazı/dolgu ve köprü yapısal doğrulaması"]:
    line_text(text, 15, False, (80, 80, 80), 4)

d.text((PAD_L, PAD_T + MAP_H + 20), "Koordinatlar masterdandır; resimden okunmadı. Konutlar (RES/OUT) masterın v0.3 aday katmanıdır, POI değildir. Greybox bu planı birebir izler.", font=f(15), fill=(90, 60, 40))

img.save(OUT / "DEREKAVAK_V0_SAHNE_PLANI.png", optimize=True)
measure = {"source_master_sha256": "04bf826f5a11724ee15995c482e45abdc3928564f52b2f91d6361c6db9b2c80a",
           "assumptions": {"river_water_width_m": RIVER_WATER_WIDTH, "local_road_width_m": LOCAL_ROAD_WIDTH, "poi01_footprint_m": POI01_FOOTPRINT, "pad_margin_m": PAD_MARGIN},
           "roads": road_report,
           "buildings": [{k: b[k] for k in ("id", "kind", "xy", "footprint", "pad_z", "cut_m", "fill_m", "level_diff_m")} for b in buildings],
           "terrain_z_range_m": [round(float(Z.min()), 1), round(float(Z.max()), 1)]}
(OUT / "derekavak_plan_measurements.json").write_text(json.dumps(measure, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"roads": road_report, "z": measure["terrain_z_range_m"]}, ensure_ascii=False, indent=1))
