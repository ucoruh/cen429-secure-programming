#!/bin/sh
# CEN429 - Week 6 - Demo 6: Component/package signature verification (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/signature" ] || { echo "Build first: ../../build.sh"; exit 1; }
rm -rf output && mkdir -p output
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Create a sample 'plugin module' file"
printf 'VERSION=1.0\nPAYMENT-MODULE\nprivilege=approve' > output/module.dat
echo "module.dat content:"; sed 's/^/   /' output/module.dat; echo

line; echo "STEP 2 - At build time the module is signed (detached HMAC signature)"
"$B/signature" generate output/module.dat output/module.sig

line; echo "STEP 3 - Verify before loading (module unchanged): HOLDS"
"$B/signature" verify output/module.dat output/module.sig && echo "   (exit code 0 - held)"

line; echo "STEP 4 - Attack: the module is REPACKAGED (one byte appended)"
printf 'X' >> output/module.dat
echo "> appended 'X' to the end of module.dat"
"$B/signature" verify output/module.dat output/module.sig \
    || echo "   (exit code 3 - repackaging DETECTED)"

line
echo "Note: APK v2/v3 uses a PUBLIC-KEY (asymmetric) signature; the verifier only"
echo "needs the public key. Here we use shared-key HMAC for teaching; asymmetric"
echo "signing comes in Week 10. Same principle: integrity + provenance before loading."
