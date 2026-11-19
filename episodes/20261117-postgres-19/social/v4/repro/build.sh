#!/bin/bash
set -e
S=$(cd "$(dirname "$0")" && pwd)
export PATH=/opt/homebrew/opt/bison/bin:/opt/homebrew/opt/flex/bin:$PATH
for tag in REL_18_7 REL_19_RC2; do
  [ -x $S/inst-$tag/bin/pg_upgrade ] && continue
  rm -rf $S/src-$tag; mkdir -p $S/src-$tag
  git -C ~/github/postgres archive $tag | tar -x -C $S/src-$tag
  cd $S/src-$tag
  meson setup build --prefix=$S/inst-$tag -Dicu=disabled -Dreadline=disabled -Dzlib=disabled -Dssl=none -Dnls=disabled -Dtap_tests=disabled -Dplperl=disabled -Dplpython=disabled -Dpltcl=disabled -Dlz4=disabled -Dzstd=disabled -Dlibxml=disabled -Dlibxslt=disabled -Dgssapi=disabled -Dldap=disabled >/dev/null
  ninja -C build -j6 install >/dev/null
  echo "built $tag: $($S/inst-$tag/bin/postgres --version)"
done
