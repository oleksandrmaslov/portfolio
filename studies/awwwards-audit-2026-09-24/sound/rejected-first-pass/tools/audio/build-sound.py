"""Render the first material-sound study. Requires numpy and ffmpeg.

All sounds here are newly synthesized, not recordings or game assets.
Keep working WAVs and the listening sketch in studies/ (not deployed).
Run from any directory; output paths are relative to this file.
"""
from pathlib import Path
import json
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public/audio"
STUDY = ROOT / "studies/awwwards-audit-2026-09-24/sound"
SR = 32000
RNG = np.random.default_rng(240924)


def rms(x):
    return float(np.sqrt(np.mean(x * x)))


def band_noise(n, low, high):
    f = np.fft.rfftfreq(n, 1 / SR)
    spectrum = np.fft.rfft(RNG.normal(size=n))
    weight = (1 - np.exp(-(f / low) ** 4)) * np.exp(-(f / high) ** 4)
    x = np.fft.irfft(spectrum * weight, n=n)
    return x / rms(x)


def contact(duration, body, decay, peak):
    """Damped, inharmonic enclosure modes and a soft physical excitation."""
    t = np.arange(round(duration * SR)) / SR
    x = np.zeros_like(t)
    for ratio, weight in [(1, 1), (1.63, .32), (2.71, .13), (4.18, .045)]:
        x += weight * np.sin(2 * np.pi * body * ratio * t) * np.exp(-t / (decay / ratio ** .6))
    x *= 1 - np.exp(-t / .0018)
    x += .14 * band_noise(len(t), 700, 2900) * (1 - np.exp(-t / .001)) * np.exp(-t / .009)
    # A felt-like second contact, not a pitched sweep or a bright digital chirp.
    offset = round(.016 * SR)
    x[offset:] += .075 * band_noise(len(t) - offset, 380, 1400) * np.exp(-t[:-offset] / .012)
    x[-round(.025 * SR):] *= np.linspace(1, 0, round(.025 * SR)) ** 2
    return x * (peak / np.max(np.abs(x)))


def stereo(x, pan=0):
    angle = (pan + 1) * np.pi / 4
    return x[:, None] * np.array([np.cos(angle), np.sin(angle)])


def write_wav(path, x):
    assert np.max(np.abs(x)) < 1, path
    channels = 1 if x.ndim == 1 else x.shape[1]
    with wave.open(str(path), "wb") as file:
        file.setnchannels(channels)
        file.setsampwidth(2)
        file.setframerate(SR)
        file.writeframes(np.round(x * 32767).astype("<i2").tobytes())


def encode(source, destination, bitrate):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                    "-codec:a", "libmp3lame", "-b:a", bitrate, "-map_metadata", "-1", str(destination)], check=True)


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    STUDY.mkdir(parents=True, exist_ok=True)
    length = 24
    t = np.arange(length * SR) / SR
    # Periodic spectra make a continuous loop. Warm broad resonances, no sub,
    # melody, pulse, pitch automation or long bright reverb.
    f = np.fft.rfftfreq(len(t), 1 / SR)
    weight = np.zeros_like(f)
    for center, width, strength in [(310, 85, 1), (620, 160, .36), (1100, 280, .13)]:
        weight += strength * np.exp(-.5 * ((f - center) / width) ** 2)
    weight *= (1 - np.exp(-(f / 180) ** 8)) * np.exp(-(f / 2600) ** 4)
    room = []
    for _ in range(2):
        x = np.fft.irfft(np.fft.rfft(RNG.normal(size=len(t))) * weight, n=len(t))
        room.append(x / rms(x))
    texture = np.column_stack(room)
    # Shared center keeps the low-level room present on mono laptop speakers.
    texture = .45 * texture + .55 * texture.mean(axis=1)[:, None]
    tonal = np.zeros((len(t), 2))
    for i, (hz, amount) in enumerate([(261.63, .52), (329.63, .28), (392, .20), (587.33, .055)]):
        hz = round(hz * length) / length
        envelope = 1 + .12 * np.sin(2 * np.pi * (i + 1) * t / length + i)
        tonal += stereo(np.sin(2 * np.pi * hz * t + i) * envelope * amount, (-1) ** i * .22)
    bed = .76 * texture + .24 * tonal
    bed *= (1 + .07 * np.sin(2 * np.pi * t / length))[:, None]
    bed *= .016 / rms(bed)
    # Tiny seam taper also tolerates encoder delay differences between decoders.
    edge = round(.008 * SR)
    bed[:edge] *= np.linspace(0, 1, edge)[:, None]
    bed[-edge:] *= np.linspace(1, 0, edge)[:, None]

    focus = contact(.18, 590, .024, .10)
    opening = contact(.46, 345, .066, .22)
    settle = contact(.80, 345, .10, .19)
    # Short, dark reflections are baked. No live convolution graph.
    dry = settle.copy()
    for delay, amount in [(.037, .12), (.071, .06), (.113, .025)]:
        shift = round(delay * SR)
        settle[shift:] += dry[:-shift] * amount

    write_wav(STUDY / "room-source.wav", bed)
    encode(STUDY / "room-source.wav", PUBLIC / "room-v1.mp3", "96k")
    for name, sound in [("focus", focus), ("open", opening), ("settle", settle)]:
        write_wav(PUBLIC / f"{name}-v1.wav", sound)

    sketch = bed.copy()
    sketch[:SR] *= np.linspace(0, 1, SR)[:, None]
    sketch[-2 * SR:] *= np.linspace(1, 0, 2 * SR)[:, None]

    def place(at, sound, gain=1, pan=0):
        i = round(at * SR)
        sketch[i:i + len(sound)] += stereo(sound, pan) * gain

    place(4.5, focus, .65, -.25)
    place(7.2, opening)
    place(12.0, focus, .42, -.55)
    place(12.65, focus, .48, .45)
    place(13.35, opening, .42, -.15)
    place(14.1, settle, 1, 0)
    place(19, opening, .65)
    # Same 50% master as the website. Do not normalize away the quiet idle.
    sketch *= .5
    write_wav(STUDY / "origin-sound-study.wav", sketch)
    encode(STUDY / "origin-sound-study.wav", STUDY / "origin-sound-study.mp3", "160k")
    measurements = {
        "sample_rate": SR, "duration_seconds": length,
        "ambient_rms_dbfs_at_default_volume": round(20 * np.log10(rms(bed * .5)), 2),
        "sketch_peak_dbfs": round(20 * np.log10(np.max(np.abs(sketch))), 2),
        "clipped_samples": int(np.count_nonzero(np.abs(sketch) >= 1)),
        "asset_bytes": {p.name: p.stat().st_size for p in sorted(PUBLIC.glob("*-v1.*"))},
        "provenance": "Newly synthesized study; no recordings, game assets or generated music service."
    }
    (STUDY / "measurements.json").write_text(json.dumps(measurements, indent=2) + "\n")
    print(json.dumps(measurements, indent=2))


if __name__ == "__main__":
    main()
