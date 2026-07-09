import { PDFDocument, rgb, PDFName, PDFBool } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mdPath = join(__dirname, '../docs/大阪旅行攻略_2026年8月.md');
const pdfPath = join(__dirname, '../docs/大阪旅行攻略_2026年8月.pdf');
const fontPath = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = { top: 50, bottom: 50, left: 42, right: 42 };
const CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right;

const COLORS = {
  h1: rgb(0.12, 0.23, 0.37),
  h2: rgb(0.12, 0.25, 0.69),
  h2bg: rgb(0.94, 0.97, 1),
  thBg: rgb(0.12, 0.25, 0.69),
  thText: rgb(1, 1, 1),
  border: rgb(0.8, 0.84, 0.88),
  zebra: rgb(0.97, 0.98, 0.99),
  text: rgb(0.1, 0.1, 0.1),
  note: rgb(0.57, 0.25, 0.05),
  noteBg: rgb(1, 0.98, 0.92),
};

let cbCounter = 0;

function parseMarkdown(src) {
  const lines = src.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const row = lines[i]
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
        if (!row.every((c) => /^:?-+:?$/.test(c))) rows.push(row);
        i++;
      }
      if (rows.length) blocks.push({ type: 'table', headers: rows[0], rows: rows.slice(1) });
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2) });
      i++;
      continue;
    }
    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', text: line.slice(2) });
      i++;
      continue;
    }
    if (line.trim() === '---') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }
    if (line.trim() === '') {
      i++;
      continue;
    }
    if (line.startsWith('*') && line.endsWith('*')) {
      blocks.push({ type: 'footer', text: line.slice(1, -1) });
      i++;
      continue;
    }
    blocks.push({ type: 'p', text: line });
    i++;
  }
  return blocks;
}

function wrapText(text, font, size, maxWidth) {
  const chars = [...text];
  const lines = [];
  let cur = '';
  for (const ch of chars) {
    const test = cur + ch;
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function isCheckboxCell(cell) {
  return /^\[\s*\]$/.test(cell.trim());
}

function cleanCell(cell) {
  return cell.replace(/^\[\s*\]\s*/, '').trim();
}

class PdfBuilder {
  constructor(pdfDoc, font) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.form = pdfDoc.getForm();
    this.page = null;
    this.y = 0;
    this.pageIndex = 0;
  }

  newPage() {
    this.page = this.pdfDoc.addPage([PAGE_W, PAGE_H]);
    this.pageIndex++;
    this.y = PAGE_H - MARGIN.top;
    return this.page;
  }

  ensureSpace(need) {
    if (!this.page || this.y - need < MARGIN.bottom) this.newPage();
  }

  drawText(text, x, y, size, color = COLORS.text, maxWidth = null) {
    const lines = maxWidth ? wrapText(text, this.font, size, maxWidth) : [text];
    for (const ln of lines) {
      this.page.drawText(ln, { x, y, size, font: this.font, color });
    }
    return lines.length;
  }

  addGap(h = 8) {
    this.y -= h;
  }

  renderH1(text) {
    this.ensureSpace(40);
    const size = 18;
    const w = this.font.widthOfTextAtSize(text, size);
    this.page.drawText(text, {
      x: (PAGE_W - w) / 2,
      y: this.y,
      size,
      font: this.font,
      color: COLORS.h1,
    });
    this.y -= 10;
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: PAGE_W - MARGIN.right, y: this.y },
      thickness: 1.5,
      color: COLORS.h2,
    });
    this.y -= 16;
  }

  renderH2(text) {
    this.ensureSpace(36);
    const h = 24;
    this.page.drawRectangle({
      x: MARGIN.left,
      y: this.y - h + 8,
      width: CONTENT_W,
      height: h,
      color: COLORS.h2bg,
    });
    this.page.drawRectangle({
      x: MARGIN.left,
      y: this.y - h + 8,
      width: 4,
      height: h,
      color: COLORS.h2,
    });
    this.page.drawText(text, {
      x: MARGIN.left + 12,
      y: this.y - 6,
      size: 13,
      font: this.font,
      color: COLORS.h2,
    });
    this.y -= h + 6;
  }

  renderH3(text) {
    this.ensureSpace(24);
    this.page.drawText(text, {
      x: MARGIN.left,
      y: this.y,
      size: 11,
      font: this.font,
      color: rgb(0.2, 0.25, 0.33),
    });
    this.y -= 18;
  }

  renderQuote(text) {
    this.ensureSpace(30);
    const pad = 10;
    const lines = wrapText(text, this.font, 9, CONTENT_W - pad * 2 - 6);
    const h = lines.length * 13 + pad * 2;
    this.page.drawRectangle({
      x: MARGIN.left,
      y: this.y - h + 10,
      width: CONTENT_W,
      height: h,
      color: COLORS.noteBg,
    });
    this.page.drawRectangle({
      x: MARGIN.left,
      y: this.y - h + 10,
      width: 3,
      height: h,
      color: rgb(0.96, 0.62, 0.04),
    });
    let ty = this.y - 4;
    for (const ln of lines) {
      this.page.drawText(ln, {
        x: MARGIN.left + pad + 4,
        y: ty,
        size: 9,
        font: this.font,
        color: COLORS.note,
      });
      ty -= 13;
    }
    this.y -= h + 4;
  }

  renderHr() {
    this.ensureSpace(12);
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: PAGE_W - MARGIN.right, y: this.y },
      thickness: 0.5,
      color: COLORS.border,
    });
    this.y -= 14;
  }

  renderP(text) {
    this.ensureSpace(20);
    const lines = wrapText(text, this.font, 10, CONTENT_W);
    for (const ln of lines) {
      this.page.drawText(ln, {
        x: MARGIN.left,
        y: this.y,
        size: 10,
        font: this.font,
        color: COLORS.text,
      });
      this.y -= 14;
    }
    this.y -= 2;
  }

  renderFooter(text) {
    this.ensureSpace(20);
    this.page.drawText(text, {
      x: MARGIN.left,
      y: this.y,
      size: 8,
      font: this.font,
      color: rgb(0.45, 0.5, 0.55),
    });
    this.y -= 16;
  }

  colWidths(headers, rows, hasCheckbox) {
    const n = headers.length;
    const weights = headers.map((h, i) => {
      if (hasCheckbox && i === 0) return 0.6;
      const hLen = [...h].length;
      const maxLen = Math.max(
        hLen,
        ...rows.map((r) => [...(r[i] || '')].length)
      );
      return Math.max(maxLen, 2);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    const checkboxW = hasCheckbox ? 22 : 0;
    const rest = CONTENT_W - checkboxW;
    return weights.map((w, i) =>
      hasCheckbox && i === 0 ? checkboxW : (w / total) * rest
    );
  }

  renderTable(headers, rows, inChecklistSection = false) {
    const hasCheckbox =
      inChecklistSection &&
      rows.some((r) => r.length && isCheckboxCell(r[0]));
    const widths = this.colWidths(headers, rows, hasCheckbox);
    const fontSize = 8.5;
    const lineH = 12;
    const padY = 5;
    const headerH = 20;

    const drawHeader = () => {
      this.ensureSpace(headerH + 20);
      let x = MARGIN.left;
      const top = this.y;
      for (let c = 0; c < headers.length; c++) {
        const w = widths[c];
        this.page.drawRectangle({ x, y: top - headerH + 6, width: w, height: headerH, color: COLORS.thBg });
        const lines = wrapText(headers[c], this.font, fontSize, w - 6);
        this.page.drawText(lines[0], {
          x: x + 3,
          y: top - 8,
          size: fontSize,
          font: this.font,
          color: COLORS.thText,
        });
        x += w;
      }
      this.y = top - headerH - 2;
    };

    drawHeader();

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const cellLines = row.map((cell, ci) => {
        const text = hasCheckbox && ci === 0 ? cleanCell(cell) : cell;
        return wrapText(text || ' ', this.font, fontSize, widths[ci] - 6);
      });
      const maxLines = Math.max(...cellLines.map((l) => l.length), 1);
      const rowH = maxLines * lineH + padY * 2;

      if (this.y - rowH < MARGIN.bottom) {
        this.newPage();
        drawHeader();
      }

      const top = this.y;
      let x = MARGIN.left;

      for (let ci = 0; ci < headers.length; ci++) {
        const w = widths[ci];
        const bg = ri % 2 === 1 ? COLORS.zebra : rgb(1, 1, 1);
        this.page.drawRectangle({ x, y: top - rowH, width: w, height: rowH, color: bg, borderColor: COLORS.border, borderWidth: 0.4 });

        if (hasCheckbox && ci === 0 && isCheckboxCell(row[0])) {
          const cbName = `check_${++cbCounter}`;
          const cb = this.form.createCheckBox(cbName);
          const cbSize = 11;
          cb.addToPage(this.page, {
            x: x + (w - cbSize) / 2,
            y: top - rowH + (rowH - cbSize) / 2,
            width: cbSize,
            height: cbSize,
          });
          try {
            cb.enableReadOnly(false);
          } catch (_) {}
        } else {
          let ty = top - padY - 2;
          for (const ln of cellLines[ci]) {
            this.page.drawText(ln, { x: x + 3, y: ty - lineH + 4, size: fontSize, font: this.font, color: COLORS.text });
            ty -= lineH;
          }
        }
        x += w;
      }
      this.y = top - rowH;
    }
    this.y -= 8;
  }

  render(blocks) {
    this.newPage();
    let inChecklist = false;

    for (const b of blocks) {
      if (b.type === 'h2' && b.text.includes('出发前准备清单')) inChecklist = true;
      if (b.type === 'h2' && !b.text.includes('出发前准备清单') && inChecklist) inChecklist = false;

      switch (b.type) {
        case 'h1':
          this.renderH1(b.text);
          break;
        case 'h2':
          this.renderH2(b.text);
          break;
        case 'h3':
          this.renderH3(b.text);
          break;
        case 'quote':
          this.renderQuote(b.text);
          break;
        case 'hr':
          this.renderHr();
          break;
        case 'p':
          this.renderP(b.text);
          break;
        case 'footer':
          this.renderFooter(b.text);
          break;
        case 'table':
          this.renderTable(b.headers, b.rows, inChecklist);
          break;
      }
    }
  }
}

const md = readFileSync(mdPath, 'utf-8');
const blocks = parseMarkdown(md);

const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(fontkit);

const fontBytes = readFileSync(fontPath);
const font = await pdfDoc.embedFont(fontBytes, { subset: true });

const builder = new PdfBuilder(pdfDoc, font);
builder.render(blocks);

// Help WPS / Adobe render checkbox states
try {
  const form = pdfDoc.getForm();
  form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True);
} catch (_) {}

const pdfBytes = await pdfDoc.save();
writeFileSync(pdfPath, pdfBytes);

console.log(`PDF generated: ${pdfPath}`);
console.log(`Pages: ${pdfDoc.getPageCount()}, Checkboxes: ${cbCounter}`);
