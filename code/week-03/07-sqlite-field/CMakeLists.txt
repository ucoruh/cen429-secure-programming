set(CEN429_FOLDER "Week 03/07 SQLite field encryption")
# SQLite: sqlite3 on Linux; the Windows SDK's built-in winsqlite3 on Windows (MSVC only).
# Crypto: crypto (OpenSSL) on Linux; bcrypt (CNG) on Windows.
# On Windows with MinGW/clang there is no winsqlite3 header -> the target is SKIPPED (use MSVC or WSL).
if(NOT WIN32 OR MSVC)
  cen429_add_demo(sqlite_field SOURCES sqlite_field.c MODE secure
               LIBS
                 $<IF:$<PLATFORM_ID:Windows>,winsqlite3,sqlite3>
                 $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

  # --- Tests ----------------------------------------------------------------------------------
  cen429_add_demo(test_sqlite_field SOURCES tests/test_sqlite_field.c MODE secure
               LIBS
                 $<IF:$<PLATFORM_ID:Windows>,winsqlite3,sqlite3>
                 $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
  cen429_test(NAME week-03/07-sqlite-field/unit COMMAND test_sqlite_field
              PASS_REGEX "0 failures")

  cen429_test(NAME week-03/07-sqlite-field/runs-e2e
              COMMAND sqlite_field create bin/e2e-customers.db
              PASS_REGEX "Database created:"
              ENV "SIM_KEY=4242424242424242424242424242424242424242424242424242424242424242")
endif()
