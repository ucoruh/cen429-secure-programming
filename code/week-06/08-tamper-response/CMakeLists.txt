set(CEN429_FOLDER "Week 06/08 Tamper response (RASP engine)")
cen429_add_demo(rasp SOURCES rasp.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_rasp SOURCES tests/test_rasp.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-06/08-tamper-response/unit COMMAND test_rasp
            PASS_REGEX "0 failures")

# End-to-end: the real compiled binary, all five response-policy scenarios. Each PASS_REGEX is
# kept to a single line (CMake's regex engine does not support multi-line patterns), so a
# scenario that needs two facts confirmed gets two separate test entries on the same command.
cen429_test(NAME week-06/08-tamper-response/normal-state
            COMMAND rasp normal
            PASS_REGEX "state NORMAL")
cen429_test(NAME week-06/08-tamper-response/normal-result
            COMMAND rasp normal
            PASS_REGEX "RESULT: NORMAL\\.")
cen429_test(NAME week-06/08-tamper-response/warn-state
            COMMAND rasp warn
            PASS_REGEX "state WARN")
cen429_test(NAME week-06/08-tamper-response/warn-result
            COMMAND rasp warn
            PASS_REGEX "RESULT: WARN\\.")
cen429_test(NAME week-06/08-tamper-response/degrade-state
            COMMAND rasp degrade
            PASS_REGEX "state DEGRADE")
cen429_test(NAME week-06/08-tamper-response/degrade-redacted
            COMMAND rasp degrade
            PASS_REGEX "RESULT-VALUE: .*\\(redacted\\)")
cen429_test(NAME week-06/08-tamper-response/lock-from-failed-checks-state
            COMMAND rasp lock
            PASS_REGEX "state LOCK")
cen429_test(NAME week-06/08-tamper-response/lock-from-failed-checks-reason
            COMMAND rasp lock
            PASS_REGEX "detection checks failed")
cen429_test(NAME week-06/08-tamper-response/lock-from-other-device-state
            COMMAND rasp other-device
            PASS_REGEX "state LOCK")
cen429_test(NAME week-06/08-tamper-response/lock-from-other-device-reason
            COMMAND rasp other-device
            PASS_REGEX "device/version binding failed")
