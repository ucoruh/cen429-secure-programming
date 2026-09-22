#!/bin/sh
# CEN429 — bütün demoları Linux/WSL'de derler. Kullanım: ./build.sh   (temizlemek için: ./build.sh temizle)
# CMake 3.16 ve üstü yeterlidir (Ubuntu 20.04'ün apt sürümü dahil); preset gerektirmez.
set -eu
cd "$(dirname "$0")"
if [ "${1:-}" = "temizle" ]; then
    rm -rf build
    find . -type d \( -name bin -o -name dokum \) -prune -exec rm -rf {} +
    echo "Temizlendi."
    exit 0
fi
command -v cmake >/dev/null || { echo "cmake gerekli: sudo apt install cmake build-essential"; exit 1; }
cmake -S . -B build/linux-gcc -DCMAKE_BUILD_TYPE=Debug > /dev/null
cmake --build build/linux-gcc -- -j"$(nproc 2>/dev/null || echo 2)"
echo "Derleme tamam: ikili dosyalar her demonun bin/linux/ klasöründe."
