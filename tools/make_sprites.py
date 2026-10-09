"""Build the prop sprites used by the game from the original map images.

Reads images/maps/mapHome.png and images/maps/mapHome_upper.png (never changed)
and writes:
  images/maps/mapHome_noProps.png        lower map without bottle and pizza box
  images/maps/mapHome_upper_noProps.png  upper map without the bedroom plant
  images/objects/<name>.png              cut-out sprites
  images/objects/<plant>_withered.png    dry versions of the three plants

Run from the repo root:  python3 tools/make_sprites.py
Needs Pillow. Every sprite has the size of its box below, so the game draws
it at the box origin (see the props in OverworldMap.js).
"""
import colorsys
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MAPS = ROOT / 'images' / 'maps'
OUT = ROOT / 'images' / 'objects'

# Floor items: box (x1, y1, x2, y2) in map pixels and offsets (dx, dy) to spots
# with the same floor pattern. The floor under the item is rebuilt from the
# color most of these spots agree on, so one spot touching furniture is outvoted.
FLOOR_ITEMS = {
    'bottle': {'box': (32, 176, 48, 208), 'shifts': [(32, 0)]},
    'pizzaBox': {'box': (224, 104, 248, 128), 'shifts': [(-32, 0), (96, 0), (0, 32), (128, 0)]},
}

# Plants: box in map pixels and the part of the box that holds leaves or flowers.
PLANTS = {
    'plantBedroom': {'box': (144, 152, 164, 176), 'leafMaxY': 169, 'kind': 'leaves'},
    'plantLivingRoom': {'box': (192, 48, 212, 80), 'leafMaxY': 64, 'kind': 'flowers'},
    'plantBath': {'box': (256, 216, 272, 240), 'leafMinY': 221, 'leafMaxY': 229, 'kind': 'leaves', 'minSat': 0.25},
}


def hsv(px):
    return colorsys.rgb_to_hsv(px[0] / 255, px[1] / 255, px[2] / 255)


def to_rgba(h, s, v, a):
    r, g, b = colorsys.hsv_to_rgb(h, max(0, min(1, s)), max(0, min(1, v)))
    return (round(r * 255), round(g * 255), round(b * 255), a)


def is_leaf(px, kind, min_sat=0.3):
    h, s, v = hsv(px)
    deg = h * 360
    if kind == 'flowers' and 185 <= deg <= 230 and s >= 0.5:
        return True
    return 40 <= deg <= 170 and s >= min_sat


def wither(px, kind):
    """Shift a green or blue pixel to a dry brown or straw yellow."""
    h, s, v = hsv(px)
    if kind == 'flowers' and 185 <= h * 360 <= 230:
        return to_rgba(25 / 360, 0.35, v * 0.7, px[3])
    # Bright leaves turn straw yellow, dark leaves turn brown
    hue = (42 if v > 0.55 else 28) / 360
    return to_rgba(hue, s * 0.75, v * 0.9, px[3])


def cut_floor_item(lower, name, box, shifts):
    x1, y1, x2, y2 = box
    source = lower.copy()
    sprite = Image.new('RGBA', (x2 - x1, y2 - y1), (0, 0, 0, 0))
    for y in range(y1, y2):
        for x in range(x1, x2):
            here = source.getpixel((x, y))
            votes = Counter(source.getpixel((x + dx, y + dy)) for dx, dy in shifts)
            floor = votes.most_common(1)[0][0]
            if here != floor:
                sprite.putpixel((x - x1, y - y1), here)
                lower.putpixel((x, y), floor)
    sprite.save(OUT / f'{name}.png')


def make_plant(lower, upper, name, box, leaf_max_y, kind, leaf_min_y=0, min_sat=0.3):
    x1, y1, x2, y2 = box
    composite = Image.alpha_composite(lower, upper)
    healthy = Image.new('RGBA', (x2 - x1, y2 - y1), (0, 0, 0, 0))
    withered = healthy.copy()

    leaves = []
    for y in range(y1, y2):
        for x in range(x1, x2):
            px = composite.getpixel((x, y))
            on_upper = upper.getpixel((x, y))[3] > 0
            leaf = leaf_min_y <= y < leaf_max_y and is_leaf(px, kind, min_sat)
            if on_upper or leaf:
                healthy.putpixel((x - x1, y - y1), px)
                withered.putpixel((x - x1, y - y1), wither(px, kind) if leaf else px)
            if leaf:
                leaves.append((x, y))
            if on_upper:
                # The sprite replaces the plant on the upper layer
                upper.putpixel((x, y), (0, 0, 0, 0))

    # Drop the tip of every other leaf column so the plant looks thinner.
    # The hole shows the most common floor color of that row.
    tips = {}
    for x, y in leaves:
        if x not in tips or y < tips[x]:
            tips[x] = y
    for i, x in enumerate(sorted(tips)):
        if i % 2 or x in (x1, x2 - 1):
            continue
        y = tips[x]
        row = Counter(lower.getpixel((cx, y)) for cx in range(x1, x2) if (cx, y) not in leaves)
        withered.putpixel((x - x1, y - y1), row.most_common(1)[0][0])

    healthy.save(OUT / f'{name}.png')
    withered.save(OUT / f'{name}_withered.png')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lower = Image.open(MAPS / 'mapHome.png').convert('RGBA')
    upper = Image.open(MAPS / 'mapHome_upper.png').convert('RGBA')

    # Plants first: they read the untouched maps
    for name, cfg in PLANTS.items():
        make_plant(lower, upper, name, cfg['box'], cfg['leafMaxY'], cfg['kind'],
                   cfg.get('leafMinY', 0), cfg.get('minSat', 0.3))
    for name, cfg in FLOOR_ITEMS.items():
        cut_floor_item(lower, name, cfg['box'], cfg['shifts'])

    lower.save(MAPS / 'mapHome_noProps.png')
    upper.save(MAPS / 'mapHome_upper_noProps.png')
    print('sprites written to', OUT)


if __name__ == '__main__':
    main()
