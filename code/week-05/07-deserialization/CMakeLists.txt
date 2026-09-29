set(CEN429_FOLDER "Week 05/07 Deserialization")

if(Java_FOUND)
  cen429_week5_java_classes(week5_07_deserialization_classes
    SOURCES SerializationDemo.java tests/TestSerializationDemo.java)

  # Unit test: entirely in-memory round trips (ObjectOutputStream /
  # ObjectInputStream over byte[]); no file, network or process is touched.
  cen429_test(NAME week-05/07-deserialization/java-unit
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin TestSerializationDemo
              PASS_REGEX "0 failures")

  # End-to-end: the real demo. The unfiltered stream accepts the unexpected
  # class (the vulnerability); the filtered stream rejects it (the fix).
  cen429_test(NAME week-05/07-deserialization/java-demo-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin SerializationDemo
              PASS_REGEX "REJECTED \\(filter\\): unexpected class blocked"
              LABELS "intentional-bug")
endif()
