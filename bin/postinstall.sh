#!/usr/bin/env bash

[ -f .gitmodules ] && git submodule update --init

# after install, perform setup steps
cd maestro-crossplatform-testing || return 1

yarn install
yarn workspace @maestro-crossplatform/core build
