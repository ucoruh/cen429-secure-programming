# Demo 6 — Encrypt-then-MAC vs MAC-then-encrypt

**Topic:** Combining confidentiality and integrity, the order matters · **Week:** 10

## What it shows

`ordering.py` implements the same "encrypt with CBC, authenticate with HMAC" pair two ways:

| Construction | Receiver's steps | What a tampered ciphertext reveals |
| --- | --- | --- |
| Encrypt-then-MAC (EtM) | check MAC over ciphertext → only then decrypt+unpad | one outcome: **MAC invalid**, `cbc_decrypt`/`unpad` never run |
| MAC-then-encrypt (MtE) | decrypt+unpad → check MAC over the recovered plaintext | **two** distinguishable outcomes: `padding error` *or* `MAC invalid`, depending on which bytes were changed |

Both reject every tampered message the tests try — MtE is not "broken" here — but MtE's two different
failure reasons are exactly the shape Vaudenay's 2002 padding-oracle attack (Demo 4) exploits when an
attacker can submit many modified ciphertexts and observe which of the two failures comes back.

## Running it

```sh
sh demo.sh          # or: python ordering.py
```

## Why it's safe

Pure Python, no files, no network.

## Try it yourself

1. Make `mte_unprotect` catch **both** exceptions and re-raise a single generic one — does that alone
   fully close the gap, or does *when* each branch runs still leak information through timing?
2. TLS's older CBC cipher suites used MAC-then-encrypt; real attacks against it (e.g. Lucky 13, 2013)
   exploited exactly the timing difference this demo's two code paths would have if not written very
   carefully. Which modern TLS 1.3 cipher suites (Demo 3's GCM, for instance) avoid the question
   entirely by using an AEAD mode instead of gluing together separate encrypt and MAC primitives?
