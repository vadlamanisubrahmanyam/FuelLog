"""Set a strictly increasing versionCode (= GitHub run number) so each new APK upgrades the installed one."""
import json, os, sys
p = sys.argv[1]
run = int(os.environ.get('GITHUB_RUN_NUMBER', '1'))
d = json.load(open(p))
d['expo']['android']['versionCode'] = run
d['expo']['version'] = f'1.0.{run}'
json.dump(d, open(p, 'w'), indent=2)
print('versionCode', run)
