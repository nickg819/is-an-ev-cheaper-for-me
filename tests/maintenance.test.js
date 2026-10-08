import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vehicleClass, powertrainOf, estimateMaintenance, LINES } from '../maintenance.js';

const FIXTURE = {
  gas: {
    car: {
      oil: { perMile: 0.01, perYear: 50, ageSlope: 0, source: 'fixture', asOf: '2026-01-01' },
      tires: { perMile: 0.02, perYear: 0, ageSlope: 0, source: 'fixture', asOf: '2026-01-01' },
      brakes: null,
      repairs: { perMile: 0.03, perYear: 100, ageSlope: 0.1, source: 'fixture', asOf: '2026-01-01' },
    },
  },
};

test('vehicleClass maps EPA class strings', () => {
  assert.equal(vehicleClass('Standard Sport Utility Vehicle 4WD'), 'suv');
  assert.equal(vehicleClass('Small Pickup Trucks 2WD'), 'truck');
  assert.equal(vehicleClass('Midsize Cars'), 'car');
  assert.equal(vehicleClass('Minivan - 2WD'), 'suv');
  assert.equal(vehicleClass(undefined), 'car');
});

test('powertrainOf maps EPA atvType', () => {
  assert.equal(powertrainOf('EV'), 'ev');
  assert.equal(powertrainOf('Hybrid'), 'hybrid');
  assert.equal(powertrainOf('Plug-in Hybrid'), 'hybrid');
  assert.equal(powertrainOf(''), 'gas');
});

test('estimateMaintenance applies per-mile, per-year and age', () => {
  const r = estimateMaintenance(FIXTURE, { powertrain: 'gas', vehicleClass: 'car', age: 0, annualMiles: 10000 });
  assert.equal(r.costs.oil, 150);
  assert.equal(r.costs.tires, 200);
  assert.equal(r.costs.repairs, 400);
  const old = estimateMaintenance(FIXTURE, { powertrain: 'gas', vehicleClass: 'car', age: 5, annualMiles: 10000 });
  assert.equal(old.costs.repairs, 600);
});

test('a null rate stays null, never zero', () => {
  const r = estimateMaintenance(FIXTURE, { powertrain: 'gas', vehicleClass: 'car', age: 0, annualMiles: 10000 });
  assert.equal(r.costs.brakes, null);
});

test('a missing powertrain or class gives all nulls', () => {
  const r = estimateMaintenance(FIXTURE, { powertrain: 'ev', vehicleClass: 'car', age: 0, annualMiles: 10000 });
  assert.deepEqual(Object.values(r.costs), [null, null, null, null]);
  assert.deepEqual(Object.keys(r.costs), LINES);
});

test('negative age counts as zero and sources are returned', () => {
  const r = estimateMaintenance(FIXTURE, { powertrain: 'gas', vehicleClass: 'car', age: -1, annualMiles: 10000 });
  assert.equal(r.costs.repairs, 400);
  assert.equal(r.sources.oil.source, 'fixture');
});

import { estimateTotal } from '../maintenance.js';
import { TOTALS } from '../maintenance-rates.js';

const TOTAL_FIXTURE = {
  gas: {
    bins: [
      { upToMiles: 50000, perMile: 0.03 },
      { upToMiles: 100000, perMile: 0.06 },
      { upToMiles: 200000, perMile: 0.08 },
    ],
    source: 'fixture',
    asOf: '2026-01',
  },
};

test('estimateTotal picks the bin from the odometer and scales by annual miles', () => {
  const young = estimateTotal(TOTAL_FIXTURE, { powertrain: 'gas', age: 0, annualMiles: 10000 });
  assert.equal(young.perYear, 300);
  const mid = estimateTotal(TOTAL_FIXTURE, { powertrain: 'gas', age: 7, annualMiles: 10000 });
  assert.equal(mid.perYear, 600);
  assert.equal(mid.source, 'fixture');
});

test('estimateTotal uses the last bin past its range', () => {
  const r = estimateTotal(TOTAL_FIXTURE, { powertrain: 'gas', age: 30, annualMiles: 10000 });
  assert.equal(r.perYear, 800);
});

test('estimateTotal is null for an unsourced powertrain', () => {
  assert.equal(estimateTotal(TOTAL_FIXTURE, { powertrain: 'ev', age: 0, annualMiles: 10000 }), null);
  assert.equal(estimateTotal(TOTAL_FIXTURE, { powertrain: 'gas', age: 0, annualMiles: 0 }), null);
});

test('every shipped total has bins, a source and an as-of date', () => {
  for (const t of Object.values(TOTALS)) {
    if (t === null) continue;
    assert.ok(t.source && t.asOf && t.bins.length > 0, 'total missing source, asOf or bins');
    for (const b of t.bins) assert.ok(Number.isFinite(b.perMile) && b.perMile >= 0 && b.upToMiles > 0);
  }
});

test('shipped totals show an EV cheaper to maintain than gas in the first bin', () => {
  const ev = estimateTotal(TOTALS, { powertrain: 'ev', age: 0, annualMiles: 10000 });
  const gas = estimateTotal(TOTALS, { powertrain: 'gas', age: 0, annualMiles: 10000 });
  assert.ok(ev.perYear > 0 && ev.perYear < gas.perYear);
});

import { RATES } from '../maintenance-rates.js';

test('every shipped itemized rate has a source and an as-of date', () => {
  for (const pt of Object.values(RATES)) {
    for (const cls of Object.values(pt)) {
      for (const rate of Object.values(cls)) {
        if (rate === null) continue;
        assert.ok(rate.source && rate.asOf, 'rate missing source or asOf');
        assert.ok(Number.isFinite(rate.perMile) && rate.perMile >= 0);
      }
    }
  }
});
