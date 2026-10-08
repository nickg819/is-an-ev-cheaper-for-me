import { test } from 'node:test';
import assert from 'node:assert/strict';
import { powertrainOf, estimateTotal } from '../maintenance.js';
import { TOTALS } from '../maintenance-rates.js';

const FIXTURE = {
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

const gas = (over) => estimateTotal(FIXTURE, { powertrain: 'gas', age: 0, annualMiles: 10000, years: 1, ...over });

test('powertrainOf maps EPA atvType', () => {
  assert.equal(powertrainOf('EV'), 'ev');
  assert.equal(powertrainOf('Hybrid'), 'hybrid');
  assert.equal(powertrainOf('Plug-in Hybrid'), 'hybrid');
  assert.equal(powertrainOf(''), 'gas');
});

test('estimateTotal prices the odometer span the car will cover', () => {
  assert.equal(gas({}).perYear, 300);
  assert.equal(gas({ age: 7 }).perYear, 600);
  assert.equal(gas({}).source, 'fixture');
});

test('estimateTotal averages across bins when ownership crosses a boundary', () => {
  const r = gas({ annualMiles: 20000, years: 5 });
  assert.equal(r.perYear, 900);
});

test('estimateTotal uses the last rate past the end of the table', () => {
  assert.equal(gas({ age: 30 }).perYear, 800);
});

test('estimateTotal is null without a sourced rate or a usable span', () => {
  assert.equal(estimateTotal(FIXTURE, { powertrain: 'ev', age: 0, annualMiles: 10000, years: 1 }), null);
  assert.equal(gas({ annualMiles: 0 }), null);
  assert.equal(gas({ years: 0 }), null);
});

test('negative age counts as zero', () => {
  assert.equal(gas({ age: -1 }).perYear, 300);
});

test('every shipped total has bins, a source and an as-of date', () => {
  for (const t of Object.values(TOTALS)) {
    if (t === null) continue;
    assert.ok(t.source && t.asOf && t.bins.length > 0, 'total missing source, asOf or bins');
    for (const b of t.bins) assert.ok(Number.isFinite(b.perMile) && b.perMile >= 0 && b.upToMiles > 0);
  }
});

test('shipped totals show an EV cheaper to maintain than gas', () => {
  const span = { age: 0, annualMiles: 10000, years: 3 };
  const ev = estimateTotal(TOTALS, { powertrain: 'ev', ...span });
  const gasCar = estimateTotal(TOTALS, { powertrain: 'gas', ...span });
  assert.ok(ev.perYear > 0 && ev.perYear < gasCar.perYear);
});

test('a longer ownership period costs more per year than a short one', () => {
  const short = estimateTotal(TOTALS, { powertrain: 'ev', age: 0, annualMiles: 15000, years: 2 });
  const long = estimateTotal(TOTALS, { powertrain: 'ev', age: 0, annualMiles: 15000, years: 8 });
  assert.ok(long.perYear > short.perYear);
});
