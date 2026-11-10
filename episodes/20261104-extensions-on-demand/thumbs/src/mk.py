import sys
opts={
 'a':('<div class="l l1">FAT IMAGE <span class="sm">or</span></div><div class="l l2">LAYERS?</div>'),
 'b':('<div class="l l1 big"><span class="o">2</span><sup class="o">220</sup> IMAGES?</div><div class="l l3">220 extensions, every mix</div>'),
 'c':('<div class="l l1">ADD AN EXTENSION,</div><div class="l l2">RESTART?</div>'),
}
css='''@font-face{font-family:Imp;src:url(file:///System/Library/Fonts/Supplemental/Impact.ttf)}
html,body{margin:0;width:1280px;height:720px;background:#111013;overflow:hidden}
.l{position:absolute;left:46px;font-family:Imp;line-height:1;letter-spacing:0.5px;white-space:nowrap}
.l1{top:34px;font-size:158px;color:#f5f3ee}.l1 .sm{font-size:100px;color:#8a8a90;margin-left:10px}
.l2{top:196px;font-size:158px;color:#ff7a1a}
.big{top:44px;font-size:214px;color:#f5f3ee}.big sup{font-size:104px;vertical-align:0;position:relative;top:-92px;margin-left:4px;margin-right:0}
.o{color:#ff7a1a}
.l3{top:272px;font-size:72px;color:#8a8a90}
.tile{position:absolute;top:380px;width:376px;height:300px;border:6px solid #f5f3ee;background:#000}
.tile img{display:block;width:376px;height:300px}
.t1{left:40px}.t2{left:452px;border-color:#ff7a1a}.t3{left:864px}
'''
for k,body in opts.items():
    open(f'thumb-{k}.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}<div class="tile t1"><img src="kirk-t.png"></div><div class="tile t2"><img src="alv-t.png"></div><div class="tile t3"><img src="nik-t.png"></div></body></html>')
