// ҚМЖ v2 builder: node build2.js lesson.json out.docx  (adds text/figure sections, image dir via FS_IMG)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageOrientation,
  ExternalHyperlink, LevelFormat, VerticalAlign,
} = require('docx');

const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];
const IMG = process.env.FS_IMG || path.join(__dirname, 'img');
const FONT = 'Times New Roman';
const SZ = +(process.env.SZ || 22); // 11pt

const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };
const margins = { top: 30, bottom: 30, left: 80, right: 80 };

// inline **bold**, __underline__, *italic*
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), font: FONT, size: SZ, ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, size: SZ, ...base }));
    else if (t.startsWith('__')) out.push(new TextRun({ text: t.slice(2, -2), underline: {}, font: FONT, size: SZ, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, font: FONT, size: SZ, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), font: FONT, size: SZ, ...base }));
  return out;
}

function para(line, opts = {}) {
  const sp = { after: 0, line: 240 };
  if (line === '') return new Paragraph({ spacing: sp, children: [new TextRun({ text: '', font: FONT, size: SZ })] });
  if (line.startsWith('img:')) {
    const [, name, w, h] = line.split(':');
    return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 20 }, children: [new ImageRun({
      type: 'png', data: fs.readFileSync(path.join(IMG, name)),
      transformation: (() => { const mx = opts.cw ? Math.floor((opts.cw - 200) / 15) : 9999; const k = Math.min(1, mx / +w); return { width: Math.round(+w * k), height: Math.round(+h * k) }; })(), altText: { title: name, description: name, name } })] });
  }
  if (line.startsWith('link:')) {
    const [label, url] = line.slice(5).split('|');
    return new Paragraph({ spacing: sp, children: [
      ...(label ? runs(label + ' ') : []),
      new ExternalHyperlink({ link: url, children: [new TextRun({ text: url, style: 'Hyperlink', font: FONT, size: SZ })] })] });
  }
  if (line.startsWith('- ')) return new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: sp, children: runs(line.slice(2)) });
  if (line.startsWith('> ')) return new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp, children: runs(line.slice(2)) });
  return new Paragraph({ spacing: opts.keepNext ? { before: 120, after: 40 } : sp, alignment: opts.align, keepNext: opts.keepNext, children: runs(line) });
}

function cell(lines, width, o = {}) {
  if (typeof lines === 'string') lines = [lines];
  return new TableCell({
    borders, margins, width: { size: width, type: WidthType.DXA },
    columnSpan: o.span, verticalAlign: o.valign || VerticalAlign.TOP,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    children: lines.map((l) => para(l, { ...o, cw: width })),
  });
}

function table(widths, rows) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows });
}

const TW = 10466; // A4 portrait, 0.5in margins
const H = [2700, 3883, 3883];
const HEAD = '**';
const children = [];
children.push(para('Бекітемін:'));
children.push(para(`Оқу ісі жөніндегі орынбасары: ${L.zam}`));
children.push(para(''));
// Нысанның тақырыптық бөлігі (министрлік, ұйым атауы, «Қысқа мерзімді (сабақ) жоспары», тақырып) алынды:
// тақырып пен барлық деректер төмендегі кестеде бар (мұғалімдердің өтінішімен — артық бет орны жоқ).

const hdrRows = [];
const two = (k, v) => new TableRow({ children: [cell(HEAD + k + HEAD, H[0]), cell(v, H[1] + H[2], { span: 2 })] });
hdrRows.push(two('Бөлім:', L.bolim));
hdrRows.push(two('Педагогтың аты-жөні:', L.teacher));
hdrRows.push(two('Күні:', L.date));
hdrRows.push(new TableRow({ children: [cell(`**Сынып:** ${L.grade}`, H[0]), cell('Қатысушылар саны:', H[1]), cell('Қатыспағандар саны:', H[2])] }));
hdrRows.push(two('Сабақтың тақырыбы:', `**${L.topic}**`));
hdrRows.push(two('Оқу бағдарламасына сәйкес оқыту мақсаттары:', L.objectives));
hdrRows.push(two('Сабақтың мақсаты:', L.smart));
for (const [k, v] of L.extraHeader) hdrRows.push(two(k, v));
children.push(table(H, hdrRows));
children.push(para('**Сабақтың барысы:**', { keepNext: true }));

const W = [1560, 4000, 1900, 1740, 1266]; // кезең мен ресурс бағаны сөз бөлінбейтіндей кең
const sRows = [new TableRow({ tableHeader: true, children: [
  'Сабақтың кезеңі/ уақыт', 'Педагогтің әрекеті', 'Оқушының әрекеті', 'Бағалау', 'Ресурстар',
].map((t, i) => cell(`**${t}**`, W[i], { fill: 'D9E2F3', align: AlignmentType.CENTER })) })];
for (const st of L.stages) {
  sRows.push(new TableRow({ cantSplit: false, children: [
    cell(st.stage, W[0], { fill: 'F2F2F2' }), cell(st.teacher, W[1]), cell(st.student, W[2]), cell(st.assess, W[3]), cell(st.res, W[4]),
  ] }));
}
// Саралау / ЕББҚ / бағалау / қауіпсіздік — сабақ барысы кестесінің ішінде, соңғы жолдар
for (const [label, lines] of (L.tail || [])) {
  sRows.push(new TableRow({ cantSplit: true, children: [cell(`**${label}**`, W[0], { fill: 'F2F2F2' }), cell(lines, W[1] + W[2] + W[3] + W[4], { span: 4 })] }));
}
children.push(table(W, sRows));

// Extra sections (form №130 tail): Саралау | Бағалау | Денсаулық
for (const sec of L.sections) {
  if (sec.newPage) children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  children.push(para(`**${sec.title}**`, { keepNext: true }));
  if (sec.type === 'text') {
    children.push(table([TW], [new TableRow({ children: [cell(sec.lines, TW, { fill: sec.fill })] })]));
    continue;
  }
  if (sec.type === 'qr') {
    const w = Math.floor(TW / sec.items.length); const ws = sec.items.map(() => w); ws[ws.length - 1] += TW - w * ws.length;
    children.push(table(ws, [new TableRow({ children: sec.items.map((it, i) => cell([`**${it[0]}** – ${it[1]}`, `link:|${it[2]}`, `img:${it[3]}:56:56`], ws[i])) })]));
    continue;
  }
  const n = sec.cols.length;
  let ws = sec.widths || Array(n).fill(Math.floor(TW / n));
  { const sm = ws.reduce((a, b) => a + b, 0); ws = ws.map((x) => Math.floor(x * TW / sm)); ws[n - 1] += TW - ws.reduce((a, b) => a + b, 0); }
  const rows = [new TableRow({ tableHeader: true, children: sec.cols.map((c, i) => cell(`**${c}**`, ws[i], { fill: 'D9E2F3', align: AlignmentType.CENTER })) })];
  for (const r of sec.rows) rows.push(new TableRow({ children: r.map((c, i) => cell(c, ws[i])) }));
  children.push(table(ws, rows));
}

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: SZ } } },
    characterStyles: [{ id: 'Hyperlink', name: 'Hyperlink', run: { color: '0563C1', underline: {} } }] },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 220 } }, run: { font: FONT } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
    margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
});
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('written', OUT); });
