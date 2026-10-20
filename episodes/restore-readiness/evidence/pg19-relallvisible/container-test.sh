#!/usr/bin/env bash
set -euxo pipefail
export PATH=/opt/pg19/bin:$PATH
export PGHOST=/tmp
export PGUSER=pgtest
export PGPORT=5432
initdb -D /home/pgtest/data --data-checksums --no-locale
cat >> /home/pgtest/data/postgresql.conf <<'EOF'
listen_addresses = ''
unix_socket_directories = '/tmp'
checkpoint_timeout = '1h'
max_wal_size = '1GB'
log_autovacuum_min_duration = 0
EOF
pg_ctl -D /home/pgtest/data -l /home/pgtest/server.log -w start
psql -X -d postgres -c "select version(); show debug_assertions; show autovacuum; show data_checksums;"
postgres --version
pg_dump --version
pg_restore --version
pg_config --configure
bash /tmp/reproduce.sh
for db in rvis_src rvis_imported rvis_zero; do
  psql -X -v ON_ERROR_STOP=1 "$db" -c "select current_database(), count(*), md5(string_agg(id::text || pad, ',' order by id)) from t; select relname, vacuum_count, analyze_count, autovacuum_count, autoanalyze_count from pg_stat_user_tables;"
done
