#!/bin/sh
# CEN429 — Week 2 — Demo 09: worm outbreak simulation (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# The program only computes; it connects to no network and produces no file.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/outbreak" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "Comparing three spreading strategies with the SI model"
"$B/outbreak"
line
echo "Note: the real Slammer slowed down after the first minute because it"
echo "saturated NETWORK BANDWIDTH (not because it ran out of susceptible machines)."
