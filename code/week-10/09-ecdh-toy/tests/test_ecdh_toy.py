#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 9 unit tests: point addition and ECDH on a tiny curve. The independent
# reference is a completely different algorithm -- REPEATED ONE-AT-A-TIME ADDITION (k applications of
# point_add) -- checked against scalar_mult()'s double-and-add, never a value copied from a prior run.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import ecdh_toy as ec  # noqa: E402

failed = 0


def check(label, cond):
    global failed
    print("  %-70s %s" % (label, "OK" if cond else "FAIL"))
    if not cond:
        failed += 1


def repeated_add(k, point):
    """Independent of scalar_mult(): adds `point` to itself k times, one at a time (no doubling)."""
    result = None
    for _ in range(k):
        result = ec.point_add(result, point)
    return result


def main():
    G = ec.find_generator()
    check("find_generator() returns a point that is actually on the curve", ec.on_curve(G))
    check("the point at infinity (None) counts as on the curve (it is the group identity)",
          ec.on_curve(None))

    # --- point-at-infinity identity laws -------------------------------------------------------------
    check("P + infinity == P", ec.point_add(G, None) == G)
    check("infinity + P == P", ec.point_add(None, G) == G)
    check("infinity + infinity == infinity", ec.point_add(None, None) is None)

    # --- every point produced by addition/doubling stays on the curve (closure) ---------------------
    pts = [G]
    for _ in range(30):
        pts.append(ec.point_add(pts[-1], G))
    check("every point in G, 2G, 3G, ... 31G stays on the curve (group closure)",
          all(ec.on_curve(pt) for pt in pts))

    # --- commutativity and a basic associativity check --------------------------------------------
    H = pts[5]
    check("point_add is commutative: P + Q == Q + P", ec.point_add(G, H) == ec.point_add(H, G))
    check("(G + G) + H == G + (G + H) (associativity, one concrete case)",
          ec.point_add(ec.point_add(G, G), H) == ec.point_add(G, ec.point_add(G, H)))

    # --- scalar_mult (double-and-add) matches repeated_add (a DIFFERENT algorithm) for many k -------
    for k in list(range(0, 25)) + [30, 33, 40]:
        check("scalar_mult(%d, G) matches repeated one-at-a-time addition" % k,
              ec.scalar_mult(k, G) == repeated_add(k, G))

    check("scalar_mult(0, G) is the point at infinity", ec.scalar_mult(0, G) is None)
    check("scalar_mult(1, G) == G", ec.scalar_mult(1, G) == G)

    # --- P + (-P) == infinity: find -P as the point with the same x, negated y ----------------------
    x, y = G
    neg_G = (x, (-y) % ec.P)
    check("G's negation is on the curve too", ec.on_curve(neg_G))
    check("G + (-G) == the point at infinity", ec.point_add(G, neg_G) is None)

    # --- ECDH: for MANY random private scalar pairs, both sides land on the same shared point -------
    import random
    rng = random.Random(99)
    agreements = 0
    for _ in range(60):
        a = rng.randint(2, 200)
        b = rng.randint(2, 200)
        A_pub = ec.scalar_mult(a, G)
        B_pub = ec.scalar_mult(b, G)
        shared_a = ec.scalar_mult(a, B_pub)
        shared_b = ec.scalar_mult(b, A_pub)
        if shared_a == shared_b:
            agreements += 1
    check("all 60 random ECDH exchanges agree on the same shared point", agreements == 60)

    # --- ECDH public values are points genuinely on the curve (not e.g. accidentally None/garbage) --
    check("a freshly computed ECDH public value is on the curve",
          ec.on_curve(ec.scalar_mult(rng.randint(2, 200), G)))

    print("  ---")
    if failed:
        print("  %d TEST(S) FAILED" % failed)
        return 1
    print("  ALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
