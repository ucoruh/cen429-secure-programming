#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 10: revocation checking -- a local, in-memory simulation of a Certificate
# Revocation List (CRL, part of X.509/RFC 5280) and of the Online Certificate Status Protocol (OCSP,
# RFC 2560, 1999). No network call is made anywhere in this file; both "servers" are plain Python
# objects.
import time


class CertificateAuthority:
    """Tracks which serial numbers it has issued and, separately, which it has revoked -- the data a
    real CA publishes as a CRL, and answers live over OCSP."""

    def __init__(self, now=None):
        self._now = now if now is not None else time.time()
        self.issued = {}     # serial -> {"not_after": epoch}
        self.revoked = {}    # serial -> {"revoked_at": epoch, "reason": str}

    def issue(self, serial, validity_days=365):
        self.issued[serial] = {"not_after": self._now + validity_days * 86400}

    def revoke(self, serial, reason="unspecified", at=None):
        if serial not in self.issued:
            raise KeyError("cannot revoke a serial that was never issued: %r" % serial)
        self.revoked[serial] = {"revoked_at": at if at is not None else self._now, "reason": reason}

    # -- CRL: a signed, timestamped SNAPSHOT the CA publishes periodically ---------------------------
    def publish_crl(self, validity_hours=24):
        """Returns a CRL: a dict with thisUpdate/nextUpdate and the list of (serial, reason) revoked
        as of "now". A real CRL is signed by the CA; the signature itself is Demo 1/2's job -- this
        object represents only the CONTENT a client would check after verifying that signature."""
        return {
            "this_update": self._now,
            "next_update": self._now + validity_hours * 3600,
            "revoked": dict(self.revoked),
        }

    # -- OCSP: a LIVE, single-serial query answered on demand (RFC 2560, 1999) -----------------------
    def ocsp_query(self, serial):
        """Returns "good", "revoked" or "unknown" (the three RFC 2560 CertStatus values) as of RIGHT
        NOW -- unlike a CRL, an OCSP responder is always asked about one specific certificate and
        answers with its current knowledge, not a snapshot that might be hours old."""
        if serial not in self.issued:
            return "unknown"
        if serial in self.revoked:
            return "revoked"
        return "good"


def crl_check(serial, crl, at_time):
    """Checks a certificate against an ALREADY-DOWNLOADED CRL. Returns one of "good", "revoked" or
    "stale" -- a CRL whose nextUpdate has passed must NOT be silently trusted as still "good": that is
    exactly the mistake that lets a revocation go unnoticed if a client caches an old CRL forever."""
    if at_time > crl["next_update"]:
        return "stale"
    return "revoked" if serial in crl["revoked"] else "good"


def demo():
    now = 1_700_000_000.0  # a fixed timestamp, so this demo's output is reproducible
    ca = CertificateAuthority(now=now)

    ca.issue(1001, validity_days=365)
    ca.issue(1002, validity_days=365)
    ca.issue(1003, validity_days=365)
    print("CA issues certificates with serials 1001, 1002, 1003")

    print("\n-- before any revocation --")
    for s in (1001, 1002, 1003):
        print("  serial %d: OCSP says %r" % (s, ca.ocsp_query(s)))

    print("\n-- serial 1002 is compromised and revoked --")
    ca.revoke(1002, reason="keyCompromise")
    for s in (1001, 1002, 1003):
        print("  serial %d: OCSP says %r" % (s, ca.ocsp_query(s)))
    print("  serial 9999 (never issued): OCSP says %r" % ca.ocsp_query(9999))

    print("\n-- a CRL published right after the revocation --")
    crl = ca.publish_crl(validity_hours=24)
    print("  thisUpdate=%.0f nextUpdate=%.0f revoked=%s" %
          (crl["this_update"], crl["next_update"], list(crl["revoked"].keys())))
    for s in (1001, 1002):
        print("  crl_check(%d) at publish time ->" % s, crl_check(s, crl, at_time=now))

    print("\n-- the SAME CRL, checked long after nextUpdate has passed --")
    later = crl["next_update"] + 3600  # one hour past the CRL's own validity window
    for s in (1001, 1002):
        print("  crl_check(%d) at a STALE time  ->" % s, crl_check(s, crl, at_time=later),
              "(a stale CRL is not proof of anything -- a client must fetch a fresh one, or ask OCSP)")

    print("\n-- OCSP after the same revocation, queried live (no staleness question at all) --")
    print("  ocsp_query(1002) ->", ca.ocsp_query(1002))
    print("  This is the CRL/OCSP trade-off: a CRL can be cached and checked offline but goes stale; "
          "OCSP is always current but needs a live round trip to the CA (or a cached, CA-SIGNED "
          "response -- 'OCSP stapling' -- attached by the server itself, avoiding the client-to-CA call).")


if __name__ == "__main__":
    demo()
