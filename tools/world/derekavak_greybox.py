"""V0 Derekavak greybox models (approval 3, docs/world/derekavak/DEREKAVAK_V0_SAHNE_PLANI.md).

Run from the Ridgebound root:
  blender --background --factory-startup --python tools/world/derekavak_greybox.py
  blender --background --factory-startup --python tools/world/derekavak_greybox.py -- house

Blender Z up, metres. Each model stands on the origin (centre of its footprint, ground
at 0) with its front towards -Y, which the glTF +Y Up export turns into +Z: the side a
Derekavak placement turns towards the valley. Flat colours only: these models settle
form, size and proportion; detail and textures come at approval 4.

Heights are the approval 2 decisions: village house 6.5 m, depot 8 m (ridge height).
Style reference: Drive ConceptDesign "Derekavak Aile Evi Tasarim Panosu" and
"Gorsel Stil" (stone ground floor, plastered upper floor, wooden balcony, low hipped
tile roof; the depot a timber shed with a corrugated metal roof and a lean-to).

Besides each .glb it writes a preview render to docs/world/derekavak/model-<name>.png,
with a 1.8 m figure (and a Gaz-52-sized box beside the depot) for scale; those helpers
are never exported.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

SCRIPT_PATH = os.path.abspath(__file__) if os.path.isabs(__file__) else os.path.abspath(os.path.join(os.getcwd(), __file__))
ROOT = os.path.normpath(os.path.join(os.path.dirname(SCRIPT_PATH), "..", ".."))
OUT = os.path.join(ROOT, "public", "assets", "derekavak")
DOCS = os.path.join(ROOT, "docs", "world", "derekavak")
COLOURS = {
    "stone": (0.52, 0.49, 0.44), "plaster": (0.86, 0.83, 0.76), "timber": (0.38, 0.25, 0.15),
    "plank": (0.47, 0.34, 0.22), "tile": (0.62, 0.31, 0.21), "metal": (0.47, 0.45, 0.43),
    "door": (0.30, 0.19, 0.11), "glass": (0.14, 0.19, 0.23), "opening": (0.07, 0.07, 0.07),
    "concrete": (0.62, 0.61, 0.58),
    # Preview helpers only.
    "figure": (0.85, 0.25, 0.15), "truck": (0.25, 0.45, 0.70), "ground": (0.42, 0.50, 0.33),
}


def linear(channel):
    """COLOURS are display (sRGB) values; Blender and glTF take linear ones."""
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name):
    found = bpy.data.materials.get(name)
    if found:
        return found
    made = bpy.data.materials.new(name)
    made.use_nodes = True
    node = made.node_tree.nodes["Principled BSDF"]
    node.inputs["Base Color"].default_value = (*(linear(channel) for channel in COLOURS[name]), 1)
    node.inputs["Roughness"].default_value = 0.9
    made.diffuse_color = (*(linear(channel) for channel in COLOURS[name]), 1)
    return made


def add_mesh(name, verts, faces, colour):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.materials.append(material(colour))
    item = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(item)
    return item


def box(name, low, high, colour):
    x0, y0, z0 = low
    x1, y1, z1 = high
    verts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    faces = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return add_mesh(name, verts, faces, colour)


def slab(name, top, thickness, colour):
    """A roof surface given by its top faces, thickened straight down."""
    verts, faces = top
    count = len(verts)
    below = [(x, y, z - thickness) for x, y, z in verts]
    all_faces = [tuple(face) for face in faces] + [tuple(index + count for index in reversed(face)) for face in faces]
    # Side faces along the boundary (edges used by exactly one top face).
    edges = {}
    for face in faces:
        for a, b in zip(face, face[1:] + face[:1]):
            edges[(a, b)] = edges.get((a, b), 0) + 1
    for (a, b) in edges:
        if (b, a) not in edges:
            all_faces.append((b, a, a + count, b + count))
    return add_mesh(name, verts + below, all_faces, colour)


def hipped_roof(name, half_x, half_y, eave, ridge, thickness, colour):
    """Four slopes, ridge along X (half_x >= half_y)."""
    run = half_x - half_y
    verts = [(-half_x, -half_y, eave), (half_x, -half_y, eave), (half_x, half_y, eave), (-half_x, half_y, eave),
             (-run, 0, ridge), (run, 0, ridge)]
    faces = [[0, 1, 5, 4], [1, 2, 5], [2, 3, 4, 5], [3, 0, 4]]
    return slab(name, (verts, faces), thickness, colour)


def gable_roof(name, x0, x1, half_y, eave, ridge, thickness, colour):
    """Two slopes, ridge along X."""
    verts = [(x0, -half_y, eave), (x1, -half_y, eave), (x1, 0, ridge), (x0, 0, ridge), (x1, half_y, eave), (x0, half_y, eave)]
    faces = [[0, 1, 2, 3], [3, 2, 4, 5]]
    return slab(name, (verts, faces), thickness, colour)


def gable_wall(name, x, half_y, eave, ridge, colour, depth=0.2):
    """Triangle wall in the YZ plane at x (gable end of a roof ridged along X)."""
    side = 1 if x > 0 else -1
    inner, outer = x, x - side * depth
    verts = [(outer, -half_y, eave), (outer, half_y, eave), (outer, 0, ridge), (inner, -half_y, eave), (inner, half_y, eave), (inner, 0, ridge)]
    faces = [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    if side < 0:
        faces = [tuple(reversed(face)) for face in faces]
    return add_mesh(name, verts, faces, colour)


def window(name, x, y, z, width, height, facing):
    """A dark pane set just proud of the wall, with a timber frame; facing is the wall normal."""
    nx, ny = facing
    if nx == 0:
        y0, y1 = (y - 0.06, y) if ny < 0 else (y, y + 0.06)
        box(f"{name}Frame", (x - width / 2 - 0.08, y0, z - 0.08), (x + width / 2 + 0.08, y1, z + height + 0.08), "timber")
        y0, y1 = (y - 0.08, y - 0.06) if ny < 0 else (y + 0.06, y + 0.08)
        box(name, (x - width / 2, y0, z), (x + width / 2, y1, z + height), "glass")
    else:
        x0, x1 = (x - 0.06, x) if nx < 0 else (x, x + 0.06)
        box(f"{name}Frame", (x0, y - width / 2 - 0.08, z - 0.08), (x1, y + width / 2 + 0.08, z + height + 0.08), "timber")
        x0, x1 = (x - 0.08, x - 0.06) if nx < 0 else (x + 0.06, x + 0.08)
        box(name, (x0, y - width / 2, z), (x1, y + width / 2, z + height), "glass")


def export(path):
    target = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=target, export_format="GLB", export_yup=True, export_apply=True,
        export_animations=False, export_cameras=False, export_lights=False,
    )
    print("wrote", target)


def measure():
    low = Vector((math.inf,) * 3)
    high = Vector((-math.inf,) * 3)
    for item in bpy.context.scene.objects:
        for corner in item.bound_box:
            point = item.matrix_world @ Vector(corner)
            low = Vector(map(min, low, point))
            high = Vector(map(max, high, point))
    return low, high


def preview(name, extra):
    """Render a front three-quarter view with scale helpers (not exported)."""
    low, high = measure()
    box("Ground", (-60, -60, -0.05), (60, 60, 0), "ground")
    box("Figure", (low.x - 1.6, low.y - 2.0, 0), (low.x - 1.1, low.y - 1.6, 1.8), "figure")
    extra()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "WORLD"
    scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
    scene.world = bpy.data.worlds.new("World")
    scene.world.color = (0.62, 0.70, 0.78)
    camera = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    size = max(high.x - low.x, high.y - low.y, high.z)
    target = Vector((0, 0, high.z * 0.4))
    camera.location = target + Vector((-0.55, -1.0, 0.32)).normalized() * size * 1.75
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 40
    scene.render.filepath = os.path.join(DOCS, f"model-{name}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", scene.render.filepath, "size", tuple(round(v, 2) for v in high - low))


def house():
    """Village house (residences, 12 x 9 m footprint; master also has 13 x 10)."""
    reset()
    half_x, half_y = 6.0, 4.5
    # 6.5 m to the ridge leaves a low (~15 degree) roof over two 2.3 m storeys.
    plinth, ground_top, band_top, eave, ridge = 0.3, 2.6, 2.8, 5.1, 6.5
    box("Plinth", (-half_x - 0.1, -half_y - 0.1, 0), (half_x + 0.1, half_y + 0.1, plinth), "stone")
    box("GroundFloor", (-half_x, -half_y, plinth), (half_x, half_y, ground_top), "stone")
    box("FloorBand", (-half_x - 0.05, -half_y - 0.05, ground_top), (half_x + 0.05, half_y + 0.05, band_top), "timber")
    box("UpperFloor", (-half_x, -half_y, band_top), (half_x, half_y, eave), "plaster")
    # Roof: deeper overhang at the front so it covers the 1.5 m balcony.
    front_over, other_over = 1.9, 0.7
    centre_y = (front_over - other_over) / 2
    roof_half_y = half_y + (front_over + other_over) / 2
    roof = hipped_roof("Roof", half_x + other_over, roof_half_y, eave - 0.1, ridge, 0.18, "tile")
    roof.location.y = -centre_y
    # Front balcony on the upper floor, timber posts from the ground.
    bx0, bx1, depth = -3.6, 4.6, 1.5
    box("BalconyDeck", (bx0, -half_y - depth, band_top - 0.15), (bx1, -half_y, band_top), "timber")
    for index, x in enumerate((bx0, (bx0 + bx1) / 2 - 0.1, bx1 - 0.2)):
        box(f"BalconyPost{index}", (x, -half_y - depth, plinth), (x + 0.2, -half_y - depth + 0.2, eave - 0.1), "timber")
    box("BalconyRail", (bx0, -half_y - depth, band_top + 0.95), (bx1, -half_y - depth + 0.08, band_top + 1.05), "timber")
    for index in range(int((bx1 - bx0) / 0.35)):
        x = bx0 + 0.15 + index * 0.35
        box(f"Baluster{index}", (x, -half_y - depth + 0.01, band_top), (x + 0.06, -half_y - depth + 0.07, band_top + 0.95), "timber")
    for side, x0, x1 in (("L", bx0, bx0 + 0.08), ("R", bx1 - 0.08, bx1)):
        box(f"BalconyRailSide{side}", (x0, -half_y - depth, band_top + 0.95), (x1, -half_y, band_top + 1.05), "timber")
    # Front: door with stone steps, two windows; upper floor door to the balcony and two windows.
    box("Door", (-0.6, -half_y - 0.06, plinth), (0.6, -half_y, plinth + 2.1), "door")
    for index in range(2):
        rise = plinth * (2 - index) / 2
        box(f"Step{index}", (-1.0, -half_y - 0.4 * (index + 1), 0), (1.0, -half_y - 0.4 * index, rise), "stone")
    for index, x in enumerate((-3.6, 3.6)):
        window(f"WinFront{index}", x, -half_y, plinth + 0.9, 1.0, 1.2, (0, -1))
    box("BalconyDoor", (-0.5, -half_y - 0.06, band_top), (0.5, -half_y, band_top + 2.0), "door")
    for index, x in enumerate((-2.6, 2.6)):
        window(f"WinUpperFront{index}", x, -half_y, band_top + 0.6, 1.0, 1.2, (0, -1))
    # Sides and back.
    for side in (-1, 1):
        for index, y in enumerate((-1.8, 1.8)):
            window(f"WinSide{side}{index}", side * half_x, y, band_top + 0.6, 0.9, 1.1, (side, 0))
        window(f"WinSideLow{side}", side * half_x, 0, plinth + 1.0, 0.8, 0.9, (side, 0))
    for index, x in enumerate((-3.0, 0.0, 3.0)):
        window(f"WinBack{index}", x, half_y, band_top + 0.6, 0.9, 1.1, (0, 1))
    box("BackDoor", (2.0, half_y, plinth), (3.0, half_y + 0.06, plinth + 2.0), "door")
    # Stone chimney on the right, through the back slope.
    box("Chimney", (3.4, 1.6, eave - 0.4), (4.2, 2.4, ridge + 0.9), "stone")
    box("ChimneyCap", (3.3, 1.5, ridge + 0.9), (4.3, 2.5, ridge + 1.05), "stone")
    export("structures/dk-house.glb")
    preview("ev", lambda: None)


def depot():
    """Depot (POI-02, 34 x 18 m footprint); the long front faces the yard."""
    reset()
    half_x, half_y = 17.0, 9.0
    base_top, eave, ridge = 1.2, 6.0, 8.0
    box("Plinth", (-half_x - 0.1, -half_y - 0.1, 0), (half_x + 0.1, half_y + 0.1, base_top), "stone")
    box("Walls", (-half_x, -half_y, base_top), (half_x, half_y, eave), "plank")
    for x in (-half_x, half_x):
        gable_wall(f"Gable{'L' if x < 0 else 'R'}", x, half_y, eave, ridge, "plank")
    over = 0.6
    gable_roof("Roof", -half_x - over, half_x + over, half_y + over, eave - 0.08 * over, ridge, 0.12, "metal")
    # Three vehicle bays on the front (4.5 m wide, 4.5 m clear) and a concrete apron.
    bays = (-10.0, 0.0, 10.0)
    for index, x in enumerate(bays):
        box(f"Bay{index}", (x - 2.25, -half_y - 0.06, 0), (x + 2.25, -half_y + 0.02, 4.5), "opening")
        box(f"BayHeader{index}", (x - 2.55, -half_y - 0.14, 4.5), (x + 2.55, -half_y - 0.04, 4.8), "timber")
        for side in (-1, 1):
            box(f"BayJamb{index}{side}", (x + side * 2.25 - (0.3 if side < 0 else 0), -half_y - 0.14, 0), (x + side * 2.25 + (0.3 if side > 0 else 0), -half_y - 0.04, 4.5), "timber")
        # A sliding door leaf parked beside each bay.
        leaf = x + 2.55 if index < 2 else x - 2.55 - 2.4
        box(f"DoorLeaf{index}", (leaf, -half_y - 0.26, 0.05), (leaf + 2.4, -half_y - 0.16, 4.6), "door")
    box("Apron", (-half_x, -half_y - 6.0, 0), (half_x, -half_y, 0.08), "concrete")
    # High windows between the bays and on the back.
    for index, x in enumerate((-15.0, -5.0, 5.0, 15.0)):
        window(f"WinFront{index}", x, -half_y, 3.4, 1.4, 0.9, (0, -1))
    for index in range(6):
        window(f"WinBack{index}", -14.0 + index * 5.6, half_y, 3.4, 1.4, 0.9, (0, 1))
    # Person door on the left end.
    box("SideDoor", (-half_x - 0.06, -5.0, 0), (-half_x, -3.9, 2.2), "door")
    # Lean-to on the right end: open shed for cargo, metal roof on timber posts.
    run = 7.0
    low_eave, high_eave = 3.6, 4.8
    verts = [(half_x, -half_y - 0.4, high_eave), (half_x + run, -half_y - 0.4, low_eave), (half_x + run, half_y + 0.4, low_eave), (half_x, half_y + 0.4, high_eave)]
    slab("LeanToRoof", (verts, [[0, 1, 2, 3]]), 0.1, "metal")
    for index, y in enumerate((-half_y, -3.0, 3.0, half_y - 0.25)):
        box(f"LeanToPost{index}", (half_x + run - 0.45, y, 0), (half_x + run - 0.2, y + 0.25, low_eave - 0.05), "timber")
    box("LeanToBeam", (half_x + run - 0.45, -half_y, low_eave - 0.3), (half_x + run - 0.2, half_y, low_eave - 0.05), "timber")
    box("LeanToSlab", (half_x, -half_y, 0), (half_x + run, half_y, 0.12), "concrete")
    export("structures/dk-depot.glb")

    def truck():
        # Gaz-52 envelope (about 6.4 x 2.3 x 2.2 m) in front of the middle bay.
        box("Truck", (-1.15, -half_y - 9.5, 0), (1.15, -half_y - 3.1, 2.2), "truck")
    preview("depo", truck)


MODELS = {"house": house, "depot": depot}
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else list(MODELS)
for model in args:
    MODELS[model]()
