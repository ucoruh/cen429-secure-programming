#!/bin/sh
# CEN429 - Week 6 - Demo 3: Environment (VM/emulator) + timing detection (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/environment" ] || { echo "Build first: ../../build.sh"; exit 1; }
"$B/environment"
echo "--------------------------------------------------------------"
echo "Try it: on bare-metal Linux the hypervisor bit is 'absent'; inside a VM"
echo "(VirtualBox/KVM/VMware) or WSL2 it comes out 'PRESENT' + a vendor signature."
echo "Same binary, different environment, different result: that is the essence"
echo "of environment detection."
