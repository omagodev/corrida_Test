/**
 * Regression tests for the game page (index.html).
 *
 * The landing page was added alongside the game, not instead of it: these
 * tests guard the game shell against accidental breakage and check that the
 * two pages stay linked to each other.
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
  collectLinks
} from './helpers/html.mjs';

const html = readRepoFile('index.html');
const markup = stripNonMarkup(html);

test('game page is still a well-formed document', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<title>[^<]*DRIFT CIRCUIT[^<]*<\/title>/i);
  assert.deepEqual(findUnbalancedTags(html), [], 'tags must be balanced');
});

test('game page keeps the elements its script depends on', () => {
  const ids = collectIds(html);
  for (const id of ['stage', 'screen', 'pads', 'overlay', 'startBtn']) {
    assert.ok(ids.has(id), `index.html must keep #${id}`);
  }
  assert.match(markup, /<canvas\s+id="screen"/i, 'the render target must stay a <canvas>');
  assert.match(html, /getElementById\('startBtn'\)/, 'the start button must stay wired up');
});

test('game page points at the landing page', () => {
  const landingLinks = collectLinks(html).filter((href) => /(^|\/)landing\.html$/.test(href));
  assert.ok(landingLinks.length >= 1, 'index.html must link to landing.html');
  assert.ok(existsSync(join(repoRoot, 'landing.html')), 'the linked landing page must exist');
});

test('game page still runs with no configuration or network access', () => {
  for (const href of collectLinks(html)) {
    assert.doesNotMatch(href, /^(https?:)?\/\//, `external resource reference: ${href}`);
  }
  assert.doesNotMatch(html, /<script\b[^>]*\ssrc=/i, 'the game must stay self-contained');
  assert.doesNotMatch(html, /process\.env/, 'no environment variables may be required');
});

test('every link on the game page resolves', () => {
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

test('initial overlay displays the driving tip once', () => {
  const tipText = 'Dica: use o nitro nas retas para ganhar velocidade!';
  const occurrences = (html.match(/Dica: use o nitro nas retas para ganhar velocidade!/g) || []).length;
  assert.equal(occurrences, 1, 'driving tip must appear exactly once in index.html');

  const overlayIdx = html.indexOf('<div id="overlay">');
  const tipIdx = html.indexOf(tipText);
  const startBtnIdx = html.indexOf('id="startBtn"');
  assert.ok(overlayIdx !== -1 && tipIdx > overlayIdx, 'tip must be inside the overlay');
  assert.ok(startBtnIdx !== -1 && tipIdx < startBtnIdx, 'tip must appear before the start button');
});

