#!/usr/bin/env bash

url="https://github.com/lessthan3"

function git.clone()  { git.pkg clone "$@"; }
function git.submodule.add()  { git.pkg submodule "$@"; }

function git.pkg()  {
  local mode name branch dest

  mode="$1"
  name="$2"
  branch="$3"
  dest="packages/$name"

  [ -e "$dest/.git/HEAD" ] && return 0

  # -c core.longpaths=true makes git use \\?\-prefixed paths, which avoids
  # Windows silently stripping trailing dots (e.g. ".../Misc.") — without it,
  # the stripped name collides with a sibling and checkout fails/prompts interactively.
  case "$mode" in
    clone)
      git \
        -c core.protectNTFS=false \
        -c core.longpaths=true \
        clone -b "$branch" --single-branch --depth=1 \
        "$url/$name.git" "$dest"
      ;;
    submodule)
      git \
        -c core.protectNTFS=false \
        -c core.longpaths=true \
        submodule add --force \
        --name "$name" \
        -b "$branch" \
        "$url/$name.git" "$dest"
      ;;
    *)
      echo "git.pkg: unknown mode '$mode'" >&2
      return 1
      ;;
  esac
}

git.submodule.add maestrokit-crossplatform-testing main
git.submodule.add maestro-web-sdk main
git.submodule.add maestro-roku-sdk develop
git.submodule.add maestro-android-sdk master
git.submodule.add maestro-swift-sdk develop
