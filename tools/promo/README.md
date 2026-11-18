# Таныстыру видеосы

Сценарий — `script.md`. Видео нақты сайттан (sabaqtas-kz.vercel.app) демо-аккаунтпен түсіріледі.

    cd tools/promo
    export DEMO_LOGIN=... DEMO_PASS=...       # демо-аккаунт (репозиторийге жазылмайды)
    node scenes.js landing cabinet lesson board video   # экран жазбалары → rec/*.webm, уақыт белгілері → marks.json
    node live.js                              # «Сынып»: тақта + оқушы телефоны → rec/live.webm, rec/phone.webm
    node offline.js                           # интернетсіз тақта → rec/offline.webm
    node mkstill.js && node mkassets.js       # бастапқы/соңғы кадр, монитор мен телефон рамкасы, субтитрлер
    python3 build.py h                        # 16:9 → out/promo_h.mp4
    python3 build.py v                        # 9:16 → out/promo_v.mp4

Дыбыс: `audio/01.mp3 … 09.mp3` (16:9) және `audio/s1.mp3 … s5.mp3` (9:16). Файл болса, сахна ұзақтығы
дыбысқа қарай өзгереді, экран жазбасының жылдамдығы соған сай реттеледі (`plan.json`). Субтитр мәтіні — `subs.json`.
`assets/still.html` бастапқы кадрға `y4_kmzh_crop.png` (кабинеттегі ҚМЖ скриншотының қиындысы) керек.
Ескерту: `live.js` демо-сабақ ашады; соңында «Сабақты аяқтау» басылмаса, сессияны кабинеттен жабыңыз.

## Motion нұсқасы (анимациялы дизайн)

Композиция браузерде кадр-кадрымен салынады (`comp.html`, `window.renderFrame(t)`): әр сахнаның өз түсі (`PAL`), үш түсті сақинамен
ауысу, ортада үлкен шығып төменге түсетін тақырып, 3D браузер терезесі, атом/синусоида/фигуралар декоры, фондағы формула (`FORM`),
санала шығатын сандар, иконкалар, телефон, соңғы кадр.

    MOTION=1 python3 build.py h               # экран жазбалары сахналар бойынша + work/timeline_h.json
    for s in 01 02 03 04 05 06 07 08 09; do mkdir -p work/fr/$s; ffmpeg -i work/h${s}_scr.mp4 -q:v 3 work/fr/$s/%05d.jpg; done
    mkdir -p work/fr/ph && ffmpeg -i work/h07_ph.mp4 -q:v 3 work/fr/ph/%05d.jpg
    python3 -m http.server 8790 &             # tools/promo ішінде
    node mrender.js h                         # → work/mfr/*.jpg (4 параллель бет)
    python3 mencode.py h                      # → out/promo_h_motion.mp4

Анимация уақыттары `comp.html` ішіндегі `FX` нысанында, дыбыстағы кідірістерге қарай қойылған.
