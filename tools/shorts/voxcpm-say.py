# VoxCPM2 voice-over, same control format as VoiceStudio's voxcpm2 engine: "(voice description)text".
import sys, time, soundfile as sf
from voxcpm import VoxCPM
model_dir, out, desc = sys.argv[1], sys.argv[2], sys.argv[3]
lines = sys.argv[4:]
t0 = time.time()
model = VoxCPM.from_pretrained(model_dir, load_denoiser=False) if 'load_denoiser' in VoxCPM.from_pretrained.__code__.co_varnames else VoxCPM.from_pretrained(model_dir)
print('loaded', round(time.time() - t0, 1), 's', flush=True)
import numpy as np
chunks = []
for i, text in enumerate(lines):
    t1 = time.time()
    wav = model.generate(text=f"({desc}){text}", cfg_value=2.0, inference_timesteps=10, max_len=min(4096, max(256, len(text) * 6)), retry_badcase=False)
    sr = getattr(model, 'tts_model', model).sample_rate if hasattr(getattr(model, 'tts_model', model), 'sample_rate') else 48000
    sf.write(out.replace('.wav', f'-{i}.wav'), wav, sr)
    chunks.append(wav)
    print(i, round(time.time() - t1, 1), 's', len(wav) / sr, flush=True)
