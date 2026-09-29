set(CEN429_FOLDER "Week 13/01 Compliance matrix validator (S17)")
cen429_add_demo(compliance_matrix SOURCES compliance_matrix.c MODE secure)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_compliance_matrix SOURCES tests/test_compliance_matrix.c MODE secure)
cen429_test(NAME week-13/01-compliance-matrix/unit COMMAND test_compliance_matrix
            PASS_REGEX "0 failures")

# End-to-end: the embedded sample has exactly one finding (CEN429-CR-02, "met" with no evidence);
# a hand-written clean fixture has none; a hand-written findings fixture mixes a malformed row, an
# unknown status and two evidence-less rows; a missing path fails cleanly with a clear message.
cen429_test(NAME week-13/01-compliance-matrix/embedded-sample
            COMMAND compliance_matrix
            PASS_REGEX "Summary: 3 met, 1 delegated, 1 not-met \\| 1 FINDING")
cen429_test(NAME week-13/01-compliance-matrix/clean-file
            COMMAND compliance_matrix "${CMAKE_CURRENT_SOURCE_DIR}/tests/fixtures/clean.txt"
            PASS_REGEX "0 FINDING")
cen429_test(NAME week-13/01-compliance-matrix/findings-file
            COMMAND compliance_matrix "${CMAKE_CURRENT_SOURCE_DIR}/tests/fixtures/findings.txt"
            PASS_REGEX "Summary: 1 met, 1 delegated, 0 not-met \\| 3 FINDING")
cen429_test(NAME week-13/01-compliance-matrix/missing-file
            COMMAND compliance_matrix does-not-exist.txt
            PASS_REGEX "Could not open file")
