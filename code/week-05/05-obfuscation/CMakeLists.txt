set(CEN429_FOLDER "Week 05/05 Obfuscation")

if(Java_FOUND)
  cen429_week5_java_classes(week5_05_obfuscation_classes
    SOURCES PlainConstant.java HiddenConstant.java DirectCall.java
            ReflectionCall.java tests/TestObfuscation.java)

  # Unit test: uses reflection ITSELF to reach the private decrypt()/
  # hiddenOperation() members (fitting this demo's own lesson) and checks
  # them against an independent XOR reference implemented in the test.
  cen429_test(NAME week-05/05-obfuscation/java-unit
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin TestObfuscation
              PASS_REGEX "0 failures")

  cen429_test(NAME week-05/05-obfuscation/plain-constant-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin PlainConstant
              PASS_REGEX "Plain constant  : server-key-9F3A")
  cen429_test(NAME week-05/05-obfuscation/hidden-constant-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin HiddenConstant
              PASS_REGEX "Decrypted constant : server-key-9F3A")
  cen429_test(NAME week-05/05-obfuscation/direct-call-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin DirectCall
              PASS_REGEX "Direct call: hidden-result-42")
  cen429_test(NAME week-05/05-obfuscation/reflection-call-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin ReflectionCall
              PASS_REGEX "Reflection call : hidden-result-42")

  # The demo's actual lesson, asserted directly via javap: the plain
  # constant's secret string is readable in the bytecode; the hidden one's
  # is not (only the byte array is). Same idea for the direct vs. reflective
  # method call.
  if(Java_JAVAP_EXECUTABLE)
    cen429_test(NAME week-05/05-obfuscation/javap-reveals-plain-secret
                COMMAND ${Java_JAVAP_EXECUTABLE} -c -p -cp bin PlainConstant
                PASS_REGEX "server-key-9F3A"
                LABELS "intentional-bug")
    cen429_test(NAME week-05/05-obfuscation/javap-hides-encrypted-secret
                COMMAND ${Java_JAVAP_EXECUTABLE} -c -p -cp bin HiddenConstant
                FAIL_REGEX "server-key-9F3A")
    cen429_test(NAME week-05/05-obfuscation/javap-shows-direct-invoke
                COMMAND ${Java_JAVAP_EXECUTABLE} -c -p -cp bin DirectCall
                PASS_REGEX "Method hiddenOperation"
                LABELS "intentional-bug")
    cen429_test(NAME week-05/05-obfuscation/javap-hides-reflective-invoke
                COMMAND ${Java_JAVAP_EXECUTABLE} -c -p -cp bin ReflectionCall
                FAIL_REGEX "invokestatic[^\n]*hiddenOperation")
  endif()
endif()
