"""Patch the prebuild-generated android/app/build.gradle:
strip enableBundleCompression (removed in RN 0.76+, still emitted by the template).
Signing: the Expo template signs release builds with its fixed debug.keystore, identical on every
build, so APKs upgrade in place with no secrets or keystore to manage."""
import sys
path = sys.argv[1]
lines = [l for l in open(path).read().split('\n') if 'enableBundleCompression' not in l]
open(path, 'w').write('\n'.join(lines))
print('build.gradle patched')
