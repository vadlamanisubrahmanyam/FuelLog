import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, View, Text, StatusBar as RNStatusBar, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DB, FuelEntry, Vehicle } from './src/types';
import { emptyDB, loadDB, saveDB } from './src/storage';
import { Header, C } from './src/ui';
import { Home, AddFuel, History, Stats, Admin } from './src/screens';

type Screen = 'home' | 'add' | 'history' | 'stats' | 'admin';
const TITLES: Record<Screen, string> = { home: '⛽ FuelLog', add: 'Fuel entry', history: 'History', stats: 'Mileage & spend', admin: 'Admin' };

export default function App() {
  const [db, setDb] = useState<DB>(emptyDB());
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [editing, setEditing] = useState<FuelEntry | null>(null);
  const [editVid, setEditVid] = useState<string | null>(null);

  useEffect(() => { loadDB().then((d) => { setDb(d); setReady(true); }); }, []);

  const commit = useCallback((next: DB) => { setDb(next); saveDB(next).catch(() => {}); }, []);

  const back = useCallback(() => {
    if (screen === 'home') return false;
    setEditing(null);
    setEditVid(null);
    setScreen('home');
    return true;
  }, [screen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', back);
    return () => sub.remove();
  }, [back]);

  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.bg }}><ActivityIndicator color={C.primary} size="large" /></View>;

  const vehicle: Vehicle | null = db.vehicles.find((v) => v.id === db.selectedVehicleId) ?? db.vehicles[0] ?? null;
  const entries = vehicle ? db.entries.filter((e) => e.vehicleId === vehicle.id) : [];
  const needVehicle = (screen === 'add' || screen === 'history' || screen === 'stats') && !vehicle;

  const go = (n: string, vid?: string) => { setEditing(null); setEditVid(vid ?? null); setScreen((needVehicle || (!vehicle && n !== 'admin' && n !== 'home')) ? 'admin' : (n as Screen)); };

  const saveEntry = (e: FuelEntry) => {
    const exists = db.entries.some((x) => x.id === e.id);
    commit({ ...db, entries: exists ? db.entries.map((x) => (x.id === e.id ? e : x)) : [...db.entries, e] });
    setEditing(null);
    setScreen('home');
  };

  const saveVehicle = (v: Vehicle) => {
    const exists = db.vehicles.some((x) => x.id === v.id);
    commit({ ...db, selectedVehicleId: db.selectedVehicleId ?? v.id, vehicles: exists ? db.vehicles.map((x) => (x.id === v.id ? v : x)) : [...db.vehicles, v] });
  };

  const deleteVehicle = (id: string) => {
    const vehicles = db.vehicles.filter((v) => v.id !== id);
    commit({ ...db, vehicles, entries: db.entries.filter((e) => e.vehicleId !== id), selectedVehicleId: db.selectedVehicleId === id ? vehicles[0]?.id ?? null : db.selectedVehicleId });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0 }}>
      <StatusBar style="light" backgroundColor={C.primary} />
      <Header title={TITLES[screen]} onBack={screen === 'home' ? undefined : back} />
      <View style={{ flex: 1 }}>
        {screen === 'home' && <Home db={db} vehicle={vehicle} go={go} select={(id) => commit({ ...db, selectedVehicleId: id })} />}
        {screen === 'add' && vehicle && <AddFuel key={editing?.id ?? 'new'} vehicle={vehicle} entries={entries} editing={editing} onSave={saveEntry} onCancel={back} />}
        {screen === 'history' && vehicle && <History vehicle={vehicle} entries={entries} onEdit={(e) => { setEditing(e); setScreen('add'); }} onDelete={(id) => commit({ ...db, entries: db.entries.filter((x) => x.id !== id) })} />}
        {screen === 'stats' && vehicle && <Stats vehicle={vehicle} entries={entries} />}
        {screen === 'admin' && <Admin key={editVid ?? 'x'} initialEditId={editVid} db={db} onSaveVehicle={saveVehicle} onDeleteVehicle={deleteVehicle} onRestore={(d) => commit(d)} />}
      </View>
    </View>
  );
}
