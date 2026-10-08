// repair + maintenance together, $ per mile by odometer band. 2019-20 survey data,
// not adjusted for inflation. no hybrid figures
const CR_SOURCE = 'Consumer Reports, Electric Vehicle Ownership Costs: Chapter 2, Maintenance (Harto, Sept. 2020), '
  + 'Table 2.1, https://advocacy.consumerreports.org/wp-content/uploads/2020/09/Maintenance-Cost-White-Paper-9.24.20.pdf';

export const TOTALS = {
  ev: {
    bins: [
      { upToMiles: 50000, perMile: 0.012 },
      { upToMiles: 100000, perMile: 0.028 },
      { upToMiles: 200000, perMile: 0.0437 },
    ],
    source: CR_SOURCE,
    asOf: '2020-09',
    note: 'Based on 2019 and 2020 owner surveys. The 100,000 to 200,000 mile figure rests on 55 early EVs.',
  },
  hybrid: null,
  gas: {
    bins: [
      { upToMiles: 50000, perMile: 0.028 },
      { upToMiles: 100000, perMile: 0.06 },
      { upToMiles: 200000, perMile: 0.079 },
    ],
    source: CR_SOURCE,
    asOf: '2020-09',
    note: 'Based on 2019 and 2020 owner surveys.',
  },
};
