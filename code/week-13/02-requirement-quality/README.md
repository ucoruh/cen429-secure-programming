# Demo 2 — Requirement quality checker

**Topic:** Writing testable security requirements · **Week:** 13

## What it shows

The program checks a requirement sentence for two independent weaknesses:

1. **A vague word or phrase** ("should be secure", "properly", "sufficiently", "as required", ...) — text no
   two reviewers would verify the same way.
2. **No measurable basis** — no number (a length, a bit count, a time limit) and no concrete technical term
   (`AES`, `TLS 1.3`, `RELRO`, ...) that a test could check against.

A requirement with either weakness is printed as `WEAK` with the reason; a requirement with neither is `OK`.
The exit code equals the number of weak requirements.

## Running it

First build all demos once (inside `code/`): Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, in this folder:

```sh
bin/<platform>/requirement_quality                                  # five built-in sample sentences
bin/<platform>/requirement_quality "The session must expire after 15 minutes of inactivity."
```

## Why is it safe?

Plain text analysis only; no file, network or system operation.

## Try it yourself

1. Take one of the sample `WEAK` sentences and rewrite it so the checker reports `OK`. Then check whether your
   rewrite is *actually* testable, or only technically passes the checker (a number alone is not the same as a
   correct requirement — see week 13's "vague sentence to testable requirement" discussion).
2. Write a sentence that contains a number but is still nonsense as a requirement (e.g. "The button should be
   about 42 pixels nice"). The checker will call it `OK` — what does that tell you about the limits of an
   automated check like this one?
3. Add your own vague phrase or concrete term to the two lists at the top of the file and rebuild; confirm the
   checker's verdict changes for a sentence using it.
