const BASE = 'https://www.fueleconomy.gov/ws/rest';
const TIMEOUT_MS = 8000;
const cache = new Map();

async function request(url, f) {
  const res = await f(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`EPA lookup failed (${res.status})`);
  return res.json();
}

// cached by url. tests pass their own fetch and skip the cache
function get(path, params = {}, f) {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE}/${path}${query ? `?${query}` : ''}`;
  if (f) return request(url, f);
  if (!cache.has(url)) {
    cache.set(url, request(url, fetch).catch((err) => {
      cache.delete(url);
      throw err;
    }));
  }
  return cache.get(url);
}

export function asMenu(raw) {
  const items = raw && raw.menuItem;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

const figure = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function parseVehicle(r) {
  const isEV = r.atvType === 'EV';
  return {
    id: String(r.id),
    year: figure(r.year),
    make: r.make,
    model: r.model,
    vClass: r.VClass || '',
    atvType: r.atvType || '',
    isEV,
    mpg: isEV ? 0 : figure(r.comb08),
    kwhPer100: isEV ? figure(r.combE) : 0,
    range: figure(r.range),
  };
}

export const getYears = async (f) => asMenu(await get('vehicle/menu/year', {}, f));
export const getMakes = async (year, f) => asMenu(await get('vehicle/menu/make', { year }, f));
export const getModels = async (year, make, f) =>
  asMenu(await get('vehicle/menu/model', { year, make }, f));
export const getOptions = async (year, make, model, f) =>
  asMenu(await get('vehicle/menu/options', { year, make, model }, f));
export const getVehicle = async (id, f) => parseVehicle(await get(`vehicle/${id}`, {}, f));
