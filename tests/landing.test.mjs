/**
 * Regression tests for the project landing page (landing.html).
 *
 * These lock in the behaviour required by the issue:
 *  - the landing page exists and describes the project;
 *  - it renders with no configuration at all (no build step, no env vars,
 *    no external requests), so opening it can never fail for lack of setup;
 *  - every internal link and anchor it advertises actually resolves.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  repoRoot,
  readRepoFile,
  stripNonMarkup,
  findUnbalancedTags,
  collectIds,
  collectLinks,
  metaContent
} from './helpers/html.mjs';

const LANDING = 'landing.html';
const html = readRepoFile(LANDING);
const markup = stripNonMarkup(html);

test('landing page file exists and has real content', () => {
  assert.ok(existsSync(join(repoRoot, LANDING)), 'landing.html must exist at the repo root');
  assert.ok(html.length > 2000, 'landing.html looks empty or truncated');
});

test('landing page is a valid, well-formed HTML document', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html\s[^>]*lang="pt-BR"/i, 'document language must be declared');
  assert.match(html, /<meta\s+charset="utf-8">/i);
  assert.deepEqual(findUnbalancedTags(html), [], 'tags must be balanced');
});

test('landing page carries the metadata a shareable page needs', () => {
  const title = html.match(/<title>([^<]+)<\/title>/i);
  assert.ok(title, 'a <title> is required');
  assert.match(title[1], /DRIFT CIRCUIT/i);

  const description = metaContent(html, 'description');
  assert.ok(description && description.length >= 60, 'meta description must be present and useful');

  assert.match(html, /<meta\s+name="viewport"[^>]*width=device-width/i, 'page must be responsive');
  for (const key of ['og:title', 'og:description', 'og:type', 'og:url']) {
    assert.ok(metaContent(html, key), `missing social metadata: ${key}`);
  }
});

test('landing page presents the project and sends visitors to the game', () => {
  const headings = [...markup.matchAll(/<h1\b[^>]*>/gi)];
  assert.equal(headings.length, 1, 'exactly one <h1> is expected');

  // The sections the navigation promises must actually be in the document.
  for (const id of ['sobre', 'recursos', 'controles', 'comecar', 'faq']) {
    assert.ok(collectIds(html).has(id), `missing section: #${id}`);
  }

  const gameLinks = collectLinks(html).filter((href) => /(^|\/)index\.html$/.test(href));
  assert.ok(gameLinks.length >= 2, 'the landing page must link to the game more than once');
});

test('landing page needs no configuration to render', () => {
  // No scripts at all: nothing can throw, and nothing needs bootstrapping.
  assert.doesNotMatch(markup, /<script\b/i, 'the landing page must stay script-free');
  assert.doesNotMatch(markup, /\son[a-z]+="/i, 'no inline event handlers');

  // No placeholders left behind that would need to be filled in.
  for (const pattern of [/\{\{/, /%%[A-Z_]+%%/, /process\.env/, /YOUR_[A-Z_]+/, /lorem ipsum/i, /\bTODO\b/, /\bFIXME\b/]) {
    assert.doesNotMatch(html, pattern, `unresolved placeholder matching ${pattern}`);
  }

  // No API keys, endpoints or env-driven settings to configure.
  assert.doesNotMatch(html, /\b(api[_-]?key|access[_-]?token|client[_-]?secret)\b/i);
});

test('landing page loads no external resources, so it works offline', () => {
  for (const href of collectLinks(html)) {
    assert.doesNotMatch(href, /^(https?:)?\/\//, `external resource reference: ${href}`);
  }
  assert.doesNotMatch(html, /@import/i, 'no external stylesheet imports');
  assert.doesNotMatch(html, /url\(\s*['"]?(https?:)?\/\//i, 'no remote url() references in CSS');
  assert.doesNotMatch(markup, /<(iframe|object|embed)\b/i, 'no embedded remote frames');
});

test('every link on the landing page resolves', () => {
  const ids = collectIds(html);
  for (const href of collectLinks(html)) {
    if (href.startsWith('#')) {
      assert.ok(ids.has(href.slice(1)), `dangling anchor: ${href}`);
      continue;
    }
    const [path] = href.split('#');
    assert.ok(
      existsSync(join(repoRoot, path.replace(/^\.\//, ''))),
      `link points at a missing file: ${href}`
    );
  }
});
