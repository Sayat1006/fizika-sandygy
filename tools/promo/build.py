"""Таныстыру видеосын жинау: python3 build.py h|v  → out/promo_<fmt>.mp4
Әр сахна: монитор рамкасы + экран жазбасы (жылдамдығы сахна ұзақтығына сай) + субтитр (+ телефон).
audio/<id>.mp3 болса, сахна ұзақтығы — дыбыстың ұзақтығы + 0,5 с."""
import json, os, subprocess, sys
fmt = sys.argv[1] if len(sys.argv) > 1 else 'h'
L = json.load(open('layout.json'))[fmt]; P = json.load(open('plan.json'))[fmt]
FPS = 30; S = L['s']; os.makedirs('work', exist_ok=True); os.makedirs('out', exist_ok=True)
def run(cmd): r = subprocess.run(cmd, capture_output=True, text=True); assert r.returncode == 0, ' '.join(cmd[-3:]) + '\n' + r.stderr[-1500:]
def dur(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).strip())
def seg_video(sg, out_d, W, H, outf):
    src, a, b = sg['src'], sg['a'], sg['b']; z0, z1 = sg.get('z0', 1.0), sg.get('z1', sg.get('z0', 1.0))
    c0 = sg.get('c0', [0.5, 0.5]); c1 = sg.get('c1', c0); N = max(1, int(out_d * FPS))
    E = f"(min(1,on/{N})*min(1,on/{N})*(3-2*min(1,on/{N})))"
    Z = f"({z0}+({z1}-{z0})*{E})"; CX = f"({c0[0]}+({c1[0]}-{c0[0]})*{E})"; CY = f"({c0[1]}+({c1[1]}-{c0[1]})*{E})"
    zp = f"zoompan=z='{Z}':x='max(0,min(iw-iw/zoom,{CX}*iw-iw/zoom/2))':y='max(0,min(ih-ih/zoom,{CY}*ih-ih/zoom/2))':d=1:s={W}x{H}:fps={FPS}"
    if src.endswith('.png'):
        inp = ['-loop', '1', '-framerate', str(FPS), '-t', f'{out_d:.3f}', '-i', src]; pre = 'scale=iw:ih'
    else:
        speed = (b - a) / out_d; inp = ['-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', src]; pre = f'setpts=(PTS-STARTPTS)/{speed:.5f},fps={FPS},scale=1920:-2'
    run(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-vf', f'{pre},{zp},tpad=stop_mode=clone:stop_duration=2,trim=duration={out_d:.3f},setsar=1,format=yuv420p',
         '-r', str(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-an', outf])
def seq(segs, D, W, H, tag):
    nat = [(s['b'] - s['a']) * s.get('w', 1.0) for s in segs]; f = D / sum(nat); parts = []
    for i, (s, n) in enumerate(zip(segs, nat)):
        o = f'work/{tag}_{i}.mp4'; seg_video(s, n * f, W, H, o); parts.append(o)
    lst = f'work/{tag}.txt'; open(lst, 'w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in parts))
    out = f'work/{tag}.mp4'; run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out]); return out
scenes = []
for sc in P:
    sid = sc['id']; au = f'audio/{sid}.mp3'; D = max(dur(au) + 0.5, sc.get('min', 0)) if os.path.exists(au) else sc['dur']
    segs = sc['segs']; full = None
    if sc.get('full_last'):  # соңғы кадр — монитордан тыс, толық экран
        nat = [(s['b'] - s['a']) * s.get('w', 1.0) for s in segs]; f = D / sum(nat); full = (segs[-1], nat[-1] * f); segs = segs[:-1]; Dm = D - full[1]
    else: Dm = D
    scr = seq(segs, Dm, S['w'], S['h'], f'{fmt}{sid}_scr')
    inputs = ['-loop', '1', '-framerate', str(FPS), '-t', f'{Dm:.3f}', '-i', f'assets/{fmt}_frame.png', '-i', scr,
              '-loop', '1', '-framerate', str(FPS), '-t', f'{Dm:.3f}', '-i', f'assets/{fmt}_sub_{sid}.png']
    fc = f"[0][1]overlay={S['x']}:{S['y']}[m];[2]format=rgba,fade=in:st=0.3:d=0.4:alpha=1,fade=out:st={max(0.5, Dm - 0.5):.2f}:d=0.4:alpha=1[sb];[m][sb]overlay=0:0[o]"
    if sc.get('phone'):
        ph = L['phone']; pv = seq(sc['phone'], Dm, ph['w'], ph['h'], f'{fmt}{sid}_ph')
        inputs += ['-loop', '1', '-framerate', str(FPS), '-t', f'{Dm:.3f}', '-i', f'assets/{fmt}_phone.png', '-i', pv]
        fc = fc.replace('[m][sb]overlay=0:0[o]', f"[m][3]overlay=0:0[m2];[m2][4]overlay={ph['x']}:{ph['y']}[m3];[m3][sb]overlay=0:0[o]")
    o = f'work/{fmt}{sid}.mp4'
    run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', fc, '-map', '[o]', '-t', f'{Dm:.3f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', o])
    parts = [o]
    if full:
        fo = f'work/{fmt}{sid}_full.mp4'; seg_video(full[0], full[1], L['W'], L['H'], fo); parts.append(fo)
    scenes += parts; print(sid, f'{D:.1f}s', flush=True)
open('work/all.txt', 'w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in scenes))
run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'work/all.txt', '-c', 'copy', 'work/video_only.mp4'])
# дыбыс: әр сахнаның басында
ids = [sc['id'] for sc in P]; have = [i for i in ids if os.path.exists(f'audio/{i}.mp3')]
out = f'out/promo_{fmt}.mp4'
if have:
    t = 0.0; ins = []; fl = []; k = 0
    for sc in P:
        au = f'audio/{sc["id"]}.mp3'; D = max(dur(au) + 0.5, sc.get('min', 0)) if os.path.exists(au) else sc['dur']
        if os.path.exists(au): ins += ['-i', au]; k += 1; fl.append(f'[{k}]adelay={int((t + 0.15) * 1000)}:all=1[a{k}]')
        t += D
    fc = ';'.join(fl) + ';' + ''.join(f'[a{i}]' for i in range(1, k + 1)) + f'amix=inputs={k}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={t - 1.2:.2f}:d=1.2[a]'
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'work/video_only.mp4', *ins, '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', '-t', f'{t:.2f}', out])
else:
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'work/video_only.mp4', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-movflags', '+faststart', out])
print(out, f'{dur(out):.1f}s', os.path.getsize(out) // 1024, 'KB')
