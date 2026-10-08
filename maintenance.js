export const LINES = ['oil', 'tires', 'brakes', 'repairs'];

export function vehicleClass(vClass = '') {
  if (/pickup/i.test(vClass)) return 'truck';
  if (/sport utility|van/i.test(vClass)) return 'suv';
  return 'car';
}

export function powertrainOf(atvType = '') {
  if (atvType === 'EV') return 'ev';
  if (/hybrid/i.test(atvType)) return 'hybrid';
  return 'gas';
}

function yearlyCost(rate, annualMiles, age) {
  const base = rate.perMile * annualMiles + (rate.perYear || 0);
  return Math.round(base * (1 + (rate.ageSlope || 0) * Math.max(0, age)));
}

export function estimateMaintenance(table, { powertrain, vehicleClass: cls, age, annualMiles }) {
  const rates = table && table[powertrain] && table[powertrain][cls];
  const costs = {};
  const sources = {};
  for (const line of LINES) {
    const rate = rates && rates[line];
    const usable = rate && rate.perMile != null && rate.source && rate.asOf;
    costs[line] = usable ? yearlyCost(rate, annualMiles, age) : null;
    if (usable) sources[line] = { source: rate.source, asOf: rate.asOf };
  }
  return { costs, sources };
}
