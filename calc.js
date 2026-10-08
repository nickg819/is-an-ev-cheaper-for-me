// tax, apr and shares are fractions in here. the form works in percents.

export const n = (v) => Number(v) || 0;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const clamp01 = (x) => Math.min(1, Math.max(0, n(x)));

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
  return clamp01((n(kwhPerMonth) * 12) / annualKwhTotal);
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
  const free = clamp01(freeShare);
  const atFast = kwh * n(charging.fastRate);
  const atMix = kwh * mixRate(charging);
  return { kwh, atFast, atMix, actual: atMix * (1 - free) };
}

// whole sets only, bought once the miles are there
function tireCost(tires, miles) {
  const setCost = n(tires && tires.setCost);
  const life = n(tires && tires.milesPerSet);
  return setCost > 0 && life > 0 ? Math.floor(miles / life) * setCost : 0;
}

const withTotal = (t) => ({ ...t, total: sum(Object.values(t)) });

function netSale(car) {
  return car.sale && car.sale.on ? n(car.sale.value) - n(car.sale.payoff) : 0;
}

function vehicleCosts(v, years, miles) {
  const acq = acquisitionCost(v.acquisition, years);
  return {
    acquisition: acq.total,
    leaseTerms: acq.leaseTerms,
    insurance: n(v.insurance) * years,
    registration: n(v.registration) * years,
    maintenance: n(v.maintenance) * years,
    tires: tireCost(v.tires, miles),
  };
}

function evTotals(input, energy, own) {
  const { options } = input;
  return withTotal({
    acquisition: own.acquisition,
    energy: energy.actual,
    insurance: own.insurance,
    registration: own.registration,
    maintenance: own.maintenance,
    tires: own.tires,
    homeCharger: options.homeCharger && options.homeCharger.on ? n(options.homeCharger.cost) : 0,
    equity: -sum(input.cars.map(netSale)),
  });
}

function iceTotals(input, gas) {
  const shares = normalizeShares(input.cars.map((c) => c.share));
  const miles = input.annualMiles * input.years;
  const costs = input.cars.map((c, i) => vehicleCosts(c, input.years, shares[i] * miles));
  const add = (key) => sum(costs.map((c) => c[key]));
  return withTotal({
    acquisition: add('acquisition'),
    energy: gas.gallons * input.gasPrice,
    insurance: add('insurance'),
    registration: add('registration'),
    maintenance: add('maintenance'),
    tires: add('tires'),
    homeCharger: 0,
    equity: 0,
  });
}

function breakdownOf(ev, ice, energy) {
  return {
    efficiency: ice.energy - energy.atFast,
    cheaperCharging: energy.atFast - energy.atMix,
    freeCharging: energy.atMix - energy.actual,
    acquisition: ice.acquisition - ev.acquisition,
    maintenance: ice.maintenance - ev.maintenance,
    tires: ice.tires - ev.tires,
    insurance: ice.insurance - ev.insurance,
    registration: ice.registration - ev.registration,
    homeCharger: ice.homeCharger - ev.homeCharger,
    equity: ice.equity - ev.equity,
  };
}

function freeShareOf(input) {
  const f = input.options && input.options.freeCharging;
  return f && f.on ? clamp01(f.share) : 0;
}

export function compare(input) {
  const { annualMiles, years, gasPrice } = input;
  const energy = evEnergy({
    kwhPer100: input.ev.kwhPer100, annualMiles, years,
    charging: input.charging, freeShare: freeShareOf(input),
  });
  const gas = gasUsage({ cars: input.cars, annualMiles, years });
  const evOwn = vehicleCosts(input.ev, years, annualMiles * years);
  const ev = evTotals(input, energy, evOwn);
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
    leaseTerms: { ev: evOwn.leaseTerms },
  };
}

const MAX_TAX = 0.2;
const MIN_REAL_RATE = 0.005;
const MAX_APR = 0.3;

const plausibleRate = (rate, max) => rate === 0 || (rate >= MIN_REAL_RATE && rate <= max);

const BUY_FIELDS = [['fees', 'Fees'], ['downPayment', 'Down payment'], ['resale', 'Resale value'], ['incentives', 'Incentives'], ['loanMonths', 'Loan length']];
const LEASE_FIELDS = [['dueAtSigning', 'Due at signing'], ['turnInFee', 'Turn-in fee'], ['incentives', 'Incentives']];

function nonNegative(obj, list, prefix, who, need) {
  for (const [key, name] of list) {
    need(n(obj[key]) >= 0, `${prefix}.${key}`, `${who}: ${name} cannot be negative.`);
  }
}

function checkBuy(a, prefix, who, need) {
  need(n(a.price) > 0, `${prefix}.price`, `${who}: Enter the price.`);
  need(plausibleRate(n(a.taxRate), MAX_TAX), `${prefix}.taxRate`, `${who}: Enter the sales tax as a percent, like 9.25.`);
  need(plausibleRate(n(a.apr), MAX_APR), `${prefix}.apr`, `${who}: Enter the loan APR as a percent, like 5.9.`);
  need(n(a.apr) === 0 || n(a.loanMonths) > 0, `${prefix}.loanMonths`, `${who}: Enter the loan length in months.`);
  nonNegative(a, BUY_FIELDS, prefix, who, need);
}

function checkLease(a, prefix, who, need) {
  need(n(a.payment) > 0, `${prefix}.payment`, `${who}: Enter the monthly payment.`);
  need(n(a.termMonths) > 0, `${prefix}.termMonths`, `${who}: Enter the lease term in months.`);
  nonNegative(a, LEASE_FIELDS, prefix, who, need);
}

function checkAcquisition(a, prefix, who, need) {
  if (a.mode === 'buy') checkBuy(a, prefix, who, need);
  if (a.mode === 'lease') checkLease(a, prefix, who, need);
  if (a.mode === 'payments') {
    nonNegative(a, [['monthlyPayment', 'Monthly payment'], ['monthsRemaining', 'Months left']], prefix, who, need);
  }
}

function checkTires(tires = {}, prefix, who, need) {
  need(n(tires.setCost) >= 0, `${prefix}.tireCost`, `${who}: The tire set cost cannot be negative.`);
  need(n(tires.milesPerSet) >= 0, `${prefix}.tireMiles`, `${who}: The miles per set cannot be negative.`);
  need(n(tires.setCost) <= 0 || n(tires.milesPerSet) > 0, `${prefix}.tireMiles`, `${who}: Enter how many miles a set of tires lasts.`);
}

function checkVehicle(v, prefix, who, need) {
  nonNegative(v, [['insurance', 'Insurance'], ['registration', 'Registration'], ['maintenance', 'Maintenance']], prefix, who, need);
  checkTires(v.tires, prefix, who, need);
  checkAcquisition(v.acquisition, prefix, who, need);
}

function checkCar(c, i, count, need) {
  const prefix = `cars[${i}]`;
  const who = count > 1 ? `Old car ${i + 1}` : 'Old car';
  need(n(c.mpg) > 0, `${prefix}.mpg`, `${who}: Enter the miles per gallon.`);
  need(n(c.share) >= 0, `${prefix}.share`, `${who}: The share of miles cannot be negative.`);
  if (c.sale && c.sale.on) nonNegative(c.sale, [['value', 'Sale price'], ['payoff', 'Loan payoff']], `${prefix}.sale`, who, need);
  checkVehicle(c, prefix, who, need);
}

function checkCharging(input, need) {
  const { homeRate, fastRate, homeShare, fastShare } = input.charging;
  need(n(homeShare) >= 0 && n(fastShare) >= 0, 'charging.share', 'Charging shares cannot be negative.');
  need(n(homeShare) + n(fastShare) > 0 || freeShareOf(input) >= 1, 'charging.share',
    'Enter how much charging is home and how much is fast charging.');
  need(n(homeRate) >= 0 && (n(homeShare) <= 0 || n(homeRate) > 0), 'charging.homeRate', 'Enter the home electricity rate.');
  need(n(fastRate) >= 0 && (n(fastShare) <= 0 || n(fastRate) > 0), 'charging.fastRate', 'Enter the fast charging rate.');
  const charger = input.options && input.options.homeCharger;
  if (charger && charger.on) need(n(charger.cost) >= 0, 'options.homeCharger', 'Home charger cost cannot be negative.');
}

export function validate(input) {
  const errors = [];
  const need = (ok, field, message) => ok || errors.push({ field, message });
  need(n(input.gasPrice) > 0, 'gasPrice', 'Enter the gas price per gallon.');
  need(n(input.annualMiles) > 0, 'annualMiles', 'Enter the miles you drive in a year.');
  need(n(input.years) > 0, 'years', 'Enter how many years you will keep the car.');
  need(n(input.ev.kwhPer100) > 0, 'ev.kwhPer100', 'EV: Enter the energy use in kWh per 100 miles.');
  checkVehicle(input.ev, 'ev', 'EV', need);
  input.cars.forEach((c, i) => checkCar(c, i, input.cars.length, need));
  need(sum(input.cars.map((c) => n(c.share))) > 0, 'cars.share', 'Give at least one old car a share of the miles.');
  checkCharging(input, need);
  return errors;
}
