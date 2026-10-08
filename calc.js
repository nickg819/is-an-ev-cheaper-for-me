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

export function annualKwh(kwhPer100, annualMiles) {
  return (n(kwhPer100) / 100) * n(annualMiles);
}

export function freeShareFromMonthlyKwh(kwhPerMonth, annualKwhTotal) {
  if (!(annualKwhTotal > 0)) return 0;
  return Math.min(1, Math.max(0, (n(kwhPerMonth) * 12) / annualKwhTotal));
}

export function gasUsage({ cars, annualMiles, years }) {
  const shares = normalizeShares(cars.map((c) => c.share));
  const perCar = cars.map((c, i) => (shares[i] * annualMiles * years) / c.mpg);
  return { gallons: sum(perCar), perCar };
}

function mixRate({ homeRate, fastRate, homeShare, fastShare }) {
  const paid = n(homeShare) + n(fastShare);
  if (paid <= 0) return n(fastRate);
  return (n(homeShare) * n(homeRate) + n(fastShare) * n(fastRate)) / paid;
}

export function evEnergy({ kwhPer100, annualMiles, years, charging, freeShare = 0 }) {
  const kwh = annualKwh(kwhPer100, annualMiles) * years;
  const free = Math.min(1, Math.max(0, n(freeShare)));
  const atFast = kwh * n(charging.fastRate);
  const atMix = kwh * mixRate(charging);
  return { kwh, atFast, atMix, actual: atMix * (1 - free) };
}

const maintenanceYearly = (m = {}) =>
  n(m.oil) + n(m.tires) + n(m.brakes) + n(m.repairs) * (m.repairsMultiplier == null ? 1 : n(m.repairsMultiplier));

const sumTotals = (t) =>
  t.acquisition + t.energy + t.insurance + t.registration + t.maintenance + t.homeCharger + t.equity;

function netSale(car) {
  return car.sale && car.sale.on ? n(car.sale.value) - n(car.sale.payoff) : 0;
}

function evTotals(input, energy) {
  const { ev, years, options } = input;
  const t = {
    acquisition: acquisitionCost(ev.acquisition, years).total,
    energy: energy.actual,
    insurance: n(ev.insurance) * years,
    registration: n(ev.registration) * years,
    maintenance: maintenanceYearly(ev.maintenance) * years,
    homeCharger: options.homeCharger && options.homeCharger.on ? n(options.homeCharger.cost) : 0,
    equity: -sum(input.cars.map(netSale)),
  };
  return { ...t, total: sumTotals(t) };
}

function iceTotals(input, gas) {
  const { cars, years, gasPrice } = input;
  const t = {
    acquisition: sum(cars.map((c) => acquisitionCost(c.acquisition, years).total)),
    energy: gas.gallons * gasPrice,
    insurance: sum(cars.map((c) => n(c.insurance))) * years,
    registration: sum(cars.map((c) => n(c.registration))) * years,
    maintenance: sum(cars.map((c) => maintenanceYearly(c.maintenance))) * years,
    homeCharger: 0,
    equity: 0,
  };
  return { ...t, total: sumTotals(t) };
}

function breakdownOf(ev, ice, energy) {
  return {
    efficiency: ice.energy - energy.atFast,
    cheaperCharging: energy.atFast - energy.atMix,
    freeCharging: energy.atMix - energy.actual,
    acquisition: ice.acquisition - ev.acquisition,
    maintenance: ice.maintenance - ev.maintenance,
    insurance: ice.insurance - ev.insurance,
    registration: ice.registration - ev.registration,
    homeCharger: ice.homeCharger - ev.homeCharger,
    equity: ice.equity - ev.equity,
  };
}

function freeShareOf(input) {
  const f = input.options && input.options.freeCharging;
  return f && f.on ? Math.min(1, Math.max(0, n(f.share))) : 0;
}

export function compare(input) {
  const { annualMiles, years, gasPrice } = input;
  const energy = evEnergy({
    kwhPer100: input.ev.kwhPer100, annualMiles, years,
    charging: input.charging, freeShare: freeShareOf(input),
  });
  const gas = gasUsage({ cars: input.cars, annualMiles, years });
  const ev = evTotals(input, energy);
  const ice = iceTotals(input, gas);
  const savings = ice.total - ev.total;
  const miles = annualMiles * years;
  return {
    ev, ice, savings,
    perYear: savings / years,
    perMonth: savings / (years * 12),
    perMile: savings / miles,
    breakdown: breakdownOf(ev, ice, energy),
    gallons: gas.gallons,
    breakEvenGasPrice: gas.gallons > 0 ? gasPrice - savings / gas.gallons : null,
    evEnergyPerMile: ev.energy / miles,
    iceEnergyPerMile: ice.energy / miles,
    leaseTerms: { ev: acquisitionCost(input.ev.acquisition, years).leaseTerms },
  };
}

const MAX_TAX = 0.2;
const MIN_REAL_TAX = 0.005;

const plausibleTax = (rate) => rate === 0 || (rate >= MIN_REAL_TAX && rate <= MAX_TAX);

function checkAcquisition(a, prefix, need) {
  if (a.mode === 'buy') {
    need(n(a.price) >= 0, `${prefix}.price`, 'Price cannot be negative.');
    need(plausibleTax(n(a.taxRate)), `${prefix}.taxRate`,
      'Enter the sales tax as a percent, like 9.25, not a fraction.');
    need(n(a.apr) === 0 || n(a.loanMonths) > 0, `${prefix}.loanMonths`, 'Enter the loan length in months.');
  }
  if (a.mode === 'lease') {
    need(n(a.termMonths) > 0, `${prefix}.termMonths`, 'Enter the lease term in months.');
    need(n(a.payment) >= 0, `${prefix}.payment`, 'Payment cannot be negative.');
  }
}

function checkVehicle(v, prefix, need) {
  need(n(v.insurance) >= 0, `${prefix}.insurance`, 'Insurance cannot be negative.');
  need(n(v.registration) >= 0, `${prefix}.registration`, 'Registration cannot be negative.');
  checkAcquisition(v.acquisition, prefix, need);
}

export function validate(input) {
  const errors = [];
  const need = (ok, field, message) => ok || errors.push({ field, message });
  need(n(input.gasPrice) > 0, 'gasPrice', 'Enter the gas price per gallon.');
  need(n(input.annualMiles) > 0, 'annualMiles', 'Enter the miles you drive in a year.');
  need(n(input.years) > 0, 'years', 'Enter how many years you will keep the car.');
  need(n(input.ev.kwhPer100) > 0, 'ev.kwhPer100', 'Enter the EV energy use in kWh per 100 miles.');
  checkVehicle(input.ev, 'ev', need);
  input.cars.forEach((c, i) => {
    need(n(c.mpg) > 0, `cars[${i}].mpg`, 'Enter the miles per gallon.');
    checkVehicle(c, `cars[${i}]`, need);
  });
  need(sum(input.cars.map((c) => n(c.share))) > 0, 'cars.share', 'Give at least one car a share of the miles.');
  const paid = n(input.charging.homeShare) + n(input.charging.fastShare);
  need(paid > 0 || freeShareOf(input) >= 1, 'charging.share', 'Enter how much charging is home and how much is fast charging.');
  need(n(input.charging.homeRate) >= 0 && n(input.charging.fastRate) >= 0, 'charging.rate', 'Charging rates cannot be negative.');
  return errors;
}
