#!/usr/bin/env python3
"""Turn the design originals into the variants the site actually serves.

Every photograph in this project arrived as a 2-4 MB JPEG or PNG at whatever
size the stock library happened to export. The browser then scaled each one
down to a card 380px wide, which means the visitor paid for four megapixels to
look at a quarter of one. This script does that scaling once, here, instead of
on every visit over an Uzbek mobile connection.

Three things happen to each image, in this order, and the order matters:

1.  Resize with Lanczos. Bilinear (what a browser uses) averages; Lanczos
    reconstructs, and on a photograph with architecture in it the difference is
    visible on the minaret edges.
2.  Unsharp mask AFTER the resize. Downscaling always softens — it is throwing
    away the high frequencies that make an edge an edge — so the sharpening has
    to happen at the final size or it sharpens detail that is then discarded.
    radius 1.1 / percent 85 is the strongest pass that leaves no halo on the
    sky gradient, checked on hero-light where the sky is a flat ramp and a halo
    would be obvious.
3.  Encode to AVIF and WebP, in that order of preference. There is no JPEG
    fallback: WebP has been in every shipping browser since Safari 14 (2020),
    and carrying a third copy of every photograph would have added 3.8 MB to
    the repository to serve a browser nobody visits us with. Checked against a
    month of real user agents, not against a compatibility table.

Run: python3 scripts/build-media.py
"""
from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parent.parent
# The originals are not in the repository: they are 20 MB of stock photography
# and the repository serves the outputs. Point this at wherever they live.
SOURCES = Path.home() / 'Desktop' / 'newqulaysimdesign' / 'public' / 'design'


@dataclass(frozen=True)
class Job:
    src: Path
    out: Path
    widths: tuple[int, ...]
    avif_quality: int
    webp_quality: int
    sharpen: int = 85
    #: Crop to this width:height ratio before resizing, or None to keep the
    #: original framing.
    ratio: tuple[int, int] | None = None


def crop_to(image: Image.Image, ratio: tuple[int, int]) -> Image.Image:
    """Centre-crop to a fixed aspect before scaling.

    The destination photographs arrived in whatever shape the stock library
    exported — azerbaijan is 960x1317 portrait, bali is a 1000x1000 square —
    and every one of them is painted into a card about four times wider than it
    is tall. `background-size: cover` then scales the whole file to fill that
    strip and throws away most of the pixels. Cropping here means we never
    encode, ship or decode the two thirds of a portrait photograph that no
    visitor has ever seen.
    """
    want_w, want_h = ratio
    target = want_w / want_h
    have = image.width / image.height
    if abs(have - target) < 0.01:
        return image
    if have > target:
        width = round(image.height * target)
        left = (image.width - width) // 2
        return image.crop((left, 0, left + width, image.height))
    height = round(image.width / target)
    top = (image.height - height) // 2
    return image.crop((0, top, image.width, top + height))


def variants(job: Job) -> list[dict]:
    written: list[dict] = []
    with Image.open(job.src) as raw:
        source = raw.convert('RGB')
    if job.ratio:
        source = crop_to(source, job.ratio)

    for width in job.widths:
        if width >= source.width:
            # Never upscale. An upscale invents no detail; it only costs bytes
            # and makes the sharpening pass amplify the interpolation itself.
            resized = source
            width = source.width
        else:
            height = round(source.height * width / source.width)
            resized = source.resize((width, height), Image.LANCZOS)

        crisp = (
            resized.filter(ImageFilter.UnsharpMask(radius=1.1, percent=job.sharpen, threshold=3))
            if job.sharpen
            else resized
        )

        stem = f'{job.out.stem}-{width}' if len(job.widths) > 1 else job.out.stem
        base = job.out.with_name(stem)
        base.parent.mkdir(parents=True, exist_ok=True)

        avif = base.with_suffix('.avif')
        crisp.save(avif, format='AVIF', quality=job.avif_quality, speed=4)

        webp = base.with_suffix('.webp')
        crisp.save(webp, format='WEBP', quality=job.webp_quality, method=6)

        written.append({
            'w': crisp.width,
            'h': crisp.height,
            'avif': '/' + str(avif.relative_to(REPO / 'public')),
            'webp': '/' + str(webp.relative_to(REPO / 'public')),
            'bytes': avif.stat().st_size + webp.stat().st_size,
        })

    return written


def main() -> int:
    public = REPO / 'public'
    jobs: list[Job] = []

    # The hero is the largest thing on the home page and the first thing drawn,
    # so it gets two widths: phones never fetch the desktop one.
    for theme in ('light', 'dark'):
        src = SOURCES / f'hero-{theme}.png'
        if src.exists():
            jobs.append(Job(src, public / 'media' / f'hero-{theme}.png',
                            widths=(1024, 1774), avif_quality=62, webp_quality=76))

    # Destination photographs are drawn into a card roughly 380 CSS px wide and
    # into the country page heading, in both cases under a scrim that is opaque
    # white across the left 40% and never lighter than 45% on the right. Detail
    # that is never seen through that does not need to be encoded: 900px at a
    # lower quality and a gentler sharpen than the hero, which is the only one
    # of these drawn at full strength.
    photos = SOURCES / 'photos'
    if photos.is_dir():
        for src in sorted(photos.glob('*.jpg')):
            jobs.append(Job(src, public / 'media' / 'photos' / src.name,
                            widths=(480, 900), avif_quality=44, webp_quality=66,
                            sharpen=55, ratio=(3, 2)))

    if not jobs:
        print(f'no sources under {SOURCES}', file=sys.stderr)
        return 1

    manifest: dict[str, list[dict]] = {}
    total = 0
    for job in jobs:
        before = job.src.stat().st_size
        key = job.out.stem if job.out.parent.name == 'media' else f'{job.out.parent.name}/{job.out.stem}'
        rendered = variants(job)
        manifest[key] = [{k: v for k, v in r.items() if k != 'bytes'} for r in rendered]
        after = sum(r['bytes'] for r in rendered)
        total += after
        print(f'{key:28s} {before / 1024:8.0f} KB -> {after / 1024:7.1f} KB'
              f'   [{", ".join(str(r["w"]) for r in rendered)}]')

    # The widths in the manifest are the widths the encoder actually produced,
    # which are not always the widths asked for: several sources are narrower
    # than the large variant and are never upscaled. A srcset `w` descriptor
    # that lies makes the browser pick the wrong file, so the numbers have to
    # come from the encoded images rather than from the job configuration.
    out = REPO / 'src' / 'lib' / 'media.generated.ts'
    lines = ['// Generated by scripts/build-media.py — do not edit by hand.',
             '',
             'export interface MediaVariant {',
             '  w: number',
             '  h: number',
             '  avif: string',
             '  webp: string',
             '}',
             '',
             'export const MEDIA: Record<string, MediaVariant[]> = {']
    for key in sorted(manifest):
        entries = ', '.join(
            f'{{ w: {v["w"]}, h: {v["h"]}, avif: \'{v["avif"]}\', webp: \'{v["webp"]}\' }}'
            for v in manifest[key]
        )
        lines.append(f"  '{key}': [{entries}],")
    lines += ['}', '']
    out.write_text('\n'.join(lines))

    print(f'\n{len(jobs)} sources -> {total / 1024 / 1024:.2f} MB of variants')
    print(f'manifest: {out.relative_to(REPO)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
