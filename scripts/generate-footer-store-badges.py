#!/usr/bin/env python3
"""Regenerate app/public/images/store/footer-*.png from the two-in-one stock PNG.

Uses flood fill from image corners (stops at black badge strokes) plus light
defringe on neutral gray pixels at alpha edges.
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


def flood_bg(rgb: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]

    def is_hard_stop(r: int, g: int, b: int) -> bool:
        return max(r, g, b) < 42

    vis = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if not vis[y, x]:
            vis[y, x] = True
            q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if nx < 0 or nx >= w or ny < 0 or ny >= h or vis[ny, nx]:
                continue
            r, g, b = rgb[ny, nx].astype(int)
            if is_hard_stop(r, g, b):
                continue
            vis[ny, nx] = True
            q.append((nx, ny))
    return vis


def trim_fg_rgba(rgba: np.ndarray) -> np.ndarray:
    ys, xs = np.where(rgba[:, :, 3] > 0)
    if len(xs) == 0:
        return rgba
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    return rgba[y0:y1, x0:x1]


def defringe_rgba(rgba: np.ndarray, gray_lo: float = 160, gray_hi: float = 250) -> np.ndarray:
    a = rgba[:, :, 3].astype(np.float32) / 255.0
    r = rgba[:, :, 0].astype(np.float32)
    g = rgba[:, :, 1].astype(np.float32)
    b = rgba[:, :, 2].astype(np.float32)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn
    neutral = (chroma < 30) & (mn > gray_lo) & (mx < gray_hi)
    h, w = a.shape
    amin = np.ones_like(a)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        sl = np.s_[max(0, -dy) : h - max(0, dy), max(0, -dx) : w - max(0, dx)]
        aa = a[max(0, dy) : h + min(0, dy), max(0, dx) : w + min(0, dx)]
        amin[sl] = np.minimum(amin[sl], aa)
    edge = (a > 0.05) & (amin < 0.95)
    kill = neutral & edge
    out = np.array(rgba, copy=True)
    out[kill, 3] = 0
    return out


def main() -> None:
    src = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.is_file():
        print(f"Missing source image: {src}", file=sys.stderr)
        sys.exit(1)
    rgb = np.array(Image.open(src).convert("RGB"))
    h, w = rgb.shape[:2]
    bg = flood_bg(rgb)
    fg = ~bg
    half = w // 2
    chunks = (("footer-google-play", slice(0, half)), ("footer-app-store", slice(half, w)))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, sl in chunks:
        sub_rgb = rgb[:, sl, :].copy()
        sub_bg = bg[:, sl].copy()
        sub_fg = ~sub_bg
        rgba = np.zeros((sub_rgb.shape[0], sub_rgb.shape[1], 4), dtype=np.uint8)
        rgba[:, :, :3] = sub_rgb
        rgba[:, :, 3] = (sub_fg.astype(np.uint8) * 255)
        rgba = trim_fg_rgba(rgba)
        rgba = defringe_rgba(rgba)
        rgba = trim_fg_rgba(rgba)
        out_path = OUT_DIR / f"{name}.png"
        Image.fromarray(rgba).save(out_path, optimize=True)
        im = Image.open(out_path)
        print(f"{name}: {im.size[0]}x{im.size[1]} -> {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
