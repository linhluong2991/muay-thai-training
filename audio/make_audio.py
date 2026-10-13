"""Make the Combo caller's sound clips (run on a Mac; not part of the site).

Voice clips come from macOS `say`; bells and clacks are synthesised here. Each clip
is trimmed of silence, peak-normalised, and saved as small AAC .m4a files:

    audio/voice/one.m4a ... six.m4a, round-one.m4a ... round-five.m4a, rest.m4a, done.m4a
    audio/voice/combo-1-2-5-2.m4a ...  one file per combo, spoken as one phrase
    audio/voice/combos.json            the list of combo files (the site reads it)
    audio/sfx/bell.m4a, bell-end.m4a, clack.m4a, silence.m4a

Combos come from the Combos table in techniques.md and from combos.md, so run this
again whenever either file gets a new combo.

Usage:  python3 audio/make_audio.py [voice]     (default voice: Samantha)
Needs:  macOS `say` and `afconvert`, Python 3 with numpy.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

import numpy as np

VOICE = sys.argv[1] if len(sys.argv) > 1 else "Samantha"
RATE_WPM = 220          # a bit brisker than the default 175, like a coach calling pads
SR = 24000              # voice sample rate
SFX_SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
NUM_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]

VOICE_CLIPS = {
    **{w: w for w in ["one", "two", "three", "four", "five", "six"]},
    **{f"round-{w}": f"Round {w}." for w in ["one", "two", "three", "four", "five"]},
    "rest": "Rest.",
    "done": "Done.",
}


def read_wav(path):
    with wave.open(path, "rb") as f:
        data = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return data, f.getframerate()


def write_wav(path, data, sr):
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sr)
        f.writeframes(pcm.tobytes())


def trim(data, sr, threshold=0.004, pad_ms=15):  # low threshold keeps soft "f"/"th"/"t" sounds
    """Cut leading/trailing silence so chained numbers sound snappy."""
    loud = np.flatnonzero(np.abs(data) > threshold)
    if not len(loud):
        return data
    pad = int(sr * pad_ms / 1000)
    out = data[max(0, loud[0] - pad): loud[-1] + pad].copy()
    fade = min(len(out) // 4, int(sr * 0.004))  # 4 ms fades, no clicks
    if fade:
        out[:fade] *= np.linspace(0, 1, fade)
        out[-fade:] *= np.linspace(1, 0, fade)
    return out


def normalise(data, peak=0.89):  # about -1 dBFS
    m = np.max(np.abs(data)) or 1
    return data * (peak / m)


def to_m4a(data, sr, out_path, bitrate):
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "clip.wav")
        write_wav(wav, data, sr)
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", str(bitrate), wav, out_path], check=True)


def say_clip(text, out_path):
    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, "raw.wav")
        subprocess.run(["say", "-v", VOICE, "-r", str(RATE_WPM), "-o", raw, f"--data-format=LEI16@{SR}", text], check=True)
        data, sr = read_wav(raw)
    to_m4a(normalise(trim(data, sr)), sr, out_path, 48000)


def make_voice():
    out_dir = os.path.join(HERE, "voice")
    os.makedirs(out_dir, exist_ok=True)
    for name, text in VOICE_CLIPS.items():
        say_clip(text, os.path.join(out_dir, f"{name}.m4a"))


def combo_code(cell):
    """'1-2 (jab-cross)' -> '1-2' (same rule as the site)."""
    m = re.match(r"^\s*(\d(?:\s*-\s*\d)*)(?!\d)", re.sub(r"[*_`]", "", cell))
    return re.sub(r"\s+", "", m.group(1)) if m else ""


def table_first_column(lines):
    rows = [l for l in lines if l.strip().startswith("|")]
    return [r.strip().strip("|").split("|")[0].strip() for r in rows[2:]]  # skip header + separator


def all_combos():
    """Combos table in techniques.md + every row of combos.md, deduplicated."""
    codes = []
    tech = open(os.path.join(ROOT, "techniques.md"), encoding="utf-8").read().split("\n")
    section = []
    for line in tech:
        if line.startswith("## "):
            if section and re.match(r"##\s+combo", section[0], re.I):
                break
            section = [line]
        elif section:
            section.append(line)
    if section and re.match(r"##\s+combo", section[0], re.I):
        codes += [combo_code(c) for c in table_first_column(section)]
    path = os.path.join(ROOT, "combos.md")
    if os.path.exists(path):
        codes += [combo_code(c) for c in table_first_column(open(path, encoding="utf-8").read().split("\n"))]
    seen, out = set(), []
    for c in codes:
        if c and c not in seen and all(int(n) < len(NUM_WORDS) for n in c.split("-")):
            seen.add(c)
            out.append(c)
    return out


def make_combos():
    """One file per combo, spoken as one phrase ("one, two, five, two")."""
    out_dir = os.path.join(HERE, "voice")
    codes = all_combos()
    for code in codes:
        say_clip(", ".join(NUM_WORDS[int(n)] for n in code.split("-")), os.path.join(out_dir, f"combo-{code}.m4a"))
    for f in os.listdir(out_dir):  # drop combos that are no longer in either file
        if f.startswith("combo-") and f.endswith(".m4a") and f[6:-4] not in codes:
            os.remove(os.path.join(out_dir, f))
    with open(os.path.join(out_dir, "combos.json"), "w", encoding="utf-8") as f:
        json.dump({"voice": VOICE, "rateWpm": RATE_WPM, "combos": codes}, f, indent=2)
        f.write("\n")
    return codes


def bell_strike(dur=1.7):
    t = np.arange(int(SFX_SR * dur)) / SFX_SR
    sig = np.zeros_like(t)
    for ratio, level in [(1, 0.5), (2.76, 0.22), (5.4, 0.12), (8.93, 0.05)]:
        decay = 1.6 / np.sqrt(ratio)
        env = np.minimum(t / 0.006, 1) * np.exp(-t * 6.9 / decay)  # ~ -60 dB at `decay`
        sig += level * env * np.sin(2 * np.pi * 830 * ratio * t)
    return sig


def mix(parts, offsets, dur):
    out = np.zeros(int(SFX_SR * dur))
    for part, off in zip(parts, offsets):
        i = int(SFX_SR * off)
        n = min(len(part), len(out) - i)
        out[i:i + n] += part[:n]
    return out


def clack_burst():
    rng = np.random.default_rng(7)
    n = int(SFX_SR * 0.06)
    noise = rng.uniform(-1, 1, n) * (1 - np.arange(n) / n) ** 4
    # simple band-pass around 2.4 kHz: difference of two one-pole low-passes
    def lowpass(x, fc):
        a = np.exp(-2 * np.pi * fc / SFX_SR)
        y = np.zeros_like(x)
        for i in range(1, len(x)):
            y[i] = (1 - a) * x[i] + a * y[i - 1]
        return y
    return lowpass(noise, 4000) - lowpass(noise, 1500)


def make_sfx():
    out_dir = os.path.join(HERE, "sfx")
    os.makedirs(out_dir, exist_ok=True)
    clips = {
        "bell": bell_strike(),
        "bell-end": mix([bell_strike()] * 3, [0, 0.32, 0.64], 2.4),
        "clack": mix([clack_burst()] * 2, [0, 0.2], 0.3),
    }
    for name, data in clips.items():
        to_m4a(normalise(data, 0.8), SFX_SR, os.path.join(out_dir, f"{name}.m4a"), 64000)
    # One second of silence, looped by the site during a session so iPhone treats the
    # page as media playback and the silent switch doesn't mute the voice.
    to_m4a(np.zeros(SFX_SR), SFX_SR, os.path.join(out_dir, "silence.m4a"), 32000)


if __name__ == "__main__":
    make_voice()
    combos = make_combos()
    make_sfx()
    print(f"Made {len(VOICE_CLIPS)} voice clips and {len(combos)} combo files ({VOICE}, {RATE_WPM} wpm), plus 3 sound effects and silence.")
    print("Combos:", " ".join(combos))
