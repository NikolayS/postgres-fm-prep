#!/usr/bin/env bash
# Run against a fresh PostgreSQL 19rc1 cluster as a superuser.
# Put that installation's bin directory on PATH; pg_visibility must be installed.
set -euo pipefail
createdb rvis_src
psql -X -v ON_ERROR_STOP=1 rvis_src <<'SQL'
create extension pg_visibility;
create table t (id integer, pad text) with (autovacuum_enabled = false);
insert into t
select g, repeat('x', 100)
from generate_series(1, 20000) g order by md5(g::text);
create index on t (id);
vacuum analyze t;
SQL
pg_dump -Fc --statistics rvis_src > rvis.dump
for db in rvis_imported rvis_zero; do
  createdb "$db"
  pg_restore --exit-on-error -d "$db" rvis.dump
done
psql -X -v ON_ERROR_STOP=1 rvis_zero <<'SQL'
select pg_restore_relation_stats(
  'schemaname', 'public', 'relname', 't', 'relallvisible', 0);
SQL
for db in rvis_imported rvis_zero; do
  psql -X -v ON_ERROR_STOP=1 "$db" <<'SQL'
select current_database(), relpages, reltuples, relallvisible,
       pg_relation_size('t') / 8192 as heap_pages, v.all_visible
from pg_class, pg_visibility_map_summary('t') v
where oid = 't'::regclass;
explain (analyze, buffers, timing off, summary off)
select id from t where id between 10001 and 11000;
select relallvisible, v.all_visible
from pg_class, pg_visibility_map_summary('t') v
where oid = 't'::regclass;
explain (analyze, buffers, timing off, summary off)
select id from t where id between 10001 and 11000;
SQL
done
