"""Read-only inventory of tracked Rafik sources; never emits credential values.

Run from the API root: python3 docs/revival/tools/collect_inventory.py
Counts include generated source and comments; they are scope indicators, not quality scores.
"""
import collections
import json
from pathlib import Path
import re
import subprocess

API = Path(__file__).resolve().parents[3]
ROOTS = [API, API.parent / 'RAFIK-FRONTEND', API.parent / 'rafik-mobile', API.parent / 'rafik-worker']
result = {'method': 'git ls-files; line counts for .ts/.js/.vue/.dart/.sql; no dependency directories', 'repositories': []}
for root in ROOTS:
    files = subprocess.check_output(['git', '-C', str(root), 'ls-files'], text=True).splitlines()
    sources, accesses, tables, rpcs = [], [], collections.Counter(), collections.Counter()
    for name in files:
        p = root / name
        if p.suffix not in {'.ts', '.js', '.vue', '.dart', '.sql'} or not p.is_file() or 'node_modules' in p.parts:
            continue
        s = p.read_text(errors='replace')
        sources.append({'path': name, 'lines': len(s.splitlines())})
        if '.from(' in s or 'Table().' in s:
            accesses.append(name)
        tables.update(re.findall(r'\.from\([\'\"]([^\'\"]+)', s))
        rpcs.update(re.findall(r'\.rpc\([\'\"]([^\'\"]+)', s))
    result['repositories'].append({
        'repository': root.name,
        'head': subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip(),
        'source_files': len(sources), 'source_lines': sum(x['lines'] for x in sources),
        'largest_sources': sorted(sources, key=lambda x: x['lines'], reverse=True)[:10],
        'direct_service_access_files': len(accesses),
        'literal_from_targets_including_storage': dict(tables), 'literal_rpc_names': dict(rpcs),
        'tests': [f for f in files if re.search(r'(^test/|/(?:__tests__|e2e)/|\.(?:test|spec)\.[jt]sx?$)', f)],
        'ci_files': [f for f in files if f.startswith('.github/')],
        'sql_files': [f for f in files if f.endswith('.sql')],
        'credential_file_paths_only': [f for f in files if Path(f).name == '.env' or 'service-account' in f],
    })

def flatten(value, prefix=''):
    if isinstance(value, dict):
        for k, v in value.items():
            yield from flatten(v, prefix + '.' + k)
    else:
        yield prefix, value

web = ROOTS[1]
en = dict(flatten(json.loads((web / 'src/i18n/en.json').read_text())))
ar = dict(flatten(json.loads((web / 'src/i18n/ar.json').read_text())))
result['web_translation_keys'] = {
    'english_leaf_keys': len(en), 'arabic_leaf_keys': len(ar),
    'english_keys_without_arabic_match': len(en.keys() - ar.keys()),
    'arabic_keys_without_english_match': len(ar.keys() - en.keys()),
    'missing_arabic_examples': sorted(en.keys() - ar.keys())[:15],
    'caveat': 'Counts exact key paths, not untranslated visible strings or translation quality.',
}
print(json.dumps(result, indent=2))
