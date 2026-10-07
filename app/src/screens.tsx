import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, Share, TouchableOpacity, Switch } from 'react-native';
import { Vehicle, FuelEntry, FuelType, FUEL_TYPES, DB } from './types';
import { Btn, Card, Chips, Field, Stat, C, s, Credit } from './ui';
import { computeStats, monthlySpend, sortEntries, todayStr, addDays, validDate, money, num } from './calc';
import { uid, parseDB } from './storage';

const vName = (v: Vehicle) => `${v.make} ${v.model}`;
const icon = (v: Vehicle) => (v.type === 'car' ? '🚗' : '🏍️');
const Body = ({ children }: any) => <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 14 }}>{children}</ScrollView>;

/* ---------------- HOME ---------------- */
export function Home({ db, vehicle, go, select }: { db: DB; vehicle: Vehicle | null; go: (n: string) => void; select: (id: string) => void }) {
  const entries = db.entries.filter((e) => vehicle && e.vehicleId === vehicle.id);
  const st = computeStats(entries, todayStr());
  const all = db.entries.reduce((a, e) => a + e.total, 0);
  return (
    <Body>
      {db.vehicles.length === 0 ? (
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>Welcome 👋</Text>
          <Text style={{ color: C.sub, marginVertical: 8 }}>Start by adding your car or bike in Admin. This is a one-time setup.</Text>
          <Btn label="Go to Admin" onPress={() => go('admin')} />
        </Card>
      ) : (
        <>
          <Chips options={db.vehicles.map((v) => ({ key: v.id, label: `${icon(v)} ${v.reg}` }))} value={vehicle?.id ?? null} onChange={select} />
          {vehicle && (
            <Card>
              <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>{icon(vehicle)} {vName(vehicle)}</Text>
              <Text style={{ color: C.sub, marginBottom: 8 }}>{vehicle.reg}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <Stat label="Avg mileage" value={st.avgMileage ? num(st.avgMileage) + ' km/l' : '—'} />
                <Stat label="Last fill" value={st.lastMileage ? num(st.lastMileage) + ' km/l' : '—'} />
                <Stat label="This month" value={money(st.monthSpend)} />
                <Stat label="Total spent" value={money(st.totalSpend)} />
              </View>
            </Card>
          )}
          <Btn label="＋  Add fuel entry" onPress={() => go('add')} style={{ marginBottom: 10 }} />
          <View style={{ flexDirection: 'row' }}>
            <Btn kind="ghost" label="History" onPress={() => go('history')} style={{ flex: 1, marginRight: 8 }} />
            <Btn kind="ghost" label="Mileage & spend" onPress={() => go('stats')} style={{ flex: 1 }} />
          </View>
          <Text style={{ color: C.sub, textAlign: 'center', marginTop: 14 }}>All vehicles spend: {money(all)}</Text>
        </>
      )}
      <Btn kind="ghost" label="⚙  Admin (vehicles & backup)" onPress={() => go('admin')} style={{ marginTop: 14 }} />
      <Credit />
    </Body>
  );
}

/* ---------------- ADD / EDIT FUEL ---------------- */
export function AddFuel({ vehicle, entries, editing, onSave, onCancel }: { vehicle: Vehicle; entries: FuelEntry[]; editing?: FuelEntry | null; onSave: (e: FuelEntry) => void; onCancel: () => void }) {
  const sorted = sortEntries(entries);
  const last = sorted.length ? sorted[sorted.length - 1] : null;
  const [date, setDate] = useState(editing?.date ?? todayStr());
  const [odo, setOdo] = useState(editing ? String(editing.odo) : '');
  const [fuelType, setFuelType] = useState<FuelType>(editing?.fuelType ?? last?.fuelType ?? 'Petrol');
  const [qty, setQty] = useState(editing ? String(editing.qty) : '');
  const [price, setPrice] = useState(editing ? String(editing.pricePerUnit) : '');
  const [total, setTotal] = useState(editing ? String(editing.total) : '');
  const [full, setFull] = useState(editing?.full ?? true);
  const [station, setStation] = useState(editing?.station ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const unit = fuelType === 'CNG' ? 'kg' : 'litres';

  const recalcTotal = (q: string, p: string) => {
    const a = parseFloat(q), b = parseFloat(p);
    if (a > 0 && b > 0) setTotal((a * b).toFixed(2));
  };
  const onQty = (t: string) => { setQty(t); recalcTotal(t, price); };
  const onPrice = (t: string) => { setPrice(t); recalcTotal(qty, t); };
  const onTotal = (t: string) => {
    setTotal(t);
    const a = parseFloat(qty), b = parseFloat(t);
    if (a > 0 && b > 0) setPrice((b / a).toFixed(2));
  };

  const save = () => {
    if (!validDate(date)) return Alert.alert('Check date', 'Use format YYYY-MM-DD, e.g. 2026-10-07');
    const o = parseFloat(odo), q = parseFloat(qty), p = parseFloat(price), t = parseFloat(total);
    if (!(o >= 0) || odo.trim() === '') return Alert.alert('Check odometer', 'Enter the odometer reading in km.');
    if (!(q > 0)) return Alert.alert('Check quantity', `Enter ${unit} filled.`);
    if (!(t > 0)) return Alert.alert('Check amount', 'Enter price per unit or total amount.');
    const others = sorted.filter((e) => e.id !== editing?.id);
    const prev = [...others].filter((e) => e.date <= date).pop();
    const next = others.find((e) => e.date > date);
    if (prev && o <= prev.odo) return Alert.alert('Odometer too low', `Previous entry (${prev.date}) was ${prev.odo} km. Reading must be higher.`);
    if (next && o >= next.odo) return Alert.alert('Odometer too high', `A later entry (${next.date}) is ${next.odo} km. Reading must be lower.`);
    const now = Date.now();
    onSave({
      id: editing?.id ?? uid(), vehicleId: vehicle.id, date, odo: o, fuelType, qty: q,
      pricePerUnit: p > 0 ? p : t / q, total: t, full, station: station.trim(), notes: notes.trim(),
      createdAt: editing?.createdAt ?? now, updatedAt: now,
    });
  };

  return (
    <Body>
      <Text style={{ color: C.sub, marginBottom: 10 }}>{icon(vehicle)} {vName(vehicle)} · {vehicle.reg}</Text>
      <Field label="Fill date" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" hint="YYYY-MM-DD" />
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Btn kind="ghost" label="− Day" onPress={() => setDate(addDays(validDate(date) ? date : todayStr(), -1))} style={{ flex: 1, marginRight: 6, paddingVertical: 8 }} />
        <Btn kind="ghost" label="Today" onPress={() => setDate(todayStr())} style={{ flex: 1, marginRight: 6, paddingVertical: 8 }} />
        <Btn kind="ghost" label="+ Day" onPress={() => setDate(addDays(validDate(date) ? date : todayStr(), 1))} style={{ flex: 1, paddingVertical: 8 }} />
      </View>
      <Field label="Odometer (km)" value={odo} onChangeText={setOdo} keyboardType="decimal-pad" hint={last ? `Last reading: ${last.odo} km` : 'First entry for this vehicle'} />
      <Text style={s.label}>Fuel type</Text>
      <Chips options={FUEL_TYPES.map((f) => ({ key: f, label: f }))} value={fuelType} onChange={(k) => setFuelType(k as FuelType)} />
      <Field label={`Quantity (${unit})`} value={qty} onChangeText={onQty} keyboardType="decimal-pad" />
      <Field label={`Price per ${unit === 'kg' ? 'kg' : 'litre'} (₹)`} value={price} onChangeText={onPrice} keyboardType="decimal-pad" />
      <Field label="Total amount (₹)" value={total} onChangeText={onTotal} keyboardType="decimal-pad" hint="Auto-calculated; edit to match your bill" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: C.text }}>Filled to full tank</Text>
          <Text style={s.hint}>Needed for accurate mileage. Turn off for partial fills.</Text>
        </View>
        <Switch value={full} onValueChange={setFull} trackColor={{ true: C.primary, false: '#ccc' }} thumbColor="#fff" />
      </View>
      <Field label="Fuel station (optional)" value={station} onChangeText={setStation} />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      <Btn label={editing ? 'Save changes' : 'Save entry'} onPress={save} style={{ marginBottom: 10 }} />
      <Btn kind="ghost" label="Cancel" onPress={onCancel} />
    </Body>
  );
}

/* ---------------- HISTORY ---------------- */
export function History({ vehicle, entries, onEdit, onDelete }: { vehicle: Vehicle; entries: FuelEntry[]; onEdit: (e: FuelEntry) => void; onDelete: (id: string) => void }) {
  const st = useMemo(() => computeStats(entries, todayStr()), [entries]);
  const seg: Record<string, number> = {};
  st.segments.forEach((g) => (seg[g.entryId] = g.mileage));
  const list = sortEntries(entries).reverse();
  return (
    <Body>
      <Text style={{ color: C.sub, marginBottom: 10 }}>{icon(vehicle)} {vName(vehicle)} · {vehicle.reg} · {list.length} entries</Text>
      {list.length === 0 && <Card><Text style={{ color: C.sub }}>No entries yet.</Text></Card>}
      {list.map((e) => (
        <TouchableOpacity key={e.id} onPress={() => onEdit(e)} onLongPress={() => Alert.alert('Delete entry?', `${e.date} · ${e.odo} km`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onDelete(e.id) }])}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', color: C.text }}>{e.date}</Text>
              <Text style={{ fontWeight: '800', color: C.primaryDark }}>{money(e.total)}</Text>
            </View>
            <Text style={{ color: C.sub, marginTop: 4 }}>{e.odo} km · {e.qty} {e.fuelType === 'CNG' ? 'kg' : 'L'} · ₹{e.pricePerUnit.toFixed(2)} · {e.fuelType}{e.full ? '' : ' · partial'}</Text>
            {seg[e.id] ? <Text style={{ color: C.primary, fontWeight: '700', marginTop: 4 }}>{num(seg[e.id])} km/l since last full fill</Text> : null}
            {!!e.station && <Text style={s.hint}>{e.station}</Text>}
          </Card>
        </TouchableOpacity>
      ))}
      <Text style={s.hint}>Tap to edit · long-press to delete</Text>
    </Body>
  );
}

/* ---------------- STATS ---------------- */
export function Stats({ vehicle, entries }: { vehicle: Vehicle; entries: FuelEntry[] }) {
  const st = computeStats(entries, todayStr());
  const months = monthlySpend(entries);
  return (
    <Body>
      <Text style={{ color: C.sub, marginBottom: 10 }}>{icon(vehicle)} {vName(vehicle)} · {vehicle.reg}</Text>
      <Card>
        <Text style={{ fontWeight: '800', color: C.text, marginBottom: 6 }}>Mileage</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Stat label="Average" value={st.avgMileage ? num(st.avgMileage) : '—'} sub="km per litre" />
          <Stat label="Last fill" value={st.lastMileage ? num(st.lastMileage) : '—'} sub="km per litre" />
          <Stat label="Best" value={st.bestMileage ? num(st.bestMileage) : '—'} />
          <Stat label="Worst" value={st.worstMileage ? num(st.worstMileage) : '—'} />
        </View>
        {st.segments.length === 0 && <Text style={s.hint}>Mileage needs at least two full-tank fills. Keep "Filled to full tank" on when you top up to the brim.</Text>}
      </Card>
      <Card>
        <Text style={{ fontWeight: '800', color: C.text, marginBottom: 6 }}>Spending</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Stat label="Total spent" value={money(st.totalSpend)} sub={`${st.fills} fills`} />
          <Stat label="This month" value={money(st.monthSpend)} />
          <Stat label="Cost per km" value={st.costPerKm ? '₹' + st.costPerKm.toFixed(2) : '—'} />
          <Stat label="Distance logged" value={Math.round(st.distance) + ' km'} sub={`${num(st.totalQty)} fuel total`} />
        </View>
      </Card>
      <Card>
        <Text style={{ fontWeight: '800', color: C.text, marginBottom: 6 }}>Monthly spend</Text>
        {months.length === 0 && <Text style={s.hint}>No data yet.</Text>}
        {months.map((m) => (
          <View key={m.month} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <Text style={{ color: C.text }}>{m.month}</Text>
            <Text style={{ fontWeight: '700', color: C.primaryDark }}>{money(m.spend)}</Text>
          </View>
        ))}
      </Card>
    </Body>
  );
}

/* ---------------- ADMIN ---------------- */
export function Admin({ db, onSaveVehicle, onDeleteVehicle, onRestore }: { db: DB; onSaveVehicle: (v: Vehicle) => void; onDeleteVehicle: (id: string) => void; onRestore: (d: DB) => void }) {
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [type, setType] = useState<'car' | 'bike'>('car');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [reg, setReg] = useState('');
  const [restoreText, setRestoreText] = useState('');
  const [showRestore, setShowRestore] = useState(false);

  const reset = () => { setEditing(null); setType('car'); setMake(''); setModel(''); setReg(''); };
  const startEdit = (v: Vehicle) => { setEditing(v); setType(v.type); setMake(v.make); setModel(v.model); setReg(v.reg); };

  const save = () => {
    const r = reg.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!make.trim() || !model.trim() || !r) return Alert.alert('Missing details', 'Make, model and registration number are required.');
    if (db.vehicles.some((v) => v.reg === r && v.id !== editing?.id)) return Alert.alert('Already added', 'A vehicle with this registration number exists.');
    const now = Date.now();
    onSaveVehicle({ id: editing?.id ?? uid(), type, make: make.trim(), model: model.trim(), reg: r, createdAt: editing?.createdAt ?? now, updatedAt: now });
    reset();
  };

  const confirmDelete = (v: Vehicle) => {
    const n = db.entries.filter((e) => e.vehicleId === v.id).length;
    Alert.alert('Delete vehicle?', `${vName(v)} (${v.reg}) and its ${n} fuel entries will be permanently removed.`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onDeleteVehicle(v.id) }]);
  };

  const doRestore = () => {
    const d = parseDB(restoreText.trim());
    if (!d) return Alert.alert('Invalid backup', 'The pasted text is not a valid FuelLog backup.');
    Alert.alert('Replace all data?', `This replaces current data with ${d.vehicles.length} vehicles and ${d.entries.length} entries.`, [{ text: 'Cancel' }, { text: 'Restore', style: 'destructive', onPress: () => { onRestore(d); setRestoreText(''); setShowRestore(false); } }]);
  };

  return (
    <Body>
      <Card>
        <Text style={{ fontWeight: '800', color: C.text, marginBottom: 8 }}>{editing ? 'Edit vehicle' : 'Add vehicle'}</Text>
        <Chips options={[{ key: 'car', label: '🚗 Car' }, { key: 'bike', label: '🏍️ Bike' }]} value={type} onChange={(k) => setType(k as any)} />
        <Field label="Make" value={make} onChangeText={setMake} placeholder="e.g. Honda" />
        <Field label="Model" value={model} onChangeText={setModel} placeholder="e.g. City / Activa" />
        <Field label="Registration number" value={reg} onChangeText={setReg} placeholder="e.g. TS09AB1234" autoCap="characters" />
        <Btn label={editing ? 'Update vehicle' : 'Add vehicle'} onPress={save} style={{ marginBottom: editing ? 8 : 0 }} />
        {editing && <Btn kind="ghost" label="Cancel edit" onPress={reset} />}
      </Card>

      <Text style={[s.label, { marginBottom: 6 }]}>Registered vehicles ({db.vehicles.length})</Text>
      {db.vehicles.map((v) => (
        <Card key={v.id}>
          <Text style={{ fontWeight: '800', color: C.text, fontSize: 16 }}>{icon(v)} {vName(v)}</Text>
          <Text style={{ color: C.sub, marginBottom: 8 }}>{v.reg} · {db.entries.filter((e) => e.vehicleId === v.id).length} entries</Text>
          <View style={{ flexDirection: 'row' }}>
            <Btn kind="ghost" label="Edit" onPress={() => startEdit(v)} style={{ flex: 1, marginRight: 8, paddingVertical: 10 }} />
            <Btn kind="danger" label="Delete" onPress={() => confirmDelete(v)} style={{ flex: 1, paddingVertical: 10 }} />
          </View>
        </Card>
      ))}

      <Card>
        <Text style={{ fontWeight: '800', color: C.text, marginBottom: 4 }}>Backup & restore</Text>
        <Text style={s.hint}>Data is saved on this phone and survives app updates. Backup shares all data as text (WhatsApp, email, notes) so you can restore after an uninstall or on a new phone.</Text>
        <Btn kind="ghost" label="Backup data (share)" onPress={() => Share.share({ message: JSON.stringify(db) })} style={{ marginTop: 10 }} />
        <Btn kind="ghost" label={showRestore ? 'Hide restore' : 'Restore from backup'} onPress={() => setShowRestore(!showRestore)} style={{ marginTop: 8 }} />
        {showRestore && (
          <View style={{ marginTop: 10 }}>
            <Field label="Paste backup text" value={restoreText} onChangeText={setRestoreText} multiline />
            <Btn label="Restore" kind="danger" onPress={doRestore} />
          </View>
        )}
      </Card>
      <Credit />
    </Body>
  );
}
