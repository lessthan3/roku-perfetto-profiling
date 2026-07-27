#!/usr/bin/env bash
set -e

bin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$bin_dir/lib/git.sh"

git.checkout_branches
