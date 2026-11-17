#!/bin/sh
# sh make.sh hooke inertia ... — сахналарды видеоға айналдыру (out/{id}.mp4 + out/{id}.jpg постер)
set -e
cd "$(dirname "$0")"
PORT=8765; FR=${FRAMES:-/tmp/vframes}
mkdir -p scenes/lib out
[ -f scenes/lib/three.module.js ] || cp ../../web/node_modules/three/build/three.module.js ../../web/node_modules/three/build/three.core.js scenes/lib/
curl -s -o /dev/null http://127.0.0.1:$PORT/kit.js || { (cd scenes && python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &); sleep 1; }
for id in "$@"; do
  rm -rf "$FR/$id"; node render.js $PORT $id.html "$FR/$id" 30 0 18
  ffmpeg -loglevel error -y -framerate 30 -i "$FR/$id/f%04d.jpg" -c:v libx264 -preset slow -crf ${CRF:-24} -pix_fmt yuv420p -movflags +faststart out/$id.mp4
  ffmpeg -loglevel error -y -i "$FR/$id/f$(printf %04d ${POSTER:-300}).jpg" -q:v 4 out/$id.jpg
  ls -la out/$id.mp4
done
