# Demo 10 — Revocation: CRL and OCSP

**Topic:** What happens after a certificate is issued but needs to stop being trusted · **Week:** 10 ·
**Standards:** X.509 CRLs (RFC 5280), OCSP (RFC 2560, 1999)

## What it shows

`revocation.py` simulates a CA tracking issued and revoked serial numbers, then answers the same
question two ways: **OCSP** (`ocsp_query`) is a live, single-certificate lookup that is always current;
a **CRL** (`publish_crl` + `crl_check`) is a signed snapshot a client can cache and check offline, but
which goes **stale** once its own `nextUpdate` passes — and `crl_check` reports `"stale"` rather than
silently treating an old snapshot as still trustworthy, even for a certificate that the CA has, by now,
actually revoked.

## Running it

```sh
sh demo.sh          # or: python revocation.py
```

## Why it's safe

Pure Python, no files, no network — both "servers" are plain in-process objects with a fixed clock.

## Try it yourself

1. Revoke a certificate, then check it against a CRL that was published **before** the revocation —
   why does the CRL still say "good", and what does that mean for how often a client must refresh it?
2. "OCSP stapling" lets a *server* attach a recent, CA-signed OCSP response to its own handshake, so
   clients don't have to contact the CA themselves — sketch what object in this file would play the
   role of that staple.
