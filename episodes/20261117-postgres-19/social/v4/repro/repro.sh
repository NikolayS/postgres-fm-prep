#!/bin/bash
# ep197 upgrade trap repro: Postgres 18.7 -> 19 RC2 (both built from the git tags REL_18_7, REL_19_RC2).
# For each case: fresh 18.7 cluster, one setting, the two find queries, pg_upgrade --check, pg_upgrade.
#   ./repro.sh <dir-with-inst-REL_18_7-and-inst-REL_19_RC2>   (writes all output to stdout)
set -u
S=${1:-$(cd "$(dirname "$0")" && pwd)}
OLD=$S/inst-REL_18_7/bin NEW=$S/inst-REL_19_RC2/bin W=$S/work
K=$(mktemp -d /private/tmp/ep197k.XXXX) # short Unix socket dir (macOS limit 103 bytes)
Q1="select coalesce(r.rolname, '-') as role, coalesce(d.datname, '-') as database, s.setconfig
from pg_db_role_setting s left join pg_roles r on r.oid = s.setrole left join pg_database d on d.oid = s.setdatabase
where s.setconfig::text ~ 'standard_conforming_strings|escape_string_warning';"
Q2="select oid::regprocedure as function, proconfig from pg_proc
where proconfig::text ~ 'standard_conforming_strings|escape_string_warning';"
Q3="select parname, paracl from pg_parameter_acl where parname in ('standard_conforming_strings', 'escape_string_warning');"
echo "old: $($OLD/postgres --version)"; echo "new: $($NEW/postgres --version)"
run_case() { # name, sql
  local name=$1 sql=$2
  echo; echo "=================== case: $name"; echo "SQL on 18.7: $sql"
  rm -rf $W; mkdir -p $W; cd $W
  $OLD/initdb -U postgres -D old --no-locale -E UTF8 -A trust >/dev/null
  $NEW/initdb -U postgres -D new --no-locale -E UTF8 -A trust >/dev/null
  $OLD/pg_ctl -D old -o "-p 55418 -k $K" -l old.log -w start >/dev/null
  $OLD/psql -X -q -h $K -p 55418 -U postgres -d postgres -c "create role app login" -c "create database appdb" 2>&1
  [ -n "$sql" ] && $OLD/psql -X -q -h $K -p 55418 -U postgres -d appdb -c "$sql" 2>&1
  echo "--- find query 1 (role and database settings):"; $OLD/psql -X -h $K -p 55418 -U postgres -d appdb -c "$Q1"
  echo "--- find query 2 (function settings):"; $OLD/psql -X -h $K -p 55418 -U postgres -d appdb -c "$Q2"
  echo "--- find query 3 (grants on the parameters):"; $OLD/psql -X -h $K -p 55418 -U postgres -d appdb -c "$Q3"
  $OLD/pg_ctl -D old -m fast -w stop >/dev/null
  echo "--- pg_upgrade --check:"
  $NEW/pg_upgrade -b $OLD -B $NEW -d old -D new -U postgres -p 55418 -P 55419 -s $K --check > check.out 2>&1; local rc=$?
  grep -E "Clusters are compatible|fatal|FATAL|error|Failure" check.out | sed 's/^/    /'; echo "    exit code: $rc"
  echo "--- pg_upgrade:"
  $NEW/pg_upgrade -b $OLD -B $NEW -d old -D new -U postgres -p 55418 -P 55419 -s $K > up.out 2>&1; rc=$?
  grep -E "Upgrade Complete|fatal|FATAL|failure|Failure|error" up.out | sed 's/^/    /'; echo "    exit code: $rc"
  if [ $rc -ne 0 ]; then
    echo "    restore error from the pg_upgrade logs:"
    grep -rh -B1 -A2 -E "ERROR|FATAL" new/pg_upgrade_output.d/*/log/*.log 2>/dev/null | head -12 | sed 's/^/      /'
  else
    $NEW/pg_ctl -D new -o "-p 55419 -k $K" -l new.log -w start >/dev/null
    echo "    after the upgrade, on 19 (connect as app to appdb):"
    $NEW/psql -X -h $K -p 55419 -U app -d appdb -Atc "select 'connected; standard_conforming_strings = ' || current_setting('standard_conforming_strings')" 2>&1 | sed 's/^/      /'
    $NEW/pg_ctl -D new -m fast -w stop >/dev/null
  fi
}
run_case "control: no setting" ""
run_case "role: standard_conforming_strings = off" "alter role app set standard_conforming_strings = off"
run_case "role: escape_string_warning = off" "alter role app set escape_string_warning = off"
run_case "database: standard_conforming_strings = off" "alter database appdb set standard_conforming_strings = off"
run_case "database: escape_string_warning = on" "alter database appdb set escape_string_warning = on"
run_case "function: standard_conforming_strings = off" "create function f() returns int language sql set standard_conforming_strings = off return 1"
run_case "function: escape_string_warning = off" "create function f() returns int language sql set escape_string_warning = off return 1"
run_case "role: standard_conforming_strings = on (allowed value)" "alter role app set standard_conforming_strings = on"
run_case "grant: set on parameter escape_string_warning" "grant set on parameter escape_string_warning to app"
rm -rf $W $K
