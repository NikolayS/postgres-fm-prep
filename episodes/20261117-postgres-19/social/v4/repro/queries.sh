#!/bin/bash
# ep197: run the exact queries from the post on an 18.7 cluster with every trap case set at once.
set -u
S=${1:-$(cd "$(dirname "$0")" && pwd)}
OLD=$S/inst-REL_18_7/bin W=$S/qwork K=$(mktemp -d /private/tmp/ep197q.XXXX)
rm -rf $W; mkdir -p $W
$OLD/initdb -U postgres -D $W/d --no-locale -E UTF8 -A trust >/dev/null
$OLD/pg_ctl -D $W/d -o "-p 55420 -k $K" -l $W/log -w start >/dev/null
P="$OLD/psql -X -h $K -p 55420 -U postgres"
$P -d postgres -q -c "create role app login" -c "create role ok_role login" -c "create database appdb"
$P -d appdb -q -c "alter role app set standard_conforming_strings = off" \
  -c "alter role ok_role set standard_conforming_strings = on" \
  -c "alter database appdb set escape_string_warning = off" \
  -c "create function f(int) returns int language sql set standard_conforming_strings = off return 1" \
  -c "grant set on parameter escape_string_warning to app"
echo "--- 18.7, appdb:"
$P -d appdb -e -c "select * from pg_db_role_setting
where setconfig::text ~ 'standard_conforming_strings|escape_string_warning';" \
 -c "select oid::regprocedure from pg_proc
where proconfig::text ~ 'standard_conforming_strings|escape_string_warning';" \
 -c "select parname from pg_parameter_acl
where parname = 'escape_string_warning';"
$OLD/pg_ctl -D $W/d -m fast -w stop >/dev/null; rm -rf $W $K
