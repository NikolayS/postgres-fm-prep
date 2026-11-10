// watchdog.ts <stallSec> -- cmd args...  Runs cmd; if the whole process tree uses no CPU for stallSec, interrupts it
// (SIGINT, so ffmpeg finalizes the file), then kills what is left, and exits 124.
// Why: ffmpeg 8.0.1 deadlocked once in sch_wait (all threads idle) during the final compose (2026-10-23, 6 h lost), and twice at the
// crossfade into the outro video (2026-11-05, episode 195).
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
let last = -1, since = Date.now(), stalled = false;
const timer = setInterval(async () => {
  const c = cpu(tree());
  if (c > last + 0.5) { last = c; since = Date.now(); return; }
  if (Date.now() - since > stall * 1000) {
    clearInterval(timer);
    stalled = true;
    // SIGINT first: ffmpeg then writes the moov atom, so the frames encoded so far stay usable
    // (splice.ts --outro can finish a render that froze at the outro crossfade). SIGKILL after 60 s.
    const pids = tree();
    console.error(`watchdog: no CPU use for ${stall} s; interrupting ${cmd[0]} tree (${pids.join(' ')})`);
    for (const pid of [...pids].reverse()) try { process.kill(pid, 'SIGINT'); } catch {}
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline && tree().some((pid) => { try { process.kill(pid, 0); return true; } catch { return false; } })) await Bun.sleep(2000);
    for (const pid of tree().reverse()) try { process.kill(pid, 'SIGKILL'); } catch {}
    process.exit(124);
  }
}, 15000);
const code = await p.exited;
clearInterval(timer);
if (stalled) {
  console.error('watchdog: stopped. If the output mp4 opens, keep it: see "Fix a finished video" in SKILL.md (splice.ts).');
  process.exit(124);
}
process.exit(code);
