# Voice-over (VoxCPM2)

Shorts narration uses **VoxCPM2** (openbmb/VoxCPM2, Apache-2.0, commercial use allowed), the
same engine and control format as VoiceStudio's `voxcpm2` engine: the text is prefixed with a voice
description in parentheses, `(voice description)line`. VoiceStudio itself (AGPL-3.0) is not vendored
into this repo; only this small script, which calls the `voxcpm` package directly.

Setup (CPU is fine, ~7 min per short line without a GPU):

    python3 -m venv venv && ./venv/bin/pip install voxcpm soundfile
    # model files from https://huggingface.co/openbmb/VoxCPM2 (needs huggingface.co, *.hf.co reachable)
    ./venv/bin/python tools/shorts/voxcpm-say.py <VoxCPM2 dir> /tmp/vo/line.wav "<voice description>" "line 1" "line 2" …

Writes `line-0.wav`, `line-1.wav`, … which `tools/shorts/edit-playtest.mjs` times to the beats.

House voice (2026-10-26): "An extremely excited young male gaming streamer, shouting with joy, very fast,
breathless, laughing, maximum hype energy". English.
