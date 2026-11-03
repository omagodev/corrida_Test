import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readRepoFile } from './helpers/html.mjs';

const html = readRepoFile('index.html');
const start = html.indexOf('function physics(dt) {');
assert.ok(start >= 0, 'race physics must exist');
let depth = 0, end = start;
for (let i = html.indexOf('{', start); i < html.length; i++) {
  if (html[i] === '{') depth++;
  if (html[i] === '}' && --depth === 0) { end = i + 1; break; }
}
const physicsSource = html.slice(start, end);

function race({ vf = 250, vl = 80, off = 0, drift = true, right = true, boost = false, fuel = 0.5, phase = 'racing' } = {}) {
  const car = { x: 100, y: 100, ang: 0, vf, vl, idx: 0, off: 0, surf: 0 };
  const G = { phase, boostFuel: fuel, driftCharging: false, shake: 0, flash: 0,
    prevS: 0, prog: 0, clock: 0, lap: 1, lapStart: 0, lapTimes: [], lapsToGo: 3,
    best: null, wrong: 0 };
  const context = {
    G, car, key: { drift, right, left: false, boost, throttle: false, brake: false },
    trackInfo: () => ({ i: 0, off, s: 0 }),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    HW: 100, KERB: 10, WALL: 150, OOB: 50, STAND_WALL: [0],
    NOR: [{ x: 0, y: 1 }], WORLD: { w: 1000, h: 1000 },
    cones: [], parts: [], L: 1000, CROWD: {},
    SFX: { engine() {}, tyre() {}, crash() {}, chime() {} },
    decalStamps: 0, decal: { getContext: () => ({ save() {}, translate() {}, rotate() {},
      beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, restore() {} }) },
    resetDecal() {}, say() {}, finishRace() {}
  };
  for (const name of ['NITRO_PASSIVE_RECHARGE', 'NITRO_DRIFT_RECHARGE', 'DRIFT_MIN_SPEED', 'DRIFT_MIN_LATERAL_SPEED']) {
    const match = html.match(new RegExp(`const ${name} = ([0-9.]+);`));
    assert.ok(match, `${name} must be easy to calibrate`);
    context[name] = Number(match[1]);
  }
  const physics = runInNewContext(`(${physicsSource})`, context);
  physics(0.1);
  return { G, car };
}

test('a controlled drift adds recharge above the passive rate', () => {
  const active = race();
  const passive = race({ drift: false });
  assert.ok(active.G.driftCharging);
  assert.ok(active.G.boostFuel > passive.G.boostFuel);
  assert.ok(Math.abs(active.G.boostFuel - 0.536) < 1e-9);
  assert.ok(Math.abs(passive.G.boostFuel - 0.516) < 1e-9);
});

test('drift alone, low speed, and leaving the track do not earn a bonus', () => {
  for (const options of [
    { vl: 0 }, { right: false }, { vf: 0 }, { vf: 179 }, { off: 115 }
  ]) {
    const { G } = race(options);
    assert.equal(G.driftCharging, false, JSON.stringify(options));
    assert.ok(Math.abs(G.boostFuel - 0.516) < 1e-9, JSON.stringify(options));
  }
});

test('boost still drains fuel, phases freeze it, and recharge caps at full', () => {
  const boosted = race({ boost: true });
  assert.equal(boosted.G.driftCharging, false);
  assert.ok(Math.abs(boosted.G.boostFuel - 0.458) < 1e-9);
  for (const phase of ['countdown', 'finished', 'paused']) {
    const { G } = race({ phase });
    assert.equal(G.boostFuel, 0.5);
    assert.equal(G.driftCharging, false);
  }
  assert.equal(race({ fuel: 0.99 }).G.boostFuel, 1);
});
