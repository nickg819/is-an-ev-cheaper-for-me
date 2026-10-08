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
