// CEN429 - Week 5 - Demo 2 unit test (plain Java, no framework/dependency needed).
//
// Tests the pure functions of CommandDemo: buildBadCommand (string the shell
// would see), isAllowed (the allow-list predicate) and buildSecureArgs (the
// argument list ProcessBuilder would run). No process is ever started here.
import java.util.List;

public class TestCommandDemo {
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
        // --- buildBadCommand: honest input ---
        check(CommandDemo.buildBadCommand("Alice").equals("java -cp bin Printer Hello Alice"),
                "buildBadCommand: honest name produces the expected literal command");

        // --- buildBadCommand: attack input survives verbatim (that IS the bug) ---
        String injected = "Alice ; echo LEAKED-COMMAND-INJECTION";
        String badCmd = CommandDemo.buildBadCommand(injected);
        check(badCmd.contains("; echo LEAKED-COMMAND-INJECTION"),
                "buildBadCommand: a ';' separator followed by a second command survives unescaped");
        check(badCmd.equals("java -cp bin Printer Hello " + injected),
                "buildBadCommand: the whole malicious string is appended verbatim, unmodified");

        // --- buildBadCommand: empty / boundary input, no exception ---
        check(CommandDemo.buildBadCommand("").equals("java -cp bin Printer Hello "),
                "buildBadCommand: empty name still produces a well-formed (if odd) command string");

        // --- isAllowed: normal identifiers pass ---
        check(CommandDemo.isAllowed("Alice"), "isAllowed: a plain name is accepted");
        check(CommandDemo.isAllowed("user_42"), "isAllowed: letters/digits/underscore are accepted");
        check(CommandDemo.isAllowed("A"), "isAllowed: a single letter is accepted");

        // --- isAllowed: empty input is rejected (the pattern requires 1+ chars) ---
        check(!CommandDemo.isAllowed(""), "isAllowed: empty string is rejected");

        // --- isAllowed: shell metacharacters are rejected (default-deny) ---
        check(!CommandDemo.isAllowed("Alice ; echo x"), "isAllowed: rejects a space and ';'");
        check(!CommandDemo.isAllowed("Alice & echo x"), "isAllowed: rejects '&'");
        check(!CommandDemo.isAllowed("Alice | echo x"), "isAllowed: rejects '|'");
        check(!CommandDemo.isAllowed("Alice`whoami`"), "isAllowed: rejects backticks");
        check(!CommandDemo.isAllowed("Alice$(whoami)"), "isAllowed: rejects '$(...)' command substitution");
        check(!CommandDemo.isAllowed("Alice\tBob"), "isAllowed: rejects a tab character");
        check(!CommandDemo.isAllowed("Alice\nBob"), "isAllowed: rejects a newline (multi-line injection)");

        // --- buildSecureArgs: the name becomes exactly one list element, no
        //     matter what shell metacharacters it contains. ---
        List<String> args1 = CommandDemo.buildSecureArgs("Alice ; echo LEAKED");
        check(args1.size() == 6, "buildSecureArgs: the argument list always has exactly 6 elements");
        check(args1.get(5).equals("Alice ; echo LEAKED"),
                "buildSecureArgs: the whole hostile string is ONE argument, never split by the shell");
        check(args1.get(3).equals("Printer") && args1.get(4).equals("Hello"),
                "buildSecureArgs: the fixed arguments (tool, greeting) are unaffected by the input");

        System.out.println(checks + " checks, " + failures + " failures");
        if (failures > 0) {
            System.exit(1);
        }
    }
}
