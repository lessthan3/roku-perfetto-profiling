#!/usr/bin/env bash

bin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$bin_dir/setup-helpers.sh"

git.submodule.add maestrokit-crossplatform-testing main
git.submodule.add maestro-web-sdk main
git.submodule.add maestro-roku-sdk develop
git.submodule.add maestro-android-sdk master
git.submodule.add maestro-swift-sdk develop
