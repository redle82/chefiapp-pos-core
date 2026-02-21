#!/usr/bin/env python3
"""Remove the gray/checkered background from the ChefIApp logo, keeping only the golden chef hat."""
from PIL import Image
import sys

src = "/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal/public/Logo Chefiapp.png"
dst = "/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal/public/Logo Chefiapp Clean.png"

img = Image.open(src).convert("RGBA")
print(f"Image: {img.mode} {img.size}")

pixels = img.load()
w, h = img.size

# The checkered/gray background consists of light gray pixels.
# The logo itself is golden/brown lines on that background.
# We'll make any pixel that is "grayish" (low saturation, high lightness) transparent.
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        # Calculate if pixel is grayish (low color saturation)
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        saturation = (max_c - min_c) / max(max_c, 1)
        lightness = (max_c + min_c) / 2

        # Gray background: low saturation AND medium-high lightness
        # Keep golden/dark pixels (the actual logo)
        if saturation < 0.15 and lightness > 100:
            pixels[x, y] = (r, g, b, 0)  # Make transparent

img.save(dst, "PNG")
print(f"Saved clean logo to: {dst}")
