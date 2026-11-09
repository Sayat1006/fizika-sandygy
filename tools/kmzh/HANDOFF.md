# ҚМЖ v2 генераторы – жалғастыру нұсқауы

## Жағдай (9 қараша 2026)
- Сайтта дайын (v2): 7, 8, 9, 10-zhmb-2 (10 ЖМБ 2 сағ).
- Жасалған, сайтқа ЖҮКТЕЛМЕГЕН: 11-zhmb-3 (100 ҚМЖ) → `out11/`.
- Кезекте: 10 ЖМБ 3 сағ (102 сабақ, КТЖ: `ktzh_src/723b505b-…10_____3.docx`), 10 ҚГБ 2 сағ, 11 ҚГБ 2 сағ (екі нұсқаның жақсысын таңдау), 11 ҚГБ 1 сағ.

## Құрылым
- `gen/make2.py` – генератор (дизайндар: poe, jigsaw, case, pairs, flipped, gallery, stations, quest, lab, tjb; 45 мин; БЖБ = 20 мин сабақ + 25 мин БЖБ; ТЖБ = 45 мин; күн қойылмайды; құндылық айы сабақ ретінен).
- `gen/g{7..11}[a-d].py` – негізгі спецификациялар S; `gen/v{7..11}.py` – v2 қосымша мазмұн V (ex, m, l, x, deep, demo, base, spec).
- `gen/ktzh.json`, `ktzh2.json` – КТЖ; жаңа нұсқалар `ktzh_v2.json`-ға (кілттер '10-zhmb-3', '10-kgb-2', '11-kgb-2', '11-kgb-1').
- `build2.js` – docx құрастырушы (npm `docx`), 130-бұйрық үлгісі; суреттер `img/v2` (FS_IMG).
- `gen/deploy_v2.py` – сайтқа көшіру + PDF + WebP превью + manifest/previews.json.

## Жаңа ортада іске қосу
```
cp -r tools/kmzh /home/claude/kmzh      # жолдар /home/claude/kmzh және /home/claude/fizika-sandygy деп жазылған
cd /home/claude/kmzh && npm i docx qrcode   # қажет болса
pip install pillow matplotlib qrcode --break-system-packages
# LibreOffice (soffice) және poppler (pdftoppm, pdfinfo) керек
cd gen && FS_OUT=/home/claude/kmzh/final_v2 python3 make2.py 11
python3 deploy_v2.py 11     # deploy_v2.py ішіндегі scratchpad жолын /tmp-ға ауыстыр
cd /home/claude/fizika-sandygy && git add -A && git commit -m "..." && git push
```
ҚГБ: make2.py-да `kgb='-kgb-' in variant` – C деңгейі жоқ, қысқартылған; 1–2 бет аз болуы керек. ҚГБ үшін V[n]['base']=(сынып, n) арқылы ЖМБ спецификациясын алу. Жаңа нұсқаларды `public/lessons.json` пен manifest-ке қосу керек (pres/ws жоқ).
