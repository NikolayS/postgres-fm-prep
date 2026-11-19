# Episode 197 thumbnails (1280x720). Title: "Postgres 19: favorite features and upgrade traps".
# The thumbnail asks; the title answers. Three co-hosts in balanced tiles: Nik, Michael, Kirk.
import subprocess,os
opts={
 'a':'<div class="l l1">POSTGRES 19:</div><div class="l l2"><span class="o">UPGRADE NOW?</span></div>',
 'b':'<div class="l l1">WHAT BREAKS</div><div class="l l2"><span class="o">ON 19?</span></div><div class="chip">pg_upgrade --check said OK</div>',
 'c':'<div class="l l1">DON\'T WAIT</div><div class="l l2">FOR <span class="o">19.1</span></div>',
}
css='''@font-face{font-family:Imp;src:url(file:///System/Library/Fonts/Supplemental/Impact.ttf)}
html,body{margin:0;width:1280px;height:720px;background:#111013;overflow:hidden}
.l{position:absolute;left:44px;font-family:Imp;font-size:158px;line-height:1;letter-spacing:0.5px;white-space:nowrap;color:#f5f3ee}
.l1{top:26px}.l2{top:190px}
.o{color:#ff7a1a}
.chip{position:absolute;right:40px;top:232px;font:600 34px Menlo,monospace;color:#111013;background:#f5f3ee;padding:12px 20px;border-radius:8px}
.tile{position:absolute;top:388px;width:384px;height:300px;border:6px solid #f5f3ee;background:#000}
.tile img{display:block;width:384px;height:300px}
.t1{left:22px}.t2{left:442px}.t3{left:862px}
'''
chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
for k,body in opts.items():
    open(f'thumb-{k}.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}<div class="tile t1"><img src="nik-t.png"></div><div class="tile t2"><img src="mic-t.png"></div><div class="tile t3"><img src="kirk-t.png"></div></body></html>')
    subprocess.run([chrome,'--headless=new','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1280,720',f'--screenshot={os.getcwd()}/thumb-{k}.png',f'file://{os.getcwd()}/thumb-{k}.html'],capture_output=True)
