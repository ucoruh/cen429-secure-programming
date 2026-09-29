set(CEN429_FOLDER "Week 03/08 Secure wipe in memory")
cen429_add_demo(memory_wipe SOURCES memory_wipe.c MODE optimize
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_memory_wipe SOURCES tests/test_memory_wipe.c MODE optimize
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-03/08-memory-wipe/unit COMMAND test_memory_wipe
            PASS_REGEX "0 failures")

cen429_test(NAME week-03/08-memory-wipe/runs-e2e
            COMMAND memory_wipe
            PASS_REGEX "cleared from memory")
