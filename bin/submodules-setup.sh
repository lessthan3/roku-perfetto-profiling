#!/usr/bin/env bash
set -e

bin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$bin_dir/lib/git.sh"

if git submodule status | grep -q '^-'; then
  git \
    -c core.protectNTFS=false \
    -c core.longpaths=true \
    submodule update --init --depth=1

  git.protectNTFS_all
fi

git.checkout_branches
