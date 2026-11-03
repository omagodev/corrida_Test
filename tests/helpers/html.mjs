/**
 * Minimal, dependency-free helpers for asserting things about the static pages
 * in this repository. Deliberately no npm packages: `node --test tests/` has to
 * work on a fresh clone with no install step and no configuration.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');

/** Reads a repo-relative file as UTF-8 text, dropping any BOM. */
export function readRepoFile(relPath) {
  return readFileSync(join(repoRoot, relPath), 'utf8').replace(/^﻿/, '');
}

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/** Removes comments plus the bodies of <script>/<style> so markup scans stay clean. */
export function stripNonMarkup(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');
}

/**
 * Stack-based tag balance check. Returns an array of human readable problems;
 * an empty array means every non-void element is opened and closed in order.
 */
export function findUnbalancedTags(html) {
  const problems = [];
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = tagRe.exec(stripNonMarkup(html))) !== null) {
    const [, slash, rawName, attrs] = m;
    const name = rawName.toLowerCase();
    if (VOID_TAGS.has(name) || attrs.trimEnd().endsWith('/')) continue;
    if (slash) {
      const open = stack.pop();
      if (open !== name) problems.push(`</${name}> closes <${open ?? 'nothing'}>`);
    } else {
      stack.push(name);
    }
  }
  for (const left of stack.reverse()) problems.push(`<${left}> is never closed`);
  return problems;
}

/** Every `id="..."` present in the document. */
export function collectIds(html) {
  return new Set(
    [...stripNonMarkup(html).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  );
}

/** Every `href="..."` and `src="..."` value present in the document. */
export function collectLinks(html) {
  return [...stripNonMarkup(html).matchAll(/\s(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
}

/** Value of a `<meta>` tag looked up by its `name` or `property` attribute. */
export function metaContent(html, key) {
  const re = new RegExp(
    `<meta\\s[^>]*(?:name|property)="${key}"[^>]*>`,
    'i'
  );
  const tag = html.match(re);
  if (!tag) return null;
  const content = tag[0].match(/\scontent="([^"]*)"/i);
  return content ? content[1] : null;
}
