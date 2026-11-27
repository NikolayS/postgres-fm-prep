// Independently measure RMS dBFS (not LUFS differences) for voice/music/background per bite.
// Usage: bun check-audio.ts <v9 scratch dir> <final.mp4> <report.json> <WORK/v7/v8tmp>
import {join} from 'path';
const [dir, video, out, original] = Bun.argv.slice(2);
const bites = [[0,4.4,'Nik/GTA'],[4.4,7.56,'Michael/GTA-19'],[7.56,15.32,'Kirk/revert-CVEs'],[15.32,19.64,'Nik/NOTIFY'],[19.64,21.72,'Michael/no-go-years'],[21.72,24.95,'Kirk/decades'],[24.95,28.84,'Nik/DDL'],[28.84,31.64,'Nik/Postgres-20'],[31.64,34.24,'Michael/small-thing']] as const;
function ff(args: string[]) { const p=Bun.spawnSync(['ffmpeg','-nostdin','-nostats',...args],{maxBuffer:20e6});if(p.exitCode)throw Error(p.stderr.toString());return p.stderr.toString(); }
function rms(file:string,a:number,b:number) {const s=ff(['-i',file,'-af',`atrim=${a}:${b},volumedetect`,'-f','null','-']);return Number(s.match(/mean_volume: ([-\d.]+)/)![1]);}
const rows=bites.map(([a,b,bite])=>{const start=8.4375+a,end=8.4375+b,voice=rms(join(dir,'voice.wav'),start,end),music=rms(join(original,'music.wav'),start,end),bg=rms(join(original,'bg.wav'),start,end);return {bite,start,end,voice,music,background:bg,voiceMusicDB:+(voice-music).toFixed(1),voiceBackgroundDB:+(voice-bg).toFixed(1)};});
const log=ff(['-i',video,'-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-']);
const loudness=JSON.parse(log.slice(log.lastIndexOf('{'),log.lastIndexOf('}')+1));
const pass=rows.every(r=>r.voiceMusicDB>=10 && r.voiceBackgroundDB>=10) && Math.abs(Number(loudness.input_i)+16)<=0.2 && Number(loudness.input_tp)<=-1.5;
await Bun.write(out,JSON.stringify({rows,loudness,pass},null,2)+'\n');console.table(rows);console.log(loudness, {pass});process.exit(pass?0:1);
