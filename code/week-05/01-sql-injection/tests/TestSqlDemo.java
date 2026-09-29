// CEN429 - Week 5 - Demo 1 unit test (plain Java, no framework/dependency needed).
//
// Tests only the PURE query-building functions of SqlDemo (buildBadQuery /
// buildSecureQuery): no database connection is opened, so this test needs no
// SQLite JDBC driver and runs the same way everywhere. It checks that the bad
// path really does let attacker input change the SQL's structure, and that the
// good path's template never contains any user value at all.
//
// Convention (matches code/common/test_check.h used by the C tests): prints
// "<checks> checks, <failures> failures" and exits 1 if any check failed.
public class TestSqlDemo {
    static int checks = 0;
    static int failures = 0;

    static void check(boolean condition, String what) {
        checks++;
        if (!condition) {
            failures++;
            System.out.println("FAIL: " + what);
        }
    }

    static void checkEquals(String expected, String actual, String what) {
        check(expected.equals(actual), what + " (expected [" + expected + "], got [" + actual + "])");
    }

    static void checkContains(String haystack, String needle, String what) {
        check(haystack.contains(needle), what + " (expected to find [" + needle + "] in [" + haystack + "])");
    }

    static void checkNotContains(String haystack, String needle, String what) {
        check(!haystack.contains(needle), what + " (did not expect to find [" + needle + "] in [" + haystack + "])");
    }

    public static void main(String[] args) {
        // --- Normal (honest) input: both builders must embed/refer to the values sensibly ---
        String q1 = SqlDemo.buildBadQuery("alice", "password123");
        checkEquals(
                "SELECT id, name, role FROM user WHERE name = 'alice' AND password = 'password123'",
                q1, "buildBadQuery: normal input produces the expected literal SQL");
        checkContains(q1, "'alice'", "buildBadQuery: normal name is quoted in place");
        checkContains(q1, "'password123'", "buildBadQuery: normal password is quoted in place");

        // --- Empty input: still just two empty-string literals, no crash ---
        String q2 = SqlDemo.buildBadQuery("", "");
        checkEquals(
                "SELECT id, name, role FROM user WHERE name = '' AND password = ''",
                q2, "buildBadQuery: empty name/password still produces valid-looking SQL text");

        // --- Attack 1: authentication bypass via ' OR '1'='1 ---
        String q3 = SqlDemo.buildBadQuery("alice", "' OR '1'='1");
        checkContains(q3, "OR '1'='1'",
                "buildBadQuery: the ' OR '1'='1 payload survives into the SQL text unescaped");
        check(countChar(q3, '\'') != 4,
                "buildBadQuery: attack input changes the number of quote characters from the honest case (4)");

        // --- Attack 2: row exfiltration via ' OR role='admin' -- ---
        String q4 = SqlDemo.buildBadQuery("' OR role='admin' --", "doesn't matter");
        checkContains(q4, "OR role='admin'",
                "buildBadQuery: the admin-role payload survives into the SQL text unescaped");
        checkContains(q4, "--",
                "buildBadQuery: the comment marker that discards the password clause survives too");

        // --- Boundary: a single quote alone breaks the string open ---
        String q5 = SqlDemo.buildBadQuery("'", "'");
        check(countChar(q5, '\'') == 6,
                "buildBadQuery: a lone quote in each field adds exactly two quote characters (4 -> 6)");

        // --- Long input: no truncation, no exception, still one literal pair ---
        String longName = "a".repeat(500);
        String q6 = SqlDemo.buildBadQuery(longName, "x");
        check(q6.length() > 500, "buildBadQuery: a long name is not truncated");
        checkContains(q6, "'" + longName + "'", "buildBadQuery: a long name is still embedded verbatim");

        // --- buildSecureQuery: fixed template, independent of any input ---
        String s1 = SqlDemo.buildSecureQuery();
        checkEquals("SELECT id, name, role FROM user WHERE name = ? AND password = ?",
                s1, "buildSecureQuery: returns the exact parameterized template");
        check(s1.equals(SqlDemo.buildSecureQuery()),
                "buildSecureQuery: is deterministic (same result every call)");
        checkNotContains(s1, "'", "buildSecureQuery: the template contains no quote characters at all");

        // --- The decisive comparison: the same attack payload that breaks the bad
        //     query's structure never even appears in the secure template, because
        //     buildSecureQuery() never looks at its caller's values. ---
        checkNotContains(s1, "OR '1'='1'",
                "buildSecureQuery: the authentication-bypass payload text is nowhere in the template");
        checkNotContains(s1, "admin",
                "buildSecureQuery: the role-exfiltration payload text is nowhere in the template");
        check(countChar(s1, '?') == 2,
                "buildSecureQuery: the template has exactly two placeholders, one per value");

        System.out.println(checks + " checks, " + failures + " failures");
        if (failures > 0) {
            System.exit(1);
        }
    }

    static int countChar(String s, char c) {
        int n = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == c) {
                n++;
            }
        }
        return n;
    }
}
