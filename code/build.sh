#!/bin/sh
# CEN429 — builds every demo on Linux/WSL. Usage: ./build.sh   (to clean up: ./build.sh clean)
# CMake 3.16 or later is enough (including Ubuntu 20.04's apt version); no preset is required.
set -eu
cd "$(dirname "$0")"
if [ "${1:-}" = "clean" ]; then
    rm -rf build
    find . -type d \( -name bin -o -name dokum -o -name dump \) -prune -exec rm -rf {} +
    echo "Cleaned."
    exit 0
fi
command -v cmake >/dev/null || { echo "cmake is required: sudo apt install cmake build-essential"; exit 1; }
cmake -S . -B build/linux-gcc -DCMAKE_BUILD_TYPE=Debug > /dev/null
cmake --build build/linux-gcc -- -j"$(nproc 2>/dev/null || echo 2)"
echo "Build complete: binaries are in each demo's bin/linux/ folder."
