set(CEN429_FOLDER "Week 05/01 SQL injection")

# A literal ';' inside one COMMAND argument must be spelled as the
# $<SEMICOLON> generator expression, or CMake's own list machinery
# (add_test()/cmake_parse_arguments() inside cen429_test() both flatten
# COMMAND through an ordinary ';'-separated list, including at least once
# through an unquoted ${ARGN}) silently splits "bin;<jar>" into two separate
# arguments, shifting every argument after it -- java then sees the jar's
# path as the main class name instead of part of -cp. A plain "\;" does NOT
# survive that round trip (verified: it still gets split); $<SEMICOLON> does,
# because it stays an opaque, unsplittable token until the generator inserts
# the literal character into the final command line.
if(WIN32)
  set(_cp_sep "$<SEMICOLON>")
else()
  set(_cp_sep ":")
endif()

if(Java_FOUND)
  cen429_week5_java_classes(week5_01_sql_injection_classes
    SOURCES SqlDemo.java tests/TestSqlDemo.java)

  # Unit test: only the pure query-building functions (buildBadQuery /
  # buildSecureQuery). No database connection is opened, so this needs no
  # SQLite JDBC driver and runs identically everywhere.
  cen429_test(NAME week-05/01-sql-injection/java-unit
              COMMAND ${Java_JAVA_EXECUTABLE} -cp bin TestSqlDemo
              PASS_REGEX "0 failures")

  # End-to-end: the SQLite JDBC driver (lib/sqlite-jdbc-*.jar) is downloaded by
  # prepare.ps1/prepare.sh and is NOT committed to the repository (.gitignore).
  # Branch at configure time on whether it happens to be present, so both
  # cases stay deterministic instead of one of them being "sometimes skipped".
  file(GLOB _sqlite_jdbc_jar "${CMAKE_CURRENT_SOURCE_DIR}/lib/sqlite-jdbc-*.jar")
  if(_sqlite_jdbc_jar)
    list(GET _sqlite_jdbc_jar 0 _sqlite_jdbc_jar)
    cen429_test(NAME week-05/01-sql-injection/java-demo-runs
                COMMAND ${Java_JAVA_EXECUTABLE}
                        -cp "bin${_cp_sep}${_sqlite_jdbc_jar}" SqlDemo
                PASS_REGEX "3 row\\(s\\) returned\\. LOGIN SUCCESSFUL"
                LABELS "intentional-bug")
  else()
    cen429_test(NAME week-05/01-sql-injection/java-demo-runs-no-driver
                COMMAND ${Java_JAVA_EXECUTABLE} -cp bin SqlDemo
                PASS_REGEX "SQLite JDBC driver not found")
  endif()
endif()

if(Python3_FOUND)
  cen429_test(NAME week-05/01-sql-injection/python-unit
              COMMAND ${Python3_EXECUTABLE} tests/test_sql_injection.py
              PASS_REGEX "0 failures")

  # End-to-end: the real demo output, showing the SQL-injection bypass on the
  # bad path and its rejection on the good (parameterized-query) path.
  cen429_test(NAME week-05/01-sql-injection/python-demo-runs
              COMMAND ${Python3_EXECUTABLE} sql_injection.py
              PASS_REGEX "Result: do NOT embed input into SQL text"
              LABELS "intentional-bug")
endif()
