import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot, readRepoFile, stripNonMarkup, findUnbalancedTags, collectLinks } from './helpers/html.mjs';

const html = readRepoFile('credits.html');
const markup = stripNonMarkup(html);

test('Página de créditos agradece Atos Vinicius pela criação do jogo', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html\s+lang="pt-BR">/i);
  assert.deepEqual(findUnbalancedTags(html), []);
  assert.match(markup, /<h1>Créditos<\/h1>/);
  assert.match(markup, /Atos Vinicius/);
  assert.match(markup, /Criador do jogo DRIFT CIRCUIT/);
});

test('Página de créditos é acessível pelo jogo e pela descrição do projeto', () => {
  for (const page of ['index.html', 'landing.html']) {
    assert.ok(collectLinks(readRepoFile(page)).includes('./credits.html'));
  }
  for (const href of collectLinks(html)) {
    assert.doesNotMatch(href, /^(https?:)?\/\//);
    assert.ok(existsSync(join(repoRoot, href.replace(/^\.\//, ''))), `Arquivo ausente: ${href}`);
  }
  assert.ok(collectLinks(html).includes('./index.html'));
});
