# Material sound study · 0x00

The first pass is **newly synthesized audio**, not recordings of Oleksandr's
hardware, not sampled game audio, and not generated music from an AI service.
The references are THE FINALS and Valorant's precision and material feel;
the requested atmosphere is very quiet, warm and occupied, never ominous.

`build-sound.py` renders one 24-second room, a soft focus contact, a dry open
contact and a slightly more resonant settle. It requires Python with numpy and
ffmpeg with libmp3lame. Run `python3 tools/audio/build-sound.py` from the repo.
The desktop bundled Python also has numpy. The fixed seed makes regeneration
repeatable with the same tool versions. No additional runtime dependency ships.

Files in `public/audio/` are deployed. Source WAVs, a 24-second listening study
and its measurements land in `studies/awwwards-audit-2026-09-24/sound/`, which is
excluded from deployment. Nothing is fetched or decoded before sound opt-in.

Study timeline (rendered at the site's default 50% master):

- 0–4s: continuous atmosphere
- 4.5s: deliberate project focus
- 7.2s: opening a project
- 12–15s: origin fragments converge to one close contact
- 19s: one button press; release stays silent

The site drives the origin fragments from assembly thresholds, not the sketch's
fixed clock. No melody, wind, scroll grains, cursor tone or idle reward plays.
All output passes through one master; foreground sources are capped at four.
The sound toggle is static, and cue energy is read by the existing scene loop.

This is an auditionable direction, not a claim that listening taste is solved.
The next provenance upgrade is a clean recording of an actual Wafer switch or
enclosure, edited into this same small family. Do not use archive recordings
without listening for speech/music first, or present synthesis as real foley.
