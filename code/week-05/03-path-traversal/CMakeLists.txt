set(CEN429_FOLDER "Week 05/03 Path traversal")

if(Java_FOUND)
  cen429_week5_java_classes(week5_03_path_traversal_classes
    SOURCES PathDemo.java tests/TestPathDemo.java)

  # Unit test: PathDemo.resolveSafely() (the canonicalize + root-containment
  # check) against a disposable temp directory tree the test creates and
  # removes itself -- never the repository, never a real system path.
  cen429_test(NAME week-05/03-path-traversal/java-unit
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin TestPathDemo
              PASS_REGEX "0 failures")

  # End-to-end: the real demo. The bad path leaks the synthetic secret file
  # that sits just above the served root; the good path rejects the same
  # request after canonicalizing it.
  cen429_test(NAME week-05/03-path-traversal/java-demo-runs
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin PathDemo
              PASS_REGEX "SECRET: synthetic admin note"
              LABELS "intentional-bug")
endif()

if(Python3_FOUND)
  cen429_test(NAME week-05/03-path-traversal/python-unit
              COMMAND ${Python3_EXECUTABLE} tests/test_path_traversal.py
              PASS_REGEX "0 failures")

  cen429_test(NAME week-05/03-path-traversal/python-demo-runs
              COMMAND ${Python3_EXECUTABLE} path_traversal.py
              PASS_REGEX "SECRET: synthetic admin note"
              LABELS "intentional-bug")
endif()
