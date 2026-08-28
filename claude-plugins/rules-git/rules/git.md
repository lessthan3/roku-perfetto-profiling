# Using Git

## Naming Pull Requests & Commits

- Pull request names and commit messages should both follow the format:
  - `[type] [description] [ticket?]`

### `[description]`

- One-line summary, less than 50 characters.
  - use precise, descriptive language.
- If more context about a decision or change should be recorded, then it should be documented in the codebase itself. Not secreted away in commit messages.

### `[ticket?]`

- Optional
- Typically aligns with a ticket name in the branch, if present.

### `[type]`

| Type       | Description                                                            |
| ---------- | ---------------------------------------------------------------------- |
| `feat`     | New feature                                                            |
| `fix`      | Bug patch or hotfix                                                    |
| `docs`     | Documentation updates only (e.g., Markdown files)                      |
| `style`    | Formatting, white-space, or missing semi-colons (no logic changes)     |
| `refactor` | Code changes that neither fix bugs nor add features                    |
| `perf`     | Logic alterations specifically targeted at improving performance       |
| `test`     | Adding missing unit tests or correcting existing test suites           |
| `chore`    | Maintenance tasks, build configurations, or package dependency updates |

## Pull Requests

- PRs should generally follow the same format as [@git.PR-template.md](git.PR-template.md)

### Size and Scope

- **Single Responsibility.** Ideally, each PR should do exactly one thing.
  - Minimizes the risk of unintended consequences.
  - Makes it easier for reviewers to understand and test the code.

- **Draft PRs.** If a larger PR is necessary, opening work-in-progress code as a 'draft' gives reviewers more time to follow the changes.

The single most critical variable impacting code review quality is the physical size of the changes introduced.

| Lines Changed | Review Quality  | Typical Review Time | Action Required                  |
| ------------- | --------------- | ------------------- | -------------------------------- |
| 1–100         | High            | 15–30 mins          | Ideal target size                |
| 100–300       | Good            | 30–60 mins          | Acceptable for complex features  |
| 300–500       | Declining       | 1–3 hours           | Ask author to consider splitting |
| 500+          | Poor (skimming) | Days                | Split into stacked PRs           |
