#!/bin/sh
# CEN429 — Week 2 — Demo 3: access matrix and model simulator (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# A simulator; it never touches a real file or a system setting.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/access" ] || { echo "Build first: ../../build.sh"; exit 1; }
E="$B/access"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 0 - Pure DAC (access control matrix): the owner's permission decides"
echo "  Scenario: mobile payment app + security library"
"$E" policy-matrix.txt
echo "   ^ app READ payment_key: not in the matrix -> DENY (least privilege)"

line; echo "STEP 1 - Bell-LaPadula (CONFIDENTIALITY): no read up, no write down"
"$E" policy-confidentiality.txt
echo "   ^ clerk READ operation: reading up -> DENY (cannot see secret information)"
echo "     general WRITE notice: writing down -> DENY (a leak is prevented)"

line; echo "STEP 2 - Biba (INTEGRITY): no read down, no write up"
"$E" policy-integrity.txt
echo "   ^ listener WRITE record: writing up -> DENY (dirty data must not corrupt clean data)"
echo "     processor READ incoming: reading down -> DENY (don't trust untrusted input)"

line; echo "STEP 3 - BLP categories: level alone is not enough, you also need the compartment"
"$E" policy-category.txt
echo "   ^ general READ asia_note: level is high enough but no ASIA category -> DENY"
echo "     analyst WRITE joint_archive: the object dominates the subject -> ALLOW"

line; echo "STEP 4 - Biba low-water-mark: reading lowers the level"
"$E" policy-lwm.txt
echo "   ^ the same request (processor WRITE record) is ALLOW first, DENY once incoming has been read"

line; echo "STEP 5 - Chinese Wall: a wall between conflicting companies"
"$E" policy-chinese-wall.txt
echo "   ^ the decision depends on history: once BankA is read, BankB is closed off"

line; echo "Result: BLP protects confidentiality, Biba protects integrity; their directions are opposite."
echo "DAC is the permission the owner grants; MAC (BLP/Biba) is the system-wide limit on top of it."
