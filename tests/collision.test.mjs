import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readRepoFile } from './helpers/html.mjs';

const html = readRepoFile('index.html');
test('game script parses', () => {
  assert.doesNotThrow(() => new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]));
});

function source(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  let depth = 0;
  for (let i = html.indexOf('{', start); i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

function scene() {
  const car = { x: 100, y: 100, ang: 0, vf: 300, vl: 0, damage: 0, impactDelay: 0 };
  const ai = { x: 130, y: 100, ang: Math.PI, speed: 200, damage: 0, impactDelay: 0 };
  const person = { x: 120, y: 100, c: '#fff' };
  const CROWD = { groups: [{ cx: 120, cy: 100, rad: 20, folks: [person], ex: 0.5 }], hype: 0, party: 0 };
  const parts = [], G = { phase: 'racing', shake: 0, flash: 0 };
  const context = { car, ai, CROWD, parts, G, WORLD: { w: 1000, h: 1000 },
    Math, SFX: { crash() {} }, clamp: (n, a, b) => Math.max(a, Math.min(n, b)) };
  const methods = ['damageCar', 'collideCars', 'knockSpectators', 'updateImpacts', 'resetCrowd'];
  runInNewContext(methods.map(source).join('\n'), context);
  return { car, ai, CROWD, parts, G, person, context };
}

test('head-on car collision separates vehicles and damages both', () => {
  const s = scene();
  s.context.collideCars();
  assert.ok(Math.hypot(s.ai.x - s.car.x, s.ai.y - s.car.y) >= 39);
  assert.ok(s.car.damage > 0 && s.ai.damage > 0);
  assert.ok(s.car.vf < 300 && s.ai.speed < 200);
  assert.ok(s.parts.some(p => p.kind === 'spark'));
});

test('moving apart and gentle contact do not add damage', () => {
  const s = scene();
  s.car.vf = -100;
  s.ai.speed = 0;
  s.context.collideCars();
  assert.equal(s.car.damage, 0);
  assert.equal(s.ai.damage, 0);
  s.ai.x = 130; s.car.x = 100;
  s.car.vf = 20; s.ai.speed = 0;
  s.context.collideCars();
  assert.equal(s.car.damage, 0);
});

test('spectators fall, stay down, and return only on race reset', () => {
  const s = scene();
  s.context.resetCrowd();
  s.context.knockSpectators(120, 100, 1, 0, 180);
  assert.equal(s.person.fallen, true);
  s.context.updateImpacts(0.5);
  const landed = [s.person.x, s.person.y];
  assert.equal(s.person.fall, 1);
  assert.equal(s.person.dead, true);
  s.context.updateImpacts(2);
  assert.deepEqual([s.person.x, s.person.y], landed);
  s.context.resetCrowd();
  assert.equal(s.person.fallen, false);
  assert.equal(s.person.dead, false);
  assert.deepEqual([s.person.x, s.person.y], [120, 100]);
});

test('damaged cars emit smoke while racing', () => {
  const s = scene();
  s.car.damage = 80;
  s.context.Math = Object.create(Math);
  s.context.Math.random = () => 0;
  s.context.updateImpacts(0.1);
  assert.ok(s.parts.some(p => p.kind === 'smoke'));
});
