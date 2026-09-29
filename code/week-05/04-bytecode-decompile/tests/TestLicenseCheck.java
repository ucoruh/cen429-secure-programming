// CEN429 - Week 5 - Demo 4 unit test (plain Java, no framework/dependency needed).
//
// Tests the two decision functions of LicenseCheck (pinCorrect / licenseValid).
// The point of the demo is that these decisions are trivially visible in the
// compiled bytecode (see demo.ps1/demo.sh's javap step); the point of THIS
// test is only that the decisions themselves are correct and total (every
// input produces a boolean, never an exception).
public class TestLicenseCheck {
    static int checks = 0;
    static int failures = 0;

    static void check(boolean condition, String what) {
        checks++;
        if (!condition) {
            failures++;
            System.out.println("FAIL: " + what);
        }
    }

    public static void main(String[] args) {
        // --- pinCorrect: the one correct value ---
        check(LicenseCheck.pinCorrect("4729"), "pinCorrect: the real PIN is accepted");

        // --- pinCorrect: wrong values of every shape ---
        check(!LicenseCheck.pinCorrect("0000"), "pinCorrect: the default placeholder PIN is rejected");
        check(!LicenseCheck.pinCorrect("4728"), "pinCorrect: an off-by-one PIN is rejected");
        check(!LicenseCheck.pinCorrect("9274"), "pinCorrect: a digit-shuffled PIN is rejected");
        check(!LicenseCheck.pinCorrect(""), "pinCorrect: an empty PIN is rejected");
        check(!LicenseCheck.pinCorrect("47290"), "pinCorrect: a too-long PIN is rejected");
        check(!LicenseCheck.pinCorrect("472"), "pinCorrect: a too-short PIN is rejected");
        check(!LicenseCheck.pinCorrect(" 4729"), "pinCorrect: a PIN with leading whitespace is rejected");
        check(!LicenseCheck.pinCorrect("4729 "), "pinCorrect: a PIN with trailing whitespace is rejected");
        check(!LicenseCheck.pinCorrect(null), "pinCorrect: null input is rejected, not an exception");

        // --- licenseValid: the one correct value ---
        check(LicenseCheck.licenseValid("PRO-2026-DEMO"), "licenseValid: the real license key is accepted");

        // --- licenseValid: wrong values ---
        check(!LicenseCheck.licenseValid("PRO-2025-DEMO"), "licenseValid: a wrong year is rejected");
        check(!LicenseCheck.licenseValid("pro-2026-demo"), "licenseValid: comparison is case-sensitive");
        check(!LicenseCheck.licenseValid(""), "licenseValid: an empty key is rejected");
        check(!LicenseCheck.licenseValid("PRO-2026-DEMO "), "licenseValid: a trailing-space key is rejected");
        check(!LicenseCheck.licenseValid(null), "licenseValid: null input is rejected, not an exception");

        // --- The two checks are independent of each other ---
        check(LicenseCheck.pinCorrect("4729") && LicenseCheck.licenseValid("PRO-2026-DEMO"),
                "both checks can be true at once for the two correct values");
        check(!(LicenseCheck.pinCorrect("0000") && LicenseCheck.licenseValid("PRO-2026-DEMO")),
                "a wrong PIN does not get rescued by a right license key");

        System.out.println(checks + " checks, " + failures + " failures");
        if (failures > 0) {
            System.exit(1);
        }
    }
}
