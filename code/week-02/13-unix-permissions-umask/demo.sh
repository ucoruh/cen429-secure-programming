#!/bin/sh
# CEN429 — Week 2 — Demo 13: Unix permissions, umask, and setuid (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Only produces files under output/; no sudo is needed, no real setuid binary
# is created. Any setuid programs on the system are only LISTED (read-only).
cd "$(dirname "$0")" || exit 1
B=bin/linux
[ -x "$B/permissions" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

# Does the filesystem keep Unix permissions? (it may not under /mnt/c)
mkdir -p output
: > output/.probe
chmod 600 output/.probe
if [ "$(stat -c %a output/.probe)" != "600" ]; then
    echo "WARNING: this filesystem does not preserve Unix permissions (e.g. /mnt/c)."
    echo "Copy the repository into WSL under ~ and run it there instead."
fi
rm -f output/.probe

line; echo "STEP 1 - Simulation: the permission algorithm, umask, setuid, the sticky bit"
"$B/permissions" sim

line; echo "STEP 2 - The same rules on the real kernel (under output/)"
"$B/permissions" real

line; echo "STEP 3 - POSIX ACLs: once three classes aren't enough (Recipe 2.1+)"
if command -v setfacl >/dev/null 2>&1; then
    : > output/acl.txt
    chmod 640 output/acl.txt
    echo "\$ setfacl -m u:nobody:r output/acl.txt   # a named user"
    if setfacl -m u:nobody:r output/acl.txt 2>/dev/null; then
        ls -l output/acl.txt | awk '{print "  " $1, $NF}'
        getfacl -c output/acl.txt 2>/dev/null | sed 's/^/  /'
        echo "\$ setfacl -m m::- output/acl.txt        # the mask: shrink everything"
        setfacl -m m::- output/acl.txt
        getfacl -c output/acl.txt 2>/dev/null | sed 's/^/  /'
        echo "   ^ the mask is the UPPER BOUND on named entries and the group;"
        echo "     '#effective' is what right actually applies."
        setfacl -b output/acl.txt
    else
        echo "  (this filesystem does not support POSIX ACLs)"
    fi
else
    echo "  (setfacl is not installed; to install it: sudo apt install acl)"
fi

line; echo "STEP 4 - setuid programs on the system (listing only)"
echo "\$ ls -l /usr/bin/passwd"
ls -l /usr/bin/passwd 2>/dev/null | awk '{print "  " $1, $3, $4, $NF}'
echo "\$ find /usr/bin -maxdepth 1 -perm -4000 | wc -l"
echo "  $(find /usr/bin -maxdepth 1 -perm -4000 2>/dev/null | wc -l) setuid program(s)"
echo "   ^ the 's' bit: the program runs with its OWNER's (root) identity. Each"
echo "     one is an attack surface; use a capability instead of adding a new one."

line; echo "Cleanup: deleting the output/ folder"
rm -rf output
echo "Result: permissions are checked against the first matching class; umask"
echo "only shrinks at creation time; in setuid, don't forget the saved UID; an"
echo "open descriptor is a capability; ACLs and capabilities give finer control."
