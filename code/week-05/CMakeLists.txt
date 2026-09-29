# CEN429 - Week 5 demos: Java and Python (interpreted-language code hardening).
# No C code this week, so no cen429_add_demo() targets -- but every subfolder
# with a CMakeLists.txt is still added the same way as any other week (see
# cmake/cen429.cmake's cen429_add_week_demos()).
#
# Java and Python are found ONCE here and reused by every demo subdirectory
# below, so a missing JDK or Python interpreter only prints one status message
# instead of one per demo.
find_package(Java COMPONENTS Development Runtime)
find_package(Python3 COMPONENTS Interpreter)

if(NOT Java_FOUND)
  message(STATUS "CEN429 week 5: no JDK found (javac/java) -- Java demos and their "
                 "tests are skipped. Install a JDK (e.g. Eclipse Temurin 17/21) to "
                 "build/test them.")
else()
  # FindJava.cmake has no COMPONENT for javap (it only tracks java, javac,
  # javah, jar, javadoc, idlj, jarsigner -- see its own header comment), but
  # Demo 4 and Demo 5's tests need it to check what a compiled .class file
  # actually reveals. It ships in the same bin/ folder as java/javac.
  get_filename_component(_cen429_java_bin_dir "${Java_JAVA_EXECUTABLE}" DIRECTORY)
  find_program(Java_JAVAP_EXECUTABLE NAMES javap HINTS "${_cen429_java_bin_dir}")
  if(NOT Java_JAVAP_EXECUTABLE)
    message(STATUS "CEN429 week 5: javap not found next to java -- the bytecode-"
                   "inspection checks in Demo 4/5 are skipped.")
  endif()
endif()
if(NOT Python3_FOUND)
  message(STATUS "CEN429 week 5: no Python 3 interpreter found -- Python demos and "
                 "their tests are skipped.")
endif()

# cen429_week5_java_classes(<target> SOURCES <file>...)
#
# Week-5-local helper (this week has no C code, so cen429_add_demo() from
# cmake/cen429.cmake does not apply -- it only knows how to add_executable() a
# C source). Compiles the given .java files (paths relative to the CALLING
# CMakeLists.txt's own folder, i.e. one demo's folder) with javac into that
# same folder's bin/, as part of the normal `cmake --build` (an ALL target),
# and adds a build dependency so editing a .java file triggers a recompile.
# Always compiles to "<demo folder>/bin" -- the SAME folder demo.ps1/demo.sh
# already use (see their own `-d bin`), which matters here because some demos
# (e.g. 02-command-injection's CommandDemo) shell out to `java -cp bin ...`
# themselves: the classpath they hard-code must be the one ctest also builds
# into, or the demo's own subprocess would not find its classes.
function(cen429_week5_java_classes target)
  cmake_parse_arguments(A "" "" "SOURCES" ${ARGN})
  if(NOT A_SOURCES)
    message(FATAL_ERROR "cen429_week5_java_classes: SOURCES is required")
  endif()
  set(_classes_dir "${CMAKE_CURRENT_SOURCE_DIR}/bin")
  set(_stamp "${CMAKE_CURRENT_SOURCE_DIR}/bin/.${target}.stamp")
  set(_abs_sources)
  foreach(_s IN LISTS A_SOURCES)
    list(APPEND _abs_sources "${CMAKE_CURRENT_SOURCE_DIR}/${_s}")
  endforeach()
  add_custom_command(
    OUTPUT "${_stamp}"
    COMMAND ${CMAKE_COMMAND} -E make_directory "${_classes_dir}"
    COMMAND ${Java_JAVAC_EXECUTABLE} --release 17 -d "${_classes_dir}" ${_abs_sources}
    COMMAND ${CMAKE_COMMAND} -E touch "${_stamp}"
    DEPENDS ${_abs_sources}
    COMMENT "javac (week 5) ${target}: ${A_SOURCES}"
    VERBATIM)
  add_custom_target(${target} ALL DEPENDS "${_stamp}")
endfunction()

cen429_add_week_demos()
