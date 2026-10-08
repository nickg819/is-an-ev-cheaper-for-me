import { compare, validate } from './calc.js';
import { getYears, getMakes, getModels, getOptions, getVehicle } from './epa.js';
import { estimateTotal, powertrainOf } from './maintenance.js';
import { TOTALS } from './maintenance-rates.js';
import { readInput } from './form.js';
import { renderResult, renderErrors } from './render.js';
import { evFieldset, carFieldset } from './templates.js';

const form = document.querySelector('#calc');
const resultEl = document.querySelector('#result');
const workingEl = document.querySelector('#working');
const PICKERS = ['ev', 'car0', 'car1'];
const vehicles = {};
const lookupDown = 'Could not reach the EPA lookup. Type the numbers instead.';

const field = (p, name) => form.elements[`${p}_${name}`];
const message = (p, text) => { form.querySelector(`[data-msg="${p}"]`).textContent = text; };

function fillSelect(select, items, label) {
  const option = (text, value) => Object.assign(document.createElement('option'), { textContent: text, value });
  select.replaceChildren(option(label, ''), ...items.map((i) => option(i.text, i.value)));
  select.disabled = items.length === 0;
}

function recompute() {
  const input = readInput(form);
  const errors = validate(input);
  if (errors.length) renderErrors(resultEl, workingEl, errors);
  else renderResult(resultEl, workingEl, compare(input), input);
}

function showTotalHint(p) {
  const el = form.querySelector(`[data-total="${p}"]`);
  const v = vehicles[p];
  if (p !== 'ev' && !v) { el.textContent = ''; return; }
  const hint = estimateTotal(TOTALS, {
    powertrain: p === 'ev' ? 'ev' : powertrainOf(v.atvType),
    age: v ? new Date().getFullYear() - v.year : 0,
    annualMiles: Number(form.elements.annualMiles.value) || 0,
  });
  el.textContent = hint
    ? `Published estimate for a car like this: about ${Math.round(hint.perYear).toLocaleString('en-US')} dollars a year for maintenance and repairs together. Enter your own split below. ${hint.note} Source: ${hint.source}.`
    : '';
}

async function applyVehicle(p, id) {
  try {
    const v = await getVehicle(id);
    if (p === 'ev' && !v.isEV) return message(p, 'That one is not an EV. Pick an electric model.');
    const eff = p === 'ev' ? v.kwhPer100 : v.mpg;
    if (!(eff > 0)) return message(p, 'The EPA has no efficiency figure for this one. Type your own below.');
    vehicles[p] = v;
    field(p, 'eff').value = eff;
    message(p, p !== 'ev' && v.atvType ? 'Hybrid or plug-in: check the mpg is right for how you drive it.' : '');
    showTotalHint(p);
    recompute();
  } catch {
    message(p, lookupDown);
  }
}

async function cascade(p, level) {
  const [y, mk, md, op] = ['year', 'make', 'model', 'option'].map((k) => field(p, k));
  message(p, '');
  try {
    if (level === 'year') fillSelect(mk, y.value ? await getMakes(y.value) : [], 'Make');
    if (level === 'year' || level === 'make') fillSelect(md, mk.value ? await getModels(y.value, mk.value) : [], 'Model');
    if (level !== 'option') fillSelect(op, md.value ? await getOptions(y.value, mk.value, md.value) : [], 'Version');
    if (level === 'model' && op.options.length === 2) op.selectedIndex = 1;
    if (op.value) await applyVehicle(p, op.value);
  } catch {
    message(p, lookupDown);
  }
}

function wirePicker(p) {
  for (const level of ['year', 'make', 'model', 'option']) {
    field(p, level).addEventListener('change', () => cascade(p, level));
  }
}

function toggleHidden(selector, hidden) {
  const el = form.querySelector(selector);
  if (el) el.hidden = hidden;
}

function wireToggles() {
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'radio' && t.name.endsWith('_mode')) {
      const p = t.name.replace('_mode', '');
      form.querySelectorAll(`[data-for="${p}"]`).forEach((el) => { el.hidden = el.dataset.mode !== t.value; });
    }
    if (t.name.endsWith('_sellOn')) toggleHidden(`[data-sale="${t.name.replace('_sellOn', '')}"]`, !t.checked);
    if (t.name === 'car1_on') toggleHidden('[data-second]', !t.checked);
    if (t.name === 'free_on') toggleHidden('[data-free]', !t.checked);
    if (t.name === 'charger_on') toggleHidden('[data-charger]', !t.checked);
  });
}

function wireInputs() {
  form.addEventListener('input', (e) => {
    if (e.target.name === 'annualMiles') PICKERS.forEach(showTotalHint);
    recompute();
  });
  form.addEventListener('change', recompute);
}

function wireTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const show = (id) => {
    tabs.forEach((t) => {
      const selected = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === id));
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      show(next.dataset.tab);
    });
  });
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
  wireTabs();
  showTotalHint('ev');
  recompute();
  await loadYears();
}

init();
