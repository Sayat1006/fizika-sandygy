"""Дайын видеоларды сайтқа шығару: tools/video/out/{id}.mp4 (+ {id}.jpg — алғашқы кадр)
→ public/vid/<хэш>/{id}.mp4, public/videos.json ({"v:n": [{src, poster, title}]}).

    python3 tools/video/publish.py

Қай сабаққа қай видео — tools/video/videos.json: lessons ("v:n") және/немесе match (сабақ тақырыбының regex өрнегі, барлық нұсқа). Видеолар ашық (Vercel CDN), атауы хэшпен.
"""
import hashlib, json, os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
SECRET = 'sabaqtas-vid-3c81e0'


def main():
    global LESSONS
    LESSONS = json.load(open(os.path.join(REPO, 'public', 'lessons.json'), encoding='utf-8'))
    cfg = json.load(open(os.path.join(HERE, 'videos.json'), encoding='utf-8'))
    out = {}
    for vid, meta in cfg.items():
        src = os.path.join(HERE, 'out', vid + '.mp4')
        if not os.path.exists(src):
            print('жоқ:', src); continue
        h = hashlib.sha256((SECRET + vid).encode()).hexdigest()[:20]
        d = os.path.join(REPO, 'public', 'vid', h)
        os.makedirs(d, exist_ok=True)
        shutil.copyfile(src, os.path.join(d, vid + '.mp4'))
        poster = os.path.join(HERE, 'out', vid + '.jpg')
        if os.path.exists(poster):
            shutil.copyfile(poster, os.path.join(d, vid + '.jpg'))
        item = {'src': f'/vid/{h}/{vid}.mp4', 'poster': f'/vid/{h}/{vid}.jpg' if os.path.exists(poster) else None, 'title': meta['title']}
        keys = list(meta.get('lessons', []))
        for pat in meta.get('match', []):  # тақырып өрнегі: барлық сыныптың барлық нұсқасынан
            keys += [f"{l['v']}:{l['n']}" for l in LESSONS if re.search(pat, l['topic'])]
        for key in dict.fromkeys(keys):
            if item not in out.setdefault(key, []): out[key].append(item)
    json.dump(out, open(os.path.join(REPO, 'public', 'videos.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('видео:', len(cfg), '· сабақ:', len(out))


if __name__ == '__main__':
    main()
