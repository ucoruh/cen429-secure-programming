# Demo 1 — Compliance matrix validator (S17)

**Topic:** Requirement-to-evidence traceability, an evaluator's reading of a compliance matrix · **Week:** 13

## What it shows

The program reads requirement rows in the form `ID|STATUS|SECTION|EVIDENCE` (`STATUS` is `met`, `delegated` or
`not-met`) and applies the same three rules an external evaluator applies to a submitted compliance matrix:

| Row looks like | Evaluator's reading | This program's verdict |
| --- | --- | --- |
| `met` with a filled `EVIDENCE` field | A concrete artefact backs the claim | `[OK]` |
| `met` with an **empty** `EVIDENCE` field | An unproven claim — counts as **not met** | `[FINDING]` |
| `delegated` with a filled `EVIDENCE` field | Who/why/how is documented (e.g. "the platform vendor signs updates") | `[OK]` |
| `delegated` with an **empty** `EVIDENCE` field | A silent hand-off with no accountable owner | `[FINDING]` |
| `not-met` | An honestly recorded gap | `[RISK]` (informational, not a finding by itself) |
| anything else in `STATUS` | Not one of the three allowed words | `[FINDING]` |

The exit code equals the number of findings — 0 means the matrix would pass this first, mechanical pass of an
evaluator's review (a human still checks whether the *evidence text itself* is convincing).

## Running it

First build all demos once (inside `code/`): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, in this folder:

```sh
bin/<platform>/compliance_matrix                        # built-in sample matrix (one finding by design)
bin/<platform>/compliance_matrix my-requirements.txt     # your own file, one row per line
```

## Why is it safe?

The program only **reads** the text file named on the command line (or an embedded sample when none is given);
it performs no write, network or system operation.

## Try it yourself

1. Add a `met` row with a one-word `EVIDENCE` field like `ok`. Does it pass? (Yes — the checker only looks for
   *some* text, not whether the text is a real artefact reference. That gap is exactly why a human still reviews
   the matrix; see week 13's requirement-block pattern for what a real evidence field should name.)
2. Change the sample's `CEN429-AS-05` row's `STATUS` from `not-met` to `met` without adding evidence. Compare the
   finding count before and after.
3. Add a row whose `STATUS` is misspelled (e.g. `carsilandi`). Confirm it is reported as an unknown status, not
   silently treated as `met`.
