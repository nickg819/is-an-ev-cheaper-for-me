import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asMenu, parseVehicle, getMakes, getOptions, getVehicle } from '../epa.js';

const fakeFetch = (body, calls = []) => async (url) => {
  calls.push(String(url));
  return { ok: true, json: async () => body };
};

test('asMenu handles null, one object and an array', () => {
  assert.deepEqual(asMenu(null), []);
  assert.deepEqual(asMenu({ menuItem: { text: 'A', value: '1' } }), [{ text: 'A', value: '1' }]);
  assert.equal(
    asMenu({ menuItem: [{ text: 'A', value: '1' }, { text: 'B', value: '2' }] }).length,
    2,
  );
});

test('getMakes builds the right URL and parses the menu', async () => {
  const calls = [];
  const makes = await getMakes(2026, fakeFetch({ menuItem: [{ text: 'Hyundai', value: 'Hyundai' }] }, calls));
  assert.equal(makes[0].value, 'Hyundai');
  assert.match(calls[0], /vehicle\/menu\/make\?year=2026$/);
});

test('getOptions encodes the model and returns [] for a null reply', async () => {
  const calls = [];
  const opts = await getOptions(2026, 'Hyundai', 'Ioniq 5 RWD', fakeFetch(null, calls));
  assert.deepEqual(opts, []);
  assert.match(calls[0], /model=Ioniq\+5\+RWD/);
});

test('parseVehicle reads a gas car', () => {
  const v = parseVehicle({
    id: '45388', year: '2023', make: 'Chevrolet', model: 'Traverse AWD',
    VClass: 'Standard Sport Utility Vehicle 4WD', atvType: '',
    comb08: '20', combE: '0.0', range: '0',
  });
  assert.equal(v.isEV, false);
  assert.equal(v.mpg, 20);
  assert.equal(v.kwhPer100, 0);
  assert.equal(v.year, 2023);
});

test('parseVehicle reads an EV from combE, not comb08', () => {
  const v = parseVehicle({
    id: '49960', year: '2026', make: 'Hyundai', model: 'Ioniq 5 RWD',
    VClass: 'Small Sport Utility Vehicle 2WD', atvType: 'EV',
    comb08: '114', combE: '30.0', range: '318',
  });
  assert.equal(v.isEV, true);
  assert.equal(v.kwhPer100, 30);
  assert.equal(v.mpg, 0);
  assert.equal(v.range, 318);
});

test('parseVehicle gives 0 for missing figures', () => {
  const v = parseVehicle({ id: '1', year: '2026', make: 'X', model: 'Y', atvType: 'EV', combE: '', comb08: '' });
  assert.equal(v.kwhPer100, 0);
});

test('getVehicle returns a parsed record', async () => {
  const v = await getVehicle('49960', fakeFetch({ id: '49960', year: '2026', make: 'Hyundai', model: 'Ioniq 5 RWD', atvType: 'EV', combE: '30.0', comb08: '114', range: '318' }));
  assert.equal(v.kwhPer100, 30);
});

test('a failed request throws', async () => {
  const bad = async () => ({ ok: false, status: 500 });
  await assert.rejects(() => getMakes(2026, bad), /500/);
});

test('real requests are cached by URL, and a failed request is retried', async () => {
  const real = globalThis.fetch;
  let calls = 0;
  let fail = true;
  globalThis.fetch = async () => {
    calls += 1;
    if (fail) return { ok: false, status: 500 };
    return { ok: true, json: async () => ({ menuItem: [{ text: 'A', value: '1' }] }) };
  };
  try {
    await assert.rejects(() => getMakes(1999), /500/);
    fail = false;
    assert.equal((await getMakes(1999)).length, 1);
    await getMakes(1999);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = real;
  }
});
