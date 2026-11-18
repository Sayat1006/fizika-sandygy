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
