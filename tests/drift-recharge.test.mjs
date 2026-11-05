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
const weatherStart = html.indexOf('function weatherAt(time) {');
assert.ok(weatherStart >= 0, 'weather cycle must exist');
const weatherClose = /^}\r?$/m.exec(html.slice(weatherStart));
assert.ok(weatherClose, 'weather function must close');
const weatherEnd = weatherStart + weatherClose.index + 1;
const weatherAt = runInNewContext(`(${html.slice(weatherStart, weatherEnd)})`, { Math });

function race({ vf = 250, vl = 80, off = 0, drift = true, right = true, boost = false,
  throttle = false, brake = false, fuel = 0.5, phase = 'racing', clock = 0 } = {}) {
  const car = { x: 100, y: 100, ang: 0, vf, vl, idx: 0, off: 0, surf: 0 };
  const G = { phase, boostFuel: fuel, driftCharging: false, shake: 0, flash: 0,
    prevS: 0, prog: 0, clock, lap: 1, lapStart: 0, lapTimes: [], lapsToGo: 3,
    best: null, wrong: 0 };
  const context = {
    G, car, weatherAt, key: { drift, right, left: false, boost, throttle, brake },
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

test('weather cycles through sun, rain and wind and repeats', () => {
  assert.equal(weatherAt(0).type, 'sun');
  assert.equal(weatherAt(10).type, 'rain');
  assert.equal(weatherAt(20).type, 'wind');
  assert.equal(weatherAt(30).type, 'sun');
  assert.ok(weatherAt(10).grip < weatherAt(0).grip);
  assert.ok(weatherAt(20).windX > weatherAt(0).windX);
});

test('rain weakens steering and brakes, while gusts push the car sideways', () => {
  const dry = race({ clock: 0, vl: 0, drift: false, brake: true });
  const wet = race({ clock: 10, vl: 0, drift: false, brake: true });
  assert.ok(wet.car.vf > dry.car.vf, 'wet asphalt increases braking distance');
  assert.ok(wet.car.ang < dry.car.ang, 'wet asphalt reduces steering response');
  const sunnyLaunch = race({ clock: 0, vf: 100, vl: 0, drift: false, right: false, throttle: true });
  const rainyLaunch = race({ clock: 10, vf: 100, vl: 0, drift: false, right: false, throttle: true });
  assert.ok(sunnyLaunch.car.vf > rainyLaunch.car.vf, 'dry asphalt improves acceleration');
  const calm = race({ clock: 0, vl: 0, drift: false, right: false });
  const windy = race({ clock: 20, vl: 0, drift: false, right: false });
  assert.ok(Math.abs(windy.car.vl) > Math.abs(calm.car.vl), 'gust adds lateral velocity');
  assert.ok(windy.car.y < calm.car.y, 'gust changes the driven line');
});
