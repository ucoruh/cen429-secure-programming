# CEN429 - Week 3 - Demo 6: TLS verification and pinning (Windows)
# This demo only runs on Linux/WSL: a local TLS server needs OpenSSL
# (openssl s_server) and libssl. Run it through WSL on Windows.
Set-Location $PSScriptRoot
"=============================================================="
"Demo 6 (TLS verification + hostname + SPKI pinning) is a WSL/Linux demo."
"Windows may not have an OpenSSL client/server installed, so this demo"
"is only built and run inside WSL."
""
"To run it (in a WSL Ubuntu window):"
"   cd ~/<course-repo>/code"
"   ./build.sh"
"   cd week-03/06-tls-pinning"
"   sh demo.sh"
""
"The demo shows: an unverified TLS client accepts a fake certificate"
"(MITM); chain + hostname verification and SPKI pinning both REJECT the"
"same attack. Everything runs only on 127.0.0.1, with self-generated"
"certificates."
"=============================================================="
