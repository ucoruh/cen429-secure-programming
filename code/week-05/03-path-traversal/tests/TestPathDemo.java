// CEN429 - Week 5 - Demo 3 unit test (plain Java, no framework/dependency needed).
//
// Tests PathDemo.resolveSafely() -- the canonicalize + root-containment check
// -- against a small, disposable directory tree created in the OS temp folder
// (never inside the repository, never touching any real system file) and
// removed again at the end. No administrator privilege is used.
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;

public class TestPathDemo {
    static int checks = 0;
    static int failures = 0;

    static void check(boolean condition, String what) {
        checks++;
        if (!condition) {
            failures++;
            System.out.println("FAIL: " + what);
        }
    }

    public static void main(String[] args) throws IOException {
        Path lab = Files.createTempDirectory("cen429-path-test-");
        try {
            Path root = lab.resolve("data");
            Path secretOutsideRoot = lab.resolve("secret.txt");
            Files.createDirectories(root);
            Files.writeString(root.resolve("report.txt"), "public");
            Files.writeString(secretOutsideRoot, "secret");
            Files.createDirectories(root.resolve("sub"));
            Files.writeString(root.resolve("sub").resolve("nested.txt"), "nested");

            // --- Legitimate requests ---
            Path r1 = PathDemo.resolveSafely(root, "report.txt");
            check(r1 != null, "resolveSafely: a plain file in the root is accepted");
            check(r1 != null && r1.getFileName().toString().equals("report.txt"),
                    "resolveSafely: the accepted path really points at report.txt");

            Path r2 = PathDemo.resolveSafely(root, "sub/nested.txt");
            check(r2 != null, "resolveSafely: a file in a legitimate subfolder is accepted");
            check(r2 != null && r2.startsWith(root.toRealPath()),
                    "resolveSafely: the accepted subfolder path stays inside the root");

            // --- Attack: parent-directory traversal ---
            check(PathDemo.resolveSafely(root, ".." + java.io.File.separator + "secret.txt") == null,
                    "resolveSafely: '../secret.txt' is rejected (escapes the root)");
            check(PathDemo.resolveSafely(root, "../secret.txt") == null,
                    "resolveSafely: '../secret.txt' with a forward slash is rejected too");
            check(PathDemo.resolveSafely(root, "sub/../../secret.txt") == null,
                    "resolveSafely: a deeper 'sub/../../secret.txt' traversal is rejected");
            check(PathDemo.resolveSafely(root, "sub/../report.txt") != null,
                    "resolveSafely: 'sub/../report.txt' normalizes back INSIDE the root and is accepted");

            // --- Attack: absolute path ---
            String absoluteAttempt = lab.toAbsolutePath().toString();
            check(PathDemo.resolveSafely(root, absoluteAttempt) == null,
                    "resolveSafely: an absolute path is always rejected, even if it points inside the root");

            // --- Boundary: empty request resolves to the root itself (accepted; it
            //     is a directory, not a secret, and still inside the root) ---
            Path r3 = PathDemo.resolveSafely(root, "");
            check(r3 != null, "resolveSafely: an empty request resolves to the root itself, accepted");

            // --- Boundary: a request for a sibling folder whose name merely starts
            //     with the root's name must NOT be treated as 'inside' (a naive
            //     string prefix check like startsWith(rootString) would wrongly
            //     accept 'data-secret/x.txt' as being inside 'data') ---
            Path sibling = lab.resolve("data-secret");
            Files.createDirectories(sibling);
            Files.writeString(sibling.resolve("x.txt"), "sibling secret");
            check(PathDemo.resolveSafely(root, "../data-secret/x.txt") == null,
                    "resolveSafely: a sibling folder sharing a name prefix is still rejected");

            // --- A few more legitimate shapes normalize() must still accept ---
            check(PathDemo.resolveSafely(root, "./report.txt") != null,
                    "resolveSafely: a leading './' is accepted (normalizes to the same file)");
            check(PathDemo.resolveSafely(root, "sub/./nested.txt") != null,
                    "resolveSafely: a redundant './' in the middle of the path is accepted");
            check(PathDemo.resolveSafely(root, "sub") != null,
                    "resolveSafely: a request naming just the subfolder itself is accepted");

            // --- A request for a file that does not exist yet still resolves (no
            //     file-existence oracle is required to run the security check) ---
            Path r4 = PathDemo.resolveSafely(root, "does-not-exist.txt");
            check(r4 != null, "resolveSafely: a non-existent file inside the root is still accepted"
                    + " (the containment check does not require the file to exist)");

            // --- A non-existent path that WOULD escape must still be rejected ---
            check(PathDemo.resolveSafely(root, "../does-not-exist-either.txt") == null,
                    "resolveSafely: a non-existent path that escapes the root is rejected too");

            System.out.println(checks + " checks, " + failures + " failures");
            if (failures > 0) {
                System.exit(1);
            }
        } finally {
            deleteRecursively(lab);
        }
    }

    static void deleteRecursively(Path p) throws IOException {
        if (!Files.exists(p)) {
            return;
        }
        try (var walk = Files.walk(p)) {
            walk.sorted(Comparator.reverseOrder()).forEach(x -> {
                try {
                    Files.delete(x);
                } catch (IOException ignored) {
                    // best-effort cleanup of our own temp lab folder
                }
            });
        }
    }
}
