from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError:
    print(
        "Pillow is required. Install it in the project venv with: "
        r".\.venv\Scripts\python.exe -m pip install pillow",
        file=sys.stderr,
    )
    raise SystemExit(1)


DEFAULT_ROLES = ("lead", "junior", "skilled")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert generated actor chroma-key PNGs into transparent app assets.",
    )
    parser.add_argument(
        "--input-dir",
        default="tmp/actor-sources",
        help="Directory containing lead.png, junior.png, and skilled.png source files.",
    )
    parser.add_argument(
        "--output-dir",
        default="src/assets/actors",
        help="Directory where transparent actor PNGs will be written.",
    )
    parser.add_argument(
        "--roles",
        default=",".join(DEFAULT_ROLES),
        help="Comma-separated role names to process.",
    )
    parser.add_argument(
        "--transparent-threshold",
        type=float,
        default=18.0,
        help="Color distance at or below which pixels become fully transparent.",
    )
    parser.add_argument(
        "--opaque-threshold",
        type=float,
        default=220.0,
        help="Color distance at or above which pixels keep full opacity.",
    )
    parser.add_argument(
        "--max-height",
        type=int,
        default=1400,
        help="Resize output down to this maximum height. Use 0 to keep original size.",
    )
    parser.add_argument(
        "--no-despill",
        action="store_true",
        help="Disable green spill reduction around transparent edges.",
    )
    return parser.parse_args()


def border_key_color(image: Image.Image) -> tuple[int, int, int]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    step = max(1, min(width, height) // 120)
    samples: list[tuple[int, int, int]] = []

    for x in range(0, width, step):
        samples.append(rgb.getpixel((x, 0)))
        samples.append(rgb.getpixel((x, height - 1)))
    for y in range(0, height, step):
        samples.append(rgb.getpixel((0, y)))
        samples.append(rgb.getpixel((width - 1, y)))

    greenish = [
        (r, g, b)
        for r, g, b in samples
        if g > r + 24 and g > b + 24
    ]
    key_samples = greenish or samples
    count = len(key_samples)
    return tuple(sum(pixel[index] for pixel in key_samples) // count for index in range(3))


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return math.sqrt(sum((a[index] - b[index]) ** 2 for index in range(3)))


def remove_chroma_key(
    image: Image.Image,
    key_color: tuple[int, int, int],
    transparent_threshold: float,
    opaque_threshold: float,
    despill: bool,
) -> Image.Image:
    rgba = image.convert("RGBA")
    output = []
    span = max(1.0, opaque_threshold - transparent_threshold)

    for r, g, b, a in rgba.getdata():
        distance = color_distance((r, g, b), key_color)
        if distance <= transparent_threshold:
            alpha_scale = 0.0
        elif distance >= opaque_threshold:
            alpha_scale = 1.0
        else:
            alpha_scale = ((distance - transparent_threshold) / span) ** 1.35

        next_alpha = round(a * alpha_scale)

        if despill and next_alpha < 255:
            spill_strength = 1.0 - (next_alpha / 255)
            if g > r and g > b:
                neutral_green = max(r, b) + 18
                g = round(g - max(0, g - neutral_green) * spill_strength)

        output.append((r, g, b, next_alpha))

    rgba.putdata(output)
    return rgba


def resize_if_needed(image: Image.Image, max_height: int) -> Image.Image:
    if max_height <= 0 or image.height <= max_height:
        return image
    scale = max_height / image.height
    width = round(image.width * scale)
    return image.resize((width, max_height), Image.Resampling.LANCZOS)


def process_role(
    role: str,
    input_dir: Path,
    output_dir: Path,
    transparent_threshold: float,
    opaque_threshold: float,
    max_height: int,
    despill: bool,
) -> None:
    source = input_dir / f"{role}.png"
    target = output_dir / f"{role}.png"

    if not source.exists():
        raise FileNotFoundError(f"Source image was not found: {source}")

    image = Image.open(source)
    key_color = border_key_color(image)
    transparent = remove_chroma_key(
        image,
        key_color,
        transparent_threshold,
        opaque_threshold,
        despill,
    )
    transparent = resize_if_needed(transparent, max_height)
    output_dir.mkdir(parents=True, exist_ok=True)
    transparent.save(target, optimize=True)
    print(f"{source} -> {target} key={key_color} size={transparent.width}x{transparent.height}")


def main() -> int:
    options = parse_args()
    input_dir = Path(options.input_dir)
    output_dir = Path(options.output_dir)
    roles = [role.strip() for role in options.roles.split(",") if role.strip()]

    for role in roles:
        process_role(
            role,
            input_dir,
            output_dir,
            options.transparent_threshold,
            options.opaque_threshold,
            options.max_height,
            not options.no_despill,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
