import { FuelEntry } from './types';

export interface Segment { entryId: string; distance: number; qty: number; mileage: number; }
export interface Stats {
  fills: number;
  totalSpend: number;
  monthSpend: number;
  totalQty: number;
  distance: number;          // first odo -> last odo
  costPerKm: number | null;
  avgMileage: number | null; // km per litre, full-tank method
  lastMileage: number | null;
  bestMileage: number | null;
  worstMileage: number | null;
  segments: Segment[];
}

export const sortEntries = (list: FuelEntry[]) =>
  [...list].sort((a, b) => a.odo - b.odo || a.date.localeCompare(b.date));

/** Full-tank method: a mileage reading is produced at each full fill, using all fuel added since the previous full fill. */
export function computeStats(entries: FuelEntry[], todayStr: string): Stats {
  const e = sortEntries(entries);
  const segments: Segment[] = [];
  let baseline: number | null = null;
  let acc = 0;
  for (const x of e) {
    if (baseline === null) {
      if (x.full) { baseline = x.odo; acc = 0; }
      continue;
    }
    acc += x.qty;
    if (x.full) {
      const distance = x.odo - baseline;
      if (distance > 0 && acc > 0) segments.push({ entryId: x.id, distance, qty: acc, mileage: distance / acc });
      baseline = x.odo;
      acc = 0;
    }
  }
  const sd = segments.reduce((s, g) => s + g.distance, 0);
  const sq = segments.reduce((s, g) => s + g.qty, 0);
  const m = segments.map((g) => g.mileage);
  const distance = e.length > 1 ? e[e.length - 1].odo - e[0].odo : 0;
  const spendAfterFirst = e.slice(1).reduce((s, x) => s + x.total, 0);
  const month = todayStr.slice(0, 7);
  return {
    fills: e.length,
    totalSpend: e.reduce((s, x) => s + x.total, 0),
    monthSpend: e.filter((x) => x.date.startsWith(month)).reduce((s, x) => s + x.total, 0),
    totalQty: e.reduce((s, x) => s + x.qty, 0),
    distance,
    costPerKm: distance > 0 ? spendAfterFirst / distance : null,
    avgMileage: sq > 0 ? sd / sq : null,
    lastMileage: m.length ? m[m.length - 1] : null,
    bestMileage: m.length ? Math.max(...m) : null,
    worstMileage: m.length ? Math.min(...m) : null,
    segments,
  };
}

export function monthlySpend(entries: FuelEntry[], count = 6) {
  const map: Record<string, number> = {};
  entries.forEach((x) => { const k = x.date.slice(0, 7); map[k] = (map[k] || 0) + x.total; });
  return Object.keys(map).sort().reverse().slice(0, count).map((k) => ({ month: k, spend: map[k] }));
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const addDays = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
export const validDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return addDays(s, 0) === s;
};
export const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const num = (n: number | null, d = 1) => (n === null || !isFinite(n) ? '—' : n.toFixed(d));
