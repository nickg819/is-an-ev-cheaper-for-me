import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  freeShareFromMonthlyKwh,
  annualKwh,
  gasUsage,
  evEnergy,
  compare,
  validate,
} from '../calc.js';

const near = (a, b, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

const zeroMaint = { oil: 0, tires: 0, brakes: 0, repairs: 0 };

function base() {
  return {
    gasPrice: 6.5,
    annualMiles: 9719,
    years: 1,
    charging: { homeRate: 0.3, fastRate: 0.45, homeShare: 0, fastShare: 1 },
    options: {},
    ev: {
      kwhPer100: 27,
      acquisition: { mode: 'lease', payment: 600, termMonths: 12, dueAtSigning: 0, turnInFee: 0 },
      insurance: 1200,
      registration: 100,
      maintenance: { ...zeroMaint },
    },
    cars: [
      { share: 6907, mpg: 20, acquisition: { mode: 'owned' }, insurance: 1500, registration: 150, maintenance: { ...zeroMaint } },
      { share: 2812, mpg: 26, acquisition: { mode: 'owned' }, insurance: 900, registration: 100, maintenance: { ...zeroMaint } },
    ],
  };
}

test('gasUsage reproduces the logbook split', () => {
  const g = gasUsage({ cars: base().cars, annualMiles: 9719, years: 1 });
  near(g.gallons, 453.5, 0.1);
  near(g.perCar[0], 345.35, 0.01);
});

test('annualKwh and freeShareFromMonthlyKwh', () => {
  assert.equal(annualKwh(30, 10000), 3000);
  near(freeShareFromMonthlyKwh(100, 3000), 0.4);
  assert.equal(freeShareFromMonthlyKwh(500, 3000), 1);
  assert.equal(freeShareFromMonthlyKwh(100, 0), 0);
});

test('evEnergy blends home and fast charging', () => {
  const e = evEnergy({
    kwhPer100: 30, annualMiles: 10000, years: 1,
    charging: { homeRate: 0.3, fastRate: 0.5, homeShare: 0.5, fastShare: 0.5 },
    freeShare: 0,
  });
  near(e.kwh, 3000);
  near(e.atFast, 1500);
  near(e.atMix, 1200);
  near(e.actual, 1200);
});

test('evEnergy free share comes off the top', () => {
  const e = evEnergy({
    kwhPer100: 30, annualMiles: 10000, years: 1,
    charging: { homeRate: 0.3, fastRate: 0.5, homeShare: 0.5, fastShare: 0.5 },
    freeShare: 0.5,
  });
  near(e.actual, 600);
});

test('evEnergy matches the logbook charging spend', () => {
  const e = evEnergy({
    kwhPer100: 100, annualMiles: 3333, years: 1,
    charging: { homeRate: 0, fastRate: 0.45, homeShare: 0, fastShare: 1 },
    freeShare: 0.63,
  });
  near(e.actual, 560, 10);
});

test('evEnergy fully free needs no paid shares', () => {
  const e = evEnergy({
    kwhPer100: 30, annualMiles: 10000, years: 1,
    charging: { homeRate: 0.3, fastRate: 0.5, homeShare: 0, fastShare: 0 },
    freeShare: 1,
  });
  assert.equal(e.actual, 0);
  assert.equal(e.atMix, e.atFast);
});

test('compare reproduces the logbook gas cost', () => {
  near(compare(base()).ice.energy, 2944, 5);
});

test('breakdown lines sum to the headline savings', () => {
  const input = base();
  input.options = {
    freeCharging: { on: true, share: 0.5 },
    homeCharger: { on: true, cost: 1500 },
  };
  input.cars[0].sale = { on: true, value: 9000, payoff: 2000 };
  const r = compare(input);
  const total = Object.values(r.breakdown).reduce((a, b) => a + b, 0);
  near(total, r.savings, 0.001);
});

test('toggles that are off match toggles that are absent', () => {
  const off = base();
  off.options = { freeCharging: { on: false, share: 0.5 }, homeCharger: { on: false, cost: 5000 } };
  off.cars[0].sale = { on: false, value: 9000, payoff: 0 };
  assert.deepEqual(compare(off), compare(base()));
});

test('free charging adds a positive line only when on', () => {
  const on = base();
  on.options = { freeCharging: { on: true, share: 0.5 } };
  assert.ok(compare(on).breakdown.freeCharging > 0);
  assert.equal(compare(base()).breakdown.freeCharging, 0);
});

test('selling an old car shows net equity as savings', () => {
  const input = base();
  input.cars[0].sale = { on: true, value: 9000, payoff: 2000 };
  near(compare(input).breakdown.equity, 7000);
});

test('home charger cost is a negative line', () => {
  const input = base();
  input.options = { homeCharger: { on: true, cost: 1500 } };
  near(compare(input).breakdown.homeCharger, -1500);
});

test('mile shares that do not sum to 1 are normalized', () => {
  const a = base();
  a.cars[0].share = 30;
  a.cars[1].share = 30;
  const b = base();
  b.cars[0].share = 0.5;
  b.cars[1].share = 0.5;
  assert.deepEqual(compare(a), compare(b));
});

test('break-even gas price returns savings of zero', () => {
  const r = compare(base());
  const again = base();
  again.gasPrice = r.breakEvenGasPrice;
  near(compare(again).savings, 0, 0.01);
});

test('break-even is null when no gas is burned', () => {
  const input = base();
  input.cars = [{ ...input.cars[0], share: 1, mpg: Infinity }];
  assert.equal(compare(input).breakEvenGasPrice, null);
});

test('lease terms are reported for the EV', () => {
  const input = base();
  input.years = 3;
  assert.equal(compare(input).leaseTerms.ev, 3);
});

test('validate accepts the base input', () => {
  assert.deepEqual(validate(base()), []);
});

test('validate rejects zero or negative basics', () => {
  const input = base();
  input.years = 0;
  input.gasPrice = -1;
  const fields = validate(input).map((e) => e.field);
  assert.ok(fields.includes('years') && fields.includes('gasPrice'));
});

test('validate rejects mpg and kWh per 100 of zero', () => {
  const input = base();
  input.cars[0].mpg = 0;
  input.ev.kwhPer100 = 0;
  const fields = validate(input).map((e) => e.field);
  assert.ok(fields.includes('cars[0].mpg') && fields.includes('ev.kwhPer100'));
});

test('validate flags a tax rate typed as a fraction slip', () => {
  const input = base();
  input.ev.acquisition = { mode: 'buy', price: 40000, taxRate: 9.25, downPayment: 40000 };
  const err = validate(input).find((e) => e.field === 'ev.taxRate');
  assert.match(err.message, /percent/i);
});

test('validate rejects all-zero mile shares but allows one zero', () => {
  const zero = base();
  zero.cars[0].share = 0;
  zero.cars[1].share = 0;
  assert.ok(validate(zero).some((e) => e.field === 'cars.share'));
  const one = base();
  one.cars[0].share = 0;
  assert.deepEqual(validate(one), []);
});

test('validate needs a paid charging share unless charging is fully free', () => {
  const input = base();
  input.charging = { homeRate: 0.3, fastRate: 0.45, homeShare: 0, fastShare: 0 };
  assert.ok(validate(input).some((e) => e.field === 'charging.share'));
  input.options = { freeCharging: { on: true, share: 1 } };
  assert.deepEqual(validate(input), []);
});

test('validate rejects negative money fields', () => {
  const input = base();
  input.ev.insurance = -5;
  assert.ok(validate(input).some((e) => e.field === 'ev.insurance'));
});

test('validate requires a lease term when leasing', () => {
  const input = base();
  input.ev.acquisition = { mode: 'lease', payment: 500, termMonths: 0 };
  assert.ok(validate(input).some((e) => e.field === 'ev.termMonths'));
});

test('validate flags a tax rate typed as a fraction, like 0.0925 for 9.25%', () => {
  const input = base();
  input.ev.acquisition = { mode: 'buy', price: 40000, taxRate: 0.000925, downPayment: 40000 };
  const err = validate(input).find((e) => e.field === 'ev.taxRate');
  assert.match(err.message, /percent/i);
});

test('validate accepts a zero tax rate and a small real one', () => {
  const zero = base();
  zero.ev.acquisition = { mode: 'buy', price: 40000, taxRate: 0, downPayment: 40000 };
  assert.deepEqual(validate(zero), []);
  const low = base();
  low.ev.acquisition = { mode: 'buy', price: 40000, taxRate: 0.04, downPayment: 40000 };
  assert.deepEqual(validate(low), []);
});
