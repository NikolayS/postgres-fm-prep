# Drive a real interactive psql 18 session through a pty; write the raw transcript.
import os, pty, sys, time, select
STMTS = [
 "create table t1 (id int, name text, status text);",
 "insert into t1 values (1,'Nik','on air'), (2,'Kirk','on air'), (3,'Michael','vacation');",
 "select * from t1;",
 "select t1 from t1;",
 "select array(select t1 from t1);",
 "select t1 from unnest(array(select t1 from t1)) t1;",
 "select (t1).* from unnest(array(select t1 from t1)) t1;",
]
pid, fd = pty.fork()
if pid == 0:
    os.execvp("docker", ["docker", "exec", "-it", "-e", "PAGER=", "-e", "COLUMNS=200", "ep196pg18", "psql", "-U", "postgres", "-X"])
buf = b""
def drain(t=1.5):
    global buf
    end = time.time() + t
    while time.time() < end:
        r, _, _ = select.select([fd], [], [], 0.1)
        if r:
            try: buf += os.read(fd, 65536)
            except OSError: return
drain(2.5)
for s in STMTS:
    os.write(fd, s.encode() + b"\r"); drain(1.5)
os.write(fd, b"\\q\r"); drain(1.0)
open(sys.argv[1], "wb").write(buf)
