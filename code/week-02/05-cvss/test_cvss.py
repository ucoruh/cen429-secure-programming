#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 — Hafta 2 — Demo 5 dogrulama: FIRST v3.1 belgesindeki puanlar
import sys
import cvss

BEKLENEN = {
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H": 9.8,
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H": 10.0,
    "CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N": 2.0,
    "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H": 7.8,
    "CVSS:3.1/AV:P/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N": 4.2,
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N": 7.5,  # Heartbleed CVE-2014-0160
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N": 6.1,  # tipik XSS
    "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H": 6.5,  # yetkiyle DoS
}


def main():
    hata = 0
    for v, b in BEKLENEN.items():
        p = cvss.taban_puan(cvss.ayristir(v))[0]
        ok = abs(p - b) < 1e-9
        hata += 0 if ok else 1
        print("  %-45s beklenen=%.1f hesap=%.1f  %s" %
              (v.split("/", 1)[1], b, p, "OK" if ok else "HATA"))
    print("  ---")
    print("  %s" % ("TUM TESTLER GECTI" if hata == 0 else "%d TEST BASARISIZ" % hata))
    return 1 if hata else 0


if __name__ == "__main__":
    sys.exit(main())
