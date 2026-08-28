# Maestro Claude Marketplace

[marketplace.json](marketplace.json) publishes this repo as a Claude Code plugin marketplace. Any repo in the org can pull the shared rules, agents, and skills from it instead of copying `.claude/` directories around and watching them drift.

The plugins themselves live in [../claude-plugins/](../claude-plugins/).

## Connecting a repo

Add both keys to the consuming repo's `.claude/settings.json`. `extraKnownMarketplaces` tells Claude Code where to fetch from; `enabledPlugins` turns individual plugins on.

```json
{
  "enabledPlugins": {
    "rules-code@maestro": true,
    "rules-git@maestro": true
  },
  "extraKnownMarketplaces": {
    "maestro": {
      "source": {
        "source": "github",
        "repo": "lessthan3/roku-shared-tools"
      }
    }
  }
}
```

Commit that file and every clone of the repo picks the plugins up on the next session. Restart Claude Code after editing it — settings are read at session start.

### How the names line up

The key in `extraKnownMarketplaces` (`maestro`) must match the `name` field in [marketplace.json](marketplace.json), and every entry in `enabledPlugins` is `<plugin>@<marketplace>` pointing back at it. The plugin half must match a `name` in [marketplace.json](marketplace.json)'s `plugins` array — `rules-code`, not `@maestro/rules-code` and not the directory path.

`repo` is the GitHub `owner/name`, not a URL. Private repos resolve through whatever credentials your `gh` CLI or git already has.

The marketplace is named `maestro`; the repo that ships it is `lessthan3/roku-shared-tools`. Those differing on purpose is fine — `repo` locates the source, the key names the marketplace — but the key and the `name` field must never drift apart, or the `@maestro` suffix on every `enabledPlugins` entry has nothing to resolve against.

### Where to put it

| File | Scope | Use for |
| --- | --- | --- |
| `.claude/settings.json` | committed, whole team | the repo's baseline — what everyone should have |
| `.claude/settings.local.json` | gitignored, you only | trying a plugin out before committing it for the team |
| `~/.claude/settings.json` | you, every repo | plugins you want everywhere regardless of project |

Prefer the committed file for anything that encodes a team convention. A rule only half the team has is worse than no rule, because reviews start disagreeing about it.

You can also add a marketplace interactively with `/plugin` in a session, which writes the same keys for you.

## Available plugins

| Plugin | Provides | Effect |
| --- | --- | --- |
| `rules-code` | `rules/`, `agents/` | Injects coding guidelines — formatting, legibility, principles, planning, docs, testing — at session start |
| `rules-git` | `rules/` | Injects commit and PR conventions at session start |
| `response-style-direct` | `rules/` | Injects reply-style rules at session start |
| `org-audit` | `skills/org-wide-audit` | Model-invoked skill for auditing a feature across every repo under `projects/` |

The three `rules-*` plugins are always-on: a `SessionStart` hook `cat`s their markdown into context every session. `org-audit` is a skill, so it costs nothing until a prompt matches its description and Claude loads it.

`org-audit` only does useful work from a checkout of this repo, since it reads the submodules under [../projects/](../projects/). Enabling it elsewhere is harmless but pointless.

## Verifying it worked

Run `/plugin` in the consuming repo and confirm the marketplace is listed and the plugins show as enabled. For the `rules-*` plugins, a fresh session should already have the rules in context — ask Claude what coding rules it is operating under. For `org-audit`, `/help` should list the skill.

If nothing loads, check in this order: the marketplace key matches on both sides, the plugin name matches `marketplace.json`, the repo is reachable, and the session has actually been restarted.

## Changing a plugin

Consumers track this repo's default branch, so a merge to `main` reaches everyone on their next session — there is no version pin in the config above. That makes edits to `claude-plugins/` org-wide changes, so treat them as such.

Bump the `version` in `marketplace.json`, the plugin's `.claude-plugin/plugin.json`, and its `package.json` together. They are currently kept in lockstep so a single number identifies what a repo is running.

To test a change before pushing it, point a marketplace at your working copy instead of GitHub:

```json
{
  "extraKnownMarketplaces": {
    "maestro-dev": {
      "source": {
        "source": "directory",
        "path": "/absolute/path/to/roku-shared-tools"
      }
    }
  }
}
```

Put that in `.claude/settings.local.json` so it stays out of the team's config, and give it a distinct key so it does not collide with the published marketplace.

## Adding a plugin

1. Create `claude-plugins/<name>/` with `.claude-plugin/plugin.json` and `package.json`.
2. Add whatever it ships — `rules/`, `agents/`, `skills/`, `hooks/hooks.json`.
3. Register it in the `plugins` array in [marketplace.json](marketplace.json) with a `name`, a `source` path, and a `description`.

The `description` is what people read in `/plugin` when deciding whether to enable it, so write it for that moment rather than as a summary of the directory.
