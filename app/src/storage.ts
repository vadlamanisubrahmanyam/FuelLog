import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB } from './types';

const KEY = 'fuellog.db.v1';
export const emptyDB = (): DB => ({ schema: 1, selectedVehicleId: null, vehicles: [], entries: [] });

export async function loadDB(): Promise<DB> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyDB();
    return parseDB(raw) ?? emptyDB();
  } catch {
    return emptyDB();
  }
}

export async function saveDB(db: DB): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(db));
}

export function parseDB(raw: string): DB | null {
  try {
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.vehicles) || !Array.isArray(d.entries)) return null;
    return { schema: 1, selectedVehicleId: d.selectedVehicleId ?? null, vehicles: d.vehicles, entries: d.entries };
  } catch {
    return null;
  }
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
