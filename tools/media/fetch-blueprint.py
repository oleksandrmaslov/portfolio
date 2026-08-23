# -*- coding: utf-8 -*-
"""
Pull the Wafer build-journal images from Blueprint into public/media/wafer/.

Source: https://blueprint.hackclub.com/projects/2800 (Oleksandr's own journal).
Blueprint serves ActiveStorage variants that are already WebP at 2000px, so we
fetch, then re-encode down to the size the case-study figures actually use.

    python tools/media/fetch-blueprint.py

Downloaded files are named for what they show, not for their blob id, so the
data records stay readable.
"""
import io, os, sys, urllib.request
from PIL import Image

OUT = "public/media/wafer"
LONG_EDGE = 1500
QUALITY = 82
BASE = "https://blueprint.hackclub.com/user-attachments/representations/redirect/"

# (output stem, path after the redirect base)
SHOTS = [
 ("journal-ergogen-first",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjQ5ODYsInB1ciI6ImJsb2JfaWQifX0=--bbdf11dd52ba943b2bfbad9c451dfdf5e91e5ea7/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-wafer-outline",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjQ5OTAsInB1ciI6ImJsb2JfaWQifX0=--dcba952acbaf8f1a03c46b9879aac23e77cba7bd/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-six-layer-mistake",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjUwMDcsInB1ciI6ImJsb2JfaWQifX0=--b397e079abdfc1c5698f813b4270011d86052a51/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-first-layout",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjUwMTcsInB1ciI6ImJsb2JfaWQifX0=--f446bda5c490cab5f24f2b8cebcd7de906d7be01/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-bare-vs-sip",
  "eyJfcmFpbHMiOnsiZGF0YSI6Mjg1MTcsInB1ciI6ImJsb2JfaWQifX0=--a18f9b94a400f7be2f08ac0df18da500efa86b1d/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-isp1807",
  "eyJfcmFpbHMiOnsiZGF0YSI6Mjg1MTgsInB1ciI6ImJsb2JfaWQifX0=--4904d0e46e53aecae4e3a753adb68483cd68ae7d/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-classic-charger",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjkwMTcsInB1ciI6ImJsb2JfaWQifX0=--b6c8c57956914969724148450d2a473e661d95ce/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-npm1300",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjkxMDQsInB1ciI6ImJsb2JfaWQifX0=--13aafc37cbb330948894aaec687037de2ef51b52/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-vbat-driver",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjkxMjksInB1ciI6ImJsb2JfaWQifX0=--29c5fedb5e1e8527d5088049ee94f9e277bf3fa9/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-schematic",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjM2MzcsInB1ciI6ImJsb2JfaWQifX0=--2ce9f565cd87b3bd368b7b0aa4662aa09a31b39d/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/Unbenannt.png"),
 ("journal-display-cutout-error",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjUwNDgsInB1ciI6ImJsb2JfaWQifX0=--6eb531c129ecff330b6b210d2af0d13237881ec4/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-thin-profile",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjUwNTEsInB1ciI6ImJsb2JfaWQifX0=--c8afe31f0dbcb5e70ff324a28769360a6c8d1496/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-cnc-sim",
  "eyJfcmFpbHMiOnsiZGF0YSI6Nzg3MzksInB1ciI6ImJsb2JfaWQifX0=--e86ee5b40bf6e691c5111661d956af560c1ae8b7/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
 ("journal-cnc-case-a",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjM2NzIsInB1ciI6ImJsb2JfaWQifX0=--2b0f6aed6f643db59fedfb8b12f14b8085fb2f32/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJqcGciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--15ca3815f01a5683e19ea0585d2eef9af9e441d7/photo_2025-12-13_16-30-36.jpg"),
 ("journal-cnc-case-b",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjM2NzEsInB1ciI6ImJsb2JfaWQifX0=--51cf6ff239e4a1a93c6d8fee1bb5255a65fa608c/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJqcGciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--15ca3815f01a5683e19ea0585d2eef9af9e441d7/photo_2025-12-13_16-30-21.jpg"),
 ("journal-hand-solder",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjM2NjIsInB1ciI6ImJsb2JfaWQifX0=--33c1721e8c1dd6e1b99c351c4a596efeb73856ba/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJqcGciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--15ca3815f01a5683e19ea0585d2eef9af9e441d7/photo_2025-12-13_16-23-11.jpg"),
 ("journal-bench",
  "eyJfcmFpbHMiOnsiZGF0YSI6MjM2ODAsInB1ciI6ImJsb2JfaWQifX0=--7ebc5a21ad9ed05cc6838b859851c0d6052365c4/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJKUEciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--9079d2de68ed728ef416a7795f4311c0c538c9dd/IMG_3291.JPG"),
 ("journal-switch-sourcing",
  "eyJfcmFpbHMiOnsiZGF0YSI6Mjg0OTgsInB1ciI6ImJsb2JfaWQifX0=--f447f87dfe4a68b1d10ae2e03e42256ca79ee2be/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOlsyMDAwLDIwMDBdLCJjb252ZXJ0Ijoid2VicCIsInNhdmVyIjp7InF1YWxpdHkiOjgwLCJzdHJpcCI6dHJ1ZX19LCJwdXIiOiJ2YXJpYXRpb24ifX0=--0f85faa91c373105a0f317054e965c1f47e93a37/image.png"),
]

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    rows = []
    for stem, tail in SHOTS:
        url = BASE + tail
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read()
        except Exception as e:
            print("  FAIL %-28s %s" % (stem, e))
            continue
        try:
            im = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception as e:
            print("  DECODE FAIL %-22s %s" % (stem, e))
            continue
        im.thumbnail((LONG_EDGE, LONG_EDGE), Image.LANCZOS)
        o = os.path.join(OUT, stem + ".webp")
        im.save(o, "WEBP", quality=QUALITY, method=6)
        n = os.path.getsize(o)
        total += n
        w, h = im.size
        g = _gcd(w, h)
        rows.append((stem, w, h, "%d / %d" % (w // g, h // g), n))
        print("  %-28s %5dx%-5d  ratio %-11s %6.0fKB" % (stem, w, h, "%d / %d" % (w // g, h // g), n / 1024))
    print("\n  %d files, %.1fKB total" % (len(rows), total / 1024))
    print("\n  ratios for the data records:")
    for stem, w, h, ratio, n in rows:
        print('    { src: "public/media/wafer/%s.webp", ratio: "%s" }' % (stem, ratio))


def _gcd(a, b):
    while b:
        a, b = b, a % b
    return a


if __name__ == "__main__":
    main()
