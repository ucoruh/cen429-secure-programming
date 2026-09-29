# Demo 1 — Certificate chain: root, intermediate, server

**Topic:** X.509 certificate chain validation (path building) · **Week:** 10 ·
**Standards:** X.509 (ITU-T X.509, 1988), RFC 5280 (Internet PKI profile)

## What it shows

`demo.sh` builds a three-level PKI with OpenSSL entirely inside a temporary folder — a root CA, an
intermediate CA it signs, and a server certificate the intermediate signs — then asks `openssl verify`
the same four questions a browser or an application asks about any certificate chain:

| Step | Question asked | Result |
| --- | --- | --- |
| 4 | Missing intermediate: does the chain reach a trusted root at all? | REJECTED — "unable to get local issuer" |
| 5 | With the intermediate supplied: complete chain? | OK |
| 6 | Validity dates: is it still within `notBefore`/`notAfter`? (checked with `-attime`, no system clock change) | REJECTED — expired |
| 7 | Trust anchor: does it chain to *this* root, or just *some* root? | REJECTED — wrong CA |
| 8 | `basicConstraints`: may this issuer sign other certificates at all? | REJECTED — issuer has `CA:FALSE` |
| 9 | Name: does the certificate's `subjectAltName` match the name being connected to? (an application-level check, not part of the chain check itself) | OK for the right name, REJECTED for the wrong one |

## Running it

```sh
sh demo.sh        # openssl required (1.1.1+ or 3.x); on Windows run this from Git Bash
```

## Why it's safe

- Everything happens inside a `pki/` folder created by the script itself, deleted again at the end.
- No certificate is installed anywhere on the system; no network connection is made; no `sudo`/admin
  rights are used.

## Try it yourself

1. Skip Step 3's `subjectAltName` line and re-run: Step 9's hostname check now fails even for the
   right name — the certificate never claimed that name in the first place.
2. Change Step 2's `pathlen:0` to `pathlen:1` and add one more intermediate level of your own: which
   step would first catch an issuer trying to exceed the path length it was given?
3. `openssl verify` never asked *who* issued the root certificate — because the root is the trust
   anchor by definition (**Try it**: `openssl x509 -in pki/root.crt -noout -issuer -subject` before the
   script cleans up, by removing the last `rm -rf "$W"` line temporarily).
