"""Nahraje hlas Miss Ember pro Školní ostrov (public/hlas).

Hlas: Kokoro-82M (Apache 2.0, https://huggingface.co/hexgrad/Kokoro-82M),
americká angličtina, ženský hlas af_heart, pomalejší tempo. Písmena se
čtou jako jejich názvy (a = ej, i = aj, z = zí). Každá promluva je zvlášť,
pauzy mezi písmeny dělá hra.

Příprava (jednou):
  python3 -m venv venv && venv/bin/pip install kokoro-onnx lameenc
  stáhnout kokoro-v1.0.int8.onnx a voices-v1.0.bin
    (https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)
  data espeak-ng (balíček espeakng_loader, složka espeak-ng-data) zkopírovat
    do krátké cesty – espeak-ng dlouhou cestu (nad ~160 znaků) nepřijme.

Spuštění:
  npx vite-node scripts/hlas/texty.ts -- /tmp/texty.json
  venv/bin/python scripts/hlas/nahraj.py /tmp/texty.json public/hlas <složka s modelem> <espeak-ng-data>

Hotové nahrávky se nepřenahrávají; nepoužité se smažou.
"""

import hashlib
import json
import os
import sys

import espeakng_loader
import lameenc
import numpy as np
from kokoro_onnx import EspeakConfig, Kokoro

VOICE = 'af_heart'
SPEED = 0.8
BITRATE = 40
VERSION = f'{VOICE}/{SPEED}/1'


def file_name(text: str) -> str:
    return hashlib.sha1(f'{VERSION}|{text}'.encode()).hexdigest()[:12] + '.mp3'


def trim(samples: np.ndarray, sr: int, level: float = 0.012, margin: float = 0.06) -> np.ndarray:
    loud = np.nonzero(np.abs(samples) > level)[0]
    if not len(loud):
        return samples
    pad = int(margin * sr)
    return samples[max(0, loud[0] - pad): min(len(samples), loud[-1] + pad)]


def mp3(samples: np.ndarray, sr: int) -> bytes:
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes()
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def main() -> None:
    texts_path, out_dir, model_dir, espeak_data = sys.argv[1:5]
    texts = json.load(open(texts_path, encoding='utf-8'))
    os.makedirs(out_dir, exist_ok=True)
    k = Kokoro(
        os.path.join(model_dir, 'kokoro-v1.0.int8.onnx'),
        os.path.join(model_dir, 'voices-v1.0.bin'),
        espeak_config=EspeakConfig(lib_path=espeakng_loader.get_library_path(), data_path=espeak_data),
    )
    clips = {}
    made = 0
    for i, text in enumerate(texts):
        name = file_name(text)
        clips[text] = name
        path = os.path.join(out_dir, name)
        if os.path.exists(path):
            continue
        samples, sr = k.create(text, voice=VOICE, speed=SPEED, lang='en-us')
        with open(path, 'wb') as f:
            f.write(mp3(trim(samples, sr), sr))
        made += 1
        if made % 50 == 0:
            print(f'{i + 1}/{len(texts)}', flush=True)
    keep = set(clips.values()) | {'index.json'}
    removed = [f for f in os.listdir(out_dir) if f not in keep]
    for f in removed:
        os.remove(os.path.join(out_dir, f))
    with open(os.path.join(out_dir, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({'voice': VERSION, 'clips': clips}, f, ensure_ascii=False, indent=0, sort_keys=True)
    print(f'hotovo: {len(clips)} promluv, nově {made}, smazáno {len(removed)}')


if __name__ == '__main__':
    main()
