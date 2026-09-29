// CEN429 - Week 5 - Demo 2: command injection (Java)
//
// A "greeting tool" passes a user name to an external program.
//   BAD  : the command is given to the shell (sh -c / cmd /c) as a single
//          STRING. Separators like ';' or '&' in the input start an EXTRA
//          command in the shell.
//   GOOD : ProcessBuilder is given an argument LIST; there is no shell, the
//          input passes through as a single argument, like data. It is also
//          checked against an allow-list first.
//
// The injected command only ever prints a HARMLESS message (echo). No file is
// deleted/changed; no network is used; no administrator privilege is needed.
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

public class CommandDemo {

    static final boolean WINDOWS =
            System.getProperty("os.name").toLowerCase().contains("win");
    // The controlled "external tool": java running the Printer class in bin/.
    // The 'java' on PATH is used (an absolute path with spaces would break the
    // shell command string).
    static final String JAVA = "java";
    // Allow-list: only letters, digits and underscore (default-deny).
    static final Pattern ALLOWED = Pattern.compile("^[A-Za-z0-9_]+$");

    static void line() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static void printOutput(Process p) throws Exception {
        try (BufferedReader r = new BufferedReader(
                new InputStreamReader(p.getInputStream()))) {
            String out;
            while ((out = r.readLine()) != null) {
                System.out.println("   | " + out);
            }
        }
        p.waitFor();
    }

    // BAD: builds the single shell command STRING. Pure function (no process
    // is started here) so the exact text handed to the shell can be unit-tested.
    static String buildBadCommand(String name) {
        return JAVA + " -cp bin Printer Hello " + name;
    }

    // GOOD: the allow-list check, as a pure predicate. Default-deny: anything
    // that is not letters/digits/underscore is rejected, including the
    // separators a shell would treat specially (space, ; & | `).
    static boolean isAllowed(String name) {
        return ALLOWED.matcher(name).matches();
    }

    // GOOD: the exact argument list ProcessBuilder would run. Pure function so
    // it can be unit-tested without starting a process; there is no shell
    // involved, so 'name' is never re-parsed -- it is exactly one element.
    static List<String> buildSecureArgs(String name) {
        List<String> cmd = new ArrayList<>();
        cmd.add(JAVA);
        cmd.add("-cp");
        cmd.add("bin");
        cmd.add("Printer");
        cmd.add("Hello");
        cmd.add(name);
        return cmd;
    }

    // BAD: the user name is embedded into a shell command STRING.
    static void runBad(String name) throws Exception {
        String command = buildBadCommand(name);
        String[] cmd = WINDOWS
                ? new String[] {"cmd", "/c", command}
                : new String[] {"sh", "-c", command};
        System.out.println("   Command sent to the shell:");
        System.out.println("   " + command);
        printOutput(Runtime.getRuntime().exec(cmd));
    }

    // GOOD: argument list; no shell. Validated against the allow-list first.
    static void runSecure(String name) throws Exception {
        if (!isAllowed(name)) {
            System.out.println("   Allow-list REJECTED it (^[A-Za-z0-9_]+$):");
            System.out.println("   input = " + name);
            System.out.println("   -> The program was never run.");
            return;
        }
        List<String> cmd = buildSecureArgs(name);
        System.out.println("   ProcessBuilder argument list:");
        System.out.println("   " + cmd);
        printOutput(new ProcessBuilder(cmd).redirectErrorStream(true).start());
    }

    public static void main(String[] args) throws Exception {
        String sep = WINDOWS ? "& " : "; ";
        String harmless = "echo LEAKED-COMMAND-INJECTION";

        line();
        System.out.println("STEP 1 - Honest input: name = 'Alice'");
        System.out.println("[BAD WAY]");
        runBad("Alice");
        System.out.println("[GOOD WAY]");
        runSecure("Alice");

        line();
        System.out.println("STEP 2 - ATTACK: name contains an extra command");
        String badName = "Alice " + sep + harmless;
        System.out.println("   name = " + badName);
        System.out.println("[BAD WAY]  <-- the shell also runs the second command");
        runBad(badName);
        System.out.println("   ^ The 'LEAKED...' line = the injected command ran.");
        System.out.println("[GOOD WAY]  <-- the same input is just harmless text");
        runSecure(badName);
        System.out.println("   ^ The allow-list saw a space/;/& and rejected it.");

        line();
        System.out.println("Result: building a command through the shell (Runtime.exec"
                + " with a string) is dangerous. Use ProcessBuilder + argument list"
                + " + an allow-list.");
    }
}
