# Extended Flatpack production migration rollback

This directory contains the exact workspace versions captured immediately
before the 2026-10-14 extended-flatpack production migration.

To roll back only this migration, copy the listed files from this directory
back to their matching repository paths. Do not replace unrelated files.

The backup preserves the user's already-modified workspace state; it is not a
Git baseline.

After restoring, run:

```text
node scripts/test-extended-flatpack.js
node scripts/validate-retro-viewer-redesign.js
```

The seven HTML pages that received a new `extended-flatpack-builder.js` script
tag are listed in `files.txt`; remove only that tag when rolling back those
pages. In `one_on_one_erving_vs_bird.html`, restore the original script order
from its backed-up copy.
