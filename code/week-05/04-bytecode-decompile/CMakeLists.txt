set(CEN429_FOLDER "Week 05/04 Bytecode and decompile")

if(Java_FOUND)
  cen429_week5_java_classes(week5_04_bytecode_decompile_classes
    SOURCES LicenseCheck.java tests/TestLicenseCheck.java)

  cen429_test(NAME week-05/04-bytecode-decompile/java-unit
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin TestLicenseCheck
              PASS_REGEX "0 failures")

  # End-to-end: the demo itself, with a wrong PIN (the normal classroom run).
  cen429_test(NAME week-05/04-bytecode-decompile/java-demo-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin LicenseCheck 1234
              PASS_REGEX "PIN correct\\?    : false")

  # The demo's actual lesson, asserted directly: javap -c -p on the compiled
  # .class file -- WITHOUT the source -- must still show the PIN in plain
  # text in the constant pool. This is the one CTest check in the whole week
  # that verifies the "bytecode is not hidden" claim the note and demo make,
  # rather than just the program's own stdout.
  if(Java_JAVAP_EXECUTABLE)
    cen429_test(NAME week-05/04-bytecode-decompile/javap-reveals-pin
                COMMAND ${Java_JAVAP_EXECUTABLE} -c -p -cp bin LicenseCheck
                PASS_REGEX "String 4729"
                LABELS "intentional-bug")
  endif()
endif()
