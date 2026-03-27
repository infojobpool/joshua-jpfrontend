#!/usr/bin/env python3
"""Regenerate app/public/images/store/footer-*.png from two-badge stock PNG.

This stock source has a fixed layout: Google Play on the left and App Store on
the right. We crop the exact badge rectangles and keep them opaque so they
render cleanly on dark footers with no alpha-fringe artifacts.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
DEFAULT_SRC = REPO / "scripts/assets/two-badges-stock.png"
OUT_DIR = REPO / "app/public/images/store"

def main() -> None:
    src = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.is_file():
        print(f"Missing source image: {src}", file=sys.stderr)
        sys.exit(1)

    # Coordinates are (left, top, right, bottom), right/bottom exclusive.
    # Derived from the stock source layout and dark border bounds.
    chunks = {
        "footer-google-play": (23, 70, 386, 177),  # 363x107
        "footer-app-store": (416, 71, 778, 178),   # 362x107
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src_im = Image.open(src).convert("RGB")
    for name, box in chunks.items():
        badge = src_im.crop(box)
        out_path = OUT_DIR / f"{name}.png"
        badge.save(out_path, optimize=True)
        print(f"{name}: {badge.size[0]}x{badge.size[1]} -> {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
