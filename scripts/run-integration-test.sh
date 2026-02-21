#!/bin/bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
echo "CWD: $(pwd)"
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:54320/chefiapp_core" \
  npx jest tests/integration/plpgsql-core-rpcs.test.ts --no-cache --forceExit 2>&1
echo "EXIT_CODE: $?"
