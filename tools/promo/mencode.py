"""work/mfr/*.jpg + дыбыс → out/promo_<fmt>_motion.mp4 (дыбыс әр сахнаның басында, −16 LUFS)"""
import json, os, subprocess, sys
fmt = sys.argv[1] if len(sys.argv) > 1 else 'h'
TL = json.load(open(f'work/timeline_{fmt}.json')); t = 0.0; ins = []; fl = []; k = 0
for s in TL:
    if s['audio']: ins += ['-i', s['audio']]; k += 1; fl.append(f'[{k}]adelay={int((t + 0.15) * 1000)}:all=1[a{k}]')
    t += s['D']
fc = ';'.join(fl) + ';' + ''.join(f'[a{i}]' for i in range(1, k + 1)) + f'amix=inputs={k}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={t - 1.2:.2f}:d=1.2[a]'
out = f'out/promo_{fmt}_motion.mp4'
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', 'work/mfr/%05d.jpg', *ins, '-filter_complex', fc, '-map', '0:v', '-map', '[a]',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', '-t', f'{t:.2f}', out]
subprocess.run(cmd, check=True); print(out, os.path.getsize(out) // 1024, 'KB')
