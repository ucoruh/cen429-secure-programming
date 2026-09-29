# Demo 2 — Digital signature: sign, verify, tamper

**Topic:** Digital signatures and their verification pitfalls · **Week:** 10 ·
**Algorithm:** ECDSA over P-256 (`prime256v1`), SHA-256 — chosen for this demo because
`openssl dgst -sign`/`-verify` support it identically on both OpenSSL 1.1.1 and 3.x

## What it shows

`demo.sh` generates a real key pair, signs a small "update file" and then verifies it under six
scenarios:

| Step | Scenario | Result |
| --- | --- | --- |
| 3 | The real message, the real signature, the real public key | VALID |
| 4 | One byte of the message changed after signing | REJECTED |
| 5 | An **older** message, but its **own** valid signature (a downgrade/replay) | VALID — the signature alone says nothing about version order |
| 6 | A message signed by an **attacker's** key, verified against the **attacker's own** public key | "VALID" — a signature only means something once you know *whose* key it is |
| 6 | The same attacker message, verified against the **real** publisher's key | REJECTED |

## Running it

```sh
sh demo.sh        # openssl required (1.1.1+ or 3.x); on Windows run this from Git Bash
```

## Why it's safe

- Every key and file lives inside a `sig/` folder created by the script itself, deleted again at the
  end. No network connection is made; no key is installed anywhere.

## Try it yourself

1. Step 5 shows why version numbers must be **inside** the signed content: try moving `version=` out of
   `update.bin` into a separate, unsigned field, and see that an attacker could now attach any old
   signed body to any version number they like.
2. Step 6 is the whole reason certificate chains exist (Demo 1): a bare public key has to come from
   *somewhere* trustworthy, or "verifies against key X" tells you nothing about who X belongs to.
3. In C, `EVP_DigestVerify()` returns `1` for a valid signature and `0` or a negative value otherwise;
   write a two-line reproduction of the `if (EVP_DigestVerify(...))` bug this demo's pitfalls list
   warns about, and show which negative return value it would wrongly accept.
