import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot, readRepoFile, stripNonMarkup, findUnbalancedTags, collectLinks } from './helpers/html.mjs';

const html = readRepoFile('credits.html');
const markup = stripNonMarkup(html);

test('Страница авторов благодарит Atos Vinicius за создание игры', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html\s+lang="ru">/i);
  assert.deepEqual(findUnbalancedTags(html), []);
  assert.match(markup, /<h1>Авторы<\/h1>/);
  assert.match(markup, /Atos Vinicius/);
  assert.match(markup, /Создатель игры DRIFT CIRCUIT/);
});

test('Страница авторов доступна из игры и описания проекта', () => {
  for (const page of ['index.html', 'landing.html']) {
    assert.ok(collectLinks(readRepoFile(page)).includes('./credits.html'));
  }
  for (const href of collectLinks(html)) {
    assert.doesNotMatch(href, /^(https?:)?\/\//);
    assert.ok(existsSync(join(repoRoot, href.replace(/^\.\//, ''))), `Нет файла: ${href}`);
  }
  assert.ok(collectLinks(html).includes('./index.html'));
});
