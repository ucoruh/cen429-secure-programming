set(CEN429_FOLDER "Week 02/13 Unix permissions and umask")
# The "sim" mode is a pure simulation and builds on both platforms; the "real"
# mode uses the POSIX file API and only tries it for real on Linux/WSL
# (it prints a note on Windows). No real setuid binary is EVER CREATED.
cen429_add_demo(permissions SOURCES permissions.c MODE secure)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_permissions SOURCES tests/test_permissions.c MODE secure)
cen429_test(NAME week-02/13-unix-permissions-umask/unit COMMAND test_permissions
            PASS_REGEX "0 failures")

cen429_test(NAME week-02/13-unix-permissions-umask/sim-runs
            COMMAND permissions sim
            PASS_REGEX "Kernel permission check")
if(NOT WIN32)
  cen429_test(NAME week-02/13-unix-permissions-umask/real-runs
              COMMAND permissions real
              PASS_REGEX "Real kernel, process uid=")
endif()
