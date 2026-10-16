import json, pathlib, urllib.request, hashlib, subprocess, concurrent.futures, time, argparse
parser=argparse.ArgumentParser(description='Reproduce the dated CC BY-SA video pack; normal development uses content:videos and needs no ffmpeg.')
parser.add_argument('--ffmpeg', required=True, help='Path to FFmpeg 7.1 with libx264/libwebp')
parser.add_argument('--source-cache', type=pathlib.Path)
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[2]
ffmpeg=args.ffmpeg
data=json.loads((root/'content/upstream/wger/video-snapshot.json').read_text())
review=json.loads((root/'content/upstream/wger/media-review.json').read_text())
data['records']=[v for v in data['records'] if str(v['exerciseId']) not in review['excluded']]
cache=args.source_cache or root/'artifacts/video-sources';cache.mkdir(parents=True, exist_ok=True)
out=root/'content/exercise-videos';out.mkdir(exist_ok=True)
def convert(v):
 src=cache/(v['videoUuid']+'.mov')
 if not src.exists():
  for retry in range(3):
   try:
    urllib.request.urlretrieve(v['sourceMediaUrl'], str(src)+'.part');pathlib.Path(str(src)+'.part').rename(src);break
   except Exception:
    if retry==2: raise
    time.sleep(2)
 raw=src.read_bytes()
 if len(raw)!=v['bytes']:raise ValueError('source size changed '+str(v['videoId']))
 digest=hashlib.sha256(raw).hexdigest()
 key='wger-'+v['videoUuid']+'-'+digest[:8]
 trim=review['trimStartSeconds'].get(str(v['exerciseId']),0)
 key += '-r1'
 dest=out/(key+'.mp4');poster=out/(key+'.webp')
 if not dest.exists():
  subprocess.run([ffmpeg,'-v','error','-y','-ss',str(trim),'-i',str(src),'-map_metadata','-1','-vf',"scale=640:640:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1",'-an','-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart','-threads','2',str(dest)],check=True)
 if not poster.exists(): subprocess.run([ffmpeg,'-v','error','-y','-ss',str((v['durationSeconds']-trim)*.5),'-i',str(dest),'-frames:v','1',str(poster)],check=True)
 item={'id':key,'exerciseId':'wger-'+str(v['exerciseId']),'name':v['englishName'],'source':v,'sourceSha256':digest,'license':'CC-BY-SA-4.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/','creator':'Goulart','modified':True,'changes':f'Converted to H.264 MP4, maximum 640px, muted. Leading {trim} seconds of camera setup removed. Midpoint WebP poster extracted; no synthesized motion.', 'trimStartSeconds':trim,'video':{'path':'/v1/catalog/exercise-videos/'+key+'.mp4','mime':'video/mp4','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size},'poster':{'path':'/v1/catalog/exercise-videos/'+key+'.webp','mime':'image/webp','sha256':hashlib.sha256(poster.read_bytes()).hexdigest(),'bytes':poster.stat().st_size}}
 (cache/(key+'.json')).write_text(json.dumps(item))
 print(v['englishName'],dest.stat().st_size,flush=True)
 return item
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: items=list(pool.map(convert,data['records']))
manifest={'schema':1,'version':'wger-20260923-v1','source':'https://wger.de/api/v2/','items':items}
manifest_path=root/'content/exercise-videos.json'
serialized=json.dumps(manifest,indent=2)+'\n'
if manifest_path.exists() and manifest_path.read_text()!=serialized: raise ValueError('Immutable pack differs: review a new version instead of overwriting it.')
manifest_path.write_text(serialized)
print('COMPLETE',len(items),sum(i['video']['bytes']+i['poster']['bytes'] for i in items),flush=True)
