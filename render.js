import { annualKwh } from './calc.js';

const SAME_COST = 0.5;
const ERRORS_SHOWN = 4;

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

const MINUS = String.fromCharCode(0x2212);
const signed = (x) => `${x < 0 ? MINUS : ''}${money.format(Math.abs(x))}`;
const tone = (x) => (x < 0 ? 'neg' : 'pos');
const isFlat = (r) => Math.abs(r.savings) < SAME_COST;
const cents = (x) => `${(x * 100).toFixed(1)} cents`;
const yearsText = (y) => `${y} ${y === 1 ? 'year' : 'years'}`;
const gasLabel = (count) => (count > 1 ? 'Gas cars' : 'Gas car');
const trim = (x, digits) => String(Number(x.toFixed(digits)));

const LABELS = {
  efficiency: ['Energy', true],
  cheaperCharging: ['Home vs fast charging', false],
  freeCharging: ['Free charging', false],
  acquisition: ['Purchase or lease', true],
  maintenance: ['Maintenance and repairs', true],
  tires: ['Tires', false],
  insurance: ['Insurance', true],
  registration: ['Registration', true],
  homeCharger: ['Home charger', false],
  equity: ['Gas car sale', false],
};

function headline(r, years) {
  const amount = money.format(Math.abs(r.savings));
  if (isFlat(r)) return `The two cost about the same over ${yearsText(years)}.`;
  return r.savings > 0
    ? `The EV saves you <span class="amount">${amount}</span> over ${yearsText(years)}.`
    : `The EV costs you <span class="amount">${amount}</span>&nbsp;more over ${yearsText(years)}.`;
}

function subline(r) {
  if (isFlat(r)) return '';
  const per = `${money.format(Math.abs(r.perMonth))} a month, ${money.format(Math.abs(r.perYear))} a year, ${cents(Math.abs(r.perMile))} a mile.`;
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
    <div class="gas"><strong>${money.format(r.ice.total)}</strong><span class="l">${gasLabel(count)}</span></div>
    <div class="ev"><strong>${money.format(r.ev.total)}</strong><span class="l">EV</span></div></div>`;
}

const numberInput = (bind, label) =>
  `<input data-bind="${bind}" type="number" inputmode="decimal" min="0" step="any" aria-label="${label}">`;

const staticValue = (key, label) => `<div class="n"><span data-v="${key}"></span><span class="l">${label}</span></div>`;
const editableValue = (bind, aria, label) => `<div class="n">${numberInput(bind, aria)}<span class="l">${label}</span></div>`;
const step = (left, op, right) => `<div class="step">${left}<span class="op">${op}</span>${right}</div>`;

// built once so the boxes keep focus while you type
function skeleton() {
  return `<div class="cols">
    <section class="col gas"><header class="display" data-v="gasTitle"></header>
      ${step(staticValue('miles', 'miles a year'), '&divide;', editableValue('mpg', 'Miles per gallon', 'miles per gallon'))}
      ${step(staticValue('gallons', 'gallons a year'), '&times;', editableValue('gasPrice', 'Gas price per gallon', 'dollars per gallon'))}
      <div class="out"><div class="n" data-v="gasYear"></div><span class="l" data-v="gasPerMile"></span></div></section>
    <section class="col ev"><header class="display">EV</header>
      ${step(staticValue('miles', 'miles a year'), '&divide;', editableValue('mikwh', 'Miles per kWh', 'miles per kWh'))}
      ${step(staticValue('kwh', 'kWh a year'), '&times;', staticValue('perKwh', 'per kWh, blended'))}
      <div class="out"><div class="n" data-v="evYear"></div><span class="l" data-v="evPerMile"></span></div></section>
  </div>
  <section class="bars-wrap"><h3 class="display" data-v="barsTitle"></h3><div data-slot="bars"></div></section>
  <div data-slot="table"></div>
  <div data-slot="monthly"></div>`;
}

function bars(r, input) {
  const top = Math.max(r.ice.total, r.ev.total, 1);
  const h = (v) => Math.round((Math.max(v, 0) / top) * 100);
  return `<div class="bars">
      <div class="bar gas"><strong>${money.format(r.ice.total)}</strong><i style="--p:${h(r.ice.total)}"></i></div>
      <div class="bar ev"><strong>${money.format(r.ev.total)}</strong><i style="--p:${h(r.ev.total)}"></i></div>
    </div><div class="axis"></div>
    <div class="bar-names"><span>${gasLabel(input.cars.length)}</span><span>EV</span></div>`;
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
  const lease = r.leaseTerms.ev > 1
    ? `<p class="note">Your ownership period is longer than one lease, so this counts ${r.leaseTerms.ev} back-to-back leases.</p>` : '';
  return `<table><caption>Difference by source over ${yearsText(years)}. Positive means the EV saves money.</caption>
    <tbody>${rows}${total}</tbody></table>${lease}`;
}

function monthlyBudget(r, years) {
  const months = years * 12;
  return `<div class="monthly">
      <div class="gas"><strong>${money.format(r.ice.total / months)}</strong><span class="l">Your monthly auto budget now</span></div>
      <div class="ev"><strong>${money.format(r.ev.total / months)}</strong><span class="l">Your monthly auto budget with an EV</span></div>
    </div>
    <p class="note">Total cost over ${yearsText(years)}, divided by ${years * 12} months.</p>`;
}

function fillWorking(el, r, input) {
  const text = (key, value) => el.querySelectorAll(`[data-v="${key}"]`).forEach((e) => { e.textContent = value; });
  const slot = (key, html) => { el.querySelector(`[data-slot="${key}"]`).innerHTML = html; };
  const box = (bind, value, readOnly = false) => {
    const i = el.querySelector(`[data-bind="${bind}"]`);
    i.readOnly = readOnly;
    if (document.activeElement !== i) i.value = value;
  };
  const perYear = r.gallons / input.years;
  const mpg = perYear > 0 ? input.annualMiles / perYear : 0;
  const kwhYear = annualKwh(input.ev.kwhPer100, input.annualMiles);
  text('gasTitle', gasLabel(input.cars.length));
  text('miles', whole.format(input.annualMiles));
  text('gallons', whole.format(perYear));
  text('kwh', whole.format(kwhYear));
  text('perKwh', price.format(kwhYear > 0 ? r.ev.energy / input.years / kwhYear : 0));
  text('gasYear', money.format(r.ice.energy / input.years));
  text('evYear', money.format(r.ev.energy / input.years));
  text('gasPerMile', `gas a year, ${cents(r.iceEnergyPerMile)} a mile`);
  text('evPerMile', `charging a year, ${cents(r.evEnergyPerMile)} a mile`);
  text('barsTitle', `Total cost over ${yearsText(input.years)}`);
  box('mpg', trim(mpg, 2), input.cars.length > 1);
  box('gasPrice', input.gasPrice);
  box('mikwh', trim(100 / input.ev.kwhPer100, 2));
  slot('bars', bars(r, input));
  slot('table', breakdownTable(r, input.years));
  slot('monthly', monthlyBudget(r, input.years));
}

export function renderResult(resultEl, workingEl, r, input) {
  resultEl.innerHTML = `<h2 class="headline display">${headline(r, input.years)}</h2>
    <p class="sub">${subline(r)}</p>${tiles(r, input.cars.length)}`;
  if (!workingEl.firstElementChild) workingEl.innerHTML = skeleton();
  workingEl.hidden = false;
  workingEl.classList.remove('stale');
  fillWorking(workingEl, r, input);
}

export function renderErrors(resultEl, workingEl, errors) {
  const shown = errors.slice(0, ERRORS_SHOWN).map((e) => `<li>${e.message}</li>`).join('');
  const more = errors.length > ERRORS_SHOWN ? `<li>And ${errors.length - ERRORS_SHOWN} more.</li>` : '';
  resultEl.innerHTML = `<h2 class="headline empty display">Missing information</h2>
    <p class="sub">The result appears once these are filled in.</p>
    <ul class="todo">${shown}${more}</ul>`;
  // stay put while typing in it, or clearing a box would drop focus
  if (workingEl.contains(document.activeElement)) workingEl.classList.add('stale');
  else workingEl.hidden = true;
}
