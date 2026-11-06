/**
 * Metadados mínimos das páginas estáticas (issue #37).
 *
 * Verifica, sem parsing complexo nem dependências, que cada página HTML do
 * repositório declara um `<title>` com texto não vazio.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { readRepoFile } from './helpers/html.mjs';

const PAGES = ['index.html', 'landing.html'];

/** Texto do primeiro `<title>` do documento, ou `null` se não houver. */
function titleText(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

for (const page of PAGES) {
  test(`${page} tem um <title> não vazio`, () => {
    const title = titleText(readRepoFile(page));
    assert.notEqual(title, null, `${page} precisa ter um elemento <title>`);
    assert.ok(title.length > 0, `o <title> de ${page} não pode estar vazio`);
  });
}
