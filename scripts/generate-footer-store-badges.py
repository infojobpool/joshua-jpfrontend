#!/usr/bin/env python3
"""Regenerate app/public/images/store/footer-*.png from two-badge stock PNG.

Expected source style: two vertically stacked badges on a checker/light
background. This script removes background to transparent and lightly lifts
dark badge tones so they read well on a dark footer.
"""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
DEFAULT_SRC = REPO / "scripts/assets/two-badges-stock.png"
OUT_DIR = REPO / "app/public/images/store"


def is_bg(px: np.ndarray) -> bool:
    r, g, b = map(int, px)
    mx = max(r, g, b)
    mn = min(r, g, b)
    return (mx - mn) <= 10 and mn >= 170


def extract_components(rgb: np.ndarray) -> list[tuple[int, int, int, int, int]]:
    h, w = rgb.shape[:2]
    vis = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        vis[y, x] = True
        q.append((x, y))

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if nx < 0 or nx >= w or ny < 0 or ny >= h or vis[ny, nx]:
                continue
            if is_bg(rgb[ny, nx]):
                vis[ny, nx] = True
                q.append((nx, ny))

    fg = ~vis
    seen = np.zeros_like(fg)
    comps: list[tuple[int, int, int, int, int]] = []
    for y in range(h):
        for x in range(w):
            if not fg[y, x] or seen[y, x]:
                continue
            stack = [(x, y)]
            seen[y, x] = True
            area = 0
            minx = maxx = x
            miny = maxy = y
            while stack:
                cx, cy = stack.pop()
                area += 1
                minx = min(minx, cx)
                maxx = max(maxx, cx)
                miny = min(miny, cy)
                maxy = max(maxy, cy)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and fg[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
            if area > 8000:
                comps.append((area, minx, miny, maxx, maxy))
    return sorted(comps, key=lambda c: c[2])[:2]


def main() -> None:
    src = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.is_file():
        print(f"Missing source image: {src}", file=sys.stderr)
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rgb = np.array(Image.open(src).convert("RGB"))
    comps = extract_components(rgb)
    if len(comps) != 2:
        print("Could not detect both badge components in source image.", file=sys.stderr)
        sys.exit(1)

    # Source is top: App Store, bottom: Google Play
    ordered_names = ["footer-app-store", "footer-google-play"]
    fg_global = np.zeros(rgb.shape[:2], dtype=bool)
    # rebuild foreground mask from background rule
    for y in range(rgb.shape[0]):
        for x in range(rgb.shape[1]):
            fg_global[y, x] = not is_bg(rgb[y, x])

    for name, comp in zip(ordered_names, comps):
        _, minx, miny, maxx, maxy = comp
        pad = 1
        x0 = max(0, minx - pad)
        y0 = max(0, miny - pad)
        x1 = min(rgb.shape[1], maxx + 1 + pad)
        y1 = min(rgb.shape[0], maxy + 1 + pad)
        crop_rgb = rgb[y0:y1, x0:x1, :].copy()
        crop_fg = fg_global[y0:y1, x0:x1]
        rgba = np.zeros((crop_rgb.shape[0], crop_rgb.shape[1], 4), dtype=np.uint8)
        rgba[:, :, :3] = crop_rgb
        rgba[:, :, 3] = (crop_fg * 255).astype(np.uint8)

        # Subtle lift so gray artwork reads better on dark footer.
        pixels = rgba[:, :, :3].astype(np.float32)
        lum = 0.2126 * pixels[:, :, 0] + 0.7152 * pixels[:, :, 1] + 0.0722 * pixels[:, :, 2]
        t = np.clip((170 - lum) / 140, 0, 1)
        pixels = np.clip(pixels + (t * 110)[:, :, None], 0, 255)
        rgba[:, :, :3] = pixels.astype(np.uint8)

        out_path = OUT_DIR / f"{name}.png"
        Image.fromarray(rgba, "RGBA").save(out_path, optimize=True)
        print(f"{name}: {rgba.shape[1]}x{rgba.shape[0]} -> {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
