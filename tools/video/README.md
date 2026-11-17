# Сөзсіз 3D видеолар (сынақ)

Әр құбылыс — бір HTML сахна (`scenes/*.html`, three.js). `window.renderFrame(t)` t секундтағы кадрды салады,
сондықтан видео әрдайым бірдей және тегіс шығады.

    # сахналар папкасында сервер: three.js `lib/` ішінде болуы керек
    mkdir -p scenes/lib && cp ../../web/node_modules/three/build/three.{module,core}.js scenes/lib/
    (cd scenes && python3 -m http.server 8765 --bind 127.0.0.1 &)
    node render.js 8765 archimedes.html /tmp/frames 30 0 18
    ffmpeg -framerate 30 -i /tmp/frames/f%04d.jpg -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart archimedes.mp4

Сынақ: «Архимед күші» (7-сынып), 18 с, 1280×720, ~1 МБ.
