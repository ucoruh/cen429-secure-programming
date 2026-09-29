# CEN429 Secure Programming — every week's demos
#
# Windows : open Visual Studio 2022 Community with "Open Folder" -> code/ -> pick a configuration at
#           the top ("Windows (MSVC)" or "WSL (GCC)") -> Build > Build All.
#           Command line: .\build.ps1
# WSL/Linux: ./build.sh
cmake_minimum_required(VERSION 3.16...3.31)
project(cen429_demos LANGUAGES C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

include(cmake/cen429.cmake)
enable_testing()

# Every week-NN folder that contains a CMakeLists.txt is added automatically.
# To build only some weeks:  cmake ... -DCEN429_WEEKS="week-01;week-03"
if(NOT DEFINED CEN429_WEEKS)
  file(GLOB CEN429_WEEKS RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}" "${CMAKE_CURRENT_SOURCE_DIR}/week-*")
  list(SORT CEN429_WEEKS)
endif()
foreach(_week IN LISTS CEN429_WEEKS)
  if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/${_week}/CMakeLists.txt")
    add_subdirectory(${_week})
  endif()
endforeach()
