export function powertrainOf(atvType = '') {
  if (atvType === 'EV') return 'ev';
  if (/hybrid/i.test(atvType)) return 'hybrid';
  return 'gas';
}

// cost of the miles between start and end, each priced at its band's rate
function costOverSpan(bins, start, end) {
  let cost = 0;
  let lower = 0;
  bins.forEach((bin, i) => {
    const upper = i === bins.length - 1 ? Infinity : bin.upToMiles;
    const overlap = Math.max(0, Math.min(end, upper) - Math.max(start, lower));
    cost += overlap * bin.perMile;
    lower = bin.upToMiles;
  });
  return cost;
}

// yearly average over the whole stretch you'll own it
export function estimateTotal(totals, { powertrain, age, annualMiles, years }) {
  const t = totals && totals[powertrain];
  if (!t || !t.source || !t.asOf || !(annualMiles > 0) || !(years > 0)) return null;
  const start = Math.max(0, age) * annualMiles;
  const cost = costOverSpan(t.bins, start, start + annualMiles * years);
  return { perYear: Math.round(cost / years), source: t.source, asOf: t.asOf, note: t.note || '' };
}
