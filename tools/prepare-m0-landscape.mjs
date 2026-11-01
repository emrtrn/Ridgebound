// One-time Ridgebound content authoring. All terrain codecs, bake and World
// Builder stages come from the selected live Forge source, never copied here.
// Default: stage a reviewable plan. --apply: verify inputs, then install it.
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
Error.stackTraceLimit = 0; // Data-URL module stack traces otherwise print the bundle.

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(root, "public");
const staging = resolve(root, ".forge/m0-landscape");
const levelPath = "assets/Maps/Landscape.level.json";
const manifestPath = "assets/manifest.json";
const terrainPath = "assets/Maps/Landscape.landscapes/m0.terrain.json";
const recipePath = "assets/Maps/Landscape.worldrecipe.json";
const profilePath = "assets/Maps/Landscape.regionprofile.json";
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inside = (base, path) => {
  const target = resolve(base, path);
  if (!target.startsWith(base + sep)) throw new Error(`Outside content root: ${path}`);
  return target;
};
const write = async (path, bytes) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes); };
const currentHash = async (path) => existsSync(path) ? hash(await readFile(path)) : null;

if (process.argv.includes("--apply")) {
  const plan = JSON.parse(await readFile(resolve(staging, "plan.json"), "utf8"));
  // Preflight every output before writing any content. Never overwrite new edits.
  for (const output of plan.outputs) {
    if (await currentHash(inside(publicRoot, output.path)) !== output.before) throw new Error(`Content changed since plan: ${output.path}`);
    if (hash(await readFile(inside(staging, `files/${output.path}`))) !== output.after) throw new Error(`Staged bytes changed: ${output.path}`);
  }
  for (const output of plan.outputs) {
    const target = inside(publicRoot, output.path);
    if (output.before !== null) await write(inside(staging, `before/${output.path}`), await readFile(target));
    await write(target, await readFile(inside(staging, `files/${output.path}`)));
  }
  await write(resolve(staging, "applied.json"), json({ date: new Date().toISOString(), files: plan.outputs.length }));
  console.log(`Applied ${plan.outputs.length} content files; prior edited files retained under .forge/m0-landscape/before/.`);
  process.exit(0);
}

if (existsSync(resolve(staging, "applied.json"))) throw new Error("M0 content is already installed; edit it with Forge tools rather than regenerating over authored work.");
const local = existsSync(resolve(root, "forge.local.json")) ? JSON.parse(await readFile(resolve(root, "forge.local.json"), "utf8")) : {};
const forgeRoot = resolve(root, process.env.FORGE_ROOT ?? local.forgeRoot ?? "../../Forge");
const requireForge = createRequire(resolve(forgeRoot, "package.json"));
const { build } = requireForge("esbuild");
const exports = {
  "engine/terrain/worldTerrainCreate": ["createFlatWorldTerrain"],
  "engine/terrain/terrainEdit": ["createTerrainEditWorld", "applyTerrainUndoPatches"],
  "engine/terrain/terrainHeightQuery": ["terrainHeightAt"],
  "engine/terrain/terrainSplines": ["createTerrainSplinePatches"],
  "engine/terrain/terrainPads": ["createTerrainPadPatches"],
  "engine/terrain/terrainTileCodec": ["encodeTerrainTile", "decodeTerrainTile"],
  "engine/terrain/terrainTypes": ["terrainTilePath", "terrainTileHeightRange"],
  "engine/terrain/terrainGlobalMapFile": ["encodeTerrainGlobalMap"],
  "engine/terrain/terrainRenderSource": ["buildTerrainGlobalAttributes", "worldTerrainRenderSource"],
  "engine/terrain/terrainDefinition": ["normalizeWorldTerrain"],
  "engine/worldbuilder/recipe": ["createWorldRecipe", "normalizeWorldRecipe"],
  "engine/worldbuilder/regionProfile": ["normalizeRegionProfile"],
  "engine/worldbuilder/stages/index": ["createDefaultWorldStages"],
  "engine/worldbuilder/stage": ["planStage", "applyPlacementGroupChanges"],
  "engine/worldbuilder/buildings": ["PAD_FALLOFF"],
};
const bundle = await build({ bundle: true, write: false, platform: "node", format: "esm", tsconfig: resolve(forgeRoot, "tsconfig.json"), stdin: {
  contents: Object.entries(exports).map(([path, names]) => `export {${names.join(",")}} from ${JSON.stringify(`./${path}.ts`)};`).join("\n"),
  resolveDir: forgeRoot, loader: "ts",
} });
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const levelBytes = await readFile(inside(publicRoot, levelPath));
const level = JSON.parse(levelBytes);
if (level.landscapes?.length || level.actors?.length) throw new Error("Landscape already has authored terrain/actors; refusing initial setup.");
const manifest = JSON.parse(await readFile(inside(publicRoot, manifestPath), "utf8"));
const forgeManifest = JSON.parse(await readFile(resolve(forgeRoot, "public/assets/manifest.json"), "utf8"));
const byId = new Map(forgeManifest.assets.map((entry) => [entry.id, entry]));
const outputs = new Map();
const selected = new Map();
async function addAsset(id) {
  if (selected.has(id)) return;
  const entry = byId.get(id);
  if (!entry) throw new Error(`Unknown Forge asset: ${id}`);
  selected.set(id, entry);
  const path = entry.path;
  const bytes = await readFile(inside(resolve(forgeRoot, "public"), path));
  outputs.set(path, bytes);
  // Only references in actual content, not provenance/source metadata.
  if (path.endsWith(".json")) {
    const visit = async (value) => {
      if (typeof value === "string") {
        if (byId.has(value)) await addAsset(value);
        else if (value.startsWith("assets/")) {
          const dependency = forgeManifest.assets.find((asset) => asset.path === value);
          if (!dependency) throw new Error(`Unregistered dependency: ${value}`);
          await addAsset(dependency.id);
        }
      } else if (value && typeof value === "object") for (const child of Object.values(value)) await visit(child);
    };
    await visit(JSON.parse(bytes));
  }
  if (path.endsWith(".glb")) {
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"));
    if ([...(gltf.buffers ?? []), ...(gltf.images ?? [])].some((item) => item.uri && !item.uri.startsWith("data:"))) throw new Error("Inspect external GLB dependencies before copying");
  }
}
for (const id of ["script-gaz52-actor", "gaz-52-vehicle", "starter-mat-grass", "lt-earth", "lt-rock", "lt-wet-mud"]) await addAsset(id);
for (const entry of selected.values()) {
  const existing = manifest.assets.find((asset) => asset.id === entry.id || asset.path === entry.path);
  if (existing && JSON.stringify(existing) !== JSON.stringify(entry)) throw new Error(`Existing manifest entry conflicts: ${entry.id}`);
  if (!existing) manifest.assets.push(entry);
}

// Authored M0 relief, 512 m square. Numbers are prototype content, not M1
// acceptance targets. Existing Forge terrain creation/codec/bake do the work.
const base = api.createFlatWorldTerrain({ name: "Ridgebound M0", tilesX: 2, tilesZ: 2, tileQuads: 128, spacing: 2, baseHeight: 0, heightMin: -16, heightMax: 96 });
base.def.layers = [
  { id: "grass", name: "Grass", color: "#5f9449", material: "starter-mat-grass", physicalMaterial: "default" },
  { id: "earth", name: "Earth", color: "#8a6441", material: "lt-earth", physicalMaterial: "default" },
  { id: "rock", name: "Rock", color: "#7f8485", material: "lt-rock", physicalMaterial: "default" },
  { id: "mud", name: "Mud", color: "#4a3626", material: "lt-wet-mud", physicalMaterial: "default" },
];
const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const relief = (x, z) => 8 + 0.015 * (x + 200) + 32 * smooth((Math.abs(z - 15 * Math.sin(x / 90)) - 125) / 120)
  + 5 * smooth((Math.abs(x) - 190) / 66) + 1.4 * Math.sin(x / 70) * Math.sin(z / 65);
for (const tile of base.tiles.values()) {
  tile.layerCount = 4;
  tile.weights = new Uint8Array(tile.size * tile.size * 4);
  for (let z = 0; z < tile.size; z++) for (let x = 0; x < tile.size; x++) {
    const wx = base.def.origin[0] + (tile.x * base.def.tileQuads + x) * base.def.spacing;
    const wz = base.def.origin[2] + (tile.z * base.def.tileQuads + z) * base.def.spacing;
    const index = z * tile.size + x;
    tile.heights[index] = relief(wx, wz);
    const rock = Math.round(210 * smooth((tile.heights[index] - 23) / 22));
    tile.weights[index * 4] = 255 - rock;
    tile.weights[index * 4 + 2] = rock;
  }
}
const world = api.createTerrainEditWorld(base.def, base.tiles.values());
const height = (x, z) => api.terrainHeightAt(world.def, world, x, z);
let recipe = api.createWorldRecipe("ridgebound-m0", 52);
recipe.regionProfile = profilePath;
recipe.plan.settlements = [
  { id: "depot", source: "manual", center: [-155, -65], radius: 64, type: "hamlet", population: 3, program: { add: [{ role: "building.transport.depot", count: 1, siting: "entrance" }] } },
  { id: "delivery", source: "manual", center: [170, 50], radius: 64, type: "hamlet", population: 0, program: { add: [{ role: "building.transport.delivery", count: 1, siting: "entrance" }] } },
];
recipe.plan.landmarks = [
  { id: "depot-board", source: "manual", kind: "logistics.depot", position: [-165, -40], settlement: "depot" },
  { id: "delivery-point", source: "manual", kind: "logistics.delivery", position: [150, 50], settlement: "delivery" },
];
recipe.plan.roadGraph.nodes = [
  { id: "depot-road", source: "manual", position: [-210, -30], kind: "end" },
  { id: "delivery-road", source: "manual", position: [200, 100], kind: "end" },
];
recipe.plan.roadGraph.edges = [
  { id: "main-route", source: "manual", from: "depot-road", to: "delivery-road", roadClass: "local", guide: [[-120, -90], [-50, -115], [35, -100], [105, -50]] },
  { id: "short-route", source: "manual", from: "depot-road", to: "delivery-road", roadClass: "track", guide: [[-40, 25], [60, 30]] },
];
const parcel = { frontage: [16, 24], depth: [22, 32], setback: 3, coverage: 0.45 };
const role = (landUse, w, d, h) => ({ landUse, footprint: { width: w, depth: d }, storeys: [1, 1], storeyHeight: h, entrance: "street", placeholderColor: "#a8adb0" });
const profileData = {
  schemaVersion: 1, id: "ridgebound-m0", label: "Ridgebound M0 graybox", traffic: { side: "right" },
  roads: {
    local: { width: 8, shoulder: 1, maxSlopeDeg: 12, minTurnRadius: 14, surfaceLayer: "earth" },
    track: { width: 5, shoulder: 0.5, maxSlopeDeg: 18, minTurnRadius: 10, surfaceLayer: "earth" },
  },
  streetPattern: { linear: 0, grid: 0, organic: 1, radial: 0, contourFollow: 0, blockSize: [35, 60] },
  parcels: { residential: parcel, industrial: { ...parcel, frontage: [24, 30], depth: [30, 38] } },
  zoning: { mode: "mixed", compatibility: {} }, household: { personsPerDwelling: 3 }, program: [],
  roles: {
    "building.residential.detached": role("residential", [8, 11], [8, 11], 4),
    "building.transport.depot": role("industrial", [14, 18], [12, 16], 6),
    "building.transport.delivery": role("industrial", [12, 16], [10, 14], 5),
  },
  streetFurniture: [{ role: "prop.sign.settlementName", roadClasses: ["local", "track"], placement: "gate", size: [1.8, 2.8, 0.2], placeholderColor: "#9a9fa2" }],
};
const normalizedProfile = api.normalizeRegionProfile(profileData);
if (normalizedProfile.issues.length) throw new Error(json(normalizedProfile.issues));
const stageReports = [];
for (const stage of api.createDefaultWorldStages().filter((entry) => entry.id !== "planBlockout")) {
  const terrains = [{ id: "m0-terrain", min: [-256, -256], max: [256, 256], locked: false, layers: world.def.layers, splines: world.def.splines ?? [] }];
  const plan = api.planStage(stage, { recipe, layout: level, profile: normalizedProfile.profile, sampleHeight: height, terrains });
  stageReports.push({ stage: stage.id, added: plan.added, updated: plan.updated, removed: plan.removed, blocked: plan.blocked, kept: plan.kept, errors: plan.errors, warnings: plan.warnings });
  if (plan.errors.length || plan.blocked.length) throw new Error(json(stageReports.at(-1)));
  api.applyPlacementGroupChanges(level, plan.groupChanges, "after");
  for (const change of plan.splineChanges) world.def.splines = change.after;
  recipe = plan.recipeAfter;
}
api.applyTerrainUndoPatches(world, api.createTerrainPadPatches(world, recipe.generated.pads.map((pad) => ({ ...pad, falloff: api.PAD_FALLOFF }))));
for (const spline of world.def.splines ?? []) api.applyTerrainUndoPatches(world, api.createTerrainSplinePatches(world, spline));

// Physical interaction placeholders; no gameplay is claimed until later slices.
const marker = (id, name, x, z, size, color) => ({ id, name, role: `logistics.${id}`, position: [x, height(x, z) + size[1] / 2, z], scale: size.map((n) => n / 0.5), color });
let cubes = level.instances.find((group) => group.assetId === "shape:cube");
if (!cubes) level.instances.push(cubes = { assetId: "shape:cube", placements: [] });
cubes.placements.push(
  marker("board", "M0 — İş Panosu (graybox)", -174, -35, [2.4, 2, 0.25], "#8d979e"),
  marker("pickup", "M0 — Yük Alma Noktası (graybox)", -172, -47, [3, 0.6, 2], "#b49a70"),
  marker("delivery", "M0 — Teslim Noktası (graybox)", 159, 50, [3, 0.6, 2], "#91a89c"),
);
level.actors = [{ name: "Gaz52", classRef: "assets/vehicles/gaz52/Script_Gaz52.actor.json", position: [-180, height(-180, -50) + 1, -50], rotationYDeg: 120, scale: 1 }];
level.landscapes = [{ id: "m0-terrain", name: "Landscape — M0", position: [0, 0, 0], dataRef: terrainPath }];
level.worldSettings = { ...level.worldSettings, gameMode: "forge.vehicle" };
level.loadGroups = [...new Set([...level.loadGroups, "Vehicles", "Textures", "Materials", "starter-materials", "starter-sounds"])];
for (const tile of world.tiles.values()) {
  const range = api.terrainTileHeightRange(tile);
  Object.assign(world.def.tiles.find((item) => item.key === `${tile.x}_${tile.z}`), { minHeight: range.min, maxHeight: range.max });
  const bytes = api.encodeTerrainTile(tile, { ...world.def, heightFormat: "f32" });
  const decoded = api.decodeTerrainTile(bytes);
  if (decoded.heights.length !== tile.heights.length) throw new Error("Terrain codec round-trip failed");
  outputs.set(api.terrainTilePath(terrainPath, `${tile.x}_${tile.z}`), bytes);
}
api.normalizeWorldTerrain(world.def);
const recipeCheck = api.normalizeWorldRecipe(recipe);
if (!recipeCheck.recipe || recipeCheck.issues.length) throw new Error(json(recipeCheck));
outputs.set(terrainPath, Buffer.from(json(world.def)));
outputs.set(terrainPath.replace(/\.terrain\.json$/, ".global.bin"), api.encodeTerrainGlobalMap(world.def, api.buildTerrainGlobalAttributes(api.worldTerrainRenderSource(world.def, world.tiles))));
outputs.set(recipePath, Buffer.from(json(recipe)));
outputs.set(profilePath, Buffer.from(json(profileData)));
outputs.set(levelPath, Buffer.from(json(level)));
outputs.set(manifestPath, Buffer.from(json(manifest)));
const plan = { createdAt: new Date().toISOString(), parameters: { extent: [512, 512], tiles: [2, 2], quads: 128, spacing: 2, recipeSeed: 52 },
  assets: [...selected.keys()], stages: stageReports,
  generated: { buildings: cubes.placements.filter((p) => p.id?.startsWith("wb-building")).length, pads: recipe.generated.pads.length, roads: (world.def.splines ?? []).length }, outputs: [] };
for (const [path, bytes] of outputs) {
  const before = await currentHash(inside(publicRoot, path));
  if (before !== null && path !== levelPath && path !== manifestPath && before !== hash(bytes)) throw new Error(`Refusing to replace existing content: ${path}`);
  await write(inside(staging, `files/${path}`), bytes);
  plan.outputs.push({ path, before, after: hash(bytes), bytes: bytes.length });
}
await write(resolve(staging, "plan.json"), json(plan));
console.log(json({ staged: plan.outputs.length, assets: plan.assets, generated: plan.generated, stages: stageReports.map(({ stage, added, warnings }) => ({ stage, added: added.length, warnings })) }));
