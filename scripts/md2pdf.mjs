import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const [mdPath, pdfPath] = process.argv.slice(2);
if (!mdPath || !pdfPath) {
  console.error('用法: node scripts/md2pdf.mjs <输入.md> <输出.pdf>');
  process.exit(1);
}

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inlineFmt = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

const splitRow = (line) =>
  line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

const isDivider = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line);

function renderTable(lines) {
  const [head, , ...body] = lines;
  const th = splitRow(head).map((c) => `<th>${inlineFmt(c)}</th>`).join('');
  const rows = body
    .map((l) => `<tr>${splitRow(l).map((c) => `<td>${inlineFmt(c)}</td>`).join('')}</tr>`)
    .join('\n');
  return `<table><thead><tr>${th}</tr></thead><tbody>\n${rows}\n</tbody></table>`;
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let list = null;
  let quote = [];

  const flushList = () => {
    if (list) {
      out.push(`<ul>${list.join('')}</ul>`);
      list = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote>${quote.map(inlineFmt).join('<br>')}</blockquote>`);
      quote = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*\|/.test(line) && isDivider(lines[i + 1] ?? '')) {
      flushList();
      flushQuote();
      const block = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) block.push(lines[i++]);
      i--;
      out.push(renderTable(block));
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      flushQuote();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFmt(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      flushList();
      quote.push(line.replace(/^\s*>\s?/, ''));
      continue;
    }
    flushQuote();

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      list ??= [];
      list.push(`<li>${inlineFmt(bullet[1])}</li>`);
      continue;
    }

    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (numbered) {
      list ??= [];
      list.push(`<li>${inlineFmt(numbered[1])}</li>`);
      continue;
    }

    flushList();

    if (/^\s*---\s*$/.test(line)) {
      out.push('<hr>');
      continue;
    }
    if (line.trim() === '') continue;

    out.push(`<p>${inlineFmt(line.trim())}</p>`);
  }

  flushList();
  flushQuote();
  return out.join('\n');
}

const md = readFileSync(resolve(mdPath), 'utf8');
const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 14mm 12mm; }
  body { font-family: "PingFang SC", "Hiragino Sans", sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1e293b; }
  h1 { font-size: 20pt; color: #1e40af; border-bottom: 2px solid #2563eb; padding-bottom: 6px; }
  h2 { font-size: 14pt; color: #1e40af; margin-top: 18px; border-left: 4px solid #2563eb; padding-left: 8px; }
  h3 { font-size: 12pt; margin-top: 14px; color: #1e293b; }
  h4 { font-size: 11pt; margin-top: 10px; color: #334155; }
  h2, h3, h4 { break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 14px; font-size: 9.5pt; break-inside: avoid; }
  th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #eff6ff; color: #1e40af; font-weight: 600; }
  tr:nth-child(even) td { background: #f8fafc; }
  ul { margin: 6px 0 12px 18px; }
  li { margin: 2px 0; }
  blockquote { margin: 8px 0; padding: 8px 12px; background: #fff7ed; border-left: 4px solid #fb923c; font-size: 9.5pt; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
  a { color: #2563eb; text-decoration: none; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
  p { margin: 6px 0; }
</style></head><body>
${mdToHtml(md)}
</body></html>`;

const tmp = mkdtempSync(join(tmpdir(), 'md2pdf-'));
const htmlFile = join(tmp, 'doc.html');
writeFileSync(htmlFile, html, 'utf8');

execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${resolve(pdfPath)}`,
  `file://${htmlFile}`,
], { stdio: 'inherit' });

console.log(`已生成 ${pdfPath}`);
