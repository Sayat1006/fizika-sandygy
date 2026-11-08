// ҚМЖ-ны мұғалімге бейімдеу: «Педагогтың аты-жөні» мен «Күні» ұяшықтарын толтырады.
const { readZip, writeZip, entryData } = require('./_zip');

const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Puts `value` into the table cell that follows the cell containing `label`.
function fillNextCell(xml, label, value) {
  const at = xml.indexOf(label);
  if (at < 0 || !value) return xml;
  const labelEnd = xml.indexOf('</w:tc>', at);
  if (labelEnd < 0) return xml;
  const labelStart = Math.max(xml.lastIndexOf('<w:tc>', at), xml.lastIndexOf('<w:tc ', at));
  const cellStart = xml.indexOf('<w:tc', labelEnd + 7);
  const cellEnd = xml.indexOf('</w:tc>', cellStart);
  if (cellStart < 0 || cellEnd < 0 || cellStart - labelEnd > 40) return xml;
  let cell = xml.slice(cellStart, cellEnd);
  // reuse the label's font, without bold
  const rPrs = xml.slice(labelStart, labelEnd).match(/<w:rPr>[\s\S]*?<\/w:rPr>/g);
  const rPr = rPrs ? rPrs[rPrs.length - 1].replace(/<w:b\/>|<w:bCs\/>|<w:b w:val="[^"]*"\/>|<w:bCs w:val="[^"]*"\/>/g, '') : '';
  const run = `<w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(value)}</w:t></w:r>`;
  const firstP = cell.search(/<w:p[ >\/]/);
  if (firstP < 0) return xml;
  if (/^<w:p\s*\/>/.test(cell.slice(firstP))) {
    cell = cell.slice(0, firstP) + `<w:p>${run}</w:p>` + cell.slice(firstP).replace(/^<w:p\s*\/>/, '');
  } else {
    const pEnd = cell.indexOf('</w:p>', firstP);
    let p = cell.slice(firstP, pEnd).replace(/<w:r[ >][\s\S]*?<\/w:r>/g, '');
    cell = cell.slice(0, firstP) + p + run + cell.slice(pEnd);
    // later paragraphs in the cell: drop leftover runs (e.g. the "«_» ____ 20_ ж." placeholder split over lines)
    const head = cell.slice(0, cell.indexOf('</w:p>', firstP) + 6);
    cell = head + cell.slice(head.length).replace(/<w:r[ >][\s\S]*?<\/w:r>/g, '');
  }
  return xml.slice(0, cellStart) + cell + xml.slice(cellEnd);
}

function personalizeKmzh(buf, { teacher, date }) {
  if (!teacher && !date) return buf;
  try {
    const entries = readZip(buf);
    const doc = entries.find((e) => e.name === 'word/document.xml');
    if (!doc) return buf;
    let xml = entryData(doc).toString('utf8');
    xml = fillNextCell(xml, 'Педагогтың аты-жөні:', teacher);
    xml = fillNextCell(xml, 'Күні:', date);
    return writeZip(entries.map((e) => (e === doc ? { name: e.name, data: Buffer.from(xml, 'utf8') } : e)));
  } catch (e) {
    console.error('personalize failed', e);
    return buf;
  }
}

module.exports = { personalizeKmzh };
