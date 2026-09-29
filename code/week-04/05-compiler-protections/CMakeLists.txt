set(CEN429_FOLDER "Week 04/05 Compiler and OS protections")

# WEAK version: protections off (for comparison).
cen429_add_demo(overflow_weak SOURCES overflow.c MODE unprotected)
if(MSVC)
  target_compile_options(overflow_weak PRIVATE /GS-)
  target_link_options(overflow_weak PRIVATE /DYNAMICBASE:NO /HIGHENTROPYVA:NO /NXCOMPAT:NO)
elseif(CEN429_ELF_HARDENING)
  # Turn off PIE and RELRO (legacy/comparison behaviour) - ELF (Linux) only
  target_compile_options(overflow_weak PRIVATE -fno-stack-protector -U_FORTIFY_SOURCE)
  target_link_options(overflow_weak PRIVATE -no-pie -Wl,-z,norelro)
endif()
# (Windows MinGW/clang: no ELF flags apply; the target still builds plain - the demo still runs.)

# HARDENED version: every compiler/OS hardening flag turned on.
cen429_add_demo(overflow_hardened SOURCES overflow.c MODE secure)
if(MSVC)
  target_compile_options(overflow_hardened PRIVATE /GS /guard:cf)
  target_link_options(overflow_hardened PRIVATE /DYNAMICBASE /HIGHENTROPYVA /NXCOMPAT /guard:cf)
elseif(CEN429_ELF_HARDENING)
  target_compile_options(overflow_hardened PRIVATE -fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE)
  target_link_options(overflow_hardened PRIVATE -pie -Wl,-z,relro,-z,now)
endif()

# --- Tests ------------------------------------------------------------------------------------
# No unit test file: copy_in() has no separate "secure" logic to test in-process (both builds run
# the exact same strcpy; only the compiler/linker flags differ) — calling it here with a crafted
# input would corrupt this test binary's own stack, exactly the bug the demo teaches, in the wrong
# process. Only end-to-end, on the real binaries.
#
# The 200-byte overflow's crash itself is NOT asserted by ctest: on the hardened build the /GS (or
# stack-protector) fail-fast path terminates the process before stdio is ever flushed, so there is
# no text to match, and the process ends via an unhandled fault/signal either way — ctest's own
# crash detection reports that as failed no matter what PASS_REGULAR_EXPRESSION says (see the
# demo.ps1/demo.sh output and README for what to expect interactively: Linux "stack smashing
# detected", Windows exit 0xC0000409).
cen429_test(NAME week-04/05-compiler-protections/overflow_weak-normal
            COMMAND overflow_weak island
            PASS_REGEX "Function returned normally \\(canary not corrupted\\)\\.")
cen429_test(NAME week-04/05-compiler-protections/overflow_hardened-normal
            COMMAND overflow_hardened island
            PASS_REGEX "Function returned normally \\(canary not corrupted\\)\\.")
