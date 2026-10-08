const esc = (s) => String(s).replace(/"/g, '&quot;');

const input = (name, label, { hint = '', unit = '', step = 'any', min = '0', ph = '', value = '' } = {}) => `
  <label class="field">
    <span class="label">${label}${unit ? ` <em>${unit}</em>` : ''}</span>
    <input name="${name}" type="number" inputmode="decimal" min="${min}" step="${step}" placeholder="${esc(ph)}" value="${esc(value)}">
    ${hint ? `<small>${hint}</small>` : ''}
  </label>`;

const select = (name, label) => `
  <label class="field"><span class="label">${label}</span>
    <select name="${name}" disabled><option value="">${label}</option></select></label>`;

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
    ${input(`${p}_down`, 'Down payment', { unit: '$', hint: 'Paying cash? Enter the full price plus tax and fees.' })}
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

const maintenance = (p) => `
  <fieldset class="group">
    <legend>Maintenance per year</legend>
    <p class="note" data-total="${p}"></p>
    ${input(`${p}_oil`, 'Oil and fluids', { unit: '$', ph: 'enter your own' })}
    ${input(`${p}_tires`, 'Tires', { unit: '$', ph: 'enter your own' })}
    ${input(`${p}_brakes`, 'Brakes', { unit: '$', ph: 'enter your own' })}
    ${input(`${p}_repairs`, 'General repairs', { unit: '$', ph: 'enter your own' })}
    ${input(`${p}_repairsMult`, 'Repairs multiplier', { ph: '1', hint: '1 is typical. Try 2 if this car has been expensive to keep.' })}
  </fieldset>`;

export function evFieldset() {
  const p = 'ev';
  return `
  <fieldset class="card">
    <legend>The EV you are considering</legend>
    ${picker(p)}
    ${input(`${p}_eff`, 'Energy use', { unit: 'kWh per 100 mi', hint: 'Filled in from the EPA. It is wall energy, what the utility bills.' })}
    <div class="radios" role="group" aria-label="Buy or lease">${radio(p, 'buy', 'Buy', true)}${radio(p, 'lease', 'Lease', false)}</div>
    ${buyPanel(p)}${leasePanel(p)}
    ${input(`${p}_insurance`, 'Insurance per year', { unit: '$' })}
    ${input(`${p}_registration`, 'Registration per year', { unit: '$' })}
    ${maintenance(p)}
  </fieldset>`;
}

export function carFieldset(index) {
  const p = `car${index}`;
  const second = index === 1;
  return `
  <fieldset class="card"${second ? ' data-second hidden' : ''}>
    <legend>${second ? 'Second car it replaces' : 'The car it replaces'}</legend>
    ${picker(p)}
    ${input(`${p}_eff`, 'Fuel economy', { unit: 'mpg', hint: 'Filled in from the EPA. Edit it if you track your own.' })}
    ${input(`${p}_share`, 'Share of your miles', { unit: '%', value: second ? '' : '100', hint: 'Shares are scaled to add up, so 70 and 30 or 7 and 3 both work.' })}
    <div class="radios" role="group" aria-label="How you pay for it">${radio(p, 'owned', 'Owned outright', true)}${radio(p, 'payments', 'Payments', false)}${radio(p, 'lease', 'Lease', false)}</div>
    ${paymentsPanel(p)}${leasePanel(p)}
    ${input(`${p}_insurance`, 'Insurance per year', { unit: '$' })}
    ${input(`${p}_registration`, 'Registration per year', { unit: '$' })}
    ${maintenance(p)}
    <label class="check"><input type="checkbox" name="${p}_sellOn"> I am selling this car</label>
    <div class="panel" data-sale="${p}" hidden>
      ${input(`${p}_sellValue`, 'Sale price', { unit: '$' })}
      ${input(`${p}_sellPayoff`, 'Loan payoff', { unit: '$', hint: 'What you still owe on it, if anything.' })}
    </div>
  </fieldset>`;
}
