"""Read-only metadata and aggregate audit through the already-authenticated Supabase CLI.
Saves reviewed metadata and aggregate counts, never individual application records.
Only the checked-in SELECT queries are intended for this audit; the prefix check
is a misuse guard, not a general SQL safety validator.
Usage: python3 capture_backend_query.py query.sql output-name
"""
from pathlib import Path
import sys,subprocess,json,re,datetime
ROOT=Path(__file__).resolve().parents[1]
query=Path(sys.argv[1]); name=sys.argv[2]
sql=query.read_text().strip()
if not sql.upper().startswith('SELECT '):
    raise SystemExit('Only reviewed SELECT metadata/aggregate queries are accepted.')
project=(ROOT.parents[1]/'supabase/.temp/project-ref').read_text().strip()
if project!='pexviywnztvqomfosvho':
    raise SystemExit('Unexpected linked project.')
p=subprocess.run(['supabase','db','query','--linked','--file',str(query.resolve()),'-o','json'],cwd=ROOT.parents[1],capture_output=True,text=True,timeout=90)
if p.returncode:
    print(json.dumps({'query':name,'exit':p.returncode,'error':p.stderr[-2000:]}));sys.exit(p.returncode)
data=json.loads(p.stdout)
rows=data.get('rows',data) if isinstance(data,dict) else data
redactions=0
def clean(value):
    global redactions
    if isinstance(value,dict):return {k:clean(v) for k,v in value.items()}
    if isinstance(value,list):return [clean(v) for v in value]
    if not isinstance(value,str):return value
    for pattern in [r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',r'(?i)(?<=bearer )[A-Za-z0-9_.=-]+',r'\b(?:sk-[A-Za-z0-9_-]{12,}|sb_secret_[A-Za-z0-9_-]+|sbp_[A-Za-z0-9_-]+|re_[A-Za-z0-9]{20,})',r'(?i)(postgres(?:ql)?://)[^\s\'\"]+',r'-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----']:
        value,n=re.subn(pattern,'[REDACTED_SECRET]',value);redactions+=n
    return value
rows=clean(rows)
result={'project_ref':project,'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Supabase CLI linked SELECT metadata and aggregate counts; no individual application records','query':query.name,'redactions':redactions,'rows':rows}
out=ROOT/'evidence/live-backend'/f'{name}.json';out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'saved':str(out),'rows':len(rows),'redactions':redactions,'bytes':out.stat().st_size}))
