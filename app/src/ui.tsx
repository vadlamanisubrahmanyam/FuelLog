import React from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, KeyboardTypeOptions } from 'react-native';

export const C = { primary: '#0B6E4F', primaryDark: '#084C37', bg: '#F3F6F4', card: '#FFFFFF', text: '#1B2A24', sub: '#62736B', line: '#DCE5E0', danger: '#C0392B', accent: '#F4A261' };

export const Card = ({ children, style }: any) => <View style={[s.card, style]}>{children}</View>;

export const Btn = ({ label, onPress, kind = 'primary', style, disabled }: any) => (
  <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    activeOpacity={0.8}
    style={[s.btn, kind === 'primary' && { backgroundColor: C.primary }, kind === 'ghost' && { backgroundColor: '#E4EEE9' }, kind === 'danger' && { backgroundColor: C.danger }, disabled && { opacity: 0.5 }, style]}>
    <Text style={[s.btnTxt, kind === 'ghost' && { color: C.primaryDark }]}>{label}</Text>
  </TouchableOpacity>
);

export const Field = ({ label, value, onChangeText, keyboardType, placeholder, hint, autoCap, multiline }: { label: string; value: string; onChangeText: (t: string) => void; keyboardType?: KeyboardTypeOptions; placeholder?: string; hint?: string; autoCap?: any; multiline?: boolean }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={[s.input, multiline && { height: 70, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor="#9AA9A2" autoCapitalize={autoCap || 'sentences'} multiline={multiline} />
    {!!hint && <Text style={s.hint}>{hint}</Text>}
  </View>
);

export const Chips = ({ options, value, onChange }: { options: { key: string; label: string }[]; value: string | null; onChange: (k: string) => void }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
    {options.map((o) => (
      <TouchableOpacity key={o.key} onPress={() => onChange(o.key)} style={[s.chip, value === o.key && { backgroundColor: C.primary, borderColor: C.primary }]}>
        <Text style={{ color: value === o.key ? '#fff' : C.text, fontWeight: '600' }}>{o.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <View style={s.stat}>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={s.statVal}>{value}</Text>
    {!!sub && <Text style={s.statSub}>{sub}</Text>}
  </View>
);

export const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
  <View style={s.header}>
    {onBack ? <TouchableOpacity onPress={onBack} style={{ paddingRight: 14 }}><Text style={{ color: '#fff', fontSize: 22 }}>←</Text></TouchableOpacity> : null}
    <Text style={s.headerTxt}>{title}</Text>
  </View>
);

export const Credit = () => <Text style={s.credit}>Developed by Subrahmanyam</Text>;

export const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  label: { color: C.sub, fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: C.text },
  hint: { color: C.sub, fontSize: 12, marginTop: 3 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  stat: { flex: 1, minWidth: '45%', backgroundColor: '#F3F8F5', borderRadius: 12, padding: 12, margin: 4 },
  statLabel: { color: C.sub, fontSize: 12, fontWeight: '600' },
  statVal: { color: C.primaryDark, fontSize: 22, fontWeight: '800', marginTop: 2 },
  statSub: { color: C.sub, fontSize: 11, marginTop: 1 },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  headerTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  credit: { textAlign: 'center', color: C.sub, fontSize: 12, marginVertical: 14 },
});
