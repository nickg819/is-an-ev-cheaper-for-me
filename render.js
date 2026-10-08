const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

const signed = (x) => `${x < 0 ? '-' : ''}${money.format(Math.abs(x))}`;
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
  if (Math.abs(r.savings) < 0.5) return `The two cost about the same over ${yearsText(years)}.`;
  return r.savings > 0
    ? `The EV saves you <span class="amount">${amount}</span> over ${yearsText(years)}.`
    : `The EV costs you <span class="amount">${amount}</span> more over ${yearsText(years)}.`;
}

function subline(r, input) {
  const monthly = money.format(Math.abs(r.perMonth));
  const lead = r.savings === 0 ? '' : `About <b>${monthly} a month</b>. `;
  if (r.breakEvenGasPrice == null || r.breakEvenGasPrice <= 0) return lead.trim();
  const p = price.format(r.breakEvenGasPrice);
  return r.savings > 0
    ? `${lead}If gas drops below <b>${p} a gallon</b>, the EV stops saving you money.`
    : `${lead}If gas climbs above <b>${p} a gallon</b>, the EV starts saving you money.`;
}

function tiles(r) {
  return `<div class="mini">
    <div class="gas"><small>Gas cars</small><strong>${money.format(r.ice.total)}</strong></div>
    <div class="ev"><small>EV</small><strong>${money.format(r.ev.total)}</strong></div></div>`;
}

function step(leftNum, leftLabel, op, rightNum, rightLabel) {
  return `<div class="step"><div class="n">${leftNum}<span class="l">${leftLabel}</span></div>
    <span class="op">${op}</span><div class="n">${rightNum}<span class="l">${rightLabel}</span></div></div>`;
}

function gasColumn(r, input) {
  const perYear = r.gallons / input.years;
  const mpg = perYear > 0 ? input.annualMiles / perYear : 0;
  const title = input.cars.length > 1 ? 'Gas cars' : 'Gas car';
  return `<section class="col gas"><header class="display">${title}</header>
    ${step(whole.format(input.annualMiles), 'miles a year', '&divide;', mpg.toFixed(1), 'miles per gallon')}
    ${step(whole.format(perYear), 'gallons a year', '&times;', price.format(input.gasPrice), 'per gallon')}
    <div class="out"><div class="n">${money.format(r.ice.energy / input.years)}</div>
    <span class="l">gas a year, ${cents(r.iceEnergyPerMile)} a mile</span></div></section>`;
}

function evColumn(r, input) {
  const kwhYear = (input.ev.kwhPer100 / 100) * input.annualMiles;
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
      <div class="bar gas"><strong>${money.format(r.ice.total)}</strong><i style="--p:${h(r.ice.total)}"></i><span>${input.cars.length > 1 ? 'Gas cars' : 'Gas car'}</span></div>
      <div class="bar ev"><strong>${money.format(r.ev.total)}</strong><i style="--p:${h(r.ev.total)}"></i><span>EV</span></div>
    </div><div class="axis"></div></section>`;
}

function breakdownTable(r, years) {
  const rows = Object.entries(LABELS)
    .filter(([key, [, always]]) => always || Math.abs(r.breakdown[key]) > 0.5)
    .map(([key, [label]]) => {
      const v = r.breakdown[key];
      return `<tr><th scope="row">${label}</th><td class="${v < 0 ? 'neg' : 'pos'}">${signed(v)}</td></tr>`;
    })
    .join('');
  return `<table><caption>Where the ${yearsText(years)} difference comes from. Positive means the EV saves you money.</caption>
    <tbody>${rows}</tbody></table>`;
}

export function renderResult(resultEl, workingEl, r, input) {
  const lease = r.leaseTerms.ev > 1
    ? `<p class="note">Your ownership period is longer than one lease, so this counts ${r.leaseTerms.ev} back-to-back leases.</p>` : '';
  resultEl.innerHTML = `<h2 class="headline display">${headline(r, input.years)}</h2>
    <p class="sub">${subline(r, input)}</p>${tiles(r)}`;
  workingEl.innerHTML = `<div class="cols">${gasColumn(r, input)}${evColumn(r, input)}</div>
    ${bars(r, input)}${breakdownTable(r, input.years)}${lease}`;
}

export function renderErrors(resultEl, workingEl, errors) {
  const shown = errors.slice(0, 4).map((e) => `<li>${e.message}</li>`).join('');
  const more = errors.length > 4 ? `<li>And ${errors.length - 4} more.</li>` : '';
  resultEl.innerHTML = `<h2 class="headline display">Not enough to go on yet.</h2>
    <p class="sub">Fill in the required fields and the answer shows up here.</p>
    <ul class="todo">${shown}${more}</ul>`;
  workingEl.innerHTML = '';
}
