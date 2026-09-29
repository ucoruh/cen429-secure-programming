# CEN429 — shared CMake helpers for the demos
#
# Every demo binary is written to bin/<platform>/ under its own source folder (platform: windows or
# linux). This way the demo.ps1 / demo.sh scripts find the binaries in the same place regardless of
# compiler or Visual Studio configuration.

if(WIN32)
  set(CEN429_PLATFORM windows)
else()
  set(CEN429_PLATFORM linux)
endif()

# --- Toolchain capabilities -------------------------------------------------
# ASan and ELF hardening (PIE/RELRO) only work on certain toolchains:
#   * MSVC                  -> has ASan (/fsanitize=address), no ELF hardening (Windows PE)
#   * Linux/macOS GCC/Clang -> has ASan, has ELF hardening
#   * Windows MinGW/Clang   -> neither is reliable (MinGW has no libasan; clang would have to switch
#                              to the MSVC target and rejects -fPIE/-Wl,-z,relro there)
# On an unsupported setup these demos are built in PLAIN mode (no build error); for the full
# experience use Visual Studio (MSVC) or WSL/Linux GCC.
if(MSVC)
  set(CEN429_HAS_ASAN ON)
  set(CEN429_ELF_HARDENING OFF)
elseif(NOT WIN32)
  set(CEN429_HAS_ASAN ON)
  set(CEN429_ELF_HARDENING ON)
else()
  set(CEN429_HAS_ASAN OFF)
  set(CEN429_ELF_HARDENING OFF)
  message(STATUS "CEN429: no MSVC found on Windows (MinGW/clang). ASan, ELF hardening and the "
                 "libFuzzer demos are built in PLAIN mode. For the full experience use Visual "
                 "Studio (MSVC) or WSL/Linux GCC.")
endif()

# Set by run_tests.py; also usable by hand: -DCEN429_WARNINGS_AS_ERRORS=ON
option(CEN429_WARNINGS_AS_ERRORS "Treat compiler warnings as errors (skipped for ALLOW_WARNINGS targets)" OFF)
# Set by run_tests.py --sanitize on Linux/WSL: also turns on UndefinedBehaviorSanitizer on every
# MODE asan target (Windows/MSVC is unaffected; MSVC's /fsanitize=address has no UBSan equivalent).
option(CEN429_UBSAN "Also enable UndefinedBehaviorSanitizer on MODE asan targets" OFF)

# Every target picks its own optimization/security flags; the compiler's per-configuration
# (Debug/Release) defaults are flattened out so they can never change a demo's behaviour.
foreach(_lang C CXX)
  foreach(_cfg DEBUG RELEASE RELWITHDEBINFO MINSIZEREL)
    if(MSVC)
      set(CMAKE_${_lang}_FLAGS_${_cfg} "/Zi")
    else()
      set(CMAKE_${_lang}_FLAGS_${_cfg} "-g")
    endif()
  endforeach()
endforeach()
if(MSVC)
  foreach(_cfg DEBUG RELEASE RELWITHDEBINFO MINSIZEREL)
    set(CMAKE_EXE_LINKER_FLAGS_${_cfg} "/DEBUG")
  endforeach()
  # The debug runtime library (/MDd) pops up dialog boxes; demos link against the release runtime
  # (/MD) in every configuration. ASan also requires this.
  set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreadedDLL")
  # If "vcpkg integrate install" has been run on this machine, Visual Studio adds vcpkg's libraries to
  # every project. The demos use no external libraries; this is turned off here so everyone's build
  # is identical regardless of what else is installed.
  set(CMAKE_VS_GLOBALS "VcpkgEnabled=false")
endif()

# cen429_add_week_demos()
#
# A week folder's CMakeLists.txt calls only this: every subfolder (demo) that contains a
# CMakeLists.txt is added in order. To build only some demos: -DCEN429_DEMO_PATTERN="^0[7-9]-"
function(cen429_add_week_demos)
  file(GLOB _sub RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}" "${CMAKE_CURRENT_SOURCE_DIR}/*")
  list(SORT _sub)
  foreach(_demo IN LISTS _sub)
    if(IS_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/${_demo}"
       AND EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/${_demo}/CMakeLists.txt")
      if(NOT CEN429_DEMO_PATTERN OR _demo MATCHES "${CEN429_DEMO_PATTERN}")
        add_subdirectory(${_demo})
      endif()
    endif()
  endforeach()
endfunction()

# cen429_add_demo(<target> SOURCES <file>... [MODE <mode>] [DEFINES <macro>...] [LIBS <lib>...]
#                 [OPTIONS <compiler option>...] [ALLOW_WARNINGS])
#
# MODE:
#   unprotected  no optimization, no extra protection     (GCC: -O0      MSVC: /Od)
#   optimize     compiled like a release build             (GCC: -O2      MSVC: /O2)
#   asan         AddressSanitizer                          (GCC: -O1 -fsanitize=address  MSVC: /fsanitize=address)
#   checked      bounds-checked library calls               (GCC: -O2 -D_FORTIFY_SOURCE=2  MSVC: /O2 + _s functions)
#   secure       the fixed source, warnings on, optimized
#
# ALLOW_WARNINGS: this target intentionally produces a compiler warning (that warning IS the demo's
# point); never add -Werror/-WX to it, even when CEN429_WARNINGS_AS_ERRORS is ON.
function(cen429_add_demo target)
  cmake_parse_arguments(A "ALLOW_WARNINGS" "MODE" "SOURCES;DEFINES;LIBS;OPTIONS" ${ARGN})
  if(NOT A_MODE)
    set(A_MODE unprotected)
  endif()
  add_executable(${target} ${A_SOURCES})
  target_include_directories(${target} PRIVATE "${PROJECT_SOURCE_DIR}/common")
  target_compile_definitions(${target} PRIVATE ${A_DEFINES})
  if(A_OPTIONS)
    target_compile_options(${target} PRIVATE ${A_OPTIONS})
  endif()
  if(A_LIBS)
    target_link_libraries(${target} PRIVATE ${A_LIBS})
  endif()

  if(MSVC)
    target_compile_definitions(${target} PRIVATE _CRT_SECURE_NO_WARNINGS)
    target_compile_options(${target} PRIVATE /W4 /utf-8)
    if(A_MODE STREQUAL "unprotected")
      target_compile_options(${target} PRIVATE /Od)
    elseif(A_MODE STREQUAL "asan")
      target_compile_options(${target} PRIVATE /Od /fsanitize=address)
      target_link_options(${target} PRIVATE /INCREMENTAL:NO)
      # Copy the ASan runtime next to the binary (so it also runs outside Visual Studio)
      get_filename_component(_cl_dir "${CMAKE_C_COMPILER}" DIRECTORY)
      set(_asan_dll "${_cl_dir}/clang_rt.asan_dynamic-x86_64.dll")
      if(EXISTS "${_asan_dll}")
        add_custom_command(TARGET ${target} POST_BUILD
          COMMAND ${CMAKE_COMMAND} -E copy_if_different "${_asan_dll}" "$<TARGET_FILE_DIR:${target}>")
      endif()
    elseif(A_MODE STREQUAL "checked")
      target_compile_options(${target} PRIVATE /O2)
      target_compile_definitions(${target} PRIVATE CHECKED_BUILD)
    else()  # optimize, secure
      target_compile_options(${target} PRIVATE /O2)
    endif()
    if(CEN429_WARNINGS_AS_ERRORS AND NOT A_ALLOW_WARNINGS)
      target_compile_options(${target} PRIVATE /WX)
    endif()
  else()
    target_compile_options(${target} PRIVATE -Wall -Wextra)
    if(A_MODE STREQUAL "unprotected")
      target_compile_options(${target} PRIVATE -O0)
    elseif(A_MODE STREQUAL "asan")
      if(CEN429_HAS_ASAN)
        # Ubuntu's GCC turns FORTIFY on by itself; it is turned off here just so ASan's own report is
        # the one you see.
        target_compile_options(${target} PRIVATE -O1 -U_FORTIFY_SOURCE -fsanitize=address -fno-omit-frame-pointer)
        target_link_options(${target} PRIVATE -fsanitize=address)
        if(CEN429_UBSAN)
          target_compile_options(${target} PRIVATE -fsanitize=undefined)
          target_link_options(${target} PRIVATE -fsanitize=undefined)
        endif()
      else()
        # ASan is not supported here (e.g. Windows MinGW): build plain with -O1, the demo still runs.
        target_compile_options(${target} PRIVATE -O1)
      endif()
    elseif(A_MODE STREQUAL "checked")
      target_compile_options(${target} PRIVATE -O2 -U_FORTIFY_SOURCE -D_FORTIFY_SOURCE=2)
    else()  # optimize, secure
      target_compile_options(${target} PRIVATE -O2)
    endif()
    if(CEN429_WARNINGS_AS_ERRORS AND NOT A_ALLOW_WARNINGS)
      target_compile_options(${target} PRIVATE -Werror)
    endif()
  endif()

  # Output: <demo folder>/bin/<platform>/  ($<0:> stops Visual Studio from adding a Debug/Release subfolder)
  # Running with F5 in Visual Studio uses the demo folder as the working directory (so files such as
  # password.txt are found).
  set_target_properties(${target} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin/${CEN429_PLATFORM}$<0:>"
    VS_DEBUGGER_WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    FOLDER "${CEN429_FOLDER}")
endfunction()

# cen429_test(NAME <test name> COMMAND <command> [<arg>...] [PASS_REGEX <regex>] [FAIL_REGEX <regex>]
#             [WILL_FAIL] [LABELS <label>...] [ENV <VAR=value>...])
#
# Thin wrapper around add_test(), used for both unit tests (a test_<program> executable built with
# cen429_add_demo) and end-to-end tests (that run a demo's own binary and check its real output with a
# regex). The working directory is set to the CMakeLists.txt that calls it (CMAKE_CURRENT_SOURCE_DIR),
# so a test runs from the demo's own folder — exactly like `.\demo.ps1` / `sh demo.sh` do, and exactly
# like an end-to-end test needs in order to find the demo's data files.
#
# LABELS "intentional-bug": for a demo with an intentionally vulnerable target, every test of that
# demo gets this label, and asserts only deterministic, documented behaviour (never "and then the
# program corrupts memory the same way every time" as the actual pass condition). A test that runs the
# raw, unprotected vulnerable binary and checks that the exploit succeeds is additionally labeled
# "plain-vulnerable"; run_tests.py --sanitize excludes "plain-vulnerable" tests (ctest -LE), since a
# global sanitizer rebuild is not what that particular test is about, and the point of --sanitize is to
# check the sanitizer/secure builds, not to re-run the raw exploit.
function(cen429_test)
  cmake_parse_arguments(A "WILL_FAIL" "NAME;PASS_REGEX;FAIL_REGEX" "COMMAND;LABELS;ENV" ${ARGN})
  if(NOT A_NAME)
    message(FATAL_ERROR "cen429_test: NAME is required")
  endif()
  if(NOT A_COMMAND)
    message(FATAL_ERROR "cen429_test: COMMAND is required")
  endif()
  add_test(NAME ${A_NAME} COMMAND ${A_COMMAND})
  set_tests_properties(${A_NAME} PROPERTIES
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    TIMEOUT 60)
  if(A_PASS_REGEX)
    set_tests_properties(${A_NAME} PROPERTIES PASS_REGULAR_EXPRESSION "${A_PASS_REGEX}")
  endif()
  if(A_FAIL_REGEX)
    set_tests_properties(${A_NAME} PROPERTIES FAIL_REGULAR_EXPRESSION "${A_FAIL_REGEX}")
  endif()
  if(A_WILL_FAIL)
    set_tests_properties(${A_NAME} PROPERTIES WILL_FAIL TRUE)
  endif()
  if(A_LABELS)
    set_tests_properties(${A_NAME} PROPERTIES LABELS "${A_LABELS}")
  endif()
  if(A_ENV)
    set_tests_properties(${A_NAME} PROPERTIES ENVIRONMENT "${A_ENV}")
  endif()
endfunction()
