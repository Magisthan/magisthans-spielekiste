# Discovery navigation rollback snapshot

Created before implementing the post-spin browse controls on 2026-10-07.

## Workspace state

The Git worktree was already heavily modified before this feature started. It
contained staged, unstaged, added and deleted files, including the ongoing
viewer redesign, localization work, new game pages and texture assets. Those
changes belong to the user and are deliberately not included in this rollback.

## Files captured

- `retro-discovery/js/app.js`
- `retro-discovery/js/navigation.js`
- `retro-discovery/js/slotrenderer.js`
- `retro-discovery/css/carousel.css`
- `retro-discovery/css/responsive.css`
- `assets/js/i18n/ui.de.js`
- `assets/js/i18n/ui.en.js`
- `scripts/validate-retro-viewer-redesign.js`

Each path below this directory contains an exact copy of the working-tree file
as it existed immediately before the discovery-navigation implementation.

## Rollback scope

When requested, restore only the files listed above from this directory. Do not
use `git reset`, `git checkout` or a repository-wide restore because that would
discard unrelated user work.

## Feature scope after this snapshot

- post-spin previous/next arrow controls;
- clickable visible neighbour covers;
- shuffled discovery deck anchored on the random winner;
- cover preloading and one-slot movement;
- viewer, LCD and accessibility synchronization;
- responsive desktop, tablet and mobile presentation;
- localized labels and regression tests.

New files created by the feature and therefore to delete during a rollback:

- `scripts/test-discovery-navigation.js`

## Implementation record

The feature changes are limited to the captured files plus the new test above.
They keep the complete filtered archive in the animated spin and create a
winner-centred, fixed five-game browse group only after the reel has stopped.
The complete eligible pool is freshly shuffled before every spin, after the
fair winner has already been selected.
The changes also add post-spin arrow controls,
clickable neighbouring covers, one-slot animated movement, prioritized cover
preloading, viewer/LCD synchronization, DE/EN accessibility labels and
responsive desktop/tablet/mobile styles. Both arrows cycle continuously inside
the fixed group; a new spin is required to discover another set of games.

Validation completed after implementation:

- JavaScript syntax checks: passed
- `scripts/test-discovery-navigation.js`: passed
- `scripts/test-retro-reactions.js`: passed
- `scripts/validate-retro-viewer-redesign.js`: passed with 0 errors
- `git diff --check` for the feature files: passed
