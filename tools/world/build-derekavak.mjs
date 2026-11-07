// V0 Derekavak greybox scene (approval 2), built once from
// docs/world/derekavak/RIDGEBOUND_SPATIAL_MASTER_v0.3.json and the decisions in
// docs/world/derekavak/DEREKAVAK_V0_SAHNE_PLANI.md. Terrain codecs, bakes and
// save validators come from the live Forge source, never copied here.
//
//   node tools/world/build-derekavak.mjs           writes the new level (refuses to overwrite)
//   node tools/world/build-derekavak.mjs --force   rebuilds it, discarding editor changes
//
// The scene is handed to the user afterwards and edited by hand; it is not meant
// to be regenerated. Writes docs/world/derekavak/derekavak_build_report.json.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
Error.stackTraceLimit = 0;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const publicRoot = resolve(root, "public");
const docs = resolve(root, "docs/world/derekavak");
const LEVEL = "assets/Maps/Derekavak.level.json";
const TERRAIN_ID = "derekavak";
const force = process.argv.includes("--force");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const inside = (path) => {
  const target = resolve(publicRoot, path);
  if (!target.startsWith(publicRoot + sep)) throw new Error(`Outside content root: ${path}`);
  return target;
};
const write = (path, bytes) => { const target = inside(path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes); };
if (existsSync(inside(LEVEL)) && !force) throw new Error(`${LEVEL} exists and may hold editor changes; pass --force to rebuild it from the master.`);

// ---- Forge API -------------------------------------------------------------------------
const local = existsSync(resolve(root, "forge.local.json")) ? JSON.parse(readFileSync(resolve(root, "forge.local.json"), "utf8")) : {};
const forgeRoot = resolve(root, process.env.FORGE_ROOT ?? local.forgeRoot ?? "../../Forge");
const { build } = createRequire(resolve(forgeRoot, "package.json"))("esbuild");
const exportsFrom = {
  "engine/terrain/worldTerrainCreate": ["createFlatWorldTerrain"],
  "engine/terrain/terrainEdit": ["createTerrainEditWorld", "applyTerrainUndoPatches", "quantizeTerrainWeights"],
  "engine/terrain/terrainHeightQuery": ["terrainHeightAt"],
  "engine/terrain/terrainSplines": ["createTerrainSplinePatches"],
  "engine/terrain/terrainPads": ["createTerrainPadPatches"],
  "engine/terrain/terrainTileCodec": ["encodeTerrainTile"],
  "engine/terrain/terrainTypes": ["createFlatTerrainTile", "terrainTilePath", "terrainTileHeightRange", "terrainGlobalMapPath", "levelTerrainDir"],
  "engine/terrain/terrainGlobalMapFile": ["encodeTerrainGlobalMap"],
  "engine/terrain/terrainRenderSource": ["buildTerrainGlobalAttributes", "worldTerrainRenderSource"],
  "engine/terrain/terrainDefinition": ["normalizeWorldTerrain"],
  "engine/terrain/worldTerrainActor": ["worldTerrainActorPosition"],
  "engine/scene/foliage": ["foliageDataPath", "normalizeFoliageData"],
  "engine/scene/shapes": ["SHAPE_PRIMITIVE_SIZE"],
  "tools/saveValidator": ["validateSavePayload", "validateFoliageData"],
};
const bundle = await build({
  bundle: true, write: false, platform: "node", format: "esm", tsconfig: resolve(forgeRoot, "tsconfig.json"), logLevel: "error",
  stdin: { contents: Object.entries(exportsFrom).map(([path, names]) => `export {${names.join(",")}} from ${JSON.stringify(`./${path}.ts`)};`).join("\n"), resolveDir: forgeRoot, loader: "ts" },
});
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

// ---- master + frame --------------------------------------------------------------------
const master = JSON.parse(readFileSync(resolve(docs, "RIDGEBOUND_SPATIAL_MASTER_v0.3.json"), "utf8"));
if (master.version !== "0.3") throw new Error("expected SPATIAL_MASTER v0.3");
// Forge world: x = X - CX, z = CY - Y (north is -Z), y = master Z (metres, local datum).
const CX = 3795, CY = 1250;
const toWorld = ([X, Y]) => [X - CX, CY - Y];
const toMaster = (x, z) => [x + CX, CY - z];
const [SX0, SX1, SY0, SY1] = master.site_extent_m;
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const round = (v, d = 3) => Number(v.toFixed(d));

// The master's analytic ground: the frozen v0.2 producer as in RIDGEBOUND_generate_v0_site_v0.3.py.
const SIDE = master.hydrology["H-02"].pts;
const SEG = SIDE.slice(1).map((b, i) => Math.hypot(b[0] - SIDE[i][0], b[1] - SIDE[i][1]));
const CUM = SEG.reduce((acc, s) => [...acc, acc[acc.length - 1] + s], [0]);
const TOTAL = CUM[CUM.length - 1];
const riverX = (Y) => 3430 + 125 * Math.sin(2 * Math.PI * Y / 3100 + 0.8) + 0.03 * (Y - 1000);
const riverBed = (Y) => 140 + 0.0525 * Y;
function masterZ(X, Y) {
  const dm = Math.abs(X - riverX(Y));
  let best = Infinity, remaining = 0;
  for (let i = 0; i < SEG.length; i++) {
    const [ax, ay] = SIDE[i], [bx, by] = SIDE[i + 1], vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((X - ax) * vx + (Y - ay) * vy) / (vx * vx + vy * vy)));
    const ds2 = (X - ax - t * vx) ** 2 + (Y - ay - t * vy) ** 2;
    if (ds2 < best) { best = ds2; remaining = TOTAL - (CUM[i] + t * SEG[i]); }
  }
  const base = 148 + 0.0525 * Y + 149 * (1 - Math.exp(-((dm / 930) ** 2)));
  const hills = 62 * Math.exp(-(((X - 800) / 1000) ** 2 + ((Y - 5400) / 1450) ** 2))
    + 39 * Math.exp(-(((X - 4950) / 770) ** 2 + ((Y - 2460) / 1200) ** 2))
    + 25 * Math.exp(-(((X - 1560) / 850) ** 2 + ((Y - 2550) / 900) ** 2));
  return Math.min(base + hills, 140 + 0.0525 * Y + 0.002 * dm * dm, 140 + 0.0525 * 3200 + 0.05 * remaining + 0.003 * best);
}

// ---- decisions and assumptions (DEREKAVAK_V0_SAHNE_PLANI.md) ---------------------------
const RIVER = { surfaceAboveBed: 0.3, depth: 1.2, flatHalf: 3, bank: 5, splineWidth: 12 };
const ROADS = [
  { id: "R01", name: "R01 Köprü yolu", pts: master.routes.R01.pts, width: master.routes.R01.design_width_m, grade: master.routes.R01.target_max_abs_grade_percent },
  { id: "R03", name: "R03 Köprüdibi yolu", pts: master.routes.R03.pts, width: master.routes.R03.design_width_m, grade: master.routes.R03.target_max_abs_grade_percent },
  { id: "konut-terasi", name: "Konut terası", pts: master.local_roads["Konut terası"], width: 4.5, grade: 12 },
  { id: "merkez-erisimi", name: "Merkez erişimi", pts: master.local_roads["Merkez erişimi"], width: 4.5, grade: 12 },
  { id: "isletme-kolu", name: "İşletme kolu", pts: master.local_roads["İşletme kolu"], width: 5, grade: 10 },
  { id: "depo-girisi", name: "Depo girişi", pts: master.local_roads["Depo girişi"], width: 5, grade: 10 },
  { id: "dis-baglanti", name: "Dış bağlantı", pts: master.local_roads["Dış bağlantı"], width: 5, grade: 12 },
];
const ROAD_FALLOFF = 4;
const CONNECT_WITHIN = 45;
const BRIDGE = { node: master.nodes.B1.xy, halfSpan: 18, deck: riverBed(master.nodes.B1.xy[1]) + master.bridges.B1.deck_above_bed_candidate_m, width: 7 };
const PAD = { margin: 2, falloff: 1, wallAt: 0.8, wallThickness: 0.6 };
const KINDS = {
  ev: { height: 7.5, color: "#c46a4a" }, depo: { height: 8, color: "#6f7f8f" }, tamir: { height: 6, color: "#7f6a55" },
  kahve: { height: 4.5, color: "#b08050" }, okul: { height: 7, color: "#d0c4a4" },
  house: { height: 6.5, color: "#b9a58b" }, outbuilding: { height: 3.5, color: "#8f7b61" },
};
const POI01_FOOTPRINT = [12, 7.5];
const COLORS = { wall: "#9a978e", bridge: "#8c8c88", terraceWall: "#a29d92" };
// Mountain relief around the village (approval 2 decision: the master's single slope gets
// steep ridges outside the village; the village, its roads and the river stay as planned).
// Each protected source holds the ground exactly within `inner` metres and reaches full
// relief `falloff` metres further out. Ridged multifractal noise: sharp crests, smooth
// hollows; the spurs run across the valley (east-west), down towards the river.
const RELIEF = {
  seed: 20261107, lift: 40, amplitude: 300, wavelength: 650, octaves: 5, gain: 0.42, spurStretch: 0.55, warp: 160, maskStep: 8,
  sites: { inner: 60, falloff: 320 }, sitesRaw: { inner: 45, falloff: 40 }, siteBlurCells: 6,
  roads: { inner: 18, falloff: 220 }, river: { inner: 22, falloff: 260 },
};
function gradientNoise(seed) {
  const hash = (a, b) => {
    let n = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(seed, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296 * 2 * Math.PI;
  };
  const grad = (a, b, dx, dz) => { const angle = hash(a, b); return Math.cos(angle) * dx + Math.sin(angle) * dz; };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fade(fx), v = fade(fz);
    const top = grad(ix, iz, fx, fz) * (1 - u) + grad(ix + 1, iz, fx - 1, fz) * u;
    const bottom = grad(ix, iz + 1, fx, fz - 1) * (1 - u) + grad(ix + 1, iz + 1, fx - 1, fz - 1) * u;
    return Math.max(-1, Math.min(1, (top * (1 - v) + bottom * v) * 1.5));
  };
}
function createMountains(options) {
  const base = gradientNoise(options.seed), warpX = gradientNoise(options.seed + 1), warpZ = gradientNoise(options.seed + 2);
  return (x, z) => {
    const wx = x + options.warp * warpX(x / 700, z / 700), wz = z + options.warp * warpZ(x / 700 + 5.3, z / 700 + 9.1);
    let freq = 1 / options.wavelength, amp = 1, weight = 1, sum = 0, norm = 0;
    for (let octave = 0; octave < options.octaves; octave++) {
      let ridge = 1 - Math.abs(base(wx * freq * options.spurStretch + octave * 17.3, wz * freq - octave * 11.7));
      ridge *= ridge * weight;
      weight = Math.min(1, ridge * 1.6);
      sum += ridge * amp; norm += amp; amp *= options.gain; freq *= 2.1;
    }
    return sum / norm; // 0..1
  };
}

// ---- terrain: master ground + river channel ---------------------------------------------
const created = api.createFlatWorldTerrain({ name: "Derekavak V0", tilesX: 8, tilesZ: 8, tileQuads: 256, spacing: 1, baseHeight: 0, heightMin: 0, heightMax: 1000 });
const def = created.def;
def.layers = [
  { id: "meadow", name: "Meadow", color: "#6f9a4a", material: "lt-meadow", physicalMaterial: "default" },
  { id: "forest", name: "Forest Floor", color: "#3f4f2c", material: "starter-mat-grass", physicalMaterial: "default" },
  { id: "rock", name: "Rock", color: "#8b8a84", material: "lt-rock", physicalMaterial: "default" },
  { id: "earth", name: "Earth", color: "#8a6441", material: "lt-earth", physicalMaterial: "default" },
  { id: "mud", name: "River Bed", color: "#4a3626", material: "lt-wet-mud", physicalMaterial: "default" },
];
const LAYER = Object.fromEntries(def.layers.map((layer, index) => [layer.id, index]));
const TERRAIN_MIN = [def.origin[0], def.origin[2]];
const TERRAIN_MAX = [def.origin[0] + def.tilesX * def.tileQuads * def.spacing, def.origin[2] + def.tilesZ * def.tileQuads * def.spacing];
// Set once the road lines are known (below); until then the ground is the master's.
let reliefAt = () => 0;
function groundZ(X, Y) {
  const z = masterZ(X, Y) + reliefAt(X, Y);
  if (Math.abs(X - riverX(Y)) >= RIVER.flatHalf + RIVER.bank) return z; // the channel only exists beside the river
  const surface = riverBed(Y) + RIVER.surfaceAboveBed;
  const channel = surface - RIVER.depth + (RIVER.depth + 0.6) * smooth((Math.abs(X - riverX(Y)) - RIVER.flatHalf) / RIVER.bank);
  return Math.min(z, channel);
}

// ---- roads: master XY, designed vertical profile -----------------------------------------
const seg2 = (p, a, b) => {
  const vx = b[0] - a[0], vy = b[1] - a[1], len = vx * vx + vy * vy;
  const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len)) : 0;
  return { point: [a[0] + vx * t, a[1] + vy * t], dist: Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vy * t) };
};
const nearestOn = (p, pts) => pts.slice(1).reduce((best, b, i) => { const hit = seg2(p, pts[i], b); return hit.dist < best.dist ? hit : best; }, { dist: Infinity, point: null });
const inTerrain = ([X, Y], margin) => { const [x, z] = toWorld([X, Y]); return x > TERRAIN_MIN[0] + margin && x < TERRAIN_MAX[0] - margin && z > TERRAIN_MIN[1] + margin && z < TERRAIN_MAX[1] - margin; };
const entrances = Object.values(master.site_access_candidates).flatMap((entry) => [entry.pedestrian_entrance_xy, entry.vehicle_entrance_xy].filter(Boolean));
// Clip each line to the terrain (4 m inside its edge).
function clipLine(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const p = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n];
      if (inTerrain(p, 6)) out.push(p);
      else if (out.length) return out;
    }
  }
  return out;
}
const report = { connectors: [], roads: [], pads: [], walls: 0, warnings: [] };
for (const road of ROADS) road.line = clipLine(road.pts);
// A loose end near another road (not a POI entrance) is joined to it.
for (const road of ROADS) {
  for (const end of [0, 1]) {
    const p = end === 0 ? road.line[0] : road.line[road.line.length - 1];
    if (!inTerrain(p, 12) || entrances.some((e) => Math.hypot(e[0] - p[0], e[1] - p[1]) < 3)) continue;
    let best = null;
    for (const other of ROADS) {
      if (other === road) continue;
      const hit = nearestOn(p, other.line);
      if (!best || hit.dist < best.hit.dist) best = { other, hit };
    }
    if (!best || best.hit.dist < 1 || best.hit.dist > CONNECT_WITHIN) continue;
    const q = best.hit.point, n = Math.ceil(best.hit.dist / 2);
    const extra = Array.from({ length: n }, (_, k) => [p[0] + (q[0] - p[0]) * (k + 1) / n, p[1] + (q[1] - p[1]) * (k + 1) / n]);
    road.line = end === 0 ? [...extra.reverse(), ...road.line] : [...road.line, ...extra];
    report.connectors.push({ road: road.id, to: best.other.id, lengthM: round(best.hit.dist, 1), at: q.map((v) => round(v, 1)) });
  }
}
// ---- mountain relief: protection mask on a coarse grid, then seeded ridges -----------------
const reliefStats = { maxM: 0, peakZ: 0 };
{
  const mountains = createMountains(RELIEF);
  const discs = [
    ...Object.values(master.poi).map((poi) => [...toWorld(poi.xy), Math.hypot(...poi.parcel_wh_m) / 2]),
    ...[...master.settlement_fabric.residences, ...master.settlement_fabric.outbuildings]
      .map((b) => [...toWorld(b.xy_m), Math.hypot(...b.building_footprint_candidate_wh_m.map((v) => v + 2 * PAD.margin)) / 2]),
  ];
  const segs = ROADS.flatMap((road) => {
    const pts = road.line.filter((_, i) => i % 4 === 0 || i === road.line.length - 1).map(toWorld);
    return pts.slice(1).map((b, i) => [pts[i], b]);
  });
  const fade = (d, { inner, falloff }) => smooth((d - inner) / falloff);
  const step = RELIEF.maskStep;
  const nx = Math.round((TERRAIN_MAX[0] - TERRAIN_MIN[0]) / step) + 1, nz = Math.round((TERRAIN_MAX[1] - TERRAIN_MIN[1]) / step) + 1;
  // Distance to the nearest site, blurred so the protected village edge is one smooth
  // outline rather than a string of circles; the raw distance still holds every pad flat.
  const siteRaw = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = TERRAIN_MIN[0] + i * step, z = TERRAIN_MIN[1] + j * step;
      siteRaw[j * nx + i] = discs.reduce((best, [cx, cz, r]) => Math.min(best, Math.hypot(x - cx, z - cz) - r), Infinity);
    }
  }
  let siteBlur = siteRaw;
  for (let pass = 0; pass < 3; pass++) {
    for (const [len, stride, count, lineStride] of [[nx, 1, nz, nx], [nz, nx, nx, 1]]) {
      const out = new Float32Array(nx * nz), r = RELIEF.siteBlurCells;
      for (let line = 0; line < count; line++) {
        for (let k = 0; k < len; k++) {
          let sum = 0, n = 0;
          for (let o = Math.max(0, k - r); o <= Math.min(len - 1, k + r); o++) { sum += siteBlur[line * lineStride + o * stride]; n++; }
          out[line * lineStride + k * stride] = sum / n;
        }
      }
      siteBlur = out;
    }
  }
  const mask = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = TERRAIN_MIN[0] + i * step, z = TERRAIN_MIN[1] + j * step, [X, Y] = toMaster(x, z);
      const index = j * nx + i;
      let w = Math.min(fade(Math.abs(X - riverX(Y)), RELIEF.river), fade(siteBlur[index], RELIEF.sites), fade(siteRaw[index], RELIEF.sitesRaw));
      for (const [a, b] of segs) { if (w === 0) break; w = Math.min(w, fade(seg2([x, z], a, b).dist, RELIEF.roads)); }
      mask[index] = w;
    }
  }
  reliefAt = (X, Y) => {
    const [x, z] = toWorld([X, Y]);
    const fi = Math.max(0, Math.min(nx - 1.000001, (x - TERRAIN_MIN[0]) / step)), fj = Math.max(0, Math.min(nz - 1.000001, (z - TERRAIN_MIN[1]) / step));
    const i = Math.floor(fi), j = Math.floor(fj), tx = fi - i, tz = fj - j;
    const w = (mask[j * nx + i] * (1 - tx) + mask[j * nx + i + 1] * tx) * (1 - tz) + (mask[(j + 1) * nx + i] * (1 - tx) + mask[(j + 1) * nx + i + 1] * tx) * tz;
    return w > 0 ? w * (RELIEF.lift + RELIEF.amplitude * mountains(x, z)) : 0;
  };
}
// Anchors: crossings and joins share one height; the bridge ends sit at the deck. Roads are solved
// in order (R01, R03, then local roads): the first road through a crossing sets its height.
const anchors = []; // { at: [X,Y], z }
const addAnchor = (at, z) => { if (!anchors.some((a) => Math.hypot(a.at[0] - at[0], a.at[1] - at[1]) < 4)) anchors.push({ at, z }); };
const r01 = ROADS[0];
const bridgeIndex = r01.line.reduce((best, p, i) => (Math.hypot(p[0] - BRIDGE.node[0], p[1] - BRIDGE.node[1]) < Math.hypot(r01.line[best][0] - BRIDGE.node[0], r01.line[best][1] - BRIDGE.node[1]) ? i : best), 0);
const bridgeEnds = [-1, 1].map((sign) => r01.line[Math.max(0, Math.min(r01.line.length - 1, bridgeIndex + sign * BRIDGE.halfSpan / 2))]);
bridgeEnds.forEach((at) => addAnchor(at, BRIDGE.deck));
for (let i = 0; i < ROADS.length; i++) {
  for (let j = i + 1; j < ROADS.length; j++) {
    const [a, b] = [ROADS[i].line, ROADS[j].line];
    for (let s = 0; s < a.length - 1; s++) {
      for (let t = 0; t < b.length - 1; t++) {
        const hit = seg2(a[s], b[t], b[t + 1]);
        if (hit.dist < 1.5) addAnchor(hit.point, null);
      }
    }
  }
}
function designProfile(road) {
  const pts = road.line, n = pts.length;
  const s = [0]; for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const raw = pts.map((p) => groundZ(...p));
  const fixed = new Map();
  const onRoad = [];
  for (const anchor of anchors) {
    let best = -1, dist = 3;
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - anchor.at[0], p[1] - anchor.at[1]); if (d < dist) { dist = d; best = i; } });
    if (best < 0) continue;
    onRoad.push([anchor, best]);
    if (anchor.z !== null) fixed.set(best, anchor.z);
  }
  const bridge = road === r01 ? new Set(pts.map((p, i) => i).filter((i) => Math.abs(s[i] - s[bridgeIndex]) <= BRIDGE.halfSpan)) : new Set();
  for (const i of bridge) fixed.set(i, BRIDGE.deck);
  const g = road.grade / 100;
  let z = raw.map((v, i) => fixed.get(i) ?? v);
  const pass = () => {
    for (let i = 1; i < n; i++) if (!fixed.has(i)) z[i] = Math.max(z[i - 1] - g * (s[i] - s[i - 1]), Math.min(z[i - 1] + g * (s[i] - s[i - 1]), z[i]));
    for (let i = n - 2; i >= 0; i--) if (!fixed.has(i)) z[i] = Math.max(z[i + 1] - g * (s[i + 1] - s[i]), Math.min(z[i + 1] + g * (s[i + 1] - s[i]), z[i]));
  };
  for (let k = 0; k < 6; k++) pass();
  for (let k = 0; k < 3; k++) { // soften the clamp corners over ~10 m
    z = z.map((v, i) => (fixed.has(i) ? v : (z[Math.max(0, i - 2)] + z[Math.max(0, i - 1)] + v + z[Math.min(n - 1, i + 1)] + z[Math.min(n - 1, i + 2)]) / 5));
    pass();
  }
  for (const [anchor, i] of onRoad) if (anchor.z === null) anchor.z = z[i];
  let maxGrade = 0, cut = 0, fill = 0;
  for (let i = 1; i < n; i++) maxGrade = Math.max(maxGrade, Math.abs(z[i] - z[i - 1]) / (s[i] - s[i - 1]) * 100);
  raw.forEach((v, i) => { if (!bridge.has(i)) { cut = Math.max(cut, v - z[i]); fill = Math.max(fill, z[i] - v); } });
  return { s, z, raw, bridge, maxGrade, cut, fill };
}
const splines = [];
for (const road of ROADS) {
  const profile = designProfile(road);
  road.profile = profile;
  const step = 5; // spline points every ~10 m (samples are ~2 m apart)
  const indices = road.line.map((_, i) => i).filter((i) => i % step === 0 || i === road.line.length - 1);
  const points = indices.map((i, k) => {
    const [x, z] = toWorld(road.line[i]);
    return { id: `p${k}`, position: [round(x), round(profile.z[i]), round(z)], width: road.width, falloff: ROAD_FALLOFF };
  });
  const segments = points.slice(1).map((point, k) => {
    const onBridge = profile.bridge.has(indices[k]) && profile.bridge.has(indices[k + 1]);
    return {
      id: `s${k}`, startPointId: points[k].id, endPointId: point.id,
      deform: { enabled: !onBridge, raiseTerrain: true, lowerTerrain: true, flatten: true },
      paint: { enabled: !onBridge, layerId: "earth", strength: 1 },
    };
  });
  splines.push({ id: `road-${road.id.toLowerCase()}`, name: road.name, smooth: true, coordinateSpace: "world", points, segments });
  const over = profile.maxGrade > road.grade + 0.5;
  report.roads.push({ id: road.id, widthM: road.width, targetGradePercent: road.grade, maxGradePercent: round(profile.maxGrade, 1), maxCutM: round(profile.cut, 1), maxFillM: round(profile.fill, 1), lengthM: round(profile.s[profile.s.length - 1], 0), meetsTarget: !over });
  if (over) report.warnings.push(`${road.id}: anchors force ${round(profile.maxGrade, 1)}% (target ${road.grade}%)`);
}
// The river: a terrain spline at the water surface, north to south (downstream).
const riverPoints = [];
for (let Y = SY1 + 60; Y >= SY0 - 60; Y -= 40) {
  const [x, z] = toWorld([riverX(Y), Y]);
  if (x < TERRAIN_MIN[0] + 4 || x > TERRAIN_MAX[0] - 4 || z < TERRAIN_MIN[1] + 4 || z > TERRAIN_MAX[1] - 4) continue;
  riverPoints.push({ id: `p${riverPoints.length}`, position: [round(x), round(riverBed(Y) + RIVER.surfaceAboveBed), round(z)], width: RIVER.splineWidth, falloff: 2 });
}
splines.push({ id: "h01", name: "H-01 Ana Dere", smooth: true, coordinateSpace: "world", points: riverPoints,
  segments: riverPoints.slice(1).map((p, k) => ({ id: `s${k}`, startPointId: riverPoints[k].id, endPointId: p.id })) });

// ---- buildings, pads, walls --------------------------------------------------------------
function downhillYaw(X, Y) {
  // World gradient: d/dx = dZ/dX, d/dz = -dZ/dY. Local +Z (front) faces downhill.
  const gx = (masterZ(X + 2, Y) - masterZ(X - 2, Y)) / 4, gz = -(masterZ(X, Y + 2) - masterZ(X, Y - 2)) / 4;
  return Math.atan2(-gx, -gz) * 180 / Math.PI;
}
function frame(center, yawDeg) {
  const r = yawDeg * Math.PI / 180, ux = [Math.cos(r), -Math.sin(r)], uz = [Math.sin(r), Math.cos(r)];
  return (a, b) => [center[0] + ux[0] * a + uz[0] * b, center[1] + ux[1] * a + uz[1] * b];
}
const rect = (at, w, d) => [at(-w / 2, -d / 2), at(w / 2, -d / 2), at(w / 2, d / 2), at(-w / 2, d / 2)];
const sites = []; // { id, role, kind, center(world), yaw, padW, padD, building: {w,d,offsetZ} | null, terraces }
for (const [id, poi] of Object.entries(master.poi)) {
  const yaw = downhillYaw(...poi.xy);
  const [pw, pd] = [Math.max(...poi.parcel_wh_m), Math.min(...poi.parcel_wh_m)];
  const fp = id === "POI-01" ? POI01_FOOTPRINT : poi.building_footprint_candidate_wh_m;
  const building = fp ? { w: Math.max(...fp), d: Math.min(...fp) } : null;
  if (building) building.offsetZ = -(pd - building.d) / 2 + 3; // against the uphill edge, yard in front
  sites.push({ id, name: poi.name, role: `poi.${poi.kind}`, kind: poi.kind, center: toWorld(poi.xy), yaw, padW: pw, padD: pd, building, terraces: poi.kind === "meydan" ? 3 : 1 });
}
for (const h of master.settlement_fabric.residences) {
  const [w, d] = h.building_footprint_candidate_wh_m;
  sites.push({ id: h.id, name: h.id, role: "building.residential.house", kind: "house", center: toWorld(h.xy_m), yaw: downhillYaw(...h.xy_m), padW: w + 2 * PAD.margin, padD: d + 2 * PAD.margin, building: { w, d, offsetZ: 0 }, terraces: 1 });
}
for (const o of master.settlement_fabric.outbuildings) {
  const [w, d] = o.building_footprint_candidate_wh_m;
  sites.push({ id: o.id, name: o.id, role: "building.outbuilding", kind: "outbuilding", center: toWorld(o.xy_m), yaw: downhillYaw(...o.xy_m), padW: w + 2 * PAD.margin, padD: d + 2 * PAD.margin, building: { w, d, offsetZ: 0 }, terraces: 1 });
}
// Each site's terraces (one, or strips across the slope for the square).
for (const site of sites) {
  const at = frame(site.center, site.yaw);
  site.parts = Array.from({ length: site.terraces }, (_, k) => {
    const depth = site.padD / site.terraces, offset = -site.padD / 2 + depth * (k + 0.5);
    const sub = (a, b) => at(a, b + offset);
    return { at: sub, w: site.padW, d: depth, polygon: rect(sub, site.padW, depth) };
  });
}
// The relief must leave every pad, road and the river exactly as planned.
for (const site of sites) {
  for (const part of site.parts) {
    const lift = Math.max(...part.polygon.map(([x, z]) => reliefAt(...toMaster(x, z))));
    if (lift > 0.01) report.warnings.push(`${site.id}: mountain relief reaches its pad (${round(lift, 2)} m)`);
  }
}
for (const road of ROADS) {
  const lift = Math.max(...road.line.map((p) => reliefAt(...p)));
  if (lift > 0.01) report.warnings.push(`${road.id}: mountain relief reaches the road (${round(lift, 2)} m)`);
}
const pointInPolygon = ([x, z], poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
const padBoxes = sites.flatMap((site) => site.parts.map((part) => {
  const xs = part.polygon.map((p) => p[0]), zs = part.polygon.map((p) => p[1]);
  return { poly: part.polygon, minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}));
const inPad = (x, z, grow = 0) => padBoxes.some((b) => x >= b.minX - grow && x <= b.maxX + grow && z >= b.minZ - grow && z <= b.maxZ + grow && (grow > 0 || pointInPolygon([x, z], b.poly)));
// Road segments bucketed in 48 m cells: a query looks at its 3x3 cells only (beyond that the forest is full anyway).
const ROAD_CELL = 48;
const roadGrid = new Map();
for (const road of ROADS) {
  for (let i = 0; i < road.line.length - 1; i++) {
    const [a, b] = [toWorld(road.line[i]), toWorld(road.line[i + 1])];
    const key = `${Math.floor(a[0] / ROAD_CELL)}_${Math.floor(a[1] / ROAD_CELL)}`;
    roadGrid.set(key, [...(roadGrid.get(key) ?? []), [a, b, road.width]]);
  }
}
function roadDistance(x, z) {
  const cx = Math.floor(x / ROAD_CELL), cz = Math.floor(z / ROAD_CELL);
  let best = Infinity;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (const [a, b, w] of roadGrid.get(`${cx + dx}_${cz + dz}`) ?? []) best = Math.min(best, seg2([x, z], a, b).dist - w / 2);
  }
  return best;
}
// Open ground is measured from each pad's edge (centre minus half its diagonal), so large parcels clear too.
const siteReach = sites.map((site) => [site.center[0], site.center[1], Math.hypot(site.padW, site.padD) / 2]);

// ---- tiles: heights + paint ----------------------------------------------------------------
const tiles = def.tiles.map(({ key }) => { const { x, z } = created.tiles.get(key); return api.createFlatTerrainTile(def, x, z); });
const writeWeights = (tile, index, weights) => {
  api.quantizeTerrainWeights(weights).forEach((weight, layer) => { tile.weights[Math.floor(layer / 4) * tile.size * tile.size * 4 + index * 4 + layer % 4] = weight; });
};
// The whole ground once (shared tile edges, and the slope for rock comes from the final relief).
const GN = def.tilesX * def.tileQuads + 1;
const ground = new Float64Array(GN * GN);
for (let j = 0; j < GN; j++) {
  for (let i = 0; i < GN; i++) {
    const z = groundZ(...toMaster(def.origin[0] + i * def.spacing, def.origin[2] + j * def.spacing));
    ground[j * GN + i] = z;
    reliefStats.peakZ = Math.max(reliefStats.peakZ, z);
  }
}
const groundAt = (gi, gj) => ground[Math.max(0, Math.min(GN - 1, gj)) * GN + Math.max(0, Math.min(GN - 1, gi))];
for (const tile of tiles) {
  for (let j = 0; j < tile.size; j++) {
    for (let i = 0; i < tile.size; i++) {
      const gi = tile.x * def.tileQuads + i, gj = tile.z * def.tileQuads + j;
      const x = def.origin[0] + gi * def.spacing;
      const z = def.origin[2] + gj * def.spacing;
      const [X, Y] = toMaster(x, z);
      const index = j * tile.size + i;
      tile.heights[index] = groundAt(gi, gj);
      const slope = Math.atan(Math.hypot(groundAt(gi + 1, gj) - groundAt(gi - 1, gj), groundAt(gi, gj + 1) - groundAt(gi, gj - 1)) / (2 * def.spacing)) * 180 / Math.PI;
      const river = Math.abs(X - riverX(Y));
      const nearSite = siteReach.reduce((best, [cx, cz, r]) => Math.min(best, Math.hypot(x - cx, z - cz) - r), Infinity);
      const clearing = Math.min(nearSite - 45, roadDistance(x, z) - 20, river - 16);
      const rock = smooth((slope - 30) / 10);
      const mud = 1 - smooth((river - RIVER.flatHalf - 2) / 3);
      const earth = inPad(x, z) ? 1 : 0;
      const forest = smooth(clearing / 25) * (1 - mud) * (1 - earth);
      const open = (1 - rock) * (1 - mud) * (1 - earth);
      writeWeights(tile, index, [open * (1 - forest), open * forest, rock * (1 - mud) * (1 - earth), earth, mud]);
    }
  }
}
const world = api.createTerrainEditWorld(def, tiles);
const height = (x, z) => api.terrainHeightAt(def, world, x, z);

// Roads first (graded profiles), then every pad at the mean of the graded ground under it.
def.splines = splines;
for (const spline of splines) if (spline.id !== "h01") api.applyTerrainUndoPatches(world, api.createTerrainSplinePatches(world, spline));
const placements = []; // { assetId, placement }
const box = (id, role, name, center, yaw, w, d, bottom, top, color, collision = true) => placements.push({
  assetId: "shape:cube",
  placement: {
    id, role, name, color, rotation: [0, round(yaw, 2), 0],
    position: [round(center[0]), round((bottom + top) / 2), round(center[1])],
    scale: [round(w / api.SHAPE_PRIMITIVE_SIZE), round((top - bottom) / api.SHAPE_PRIMITIVE_SIZE), round(d / api.SHAPE_PRIMITIVE_SIZE)],
    ...(collision ? {} : { collision: false }),
  },
});
const sampleEdge = (from, to, n = 12) => Array.from({ length: n + 1 }, (_, k) => height(from[0] + (to[0] - from[0]) * k / n, from[1] + (to[1] - from[1]) * k / n));
const pads = [];
for (const site of sites) {
  site.levels = site.parts.map((part) => {
    const samples = [];
    for (let a = -part.w / 2; a <= part.w / 2; a += 1) for (let b = -part.d / 2; b <= part.d / 2; b += 1) samples.push(height(...part.at(a, b)));
    const level = samples.reduce((sum, v) => sum + v, 0) / samples.length;
    pads.push({ polygon: part.polygon, height: level, falloff: PAD.falloff });
    // Walls where the downhill (front, +Z) edge is filled or the uphill (back, -Z) edge is cut.
    const front = sampleEdge(part.at(-part.w / 2, part.d / 2), part.at(part.w / 2, part.d / 2));
    const back = sampleEdge(part.at(-part.w / 2, -part.d / 2), part.at(part.w / 2, -part.d / 2));
    const fill = level - Math.min(...front), cut = Math.max(...back) - level;
    return { level, fill, cut, part, min: Math.min(...samples), max: Math.max(...samples) };
  });
  report.pads.push({ id: site.id, kind: site.kind, levels: site.levels.map((l) => round(l.level, 2)), maxFillM: round(Math.max(...site.levels.map((l) => l.fill)), 2), maxCutM: round(Math.max(...site.levels.map((l) => l.cut)), 2) });
}
api.applyTerrainUndoPatches(world, api.createTerrainPadPatches(world, pads));
for (const site of sites) {
  site.levels.forEach(({ level, fill, cut, part }, k) => {
    const color = site.terraces > 1 ? COLORS.terraceWall : COLORS.wall;
    if (fill > PAD.wallAt) {
      box(`${site.id}-wall-front${site.terraces > 1 ? `-${k}` : ""}`, "structure.retainingWall", `${site.id} wall`, part.at(0, part.d / 2), site.yaw, part.w, PAD.wallThickness, level - fill - 0.5, level + 0.4, color);
      report.walls++;
    }
    if (cut > PAD.wallAt) {
      box(`${site.id}-wall-back${site.terraces > 1 ? `-${k}` : ""}`, "structure.retainingWall", `${site.id} wall`, part.at(0, -part.d / 2), site.yaw, part.w, PAD.wallThickness, level - 0.3, level + cut, color);
      report.walls++;
    }
  });
  if (!site.building) continue;
  const { level } = site.levels[0];
  const spec = KINDS[site.kind];
  const at = frame(site.center, site.yaw);
  box(site.id, site.role, site.name, at(0, site.building.offsetZ), site.yaw, site.building.w, site.building.d, level - 0.5, level + spec.height, spec.color);
}
// B1 bridge: deck over the channel, two piers.
{
  const [a, b] = bridgeEnds.map(toWorld);
  const center = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const yaw = Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) + 6;
  box("B1-deck", "structure.bridge", "B1 Aşağı Köprü", center, yaw, BRIDGE.width, length, BRIDGE.deck - 0.8, BRIDGE.deck, COLORS.bridge);
  for (const t of [-0.3, 0.3]) {
    const p = [center[0] + (b[0] - a[0]) * t, center[1] + (b[1] - a[1]) * t];
    box(`B1-pier-${t < 0 ? "a" : "b"}`, "structure.bridge", "B1 pier", p, yaw, BRIDGE.width - 1, 1.6, height(...p) - 1, BRIDGE.deck - 0.8, COLORS.bridge);
  }
}
const depot = sites.find((site) => site.id === "POI-02");
const yardAt = frame(depot.center, depot.yaw)(0, depot.padD / 2 - 9);
const yardY = height(...yardAt);

// ---- assets the scene needs from Forge (foliage types, materials) ---------------------------
const manifestPath = "assets/manifest.json";
const manifest = JSON.parse(readFileSync(inside(manifestPath), "utf8"));
const forgeManifest = JSON.parse(readFileSync(resolve(forgeRoot, "public/assets/manifest.json"), "utf8"));
const byId = new Map(forgeManifest.assets.map((entry) => [entry.id, entry]));
const copied = [];
const seen = new Set();
// Model sidecars carry what the manifest entry does not (material slots, collision, UVW).
const MODEL_SIDECARS = [".materials.json", ".collision.json", ".uvw.json"];
function visitRefs(value) {
  if (typeof value === "string") {
    if (byId.has(value)) addAsset(value);
    else if (value.startsWith("assets/")) { const dep = forgeManifest.assets.find((asset) => asset.path === value); if (dep) addAsset(dep.id); }
  } else if (value && typeof value === "object") Object.values(value).forEach(visitRefs);
}
function copyFile(path) {
  if (existsSync(inside(path))) return;
  write(path, readFileSync(resolve(forgeRoot, "public", path)));
  copied.push(path);
}
function addAsset(id) {
  if (seen.has(id)) return;
  seen.add(id);
  const entry = byId.get(id);
  if (!entry) throw new Error(`Unknown Forge asset: ${id}`);
  if (!manifest.assets.some((asset) => asset.id === id)) manifest.assets.push(entry);
  copyFile(entry.path);
  if (entry.path.endsWith(".json")) visitRefs(JSON.parse(readFileSync(resolve(forgeRoot, "public", entry.path), "utf8")));
  if (/\.(glb|gltf)$/.test(entry.path)) {
    for (const suffix of MODEL_SIDECARS) {
      const sidecar = entry.path.replace(/\.(glb|gltf)$/, suffix);
      if (!existsSync(resolve(forgeRoot, "public", sidecar))) continue;
      copyFile(sidecar);
      visitRefs(JSON.parse(readFileSync(resolve(forgeRoot, "public", sidecar), "utf8")));
    }
  }
}
for (const id of ["lt-meadow", "lt-earth", "lt-rock", "lt-wet-mud", "starter-mat-grass",
  "wp-conifer-a-type", "wp-conifer-b-type", "wp-conifer-c-type", "wp-bush-a-type", "wp-bush-b-type", "wp-grass-a-type"]) addAsset(id);
const plantRules = [
  ["forest-conifer-a", "forest", "wp-conifer-a-type", 0.0025, 0.6, 101], ["forest-conifer-b", "forest", "wp-conifer-b-type", 0.002, 0.45, 102],
  ["forest-conifer-c", "forest", "wp-conifer-c-type", 0.0015, 0.35, 106], ["forest-bush", "forest", "wp-bush-a-type", 0.0015, 0.5, 103],
  ["forest-bush-b", "forest", "wp-bush-b-type", 0.001, 0.5, 107], ["meadow-bush", "meadow", "wp-bush-a-type", 0.0006, 0.6, 104],
  ["meadow-grass", "meadow", "wp-grass-a-type", 0.02, 0.5, 105],
].map(([id, layerId, foliageTypeId, density, minWeight, seed]) => ({ id, landscapeId: TERRAIN_ID, layerId, foliageTypeId, density, minWeight, seed }));

// ---- level -------------------------------------------------------------------------------
const reference = JSON.parse(readFileSync(inside("assets/Maps/Landscape.level.json"), "utf8"));
const terrainPath = `${api.levelTerrainDir(LEVEL)}/${TERRAIN_ID}.terrain.json`;
const groups = new Map();
for (const { assetId, placement } of placements) groups.set(assetId, [...(groups.get(assetId) ?? []), placement]);
const riverStart = riverPoints[0].position[1];
const layout = {
  schema: 1, name: "Derekavak", loadGroups: [],
  instances: [
    { assetId: "marker:playerStart", placements: [{ name: "Player Start", position: [round(yardAt[0]), round(yardY + 2), round(yardAt[1])], rotationYDeg: round(depot.yaw, 1), scale: 1, collision: false }] },
    ...[...groups].map(([assetId, list]) => ({ assetId, placements: list })),
  ],
  characters: [],
  worldSettings: { staticObjectsCastShadow: true, viewDistance: 2000, gameMode: "forge.vehicle" },
  ...Object.fromEntries(["skyAtmosphere", "heightFog", "cloudLayer", "postProcess", "worldEnvironment", "lights"].filter((key) => reference[key] !== undefined).map((key) => [key, reference[key]])),
  landscapes: [{ id: TERRAIN_ID, name: "Derekavak V0", position: api.worldTerrainActorPosition(def), dataRef: terrainPath }],
  riverWaters: [{ id: "h01-water-1", name: "H-01 Ana Dere", landscapeRef: TERRAIN_ID, splineRef: "h01", coordinateSpace: "world", surfaceLevel: riverStart, reflectionQuality: "medium" }],
  actors: [{ classRef: "assets/vehicles/gaz52/Script_Gaz52.actor.json", name: "Gaz52", position: [round(yardAt[0] + 6), round(yardY + 1.2), round(yardAt[1])], rotationYDeg: round(depot.yaw + 90, 1), scale: 1 }],
};
const level = api.validateSavePayload({ layout }).layout;

// ---- files -------------------------------------------------------------------------------
for (const summary of def.tiles) {
  const tile = world.tiles.get(summary.key);
  const range = api.terrainTileHeightRange(tile);
  summary.minHeight = range.min; summary.maxHeight = range.max;
}
const tilesDir = resolve(inside(terrainPath), "..", `${TERRAIN_ID}.tiles`);
if (existsSync(tilesDir)) rmSync(tilesDir, { recursive: true });
for (const summary of def.tiles) write(api.terrainTilePath(terrainPath, summary.key), api.encodeTerrainTile(world.tiles.get(summary.key), { ...def, heightFormat: "f32" }));
write(api.terrainGlobalMapPath(terrainPath), api.encodeTerrainGlobalMap(def, api.buildTerrainGlobalAttributes(api.worldTerrainRenderSource(def, world.tiles))));
write(terrainPath, json(api.normalizeWorldTerrain(structuredClone(def))));
write(LEVEL, json(level));
write(api.foliageDataPath(LEVEL), json(api.validateFoliageData(api.normalizeFoliageData({ schema: 1, type: "foliage", groups: [], landscapeRules: plantRules }))));
const levelEntry = { id: "derekavak-level", name: "Derekavak.Level", assetType: "level", category: "Maps", path: LEVEL, tags: [], placeable: false,
  placement: { surface: "floor", snapToWall: false, allowRotation: false, allowScale: false },
  runtime: { loadGroup: "Maps", castShadow: false, receiveShadow: false, collision: false, bytes: Buffer.byteLength(json(level)) }, license: "Unknown" };
const existing = manifest.assets.findIndex((asset) => asset.id === levelEntry.id);
if (existing >= 0) manifest.assets[existing] = levelEntry; else manifest.assets.push(levelEntry);
write(manifestPath, json(manifest));

const fullReport = {
  builtFrom: { master: "RIDGEBOUND_SPATIAL_MASTER_v0.3.json", masterSha256: "04bf826f5a11724ee15995c482e45abdc3928564f52b2f91d6361c6db9b2c80a", frame: { CX, CY } },
  level: LEVEL, terrain: { tiles: def.tiles.length, spacingM: def.spacing, sizeM: [TERRAIN_MAX[0] - TERRAIN_MIN[0], TERRAIN_MAX[1] - TERRAIN_MIN[1]] },
  bridge: { deckZ: round(BRIDGE.deck, 2), lengthM: round(Math.hypot(...[0, 1].map((k) => toWorld(bridgeEnds[0])[k] - toWorld(bridgeEnds[1])[k])) + 6, 1) },
  relief: { ...RELIEF, peakZ: round(reliefStats.peakZ, 1) },
  placements: placements.length, copiedAssets: copied, ...report,
};
writeFileSync(resolve(docs, "derekavak_build_report.json"), json(fullReport));
console.log(JSON.stringify({ level: LEVEL, placements: placements.length, walls: report.walls, connectors: report.connectors, roads: report.roads, warnings: report.warnings, copied: copied.length }, null, 1));
