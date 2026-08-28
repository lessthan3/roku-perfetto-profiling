# Formatting

## Code

### When to Split a Function

Same dual trigger as files: **length or scope, and neither is subordinate to the other.** A 20-line function doing three things is as much a candidate as a 200-line one. Length is the trigger people notice; scope is the one that actually degrades code, because a short dense function looks fine in review.

#### Function Scope

A function covers more than one scope if any of these hold:

- Its body does more than one of **find the thing**, **decide about it**, **act on it**.
- Describing it needs "and", or a comma-spliced list.
- Two or more `continue` / `return` / `break` guards sit inside one loop body. Each guard encodes a separate rule about what qualifies; together they are a predicate wearing a disguise.
- Nesting reaches two levels and the inner level filters before acting.
- A line needs a comment to explain *why it is that way*. Extract it and let the function name carry the why.

The rewrite is always the same shape: name each part after the **decision it makes**, not the mechanics it performs. `isOwnProperty` over `hasOwn`, `bindableMethod` over `getMethod`. A well-named extraction turns a guard into a sentence and deletes the comment that would have explained it.

Guards simple enough that a predicate function would be overkill stay inline — see [Naming inline guard conditions](code-legibility.md#naming-inline-guard-conditions).

#### Function Length

- **Sweet spot: under 50 lines.** Not a firm number, and never a defence against the scope trigger.

### Comment placement

A comment explaining a subtlety belongs on the line that implements it. A sibling `.md` carries rationale for a reader who wants depth — it does not excuse an unexplained line in the source.

## Files

### When to Split

Split a file out into its own cluster member when **either** trigger fires — length or scope. Neither is subordinate to the other; a short file covering two scopes is as much a candidate as a long one covering a single scope.

#### File Scope

- A file is too broad if it covers more than one distinct scope. As with functions, if you can split its purpose using the word "and," it needs to be broken into separate files.
  - e.g. a config builder that resolves the target file *and* writes key/values *and* writes comments is three files, whatever its line count.
- Split on the seam the file already shows — the grouping its own section headers or import clusters imply.

#### File Length

- **Sweet spot: 150-400 lines.** This range keeps modules highly focused on a single responsibility.
- **Soft limit: 500 lines.** Exceeding 500 lines is a strong signal that a file should be refactored or split.
- **Hard Limit: 1000 lines.** Files larger than 1,000 lines significantly hurt readability, slow down git diff reviews, and increase merge conflicts

Landing in the sweet spot is not a defense against the scope trigger — a focused 200-line file is fine, a 200-line file doing three things is not.

### File Collocation

- Group files into clusters by scope/purpose.
  - A cluster of files should be isolated in their own subfolder.
  - Standard naming convention for this pattern is `<cluster>.<scope>.<ext>` where `<cluster>` matches a folder
    - e.g. `graph.routes.js`, `graph.db.js`
- When a cluster grows too large, or has more than one responsibility, it should be broken-down into sub-clusters.
  - Once a directory's files split into clearly distinct groups (e.g. db-graph's editor side vs its viewer side), each group gets its own subdirectory (`db-graph/editor/`, `db-graph/viewer/`), not files dangling at the parent cluster's root next to each other.
