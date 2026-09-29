# Demo 6 — SBOM: software bill of materials (CycloneDX) and vulnerability matching

**Topic:** Dependency security, SBOM, known-vulnerable components (CWE-1104) ·
**Week:** 5 · **Book:** no direct recipe (external topic); Viega & Messier's "trust no
input" principle extends to dependencies too

## What it shows

The demo produces a **CycloneDX 1.5** JSON SBOM from its own **synthetic** jars
(`output/lib/`). For each component: **name, version, purl** (package URL) and
**SHA-256**. It then matches them against a small, **synthetic** "known vulnerable
versions" list and prints a warning for the affected components.

| Step | What happens |
| --- | --- |
| 1 | The jars in `lib/` are scanned; name/version/SHA-256 are extracted, the CycloneDX JSON is written |
| 2 | A **purl** in the form `pkg:maven/...@version` is generated for each component |
| 3 | Matched against the synthetic vulnerability list; two components get a warning |

**Why it matters:** an SBOM is a **machine-readable** answer to "which component, which
version, do I have?" When **Log4Shell** hit in 2021 (CVE-2021-44228, in Log4j 2.x),
teams with an SBOM answered "am I affected?" in **seconds**; teams without one spent
days scanning code by hand. This demo's `log-core` component is a synthetic stand-in
for that scenario (it is not the real Log4j).

## Running it

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

Only **Python 3** is needed. **No download required** (uses the built-in `zipfile`,
`hashlib`, `json`). No external tool (`cyclonedx-*`) is needed to generate CycloneDX
here; real projects use `cyclonedx-maven-plugin`, `syft` or `cdxgen`.

## Why it's safe

- Component names/versions and the vulnerability IDs are **entirely synthetic** (not a
  real library/CVE). The generated jars and SBOM live under `output/` (in `.gitignore`).
- No network is used; nothing on the system is touched. No local NVD/OSV database is
  downloaded.

## Try it yourself

1. Add a new component to `COMPONENTS` and to `VULNERABLE`. How do the SBOM and the
   warning change? Does the warning disappear once you bump the version to the
   "fixed_in" value?
2. Open the generated `output/sbom.cyclonedx.json`. Look at the `purl`, `hashes` and
   `metadata.component` fields. What is the core difference between SPDX and
   CycloneDX?
3. How would you generate an SBOM automatically in a real project? (Hint: a build
   pipeline step + a vulnerability scan; write this up in the term-project section.)
