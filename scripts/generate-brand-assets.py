"""Regenerate transparent Todo Matrix icons.

Requires Pillow: python -m pip install pillow
"""

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / "assets" / "branding"
PUBLIC = ROOT / "public"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
SOURCE = BRANDING / "todo-matrix-mark.png"

RESAMPLING = Image.Resampling.LANCZOS


def import_reference_icon(path: Path) -> Image.Image:
    reference = Image.open(path).convert("RGB")
    width, height = reference.size
    if width != height:
        raise ValueError("The brand reference must use a square canvas.")

    def scaled(value: float) -> int:
        return round(value * width / 1254)

    crop_left = scaled(128)
    crop_top = scaled(128)
    crop_right = scaled(1126)
    crop_bottom = scaled(1126)
    cropped = reference.crop((crop_left, crop_top, crop_right, crop_bottom))

    card_box = (
        scaled(192) - crop_left,
        scaled(161) - crop_top,
        scaled(1065) - crop_left,
        scaled(1072) - crop_top,
    )
    card_radius = scaled(205)

    card_mask = Image.new("L", cropped.size, 0)
    ImageDraw.Draw(card_mask).rounded_rectangle(
        card_box,
        radius=card_radius,
        fill=255,
    )
    card_mask = card_mask.filter(ImageFilter.GaussianBlur(max(0.5, scaled(0.7))))

    shadow_source = Image.new("L", cropped.size, 0)
    shadow_source.paste(card_mask, (0, scaled(14)))
    shadow_mask = shadow_source.filter(ImageFilter.GaussianBlur(scaled(24)))
    shadow_mask = shadow_mask.point(lambda value: round(value * 0.22))

    result = Image.new("RGBA", cropped.size, (0, 0, 0, 0))
    shadow = Image.new("RGBA", cropped.size, (35, 42, 52, 0))
    shadow.putalpha(shadow_mask)
    result.alpha_composite(shadow)

    card = cropped.convert("RGBA")
    card.putalpha(card_mask)
    result.alpha_composite(card)

    return result.resize((1024, 1024), RESAMPLING)


def despill_transparent_edges(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    replacements: list[tuple[int, int, tuple[int, int, int, int]]] = []

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0 or alpha == 255:
                continue

            replacement = None
            for radius in range(1, 9):
                candidates = []
                for sample_y in range(max(0, y - radius), min(height, y + radius + 1)):
                    for sample_x in range(max(0, x - radius), min(width, x + radius + 1)):
                        if max(abs(sample_x - x), abs(sample_y - y)) != radius:
                            continue
                        sample = pixels[sample_x, sample_y]
                        if sample[3] == 255:
                            distance = (sample_x - x) ** 2 + (sample_y - y) ** 2
                            candidates.append((distance, sample))
                if candidates:
                    replacement = min(candidates, key=lambda candidate: candidate[0])[1]
                    break

            if replacement is not None:
                replacements.append(
                    (x, y, (replacement[0], replacement[1], replacement[2], alpha))
                )
            elif red > 180 and green > 180 and blue > 180:
                replacements.append((x, y, (15, 27, 48, alpha)))

    for x, y, replacement in replacements:
        pixels[x, y] = replacement

    return rgba


def extract_transparent_mark(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    alpha = rgba.getchannel("A")

    if alpha.getextrema()[0] < 255:
        mark = rgba
    else:
        grayscale = rgba.convert("L")
        width, height = rgba.size
        pixels = grayscale.load()
        row_spans: list[tuple[int, int] | None] = []

        for y in range(height):
            dark_pixels = [x for x in range(width) if pixels[x, y] < 120]
            row_spans.append(
                (dark_pixels[0], dark_pixels[-1]) if dark_pixels else None
            )

        rows = [y for y, span in enumerate(row_spans) if span is not None]
        if not rows:
            raise ValueError("Could not locate the dark Todo Matrix mark.")

        top, bottom = rows[0], rows[-1]
        left = min(row_spans[y][0] for y in rows if row_spans[y] is not None)
        right = max(row_spans[y][1] for y in rows if row_spans[y] is not None)
        side = max(right - left + 1, bottom - top + 1)
        center_x = (left + right) / 2
        center_y = (top + bottom) / 2
        crop_left = round(center_x - side / 2)
        crop_top = round(center_y - side / 2)
        crop_box = (
            crop_left,
            crop_top,
            crop_left + side,
            crop_top + side,
        )

        cropped = rgba.crop(crop_box)
        mask = Image.new("L", cropped.size, 0)
        mask_pixels = mask.load()

        for y in range(crop_box[1], crop_box[3]):
            span = row_spans[y] if 0 <= y < height else None
            if span is None:
                continue
            start = max(span[0], crop_box[0]) - crop_box[0]
            end = min(span[1], crop_box[2] - 1) - crop_box[0]
            for x in range(start, end + 1):
                mask_pixels[x, y - crop_box[1]] = 255

        mask = mask.filter(ImageFilter.MinFilter(5))
        mask = mask.filter(ImageFilter.GaussianBlur(0.8))
        cropped.putalpha(mask)
        mark = cropped

    square_side = max(mark.size)
    square = Image.new("RGBA", (square_side, square_side), (0, 0, 0, 0))
    square.alpha_composite(
        mark,
        ((square_side - mark.width) // 2, (square_side - mark.height) // 2),
    )
    return despill_transparent_edges(square)


def resized(mark: Image.Image, size: int, inset: float = 0) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    content_size = max(1, round(size * (1 - inset * 2)))
    content = mark.resize((content_size, content_size), RESAMPLING)
    offset = (size - content_size) // 2
    canvas.alpha_composite(content, (offset, offset))
    return canvas


def binary_transparency(image: Image.Image, threshold: int = 128) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").point(
        lambda value: 255 if value >= threshold else 0
    )
    rgba.putalpha(alpha)
    return rgba


def without_outer_shadow(mark: Image.Image) -> Image.Image:
    rgba = mark.convert("RGBA")
    width, height = rgba.size
    mask = Image.new("L", rgba.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (
            round(width * 0.064),
            round(height * 0.033),
            round(width * 0.960),
            round(height * 0.945),
        ),
        radius=round(width * 0.205),
        fill=255,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(max(0.5, width * 0.0007)))
    rgba.putalpha(Image.composite(rgba.getchannel("A"), Image.new("L", rgba.size, 0), mask))
    return rgba


def android_adaptive_foreground(mark: Image.Image) -> Image.Image:
    rgba = mark.convert("RGBA")
    width, height = rgba.size
    foreground = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    quadrants = (
        (0, 0, width // 2, height // 2),
        (width // 2, 0, width, height // 2),
        (0, height // 2, width // 2, height),
        (width // 2, height // 2, width, height),
    )

    for quadrant in quadrants:
        colored_mask = Image.new("L", rgba.size, 0)
        pixels = colored_mask.load()
        for y in range(quadrant[1], quadrant[3]):
            for x in range(quadrant[0], quadrant[2]):
                red, green, blue, alpha = rgba.getpixel((x, y))
                if alpha > 32 and max(red, green, blue) - min(red, green, blue) > 45:
                    pixels[x, y] = 255

        tile_box = colored_mask.getbbox()
        if tile_box is None:
            raise ValueError("Could not locate an Android launcher tile.")

        expanded_box = (
            max(0, tile_box[0] - 2),
            max(0, tile_box[1] - 2),
            min(width, tile_box[2] + 2),
            min(height, tile_box[3] + 2),
        )
        local_mask = colored_mask.crop(expanded_box)
        flooded = local_mask.copy()
        ImageDraw.floodfill(flooded, (0, 0), 128)
        filled_tile = flooded.point(lambda value: 0 if value == 128 else 255)
        tile_mask = Image.new("L", rgba.size, 0)
        tile_mask.paste(filled_tile, expanded_box[:2])
        tile = rgba.copy()
        tile.putalpha(ImageChops.multiply(rgba.getchannel("A"), tile_mask))
        foreground.alpha_composite(tile)

    content_box = foreground.getchannel("A").getbbox()
    if content_box is None:
        raise ValueError("Android adaptive foreground is empty.")

    offset_x = round((width - (content_box[2] - content_box[0])) / 2 - content_box[0])
    offset_y = round((height - (content_box[3] - content_box[1])) / 2 - content_box[1])
    centered = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    centered.alpha_composite(foreground, (offset_x, offset_y))
    return centered


def save_png(
    mark: Image.Image,
    path: Path,
    size: int,
    inset: float = 0,
    hard_transparency: bool = False,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image = resized(mark, size, inset)
    if hard_transparency:
        image = binary_transparency(image)
    image.save(path, optimize=True)


def save_favicon_ico(mark: Image.Image, path: Path) -> None:
    sizes = [16, 24, 32, 48, 64]
    frames = [binary_transparency(resized(mark, size)) for size in sizes]
    frames[-1].save(
        path,
        format="ICO",
        sizes=[(size, size) for size in sizes],
        append_images=frames[:-1],
    )


def generate_android_icons(mark: Image.Image) -> None:
    densities = {
        "mdpi": (48, 108),
        "hdpi": (72, 162),
        "xhdpi": (96, 216),
        "xxhdpi": (144, 324),
        "xxxhdpi": (192, 432),
    }
    foreground = android_adaptive_foreground(mark)

    for density, (legacy_size, foreground_size) in densities.items():
        directory = ANDROID_RES / f"mipmap-{density}"
        save_png(mark, directory / "ic_launcher.png", legacy_size)
        save_png(mark, directory / "ic_launcher_round.png", legacy_size)
        save_png(
            foreground,
            directory / "ic_launcher_foreground.png",
            foreground_size,
            inset=0.165,
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--reference",
        type=Path,
        help="Import a square reference image before regenerating all brand assets.",
    )
    parser.add_argument(
        "--android-only",
        action="store_true",
        help="Regenerate only Android launcher resources.",
    )
    args = parser.parse_args()

    if args.reference:
        mark = import_reference_icon(args.reference)
        mark.save(SOURCE, optimize=True)
    else:
        mark = extract_transparent_mark(Image.open(SOURCE))

    platform_mark = without_outer_shadow(mark)
    if args.android_only:
        generate_android_icons(platform_mark)
        return

    transparent_source = resized(platform_mark, 1254)
    transparent_source.save(BRANDING / "todo-matrix-icon-source.png", optimize=True)

    save_png(platform_mark, BRANDING / "todo-matrix-icon-1024.png", 1024)

    icon_1024 = resized(platform_mark, 1024)
    icon_1024.save(
        BRANDING / "todo-matrix-icon.ico",
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    icon_1024.save(BRANDING / "todo-matrix-icon.icns", format="ICNS")

    save_png(platform_mark, PUBLIC / "favicon-32.png", 32, hard_transparency=True)
    save_png(platform_mark, PUBLIC / "favicon-64.png", 64, hard_transparency=True)
    save_png(platform_mark, PUBLIC / "apple-touch-icon.png", 180)
    save_png(platform_mark, PUBLIC / "icons" / "icon-192.png", 192)
    save_png(platform_mark, PUBLIC / "icons" / "icon-512.png", 512)
    save_png(platform_mark, PUBLIC / "icons" / "icon-maskable-512.png", 512, inset=0.1)
    save_favicon_ico(platform_mark, PUBLIC / "favicon.ico")

    generate_android_icons(platform_mark)


if __name__ == "__main__":
    main()
