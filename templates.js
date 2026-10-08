const esc = (s) => String(s).replace(/"/g, '&quot;');

const input = (name, label, { hint = '', unit = '', step = 'any', min = '0', ph = '', value = '' } = {}) => `
  <label class="field">
    <span class="label">${label}${unit ? ` <em>${unit}</em>` : ''}</span>
    <input name="${name}" type="number" inputmode="decimal" min="${min}" step="${step}" placeholder="${esc(ph)}" value="${esc(value)}">
    ${hint ? `<small>${hint}</small>` : ''}
  </label>`;

const select = (name, label) => `
  <label class="field"><span class="label">${label}</span>
    <select name="${name}" disabled><option value="">Select</option></select></label>`;

const picker = (p) => `
  <div class="picker" data-picker="${p}">
    ${select(`${p}_year`, 'Year')}${select(`${p}_make`, 'Make')}${select(`${p}_model`, 'Model')}${select(`${p}_option`, 'Version')}
    <p class="note" data-msg="${p}" role="status"></p>
  </div>`;

const radio = (p, value, label, checked) => `
  <label class="radio"><input type="radio" name="${p}_mode" value="${value}"${checked ? ' checked' : ''}> ${label}</label>`;

const buyPanel = (p) => `
  <div class="panel" data-mode="buy" data-for="${p}">
    ${input(`${p}_price`, 'Price', { unit: '$' })}
    ${input(`${p}_tax`, 'Sales tax', { unit: '%', hint: 'Your local rate, like 9.25. Your city or state tax site has it.' })}
    ${input(`${p}_fees`, 'Fees', { unit: '$', hint: 'Title, registration and dealer doc fees.' })}
    ${input(`${p}_down`, 'Down payment', { unit: '$', hint: 'If you are paying cash, enter the full price plus tax and fees.' })}
    ${input(`${p}_apr`, 'Loan APR', { unit: '%', hint: 'Optional.' })}
    ${input(`${p}_loanMonths`, 'Loan length', { unit: 'months', hint: 'Optional.' })}
    ${input(`${p}_resale`, 'Resale value at the end', { unit: '$', hint: 'Your estimate. Leave it empty to count none.' })}
    ${input(`${p}_incentives`, 'Incentives', { unit: '$', hint: 'Federal, state or utility credits, if any.' })}
  </div>`;

const leasePanel = (p) => `
  <div class="panel" data-mode="lease" data-for="${p}" hidden>
    ${input(`${p}_leasePay`, 'Monthly payment', { unit: '$', hint: 'Tax is usually already in this number.' })}
    ${input(`${p}_dueAtSigning`, 'Due at signing', { unit: '$' })}
    ${input(`${p}_leaseTerm`, 'Term', { unit: 'months' })}
    ${input(`${p}_turnInFee`, 'Turn-in fee', { unit: '$' })}
    ${input(`${p}_leaseIncentives`, 'Incentives', { unit: '$' })}
  </div>`;

const paymentsPanel = (p) => `
  <div class="panel" data-mode="payments" data-for="${p}" hidden>
    ${input(`${p}_monthlyPayment`, 'Monthly payment', { unit: '$' })}
    ${input(`${p}_monthsRemaining`, 'Months left', { unit: 'months' })}
  </div>`;

const yearlyCosts = (p) => `
  <div class="panel">
    ${input(`${p}_insurance`, 'Insurance', { unit: '$ per year' })}
    ${input(`${p}_registration`, 'Registration', { unit: '$ per year' })}
  </div>`;

const TIRE_HINT = {
  ev: 'EVs often wear tires faster and pay more for them. Ask a tire shop what your model needs.',
  car: 'Leave both blank to count no tires.',
};

const maintenance = (p) => `
  <fieldset class="group">
    <legend>Maintenance and tires</legend>
    <div class="panel">
      ${input(`${p}_maintenance`, 'Maintenance and repairs', { unit: '$ per year', ph: 'enter your own' })}
    </div>
    <p class="note" data-total="${p}"></p>
    <div class="panel">
      ${input(`${p}_tireCost`, 'Tire set cost', { unit: '$', hint: TIRE_HINT[p === 'ev' ? 'ev' : 'car'] })}
      ${input(`${p}_tireMiles`, 'Miles per set', { unit: 'miles', hint: 'A set only counts once your total miles reach this.' })}
    </div>
  </fieldset>`;

export function evFieldset() {
  const p = 'ev';
  return `
  <fieldset class="card">
    <legend>EV</legend>
    ${picker(p)}
    <div class="panel">
      ${input(`${p}_eff`, 'Energy use', { unit: 'kWh per 100 mi', hint: 'Filled in from the EPA. It is wall energy, what the utility bills.' })}
    </div>
    <div class="radios" role="group" aria-label="Buy or lease">${radio(p, 'buy', 'Buy', true)}${radio(p, 'lease', 'Lease', false)}</div>
    ${buyPanel(p)}${leasePanel(p)}
    ${yearlyCosts(p)}
    ${maintenance(p)}
  </fieldset>`;
}

export function carFieldset() {
  const p = 'car0';
  return `
  <fieldset class="card">
    <legend>Gas car</legend>
    ${picker(p)}
    <div class="panel">
      ${input(`${p}_eff`, 'Fuel economy', { unit: 'mpg', hint: 'Filled in from the EPA. Edit it if you track your own.' })}
    </div>
    <div class="radios" role="group" aria-label="Payment type">${radio(p, 'owned', 'Owned', true)}${radio(p, 'payments', 'Payments', false)}${radio(p, 'lease', 'Lease', false)}</div>
    ${paymentsPanel(p)}${leasePanel(p)}
    ${yearlyCosts(p)}
    ${maintenance(p)}
    <label class="check"><input type="checkbox" name="${p}_sellOn" data-reveals='[data-sale="${p}"]'> Selling this car</label>
    <div class="panel" data-sale="${p}" hidden>
      ${input(`${p}_sellValue`, 'Sale price', { unit: '$' })}
      ${input(`${p}_sellPayoff`, 'Loan payoff', { unit: '$', hint: 'What you still owe on it, if anything.' })}
    </div>
  </fieldset>`;
}
