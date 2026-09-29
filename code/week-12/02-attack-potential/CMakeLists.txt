set(CEN429_FOLDER "Week 12/02 Attack potential calculator")
cen429_add_demo(attack_potential SOURCES attack_potential.c MODE secure)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_attack_potential SOURCES tests/test_attack_potential.c MODE secure)
cen429_test(NAME week-12/02-attack-potential/unit COMMAND test_attack_potential
            PASS_REGEX "0 failures")

# End-to-end: no-argument run scores the three built-in example findings.
cen429_test(NAME week-12/02-attack-potential/embedded-examples COMMAND attack_potential
            PASS_REGEX "score=55 -> BEYOND")

# End-to-end: explicit factor levels via CLI reproduce the "protected license check" example.
cen429_test(NAME week-12/02-attack-potential/cli-license-protected
            COMMAND attack_potential 1 2 1 1 0
            PASS_REGEX "score=17 -> HIGH")
