# Three YouTube thumbnails (1280x720): the thumbnail asks, the title answers.
opts={
 'a':'<div class="l l1">TEMP TABLES</div><div class="l l2"><span class="o">23x</span> SLOWER?</div>',
 'b':'<div class="l l1">5,000 IDLE</div><div class="l l2"><span class="o">SESSIONS?</span></div>',
 'c':'<div class="l l1">DON\'T USE</div><div class="l l2"><span class="o">TEMP TABLES?</span></div>',
}
css='''@font-face{font-family:Imp;src:url(file:///System/Library/Fonts/Supplemental/Impact.ttf)}
html,body{margin:0;width:1280px;height:720px;background:#111013;overflow:hidden}
.l{position:absolute;left:46px;font-family:Imp;line-height:1;letter-spacing:0.5px;white-space:nowrap}
.l1{top:30px;font-size:158px;color:#f5f3ee}
.l2{top:192px;font-size:158px;color:#f5f3ee}
.o{color:#ff7a1a}
.tile{position:absolute;top:376px;width:580px;height:316px;border:6px solid #f5f3ee;background:#000}
.tile img{display:block;width:580px;height:316px}
.t1{left:40px}.t2{left:648px}
'''
for k,body in opts.items():
    open(f'thumb-{k}.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}<div class="tile t1"><img src="nik-t.png"></div><div class="tile t2"><img src="kirk-t.png"></div></body></html>')
