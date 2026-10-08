import { annualKwh } from './calc.js';

const SAME_COST = 0.5;
const ERRORS_SHOWN = 4;

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

const signed = (x) => `${x < 0 ? '-' : ''}${money.format(Math.abs(x))}`;
const tone = (x) => (x < 0 ? 'neg' : 'pos');
const isFlat = (r) => Math.abs(r.savings) < SAME_COST;
const cents = (x) => `${(x * 100).toFixed(1)} cents`;
const yearsText = (y) => `${y} ${y === 1 ? 'year' : 'years'}`;

const LABELS = {
  efficiency: ['Using less energy', true],
  cheaperCharging: ['Charging cheaper than fast charging', false],
  freeCharging: ['Free charging', false],
  acquisition: ['Buying or leasing', true],
  maintenance: ['Maintenance', true],
  insurance: ['Insurance', true],
  registration: ['Registration', true],
  homeCharger: ['Home charger', false],
  equity: ['Selling the old car', false],
};

function headline(r, years) {
  const amount = money.format(Math.abs(r.savings));
  if (isFlat(r)) return `The two cost about the same over ${yearsText(years)}.`;
  return r.savings > 0
    ? `The EV saves you <span class="amount">${amount}</span> over ${yearsText(years)}.`
    : `The EV costs you <span class="amount">${amount}</span> more over ${yearsText(years)}.`;
}

const gasLabel = (count) => (count > 1 ? 'Gas cars' : 'Gas car');

function subline(r) {
  if (isFlat(r)) return '';
  const per = `<b>${money.format(Math.abs(r.perMonth))} a month</b>, ${money.format(Math.abs(r.perYear))} a year, ${cents(Math.abs(r.perMile))} a mile.`;
  if (r.breakEvenGasPrice == null) return per;
  if (r.breakEvenGasPrice <= 0) {
    return r.savings > 0 ? `${per} The EV saves money even if gas were free.` : per;
  }
  const p = price.format(r.breakEvenGasPrice);
  return r.savings > 0
    ? `${per} If gas drops below <b>${p} a gallon</b>, the EV stops saving you money.`
    : `${per} If gas climbs above <b>${p} a gallon</b>, the EV starts saving you money.`;
}

function tiles(r, count) {
  return `<div class="mini">
    <div class="gas"><small>${gasLabel(count)}</small><strong>${money.format(r.ice.total)}</strong></div>
    <div class="ev"><small>EV</small><strong>${money.format(r.ev.total)}</strong></div></div>`;
}

function step(leftNum, leftLabel, op, rightNum, rightLabel) {
  return `<div class="step"><div class="n">${leftNum}<span class="l">${leftLabel}</span></div>
    <span class="op">${op}</span><div class="n">${rightNum}<span class="l">${rightLabel}</span></div></div>`;
}

function gasColumn(r, input) {
  const perYear = r.gallons / input.years;
  const mpg = perYear > 0 ? input.annualMiles / perYear : 0;
  return `<section class="col gas"><header class="display">${gasLabel(input.cars.length)}</header>
    ${step(whole.format(input.annualMiles), 'miles a year', '&divide;', mpg.toFixed(1), 'miles per gallon')}
    ${step(whole.format(perYear), 'gallons a year', '&times;', price.format(input.gasPrice), 'per gallon')}
    <div class="out"><div class="n">${money.format(r.ice.energy / input.years)}</div>
    <span class="l">gas a year, ${cents(r.iceEnergyPerMile)} a mile</span></div></section>`;
}

function evColumn(r, input) {
  const kwhYear = annualKwh(input.ev.kwhPer100, input.annualMiles);
  const perKwh = kwhYear > 0 ? r.ev.energy / input.years / kwhYear : 0;
  return `<section class="col ev"><header class="display">EV</header>
    ${step(whole.format(input.annualMiles), 'miles a year', '&divide;', (100 / input.ev.kwhPer100).toFixed(1), 'miles per kWh')}
    ${step(whole.format(kwhYear), 'kWh a year', '&times;', price.format(perKwh), 'per kWh, blended')}
    <div class="out"><div class="n">${money.format(r.ev.energy / input.years)}</div>
    <span class="l">charging a year, ${cents(r.evEnergyPerMile)} a mile</span></div></section>`;
}

function bars(r, input) {
  const top = Math.max(r.ice.total, r.ev.total, 1);
  const h = (v) => Math.round((Math.max(v, 0) / top) * 100);
  return `<section class="bars-wrap"><h3 class="display">${yearsText(input.years)}, everything counted</h3>
    <div class="bars">
      <div class="bar gas"><strong>${money.format(r.ice.total)}</strong><i style="--p:${h(r.ice.total)}"></i><span>${gasLabel(input.cars.length)}</span></div>
      <div class="bar ev"><strong>${money.format(r.ev.total)}</strong><i style="--p:${h(r.ev.total)}"></i><span>EV</span></div>
    </div><div class="axis"></div></section>`;
}

function breakdownTable(r, years) {
  const rows = Object.entries(LABELS)
    .filter(([key, [, always]]) => always || Math.abs(r.breakdown[key]) > SAME_COST)
    .map(([key, [label]]) => {
      const v = r.breakdown[key];
      return `<tr><th scope="row">${label}</th><td class="${tone(v)}">${signed(v)}</td></tr>`;
    })
    .join('');
  const total = `<tr class="total"><th scope="row">Total</th><td class="${tone(r.savings)}">${signed(r.savings)}</td></tr>`;
  return `<table><caption>Where the ${years}-year difference comes from. Positive means the EV saves you money.</caption>
    <tbody>${rows}${total}</tbody></table>`;
}

export function renderResult(resultEl, workingEl, r, input) {
  const lease = r.leaseTerms.ev > 1
    ? `<p class="note">Your ownership period is longer than one lease, so this counts ${r.leaseTerms.ev} back-to-back leases.</p>` : '';
  resultEl.innerHTML = `<h2 class="headline display">${headline(r, input.years)}</h2>
    <p class="sub">${subline(r)}</p>${tiles(r, input.cars.length)}`;
  workingEl.innerHTML = `<div class="cols">${gasColumn(r, input)}${evColumn(r, input)}</div>
    ${bars(r, input)}${breakdownTable(r, input.years)}${lease}`;
}

export function renderErrors(resultEl, workingEl, errors) {
  const shown = errors.slice(0, ERRORS_SHOWN).map((e) => `<li>${e.message}</li>`).join('');
  const more = errors.length > ERRORS_SHOWN ? `<li>And ${errors.length - ERRORS_SHOWN} more.</li>` : '';
  resultEl.innerHTML = `<h2 class="headline display">Not enough to go on yet.</h2>
    <p class="sub">Fill in the required fields and the answer shows up here.</p>
    <ul class="todo">${shown}${more}</ul>`;
  workingEl.innerHTML = '';
}
