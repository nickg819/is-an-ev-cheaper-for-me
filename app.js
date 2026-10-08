import { compare, validate, n } from './calc.js';
import { getYears, getMakes, getModels, getOptions, getVehicle } from './epa.js';
import { estimateTotal, powertrainOf } from './maintenance.js';
import { TOTALS } from './maintenance-rates.js';
import { readInput } from './form.js';
import { renderResult, renderErrors, money } from './render.js';
import { evFieldset, carFieldset } from './templates.js';

const form = document.querySelector('#calc');
const resultEl = document.querySelector('#result');
const workingEl = document.querySelector('#working');
const peekEl = document.querySelector('#peek');
const announceEl = document.querySelector('#announce');
const PICKERS = ['ev', 'car0', 'car1'];
const LEVELS = ['year', 'make', 'model', 'option'];
const ANNOUNCE_DELAY_MS = 700;
const vehicles = {};
const requests = Object.fromEntries(PICKERS.map((p) => [p, 0]));
const lookupDown = 'Could not reach the EPA lookup. Type the numbers instead.';

const field = (p, name) => form.elements[`${p}_${name}`];
const message = (p, text) => { form.querySelector(`[data-msg="${p}"]`).textContent = text; };

function fillSelect(select, items, label) {
  const option = (text, value) => Object.assign(document.createElement('option'), { textContent: text, value });
  select.replaceChildren(option(label, ''), ...items.map((i) => option(i.text, i.value)));
  select.disabled = items.length === 0;
}

let announceTimer;
function announce(text) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { announceEl.textContent = text; }, ANNOUNCE_DELAY_MS);
}

function recompute() {
  const input = readInput(form);
  const errors = validate(input);
  if (errors.length) renderErrors(resultEl, workingEl, errors);
  else renderResult(resultEl, workingEl, compare(input), input);
  const headline = resultEl.querySelector('.headline').textContent;
  peekEl.textContent = headline;
  announce(headline);
}

function showTotalHint(p) {
  const el = form.querySelector(`[data-total="${p}"]`);
  const v = vehicles[p];
  if (p !== 'ev' && !v) { el.textContent = ''; return; }
  const hint = estimateTotal(TOTALS, {
    powertrain: p === 'ev' ? 'ev' : powertrainOf(v.atvType),
    age: v ? new Date().getFullYear() - v.year : 0,
    annualMiles: n(form.elements.annualMiles.value),
  });
  el.textContent = hint
    ? `Published estimate for a car like this: about ${money.format(hint.perYear)} a year for maintenance and repairs together. Enter your own split below. ${hint.note} Source: ${hint.source}.`
    : '';
}

function clearVehicle(p, text = '') {
  delete vehicles[p];
  field(p, 'eff').value = '';
  message(p, text);
  showTotalHint(p);
  recompute();
}

const efficiencyOf = (p, v) => (p === 'ev' ? v.kwhPer100 : v.mpg);

function refuse(p, v) {
  if (p === 'ev' && !v.isEV) return 'That one is not an EV. Pick an electric model.';
  if (p !== 'ev' && v.isEV) return 'That one is an EV. Pick a gas car here, and the EV in the EV section.';
  return efficiencyOf(p, v) > 0 ? '' : 'The EPA has no efficiency figure for this one. Type your own below.';
}

async function applyVehicle(p, id, token) {
  try {
    const v = await getVehicle(id);
    if (token !== requests[p]) return;
    const refusal = refuse(p, v);
    if (refusal) return clearVehicle(p, refusal);
    vehicles[p] = v;
    field(p, 'eff').value = efficiencyOf(p, v);
    message(p, powertrainOf(v.atvType) === 'hybrid' ? 'Hybrid or plug-in: check the mpg is right for how you drive it.' : '');
    showTotalHint(p);
    recompute();
  } catch {
    if (token === requests[p]) message(p, lookupDown);
  }
}

async function cascade(p, level) {
  const token = ++requests[p];
  const [y, mk, md, op] = LEVELS.map((k) => field(p, k));
  if (vehicles[p]) clearVehicle(p); else message(p, '');
  try {
    if (level === 'year') {
      const makes = y.value ? await getMakes(y.value) : [];
      if (token !== requests[p]) return;
      fillSelect(mk, makes, 'Make');
    }
    if (level === 'year' || level === 'make') {
      const models = mk.value ? await getModels(y.value, mk.value) : [];
      if (token !== requests[p]) return;
      fillSelect(md, models, 'Model');
    }
    if (level !== 'option') {
      const options = md.value ? await getOptions(y.value, mk.value, md.value) : [];
      if (token !== requests[p]) return;
      fillSelect(op, options, 'Version');
      if (level === 'model' && options.length === 1) op.selectedIndex = 1;
    }
    if (op.value) await applyVehicle(p, op.value, token);
  } catch {
    if (token === requests[p]) message(p, lookupDown);
  }
}

function wirePicker(p) {
  for (const level of LEVELS) {
    field(p, level).addEventListener('change', () => cascade(p, level));
  }
}

function toggleHidden(selector, hidden) {
  const el = form.querySelector(selector);
  if (el) el.hidden = hidden;
}

function splitMilesBetweenTwoCars(two) {
  const [first, second] = [field('car0', 'share'), field('car1', 'share')];
  if (two && !second.value) {
    first.value = 50;
    second.value = 50;
  }
  if (!two && Number(first.value) === 50) {
    first.value = 100;
    second.value = '';
  }
}

function wireToggles() {
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'radio' && t.name.endsWith('_mode')) {
      const p = t.name.replace('_mode', '');
      form.querySelectorAll(`[data-for="${p}"]`).forEach((el) => { el.hidden = el.dataset.mode !== t.value; });
    }
    if (t.dataset.reveals) toggleHidden(t.dataset.reveals, !t.checked);
    if (t.name === 'car1_on') {
      splitMilesBetweenTwoCars(t.checked);
      recompute();
    }
  });
}

function wireInputs() {
  form.addEventListener('input', (e) => {
    if (e.target.name === 'annualMiles') PICKERS.forEach(showTotalHint);
    recompute();
  });
}

// Each box in the math columns drives one form field. Miles per kWh is stored as kWh per 100 miles.
const WORKING_BINDINGS = {
  gasPrice: ['gasPrice', (x) => x],
  mpg: ['car0_eff', (x) => x],
  mikwh: ['ev_eff', (x) => (n(x) > 0 ? 100 / n(x) : '')],
};

function wireWorking() {
  workingEl.addEventListener('input', (e) => {
    const binding = WORKING_BINDINGS[e.target.dataset.bind];
    if (!binding) return;
    const [name, convert] = binding;
    const target = form.elements[name];
    target.value = convert(e.target.value);
    target.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function wirePeek() {
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => { peekEl.hidden = entry.isIntersecting; }).observe(resultEl);
}

function wireTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const phone = matchMedia('(max-width: 760px)');
  const show = (id) => {
    tabs.forEach((t) => {
      const selected = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === id));
  };
  const syncRoles = () => panels.forEach((p) => {
    if (phone.matches) {
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', `tab-${p.dataset.panel}`);
    } else {
      p.removeAttribute('role');
      p.removeAttribute('aria-labelledby');
    }
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      const target = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      tabs[target].focus();
      show(tabs[target].dataset.tab);
    });
  });
  phone.addEventListener('change', syncRoles);
  syncRoles();
  show('basics');
}

async function loadYears() {
  try {
    const years = await getYears();
    PICKERS.forEach((p) => fillSelect(field(p, 'year'), years, 'Year'));
  } catch {
    PICKERS.forEach((p) => message(p, lookupDown));
  }
}

async function init() {
  document.querySelector('#ev-slot').innerHTML = evFieldset();
  document.querySelector('#car-slot').innerHTML = carFieldset(0) + carFieldset(1);
  PICKERS.forEach(wirePicker);
  wireToggles();
  wireInputs();
  wireWorking();
  wireTabs();
  wirePeek();
  showTotalHint('ev');
  recompute();
  await loadYears();
}

init();
