// Yearly maintenance estimates. Cost per year = (perMile * miles + perYear) * (1 + ageSlope * age).
// An entry is null until it has a source and an as-of date. See estimateMaintenance().
const none = { oil: null, tires: null, brakes: null, repairs: null };

export const RATES = {
  ev: { car: { ...none }, suv: { ...none }, truck: { ...none } },
  hybrid: { car: { ...none }, suv: { ...none }, truck: { ...none } },
  gas: { car: { ...none }, suv: { ...none }, truck: { ...none } },
};
