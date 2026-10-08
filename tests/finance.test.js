import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeShares,
  monthlyLoanPayment,
  loanInterest,
  acquisitionCost,
} from '../calc.js';

const near = (a, b, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test('normalizeShares scales to 1', () => {
  assert.deepEqual(normalizeShares([30, 30]), [0.5, 0.5]);
  assert.deepEqual(normalizeShares([1]), [1]);
});

test('normalizeShares allows one zero share', () => {
  assert.deepEqual(normalizeShares([0, 50]), [0, 1]);
});

test('normalizeShares rejects all zero', () => {
  assert.throws(() => normalizeShares([0, 0]), RangeError);
});

test('monthlyLoanPayment matches a known 6% 60-month payment', () => {
  near(monthlyLoanPayment({ principal: 30000, apr: 0.06, termMonths: 60 }), 579.98, 0.02);
});

test('monthlyLoanPayment with 0% APR divides evenly', () => {
  assert.equal(monthlyLoanPayment({ principal: 12000, apr: 0, termMonths: 48 }), 250);
});

test('loanInterest over the full term', () => {
  near(loanInterest({ principal: 30000, apr: 0.06, termMonths: 60 }), 4798.6, 0.5);
});

test('loanInterest counts only the months held', () => {
  const loan = { principal: 30000, apr: 0.06, termMonths: 60 };
  const firstYear = loanInterest(loan, 12);
  assert.ok(firstYear > 1600 && firstYear < 1750, `got ${firstYear}`);
  assert.ok(firstYear < loanInterest(loan));
});

test('loanInterest is 0 with no APR or no principal', () => {
  assert.equal(loanInterest({ principal: 30000, apr: 0, termMonths: 60 }), 0);
  assert.equal(loanInterest({ principal: 0, apr: 0.06, termMonths: 60 }), 0);
});

test('buy with cash: price + tax + fees - resale', () => {
  const a = { mode: 'buy', price: 40000, taxRate: 0.0925, fees: 500, downPayment: 44200, resale: 20000 };
  assert.equal(acquisitionCost(a, 5).total, 24200);
});

test('buy with a loan adds interest', () => {
  const a = { mode: 'buy', price: 30000, taxRate: 0, fees: 0, downPayment: 0, apr: 0.06, loanMonths: 60, resale: 0 };
  near(acquisitionCost(a, 5).total, 34798.6, 0.5);
});

test('buy held shorter than the loan only pays interest for months held', () => {
  const a = { mode: 'buy', price: 30000, taxRate: 0, fees: 0, downPayment: 0, apr: 0.06, loanMonths: 60, resale: 0 };
  const total = acquisitionCost(a, 1).total;
  assert.ok(total > 31600 && total < 31750, `got ${total}`);
});

test('buy subtracts incentives', () => {
  const a = { mode: 'buy', price: 40000, taxRate: 0, fees: 0, downPayment: 40000, resale: 0, incentives: 7500 };
  assert.equal(acquisitionCost(a, 3).total, 32500);
});

test('lease: one term', () => {
  const a = { mode: 'lease', payment: 400, termMonths: 36, dueAtSigning: 2000, turnInFee: 400 };
  assert.deepEqual(acquisitionCost(a, 3), { total: 16800, leaseTerms: 1 });
});

test('lease repeats in whole terms, rounded up', () => {
  const a = { mode: 'lease', payment: 400, termMonths: 36, dueAtSigning: 2000, turnInFee: 400 };
  assert.deepEqual(acquisitionCost(a, 5), { total: 33600, leaseTerms: 2 });
});

test('lease incentives apply once', () => {
  const a = { mode: 'lease', payment: 400, termMonths: 36, dueAtSigning: 0, turnInFee: 0, incentives: 1000 };
  assert.equal(acquisitionCost(a, 3).total, 13400);
});

test('owned outright costs nothing', () => {
  assert.deepEqual(acquisitionCost({ mode: 'owned' }, 5), { total: 0, leaseTerms: null });
});

test('payments stop when the loan ends or the period ends, whichever is first', () => {
  const a = { mode: 'payments', monthlyPayment: 500, monthsRemaining: 20 };
  assert.equal(acquisitionCost(a, 3).total, 10000);
  assert.equal(acquisitionCost(a, 1).total, 6000);
});

test('blank and missing numeric fields count as zero', () => {
  const a = { mode: 'buy', price: '', taxRate: undefined, fees: null, downPayment: 0 };
  assert.equal(acquisitionCost(a, 3).total, 0);
});

test('unknown mode throws', () => {
  assert.throws(() => acquisitionCost({ mode: 'barter' }, 3), /mode/);
});
