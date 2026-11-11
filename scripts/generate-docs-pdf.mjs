#!/usr/bin/env node
/**
 * Renders Markdown documentation files in docs/ into clean, print-ready PDFs
 * using Playwright's Chromium PDF engine.
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function markdownToHtml(md, title) {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Tables
  html = html.replace(
    /(?:^\|.*\|\r?\n)+/gm,
    (tableBlock) => {
      const rows = tableBlock
        .trim()
        .split(/\r?\n/)
        .filter((r) => !/^\|[\s:-]+\|$/.test(r.replace(/\|/g, '|')));
      const parsedRows = rows
        .filter((r) => !/^\|(?:\s*:?-+:?\s*\|)+$/.test(r.trim()))
        .map((r, idx) => {
          const cells = r
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());
          const tag = idx === 0 ? 'th' : 'td';
          return `<tr>${cells.map((c) => `<${tag}>${inlineFormat(c)}</${tag}>`).join('')}</tr>`;
        });
      return `<table>${parsedRows.join('')}</table>`;
    },
  );

  // Headings, lists, rules, paragraphs
  const lines = html.split(/\r?\n/);
  const out = [];
  let inList = false;

  for (const line of lines) {
    if (line.startsWith('<pre>') || line.startsWith('<table>')) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(line);
      continue;
    }
    if (/^---\s*$/.test(line)) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push('<hr />');
    } else if (line.startsWith('### ')) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    } else if (/^(\s*[-*]|\s*\d+\.)\s+/.test(line)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inlineFormat(line.replace(/^(\s*[-*]|\s*\d+\.)\s+/, ''))}</li>`);
    } else if (line.trim() === '') {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
    } else {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  if (inList) out.push('</ul>');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body {
      font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #291822;
      line-height: 1.55;
      font-size: 12.5px;
      padding: 20px 28px;
    }
    h1 {
      color: #EE361C;
      font-size: 24px;
      border-bottom: 2px solid #EE361C;
      padding-bottom: 8px;
      margin-top: 0;
    }
    h2 {
      color: #291822;
      font-size: 17px;
      margin-top: 22px;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 4px;
    }
    h3 {
      color: #EE361C;
      font-size: 14px;
      margin-top: 16px;
      margin-bottom: 6px;
    }
    p, li {
      margin: 5px 0;
    }
    ul {
      margin: 6px 0 10px 20px;
      padding: 0;
    }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #FDEBE7;
      color: #C42610;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 11.5px;
    }
    pre {
      background: #1E1B24;
      color: #F8FAFC;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 11px;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11.5px;
    }
    th {
      background: #FDEBE7;
      color: #291822;
      text-align: left;
      padding: 7px 9px;
      border: 1px solid #F3C6BC;
      font-weight: 700;
    }
    td {
      padding: 6px 9px;
      border: 1px solid #E5E7EB;
      vertical-align: top;
    }
    hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 18px 0;
    }
  </style>
</head>
<body>
${out.join('\n')}
</body>
</html>`;
}

function inlineFormat(str) {
  return str
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#EE361C;text-decoration:none;">$1</a>');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const docs = [
    {
      md: 'docs/BOOKIT_PLATFORM_QA_GUIDE.md',
      pdf: 'docs/BOOKIT_PLATFORM_QA_GUIDE.pdf',
      title: 'BookIt! Mobile & Web Platform Q&A Guide',
    },
    {
      md: 'docs/PRODUCTION_READINESS_REPORT.md',
      pdf: 'docs/PRODUCTION_READINESS_REPORT.pdf',
      title: 'BookIt! Production Readiness & Deployment Verification Report',
    },
  ];

  for (const item of docs) {
    const mdPath = path.resolve(process.cwd(), item.md);
    if (!fs.existsSync(mdPath)) continue;
    const md = fs.readFileSync(mdPath, 'utf8');
    const html = markdownToHtml(md, item.title);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: path.resolve(process.cwd(), item.pdf),
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
    await page.close();
    console.log(`✅ Generated ${item.pdf}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
