import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

/** Open the camera (with crop step), run on-device ML Kit OCR, return the recognised text or null if cancelled. */
export async function captureText(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Camera permission needed', 'Allow camera access in Android Settings > Apps > FuelLog > Permissions to scan readings.');
    return null;
  }
  const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
  if (r.canceled || !r.assets?.length) return null;
  try {
    const out = await TextRecognition.recognize(r.assets[0].uri);
    return out?.text ?? '';
  } catch (e) {
    Alert.alert('Could not read the photo', 'Text recognition failed. Try again or type the value.');
    return null;
  }
}

// Fix common OCR mix-ups inside digit-like tokens (O->0, I/l->1)
const clean = (text: string) =>
  text.replace(/[0-9OoIl][0-9OoIl,.]*/g, (tok) => ((tok.match(/\d/g) || []).length >= 2 ? tok.replace(/[Oo]/g, '0').replace(/[Il]/g, '1') : tok));

/** Likely odometer readings (3-7 digits), best guess first: just above the last known reading. */
export function odometerCandidates(text: string, ref: number): number[] {
  const toks = clean(text).match(/\d[\d,]*(\.\d+)?/g) || [];
  const set = new Set<number>();
  toks.forEach((t) => {
    const digits = t.split('.')[0].replace(/,/g, '');
    if (digits.length >= 3 && digits.length <= 7) set.add(parseInt(digits, 10));
  });
  const all = [...set];
  const near = all.filter((n) => n >= ref && n <= ref + 5000).sort((a, b) => a - b);
  const rest = all.filter((n) => !near.includes(n)).sort((a, b) => String(b).length - String(a).length || b - a);
  return [...near, ...rest].slice(0, 6);
}

/** Numbers on a pump display or bill (rate, litres, amount); decimals first. */
export function amountCandidates(text: string): number[] {
  const toks = clean(text).match(/\d[\d,]*(\.\d{1,3})?/g) || [];
  const seen = new Set<number>();
  const list: { n: number; dec: boolean }[] = [];
  toks.forEach((t) => {
    const n = parseFloat(t.replace(/,/g, ''));
    if (n > 0 && n < 100000 && !seen.has(n)) { seen.add(n); list.push({ n, dec: t.includes('.') }); }
  });
  return list.sort((a, b) => Number(b.dec) - Number(a.dec)).map((x) => x.n).slice(0, 8);
}
