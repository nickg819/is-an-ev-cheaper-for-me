import { annualKwh, freeShareFromMonthlyKwh, n } from './calc.js';

const num = (fd, k) => n(fd.get(k));
const pct = (fd, k) => num(fd, k) / 100;
const on = (fd, k) => fd.get(k) === 'on';

function readAcquisition(fd, p) {
  switch (fd.get(`${p}_mode`)) {
    case 'buy':
      return {
        mode: 'buy', price: num(fd, `${p}_price`), taxRate: pct(fd, `${p}_tax`),
        fees: num(fd, `${p}_fees`), downPayment: num(fd, `${p}_down`),
        apr: pct(fd, `${p}_apr`), loanMonths: num(fd, `${p}_loanMonths`),
        resale: num(fd, `${p}_resale`), incentives: num(fd, `${p}_incentives`),
      };
    case 'lease':
      return {
        mode: 'lease', payment: num(fd, `${p}_leasePay`), dueAtSigning: num(fd, `${p}_dueAtSigning`),
        termMonths: num(fd, `${p}_leaseTerm`), turnInFee: num(fd, `${p}_turnInFee`),
        incentives: num(fd, `${p}_leaseIncentives`),
      };
    case 'payments':
      return { mode: 'payments', monthlyPayment: num(fd, `${p}_monthlyPayment`), monthsRemaining: num(fd, `${p}_monthsRemaining`) };
    default:
      return { mode: 'owned' };
  }
}

function readMaintenance(fd, p) {
  const mult = fd.get(`${p}_repairsMult`);
  return {
    oil: num(fd, `${p}_oil`), tires: num(fd, `${p}_tires`), brakes: num(fd, `${p}_brakes`),
    repairs: num(fd, `${p}_repairs`), repairsMultiplier: mult === '' || mult == null ? 1 : Number(mult),
  };
}

function readVehicle(fd, p) {
  return {
    acquisition: readAcquisition(fd, p),
    insurance: num(fd, `${p}_insurance`),
    registration: num(fd, `${p}_registration`),
    maintenance: readMaintenance(fd, p),
  };
}

function readCar(fd, p) {
  return {
    ...readVehicle(fd, p),
    share: num(fd, `${p}_share`),
    mpg: num(fd, `${p}_eff`),
    sale: { on: on(fd, `${p}_sellOn`), value: num(fd, `${p}_sellValue`), payoff: num(fd, `${p}_sellPayoff`) },
  };
}

function readFree(fd, kwhPer100, annualMiles) {
  if (!on(fd, 'free_on')) return { on: false, share: 0 };
  const value = num(fd, 'free_value');
  const share = fd.get('free_mode') === 'kwh'
    ? freeShareFromMonthlyKwh(value, annualKwh(kwhPer100, annualMiles))
    : value / 100;
  return { on: true, share };
}

export function readInput(form) {
  const fd = new FormData(form);
  const annualMiles = num(fd, 'annualMiles');
  const kwhPer100 = num(fd, 'ev_eff');
  const cars = [readCar(fd, 'car0')];
  if (on(fd, 'car1_on')) cars.push(readCar(fd, 'car1'));
  return {
    gasPrice: num(fd, 'gasPrice'), annualMiles, years: num(fd, 'years'),
    charging: {
      homeRate: num(fd, 'homeRate'), fastRate: num(fd, 'fastRate'),
      homeShare: num(fd, 'homeShare'), fastShare: num(fd, 'fastShare'),
    },
    options: {
      freeCharging: readFree(fd, kwhPer100, annualMiles),
      homeCharger: { on: on(fd, 'charger_on'), cost: num(fd, 'charger_cost') },
    },
    ev: { ...readVehicle(fd, 'ev'), kwhPer100 },
    cars,
  };
}
