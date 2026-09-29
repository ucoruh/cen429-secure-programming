set(CEN429_FOLDER "Week 05/02 Command injection")

if(Java_FOUND)
  # Printer.java is the small controlled "external tool" CommandDemo itself
  # shells out to (as `java -cp bin Printer ...`); it must be compiled into
  # the SAME bin/ the demo's own subprocess call expects.
  cen429_week5_java_classes(week5_02_command_injection_classes
    SOURCES Printer.java CommandDemo.java tests/TestCommandDemo.java)

  # Unit test: the pure functions (buildBadCommand / isAllowed /
  # buildSecureArgs). No process is started, so this is independent of the
  # platform's actual shell.
  cen429_test(NAME week-05/02-command-injection/java-unit
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin TestCommandDemo
              PASS_REGEX "0 failures")

  # End-to-end: the real demo, showing the injected command's output on the
  # bad path (a harmless echo) and the allow-list rejection on the good path.
  cen429_test(NAME week-05/02-command-injection/java-demo-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin CommandDemo
              PASS_REGEX "\\| LEAKED-COMMAND-INJECTION"
              LABELS "intentional-bug")
endif()

if(Python3_FOUND)
  cen429_test(NAME week-05/02-command-injection/python-unit
              COMMAND ${Python3_EXECUTABLE} tests/test_command_injection.py
              PASS_REGEX "0 failures")

  cen429_test(NAME week-05/02-command-injection/python-demo-runs
              COMMAND ${Python3_EXECUTABLE} command_injection.py
              PASS_REGEX "\\| LEAKED-COMMAND-INJECTION"
              LABELS "intentional-bug")
endif()
