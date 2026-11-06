import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, '..', 'package.json');

test('package.json defines test script with "node --test"', () => {
  const content = readFileSync(packageJsonPath, 'utf8').replace(/^\uFEFF/, '');
  const pkg = JSON.parse(content);

  assert.ok(pkg.scripts, 'scripts object must be defined in package.json');
  assert.equal(pkg.scripts.test, 'node --test', 'npm test script must execute "node --test"');
});
