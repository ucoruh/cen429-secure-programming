set(CEN429_FOLDER "Week 04/04 Fuzzing (libFuzzer)")

# Reproducer: built with ASan. Replays a crashing input; shows the bug at the exact spot even on
# platforms without a fuzzer. (Without ASan, cen429_add_demo falls back to plain -O1; the demo
# still shows the crash.)
cen429_add_demo(parser        SOURCES replay.c parser.c        MODE asan)
cen429_add_demo(parser_secure SOURCES replay.c parser_secure.c MODE asan)

# libFuzzer targets only build with Clang (Linux) or MSVC (Windows).
# WSL Ubuntu 20.04 (GCC only) and Windows MinGW/clang SKIP these; demo.sh explains installing clang.
if((CMAKE_C_COMPILER_ID STREQUAL "Clang" AND NOT WIN32) OR MSVC)
  cen429_add_demo(parser_fuzz SOURCES fuzz.c parser.c MODE asan
               OPTIONS $<$<C_COMPILER_ID:Clang>:-fsanitize=fuzzer>
                       $<$<C_COMPILER_ID:MSVC>:/fsanitize=fuzzer>)
  cen429_add_demo(parser_fuzz_secure SOURCES fuzz.c parser_secure.c MODE asan
               OPTIONS $<$<C_COMPILER_ID:Clang>:-fsanitize=fuzzer>
                       $<$<C_COMPILER_ID:MSVC>:/fsanitize=fuzzer>)
  if(NOT MSVC)
    target_link_options(parser_fuzz        PRIVATE -fsanitize=fuzzer)
    target_link_options(parser_fuzz_secure PRIVATE -fsanitize=fuzzer)
  endif()
endif()

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_parser_secure SOURCES tests/test_parser_secure.c MODE optimize)
cen429_test(NAME week-04/04-fuzzing/parser_secure-unit COMMAND test_parser_secure
            PASS_REGEX "0 failures")

cen429_test(NAME week-04/04-fuzzing/parser-normal-seed
            COMMAND parser seeds/normal.bin
            PASS_REGEX "Parse result: 65")
cen429_test(NAME week-04/04-fuzzing/parser_secure-normal-seed
            COMMAND parser_secure seeds/normal.bin
            PASS_REGEX "Parse result: 65")
cen429_test(NAME week-04/04-fuzzing/parser_secure-rejects-crash-seed
            COMMAND parser_secure seeds/crash.bin
            PASS_REGEX "Parse result: -1")
cen429_test(NAME week-04/04-fuzzing/parser-crash-seed-triggers-asan
            COMMAND parser seeds/crash.bin
            PASS_REGEX "AddressSanitizer: heap-buffer-overflow"
            LABELS "intentional-bug;plain-vulnerable")
