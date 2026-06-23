/* TooToo — production config (used by `assemble.ps1 -Prod`).

   Intentionally empty. Canonical index.html stays byte-identical across every fork;
   each repo customizes via its own tootoo.config.js (window.TOOTOO_CONFIG), merged
   over the CONFIG defaults at init.

   The dev build uses config.js instead, which bakes a default repo + dev identity so
   the standalone assembled file is testable without a tootoo.config.js sibling or a
   .git/config to detect. */
