#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 10 unit tests: CRL and OCSP revocation checking.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import revocation as rv  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def main():
    now = 1_700_000_000.0
    ca = rv.CertificateAuthority(now=now)
    ca.issue(1, validity_days=365)
    ca.issue(2, validity_days=365)
    ca.issue(3, validity_days=365)

    # --- OCSP: good / revoked / unknown, exactly the three RFC 2560 CertStatus values ----------------
    check("a freshly issued, never-revoked serial is 'good'", ca.ocsp_query(1) == "good")
    check("a never-issued serial is 'unknown'", ca.ocsp_query(9999) == "unknown")
    check("revoke() rejects a serial that was never issued",
          _raises(lambda: ca.revoke(9999)))

    ca.revoke(2, reason="keyCompromise")
    check("a revoked serial is 'revoked' via OCSP", ca.ocsp_query(2) == "revoked")
    check("an unrelated serial stays 'good' after another one is revoked", ca.ocsp_query(1) == "good")
    check("a revoked serial cannot go back to 'good'",
          ca.ocsp_query(2) == "revoked" and ca.ocsp_query(2) != "good")

    # --- revocation records the reason and a timestamp -----------------------------------------------
    check("the revocation reason is recorded", ca.revoked[2]["reason"] == "keyCompromise")
    check("the revocation timestamp defaults to the CA's 'now'", ca.revoked[2]["revoked_at"] == now)
    ca.revoke(3, reason="cessationOfOperation", at=now + 100)
    check("an explicit revocation timestamp is honored", ca.revoked[3]["revoked_at"] == now + 100)

    # --- CRL: a snapshot, checked at publish time ------------------------------------------------------
    crl = ca.publish_crl(validity_hours=24)
    check("the CRL lists exactly the currently-revoked serials", set(crl["revoked"].keys()) == {2, 3})
    check("crl_check reports 'good' for a non-revoked serial at publish time",
          rv.crl_check(1, crl, at_time=now) == "good")
    check("crl_check reports 'revoked' for a revoked serial at publish time",
          rv.crl_check(2, crl, at_time=now) == "revoked")
    check("nextUpdate is validity_hours after thisUpdate",
          crl["next_update"] - crl["this_update"] == 24 * 3600)

    # --- CRL: a serial revoked AFTER the CRL was published is NOT yet in that CRL --------------------
    ca.issue(4, validity_days=365)
    crl_before = ca.publish_crl(validity_hours=24)
    ca.revoke(4, reason="unspecified")
    check("a serial revoked after a CRL snapshot was taken is absent from that (now outdated) snapshot",
          4 not in crl_before["revoked"])
    check("but OCSP, queried live, already reports it revoked", ca.ocsp_query(4) == "revoked")

    # --- CRL: staleness must be checked, not silently ignored ----------------------------------------
    check("crl_check at publish time is not 'stale'", rv.crl_check(1, crl, at_time=crl["this_update"]) != "stale")
    check("crl_check exactly at nextUpdate is not yet stale",
          rv.crl_check(1, crl, at_time=crl["next_update"]) != "stale")
    check("crl_check one second past nextUpdate IS stale",
          rv.crl_check(1, crl, at_time=crl["next_update"] + 1) == "stale")
    check("a stale CRL says 'stale' even for a certificate that IS revoked "
          "(staleness is checked before the revoked-list lookup, so it can never be silently skipped)",
          rv.crl_check(2, crl, at_time=crl["next_update"] + 1) == "stale")

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


def _raises(fn):
    try:
        fn()
        return False
    except KeyError:
        return True


if __name__ == "__main__":
    sys.exit(main())
