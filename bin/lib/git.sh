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

  # core.protectNTFS=false lets checkout proceed even for paths Windows can't
  # represent (e.g. a dir named "Misc." — trailing dots/spaces get silently
  # stripped by the Win32 API). That produces a mangled on-disk name that no
  # longer matches the index, so git.protectNTFS cleans it up below.
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

  git.protectNTFS "$dest"
}

# Windows can't check out paths with a trailing "." or " " in any component
# (e.g. "Misc.") — the OS silently strips it, leaving a mangled dir that
# perpetually shows as modified/deleted since it no longer matches the index.
# Exclude those exact paths via sparse-checkout and remove the mangled leftovers.
function git.protectNTFS() {
  local dest="$1" gitdir badpaths mangled out part

  # only Windows mangles these paths — no-op everywhere else
  [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* || "$OSTYPE" == win32* ]] || return 0

  gitdir=$(git -C "$dest" rev-parse --git-dir) || return 0

  # find tracked paths with a component ending in "." or " "
  badpaths=$(git -C "$dest" ls-tree -r --name-only HEAD | grep -E '(^|/)[^/]*[. ](/|$)' || true)
  [ -z "$badpaths" ] && return 0

  echo "setup: $dest has paths Windows can't check out — excluding via sparse-checkout:" >&2
  echo "  ${badpaths//$'\n'/$'\n'  }" >&2

  # tell git to never check these exact paths out
  git -C "$dest" sparse-checkout init --no-cone
  { echo '/*'; echo "!/${badpaths//$'\n'/$'\n'!/}"; } > "$gitdir/info/sparse-checkout"

  git -C "$dest" sparse-checkout reapply

  # delete any leftover dir Windows already wrote under the stripped name
  while IFS= read -r path; do
    out=""

    IFS='/' read -ra parts <<< "$path"
    for part in "${parts[@]}"; do

      # mirror what Windows does: strip trailing dots/spaces from each segment
      while [[ "$part" == *. || "$part" == *' ' ]]; do
        part="${part%.}"; part="${part% }"
      done

      out+="$part/"
    done

    mangled="$dest/${out%/}"
    if [ -e "$mangled" ]; then rm -rf -- "$mangled"; fi
  done <<< "$badpaths"
}

# Fetch and check out each submodule's tracked branch (from .gitmodules).
# Submodules are normally left in detached HEAD at a pinned commit —
# this puts them back on the branch listed for local development.
function git.protectNTFS_all() {
  # shellcheck disable=SC2016
  git submodule foreach --quiet 'echo "$sm_path"' | while IFS= read -r path; do
    git.protectNTFS "$path"
  done
}

function git.checkout_branches() {
  # shellcheck disable=SC2016 # $vars expand inside the per-submodule subshell foreach spawns, not here
  git submodule foreach --quiet '
    branch=$(git config -f "$toplevel/.gitmodules" "submodule.$name.branch")
    [ -z "$branch" ] && branch=main
    git fetch origin "$branch"
    git checkout -B "$branch" "origin/$branch"
  '

  git.protectNTFS_all
}
