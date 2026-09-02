#!/usr/bin/env python3
"""Recolor the jersey 3D model's front-print texture and rebuild website/assets/jersey.glb.

Always rebuilds from the untouched original source (../../cycling_jersey.glb, project root) —
never from a previously-recolored GLB — so repeated runs don't compound edits or drift.

Why this exists / what it knows that isn't obvious from the GLB itself:
- The source model (free "Cycling Jersey" model by Sev on Sketchfab, CC Attribution — credit
  already in the site footer, keep it there if this script is reused) ships with a navy "lightning
  bolt" graphic + "3DEE Signs" logo baked into its front-print texture (image index 0). That's a
  leftover demo design, not something to keep.
- The texture is NOT simple to recolor by flat color-distance matching: the flat "true" panel color
  (the collar band + originally the arm/side trim) turns out to be the exact same blue used as one
  of the lightning graphic's own tones, so naive color-distance picks up chunks of the graphic too.
  The fix that actually works: connected-component analysis (scipy.ndimage.label) on a tight color
  match, then keep only components with a high fill-ratio (area / bounding-box area > 0.7) — flat
  rectangular panels score ~0.9-0.98, jagged graphic shards score ~0.1-0.35. That's what separates
  "real flat panel" from "part of the graphic that happens to be a similar blue."
- The dark-navy tones (including the logo text, confirmed by direct pixel sampling) fall outside
  that tight match, so they get swept into the base-color bucket and simply disappear — no separate
  logo-removal step needed.
- Materials in this file need help beyond just the texture: pbrMetallicRoughness is empty, so glTF's
  spec default (fully metallic, fully rough) applies — with no environment map that renders flat
  dark grey regardless of texture color. And emissiveFactor defaults to black, so the recolored
  texture (wired as an emissiveMap) would be invisible unless emissive color is forced to white.
  Both of those are fixed in website/js/jersey-3d.js at load time, not here — this script only
  touches the texture pixels and rebuilds the GLB's binary layout around the new file size.

Usage:
    python3 website/scripts/recolor_jersey.py --base C3CDCD --accent fc4c02 --collar-only

    --base         Hex color for the main garment fill (no # needed). Required.
    --accent       Hex color for the flat panels (collar, and arm/side trim unless --collar-only). Required.
    --collar-only  Only the two collar-band panels get --accent; the two larger arm/side panels
                   (which render as cuff/sleeve trim on this specific model) get --base instead.
                   Omit this flag to color all four flat panels with --accent.

Requires: pillow, numpy, scipy (pip3 install pillow numpy scipy)
"""
import argparse
import struct
import json
import io
from pathlib import Path

import numpy as np
from scipy import ndimage
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCE_GLB = PROJECT_ROOT / "cycling_jersey.glb"
OUTPUT_GLB = PROJECT_ROOT / "website" / "assets" / "jersey.glb"

FLAT_BLUE = np.array([18, 81, 164])  # the source graphic's flat-panel blue — see module docstring
TIGHT_TOLERANCE = 12
MIN_COMPONENT_AREA = 5000
MIN_FILL_RATIO = 0.7
COLLAR_MAX_AREA = 200000  # separates the two collar bands (~128k px) from the two larger arm/side panels (~417k px)


def hex_to_rgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def extract_image_0(glb_bytes):
    offset = 12
    json_len, _ = struct.unpack_from("<I4s", glb_bytes, offset)
    offset += 8
    gltf = json.loads(glb_bytes[offset:offset + json_len])
    offset += json_len
    bin_len, _ = struct.unpack_from("<I4s", glb_bytes, offset)
    offset += 8
    bin_data = glb_bytes[offset:offset + bin_len]

    bv = gltf["bufferViews"][gltf["images"][0]["bufferView"]]
    start = bv.get("byteOffset", 0)
    img_bytes = bin_data[start:start + bv["byteLength"]]
    return gltf, Image.open(io.BytesIO(img_bytes)).convert("RGB")


def recolor(img, base_rgb, accent_rgb, collar_only):
    arr = np.array(img).astype(np.int32)
    dist = np.sqrt(((arr - FLAT_BLUE) ** 2).sum(axis=2))
    mask = dist < TIGHT_TOLERANCE

    labeled, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, labeled, range(1, n + 1))
    objs = ndimage.find_objects(labeled)

    accent_mask = np.zeros(mask.shape, dtype=bool)
    for i in range(n):
        area = sizes[i]
        if area < MIN_COMPONENT_AREA:
            continue
        sl = objs[i]
        bbox_area = (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start)
        if area / bbox_area <= MIN_FILL_RATIO:
            continue
        if collar_only and area >= COLLAR_MAX_AREA:
            continue  # this is one of the two larger arm/side panels — leave it as base color
        accent_mask |= (labeled == (i + 1))

    out = np.full_like(arr, 255, dtype=np.uint8)
    out[:, :] = base_rgb
    out[accent_mask] = accent_rgb
    return Image.fromarray(out, mode="RGB")


def rebuild_glb(gltf, bin_data_original, new_image_bytes, out_path):
    bin_data = bytearray(bin_data_original)
    bv_index = gltf["images"][0]["bufferView"]
    buffer_views = gltf["bufferViews"]
    old_bv = buffer_views[bv_index]
    old_offset = old_bv.get("byteOffset", 0)
    old_length = old_bv["byteLength"]

    delta = len(new_image_bytes) - old_length
    new_bin = bin_data[:old_offset] + new_image_bytes + bin_data[old_offset + old_length:]
    old_bv["byteLength"] = len(new_image_bytes)

    for i, bv in enumerate(buffer_views):
        if i == bv_index:
            continue
        bv_offset = bv.get("byteOffset", 0)
        if bv_offset >= old_offset + old_length:
            bv["byteOffset"] = bv_offset + delta

    gltf["buffers"][0]["byteLength"] = len(new_bin)

    new_json_bytes = json.dumps(gltf).encode("utf-8")
    new_json_bytes += b' ' * ((4 - len(new_json_bytes) % 4) % 4)
    new_bin += b'\x00' * ((4 - len(new_bin) % 4) % 4)

    json_chunk = struct.pack("<I4s", len(new_json_bytes), b"JSON") + new_json_bytes
    bin_chunk = struct.pack("<I4s", len(new_bin), b"BIN\x00") + bytes(new_bin)
    header = struct.pack("<4sII", b"glTF", 2, 12 + len(json_chunk) + len(bin_chunk))

    out_path.write_bytes(header + json_chunk + bin_chunk)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", required=True, help="hex color for the main garment fill, e.g. C3CDCD")
    ap.add_argument("--accent", required=True, help="hex color for the flat panels, e.g. fc4c02")
    ap.add_argument("--collar-only", action="store_true", help="only color the collar bands; arm/side panels get --base instead")
    args = ap.parse_args()

    if not SOURCE_GLB.exists():
        raise SystemExit(f"Source GLB not found at {SOURCE_GLB} — this must run from the untouched original, not a previously-recolored file.")

    glb_bytes = SOURCE_GLB.read_bytes()
    gltf, img = extract_image_0(glb_bytes)

    offset = 12
    json_len, _ = struct.unpack_from("<I4s", glb_bytes, offset)
    offset += 8 + json_len
    bin_len, _ = struct.unpack_from("<I4s", glb_bytes, offset)
    offset += 8
    bin_data_original = glb_bytes[offset:offset + bin_len]

    recolored = recolor(img, hex_to_rgb(args.base), hex_to_rgb(args.accent), args.collar_only)
    buf = io.BytesIO()
    recolored.save(buf, format="PNG", optimize=True)

    OUTPUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    rebuild_glb(gltf, bin_data_original, buf.getvalue(), OUTPUT_GLB)
    print(f"Wrote {OUTPUT_GLB} ({OUTPUT_GLB.stat().st_size} bytes) — base #{args.base}, accent #{args.accent}, collar_only={args.collar_only}")


if __name__ == "__main__":
    main()
