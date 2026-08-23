# -*- coding: utf-8 -*-
"""
Derive web-ready media in public/media/ from the studies/ working pack.

studies/ is 207 MB of originals and is excluded from the deploy. This script
produces the small derivatives the case-study pages actually load.

    python tools/media/build-media.py

Stills become WebP. Clips are re-encoded with the ffmpeg-static binary installed
under tools/media/node_modules, so nothing has to be on the system PATH:

    npm install --prefix tools/media

Both outputs are sized against how the pages present them. A figure renders at
420 px for portrait and 860 px for landscape, and the ASCII lens samples that
into roughly 105x33 cells, so anything past a 1500 px still or a 960 px clip is
detail nobody can see.
"""
import os, shutil, subprocess, sys
from PIL import Image, ImageOps

SRC = "studies/media"
OUT = "public/media"

PHOTO_LONG_EDGE = 1500
PHOTO_QUALITY = 82          # WebP; visually equivalent to JPEG ~90 here
VIDEO_LONG_EDGE = 960
VIDEO_CRF = 29
VIDEO_FPS = 30

# slug -> [(source relative to studies/media, output stem)]
PHOTOS = {
    "wafer": [
        ("wafer/final_photos/A872F6DC-BCDB-4080-9207-5EBCAB41425A.jpeg", "hero-in-hand"),
        ("wafer/final_photos/E5699420-BFB3-4647-871C-486BE4134372.jpeg", "side-profile"),
        ("wafer/final_photos/BC5CB3DE-24F9-409E-B752-51E0EF83F9CE.jpeg", "assembly"),
        ("wafer/final_photos/1659C908-D87A-4C98-91E0-DF9A299454D3.jpeg", "display-detail"),
        ("wafer/final_photos/ADCB7626-7225-49B1-8A26-B39CEEDE1591.jpeg", "magnets-steel"),
        ("wafer/final_photos/247C37C1-66B4-434C-ADB9-725A015F3932.jpeg", "both-halves"),
    ],
    "ci-clop": [
        ("ci_clop/board_and_bringup/photo_363@26-01-2026_10-01-52.jpg", "board-bringup"),
        ("ci_clop/old_interface/photo_218@18-09-2025_04-27-01.jpg", "previous-light"),
        ("ci_clop/old_interface/photo_131@30-11-2024_06-35-05.jpg", "field-use"),
    ],
    # Iskra's stills are the station and the bench it runs on, not the workshop
    # around them. station.webp (the Avalonia UI) and bench.webp (a Ci-Clop
    # panel on Tag-Connect) were handed over directly rather than derived from
    # studies/, so they are not listed here; re-running this leaves them alone.
    "iskra": [],
    "venovisor": [
        # photo_412 is soldiers holding Ci-Clop lights, not venovisors. It was
        # filed under venovisor/field_context in the pack, but putting it on a
        # medical-device page misrepresents what the device is.
        ("venovisor/field_context/photo_311@13-12-2025_15-16-49.jpg", "delivered"),
        ("venovisor/field_context/photo_464@01-05-2026_16-15-14.jpg", "in-use"),
    ],
}

VIDEOS = {
    "ci-clop":   [("ci_clop/board_and_bringup/video_37@26-01-2026_10-01-52.mp4", "bringup")],
    "iskra":     [("iskra/volunteer_production/video_49@11-05-2026_03-48-20.mp4", "volunteer-build")],
    "venovisor": [("venovisor/production/video_54@13-05-2026_18-02-01.mp4", "printing")],
}


def ffmpeg_bin():
    """The static binary npm dropped in this folder, if it is there."""
    local = os.path.join("tools", "media", "node_modules", "ffmpeg-static",
                         "ffmpeg.exe" if os.name == "nt" else "ffmpeg")
    if os.path.exists(local):
        return local
    return shutil.which("ffmpeg")


def build_photos():
    a = b = 0
    for slug, items in PHOTOS.items():
        d = os.path.join(OUT, slug)
        os.makedirs(d, exist_ok=True)
        for rel, stem in items:
            s = os.path.join(SRC, rel)
            if not os.path.exists(s):
                print("  MISSING", s)
                continue
            im = Image.open(s)
            im = ImageOps.exif_transpose(im).convert("RGB")   # honour camera rotation
            im.thumbnail((PHOTO_LONG_EDGE, PHOTO_LONG_EDGE), Image.LANCZOS)
            o = os.path.join(d, stem + ".webp")
            im.save(o, "WEBP", quality=PHOTO_QUALITY, method=6)
            si, so = os.path.getsize(s), os.path.getsize(o)
            a += si; b += so
            print("  photo %-32s %6.0fKB -> %6.0fKB  %dx%d" % (
                slug + "/" + stem + ".webp", si / 1024, so / 1024, im.width, im.height))
            # a stale .jpg from an earlier run would silently keep shipping
            old = os.path.join(d, stem + ".jpg")
            if os.path.exists(old):
                os.remove(old)
    return a, b


def build_videos(ff):
    a = b = 0
    for slug, items in VIDEOS.items():
        d = os.path.join(OUT, slug)
        os.makedirs(d, exist_ok=True)
        for rel, stem in items:
            s = os.path.join(SRC, rel)
            if not os.path.exists(s):
                print("  MISSING", s)
                continue
            o = os.path.join(d, stem + ".mp4")
            if not ff:
                shutil.copy2(s, o)
                si = os.path.getsize(o)
                a += si; b += si
                print("  video %-32s %6.1fMB  COPIED (no ffmpeg; run npm install --prefix tools/media)"
                      % (slug + "/" + stem + ".mp4", si / 1e6))
                continue
            cmd = [
                ff, "-y", "-loglevel", "error", "-i", s,
                # cap the long edge whichever way the clip is oriented, keep even dims
                "-vf", "scale='if(gt(iw,ih),min(%d,iw),-2)':'if(gt(iw,ih),-2,min(%d,ih))',fps=%d"
                       % (VIDEO_LONG_EDGE, VIDEO_LONG_EDGE, VIDEO_FPS),
                "-c:v", "libx264", "-crf", str(VIDEO_CRF), "-preset", "slow",
                "-profile:v", "high", "-pix_fmt", "yuv420p",
                "-an",                        # the figures are muted anyway
                "-movflags", "+faststart",    # index first, so playback starts early
                o,
            ]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode != 0:
                print("  FFMPEG FAILED", o, r.stderr.strip()[:200])
                continue
            si, so = os.path.getsize(s), os.path.getsize(o)
            a += si; b += so
            print("  video %-32s %6.1fMB -> %6.1fMB" % (slug + "/" + stem + ".mp4", si / 1e6, so / 1e6))
    return a, b


def main():
    if not os.path.isdir(SRC):
        sys.exit("studies/media not found. Run from the repo root.")
    ff = ffmpeg_bin()
    print("  ffmpeg:", ff or "NOT FOUND (clips will be copied verbatim)")
    pa, pb = build_photos()
    va, vb = build_videos(ff)
    print("\n  photos %5.1fMB -> %5.1fMB" % (pa / 1e6, pb / 1e6))
    print("  clips  %5.1fMB -> %5.1fMB" % (va / 1e6, vb / 1e6))
    print("  total  %5.1fMB -> %5.1fMB" % ((pa + va) / 1e6, (pb + vb) / 1e6))


if __name__ == "__main__":
    main()
