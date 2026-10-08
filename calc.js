/**
 * @typedef {{mode:'buy', price:number, taxRate:number, fees:number, downPayment:number,
 *   apr:number, loanMonths:number, resale:number, incentives:number}} BuyAcq
 * @typedef {{mode:'lease', payment:number, dueAtSigning:number, termMonths:number,
 *   turnInFee:number, incentives:number}} LeaseAcq
 * @typedef {{mode:'payments', monthlyPayment:number, monthsRemaining:number}} PaymentsAcq
 * @typedef {{mode:'owned'}} OwnedAcq
 * Rates (taxRate, apr, shares) are fractions, not percents.
 */

const n = (v) => Number(v) || 0;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

export function normalizeShares(shares) {
  const total = sum(shares.map(n));
  if (!(total > 0)) throw new RangeError('shares must add up to more than 0');
  return shares.map((s) => n(s) / total);
}

export function monthlyLoanPayment({ principal, apr, termMonths }) {
  if (principal <= 0 || termMonths <= 0) return 0;
  const r = apr / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

export function loanInterest({ principal, apr, termMonths }, monthsHeld = termMonths) {
  const r = apr / 12;
  if (principal <= 0 || termMonths <= 0 || r === 0) return 0;
  const payment = monthlyLoanPayment({ principal, apr, termMonths });
  const months = Math.min(monthsHeld, termMonths);
  const growth = Math.pow(1 + r, months);
  const balance = principal * growth - payment * ((growth - 1) / r);
  return months * payment - (principal - balance);
}

function buyCost(a, years) {
  const price = n(a.price);
  const tax = price * n(a.taxRate);
  const fees = n(a.fees);
  const financed = Math.max(0, price + tax + fees - n(a.downPayment));
  const loan = { principal: financed, apr: n(a.apr), termMonths: n(a.loanMonths) };
  const interest = loanInterest(loan, years * 12);
  return price + tax + fees + interest - n(a.resale) - n(a.incentives);
}

function leaseCost(a, years) {
  const termMonths = n(a.termMonths);
  const leaseTerms = termMonths > 0 ? Math.ceil((years * 12) / termMonths) : 0;
  const perTerm = n(a.payment) * termMonths + n(a.dueAtSigning) + n(a.turnInFee);
  return { total: leaseTerms * perTerm - n(a.incentives), leaseTerms };
}

export function acquisitionCost(a, years) {
  switch (a.mode) {
    case 'buy':
      return { total: buyCost(a, years), leaseTerms: null };
    case 'lease':
      return leaseCost(a, years);
    case 'payments': {
      const months = Math.min(n(a.monthsRemaining), years * 12);
      return { total: n(a.monthlyPayment) * months, leaseTerms: null };
    }
    case 'owned':
      return { total: 0, leaseTerms: null };
    default:
      throw new Error(`unknown acquisition mode: ${a.mode}`);
  }
}
