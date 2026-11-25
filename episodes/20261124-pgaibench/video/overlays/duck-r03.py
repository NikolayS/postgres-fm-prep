# r03 (S13): the typing sound sits 12 dB lower under Kirk's punchline "I'll make a note not to do that again."
# compose.ts ignores sfx gain and sets each file's loudest 400 ms to one level, so the duck is baked into one
# file that holds both typed lines: line 1 at 0, line 2 at +1.82 s, -12 dB from the punchline on.
import json, subprocess, sys
R = '/Users/nik/Documents/Zoom/2026-11-24 10.37.15 .fm recording/review/overlays/out-v2'
mf = sys.argv[1]  # manifest-v5-sfx.json
m = json.load(open(f'{R}/{mf}'))
o = next(x for x in m['overlays'] if x['id'] == 'r03-backup-chat')
a, b = o['sfx'][0], o['sfx'][1]
punch = float(sys.argv[2])  # seconds from the overlay start where "I'll" starts
d = b['at'] - a['at']; k = punch - b['at']
out = 'sfx/typing-r03-duck.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f"{R}/{a['file']}", '-i', f"{R}/{b['file']}", '-filter_complex',
  f"[1:a]volume='if(lt(t,{k-0.08:.2f}),1,if(lt(t,{k:.2f}),1-0.749*(t-{k-0.08:.2f})/0.08,0.251))':eval=frame,adelay={int(d*1000)}:all=1[b];[0:a][b]amix=inputs=2:normalize=0:duration=longest",
  f'{R}/{out}'], check=True)
o['sfx'] = [{'file': out, 'at': a['at'], 'gain': 1, 'note': f'two typing lines in one file; -12 dB from {punch} s under Kirk\'s punchline'}]
json.dump(m, open(f'{R}/{mf}', 'w'), indent=2)
print('r03 typing ducked from', punch)
