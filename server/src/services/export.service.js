const PDFDocument = require('pdfkit');
const { list } = require('./calculation.service');
const { todayKey } = require('../utils/time');

const L = {
  id: {
    head: ['Tanggal', 'Kategori', 'Aktivitas/Barang', 'Jumlah', 'Satuan', 'Faktor emisi', 'Status faktor', 'Periode (hari)', 'Emisi (kg CO2e)'],
    act: { TRANSPORT: 'Transportasi', ELECTRICITY: 'Listrik', AC: 'AC', ELECTRONICS: 'Elektronik' },
    title: 'Laporan Riwayat Emisi Karbon', user: 'Nama', made: 'Dibuat', filter: 'Filter', total: 'Total emisi', count: 'Jumlah catatan',
    note: 'Catatan: angka adalah ESTIMASI berbasis faktor emisi DEMO/ESTIMASI Emisify (mis. grid listrik ~0,87 kg CO2e/kWh), bukan data resmi.',
    all: 'Semua', empty: 'Tidak ada data untuk filter ini.',
  },
  en: {
    head: ['Date', 'Category', 'Activity/Item', 'Quantity', 'Unit', 'Emission factor', 'Factor status', 'Period (days)', 'Emissions (kg CO2e)'],
    act: { TRANSPORT: 'Transport', ELECTRICITY: 'Electricity', AC: 'AC', ELECTRONICS: 'Electronics' },
    title: 'Carbon Emission History Report', user: 'Name', made: 'Generated', filter: 'Filter', total: 'Total emissions', count: 'Records',
    note: 'Note: figures are ESTIMATES based on Emisify DEMO/ESTIMATE emission factors (e.g. grid ~0.87 kg CO2e/kWh), not official data.',
    all: 'All', empty: 'No data for this filter.',
  },
};

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function rowsFor(items, lang) {
  const l = L[lang];
  return items.map((c) => [
    c.activityDate, l.act[c.activityType], c.itemName[lang] || c.itemName.id, c.quantity, c.unit,
    `${c.factor.value} ${c.factor.unit}`, c.factor.status, c.periodDays, c.resultKg,
  ]);
}

async function exportHistory(user, q, format, lang) {
  const data = await list(user.id, q);
  const l = L[lang];
  const stamp = todayKey();
  const filename = `emisify-riwayat-${stamp}.${format}`;
  if (format === 'csv') {
    const lines = [l.head, ...rowsFor(data.items, lang)].map((r) => r.map(csvCell).join(','));
    return { filename, type: 'text/csv; charset=utf-8', body: Buffer.from(`\uFEFF${lines.join('\r\n')}\r\n`, 'utf8') };
  }
  return { filename, type: 'application/pdf', body: await buildPdf(user, q, data, lang, stamp) };
}

function buildPdf(user, q, data, lang, stamp) {
  const l = L[lang];
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fillColor('#C94A2F').font('Helvetica-Bold').fontSize(20).text('Emisify');
    doc.fillColor('#2E211B').fontSize(14).text(l.title);
    doc.moveDown(0.3).font('Helvetica').fontSize(9).fillColor('#7A675C')
      .text(`${l.user}: ${user.name}   |   ${l.made}: ${stamp}   |   ${l.filter}: ${q.category === 'ALL' ? l.all : l.act[q.category]}, ${q.range}, ${q.sort}`);
    doc.moveDown(0.8);

    const widths = [62, 70, 170, 55, 38, 110, 62, 55, 80];
    const startX = doc.page.margins.left;
    const drawRow = (cells, bold, fill) => {
      const y = doc.y;
      const h = 18;
      if (y + h > doc.page.height - 60) { doc.addPage(); return drawRow(cells, bold, fill); }
      if (fill) doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), h).fill(fill);
      let x = startX;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor('#2E211B');
      cells.forEach((cell, i) => {
        doc.text(String(cell), x + 4, y + 5, { width: widths[i] - 8, height: h - 4, ellipsis: true, lineBreak: false });
        x += widths[i];
      });
      doc.y = y + h;
      doc.x = startX;
      return null;
    };
    drawRow(l.head, true, '#F8DCC5');
    const rows = rowsFor(data.items, lang);
    if (!rows.length) doc.moveDown().font('Helvetica').fontSize(10).text(l.empty, startX);
    rows.forEach((r, i) => drawRow(r, false, i % 2 ? '#FFF8F0' : null));

    doc.moveDown(1).font('Helvetica-Bold').fontSize(11).fillColor('#2E211B')
      .text(`${l.total}: ${data.totalKg} kg CO2e   |   ${l.count}: ${data.count}`, startX);
    doc.moveDown(0.5).font('Helvetica').fontSize(8).fillColor('#7A675C').text(l.note, startX);
    doc.end();
  });
}

module.exports = { exportHistory };
