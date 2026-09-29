set(CEN429_FOLDER "Week 06/04 Preload hook detection")
# Linux/WSL only: LD_PRELOAD, dlsym(RTLD_DEFAULT), dladdr. On Windows students run this under WSL
# (see demo.ps1). Windows's equivalent of a hook is IAT/inline hook detection; that needs a
# different API and is not covered by this demo.
if(NOT WIN32)
  cen429_add_demo(preload_hook SOURCES preload_hook.c MODE secure LIBS ${CMAKE_DL_LIBS})

  # The fake hook library an attacker preloads (for the demo only).
  add_library(fake_hook SHARED fake_hook.c)
  set_target_properties(fake_hook PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin/${CEN429_PLATFORM}$<0:>"
    FOLDER "${CEN429_FOLDER}")

  # --- Tests ----------------------------------------------------------------------------------
  cen429_add_demo(test_preload_hook SOURCES tests/test_preload_hook.c MODE secure LIBS ${CMAKE_DL_LIBS})
  cen429_test(NAME week-06/04-preload-hook/unit COMMAND test_preload_hook
              PASS_REGEX "0 failures")

  # End-to-end: normal run must be clean; running under LD_PRELOAD with the fake hook must detect
  # it and time() must return the attacker's fixed fake value.
  cen429_test(NAME week-06/04-preload-hook/clean-run
              COMMAND preload_hook
              PASS_REGEX "RESULT: clean - no preload/hook visible\\.")
  cen429_test(NAME week-06/04-preload-hook/ld-preload-detected
              COMMAND preload_hook
              PASS_REGEX "RESULT: function hook / preload DETECTED"
              ENV "LD_PRELOAD=$<TARGET_FILE:fake_hook>")
  cen429_test(NAME week-06/04-preload-hook/ld-preload-flags-time-symbol
              COMMAND preload_hook
              PASS_REGEX "time.*\\(HOOK!\\)"
              ENV "LD_PRELOAD=$<TARGET_FILE:fake_hook>")
  cen429_test(NAME week-06/04-preload-hook/ld-preload-fakes-time
              COMMAND preload_hook
              PASS_REGEX "time\\(NULL\\) returned +: 1234567890"
              ENV "LD_PRELOAD=$<TARGET_FILE:fake_hook>")
endif()
