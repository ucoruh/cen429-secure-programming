# CEN429 Güvenli Programlama — bütün haftaların demoları
#
# Windows : Visual Studio 2022 Community ile "Klasör Aç" -> code/ -> üstten yapılandırma seç
#           ("Windows (MSVC)" ya da "WSL (GCC)") -> Derle > Tümünü Derle.
#           Komut satırı: .\build.ps1
# WSL/Linux: ./build.sh
cmake_minimum_required(VERSION 3.16...3.31)
project(cen429_demolar LANGUAGES C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

include(cmake/cen429.cmake)

# İçinde CMakeLists.txt bulunan her week-NN klasörü kendiliğinden eklenir.
# Yalnız bazı haftaları derlemek için:  cmake ... -DCEN429_HAFTALAR="week-01;week-03"
if(NOT DEFINED CEN429_HAFTALAR)
  file(GLOB CEN429_HAFTALAR RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}" "${CMAKE_CURRENT_SOURCE_DIR}/week-*")
  list(SORT CEN429_HAFTALAR)
endif()
foreach(_hafta IN LISTS CEN429_HAFTALAR)
  if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/${_hafta}/CMakeLists.txt")
    add_subdirectory(${_hafta})
  endif()
endforeach()
