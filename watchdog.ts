// watchdog.ts <stallSec> -- cmd args...  Runs cmd; if the whole process tree uses no CPU for stallSec, kills it and exits 124.
// Why: ffmpeg 8.0.1 deadlocked once in sch_wait (all threads idle) during the final compose (2026-10-23, 6 h lost).
const i = Bun.argv.indexOf('--');
const stall = Number(Bun.argv[2]);
const cmd = Bun.argv.slice(i + 1);
const p = Bun.spawn(cmd, {stdout: 'inherit', stderr: 'inherit', stdin: 'ignore'});
const tree = (): number[] => {
  const rows = Bun.spawnSync(['ps', '-ax', '-o', 'pid=,ppid=']).stdout.toString().trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
  const out = [p.pid];
  for (let k = 0; k < out.length; k++) for (const [pid, pp] of rows) if (pp === out[k]) out.push(pid);
  return out;
};
const cpu = (pids: number[]) => {
  const t = Bun.spawnSync(['ps', '-o', 'time=', '-p', pids.join(',')]).stdout.toString().trim().split('\n');
  return t.reduce((s, x) => { const [m, sec] = x.trim().split(':'); return s + Number(m) * 60 + Number(sec || 0); }, 0);
};
let last = -1, since = Date.now();
const timer = setInterval(() => {
  const c = cpu(tree());
  if (c > last + 0.5) { last = c; since = Date.now(); return; }
  if (Date.now() - since > stall * 1000) {
    console.error(`watchdog: no CPU use for ${stall} s; killing ${cmd[0]} tree (${tree().join(' ')})`);
    for (const pid of tree().reverse()) try { process.kill(pid, 'SIGKILL'); } catch {}
    process.exit(124);
  }
}, 15000);
const code = await p.exited;
clearInterval(timer);
process.exit(code);
