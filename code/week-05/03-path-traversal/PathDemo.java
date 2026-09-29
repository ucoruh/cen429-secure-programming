// CEN429 - Week 5 - Demo 3: path traversal (Java)
//
// A "file server" should only ever hand out files under output/data/.
//   BAD  : the request is appended straight onto the root; ../secret.txt
//          escapes OUTSIDE the root.
//   GOOD : the path is canonicalized (normalize + toRealPath) and checked to
//          still be INSIDE the root; an absolute path / drive letter is also
//          rejected.
//
// ALL files are produced under the demo folder's output/; nothing is ever
// written or read outside it. All content is synthetic.
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class PathDemo {

    static void line() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static void prepare(Path root, Path secret) throws IOException {
        Files.createDirectories(root);
        Files.write(root.resolve("report.txt"),
                "Public report (synthetic).\n".getBytes("UTF-8"));
        Files.write(secret,
                "SECRET: synthetic admin note (outside the root).\n"
                        .getBytes("UTF-8"));
    }

    // BAD: no check at all. The request is appended to the root and read.
    static void readBad(Path root, String request) {
        try {
            Path target = root.resolve(request);
            byte[] content = Files.readAllBytes(target);
            System.out.println("   Resolved path: " + target.normalize());
            System.out.println("   READ -> " + new String(content, "UTF-8")
                    .trim());
        } catch (IOException e) {
            System.out.println("   (Read error: " + e.getMessage() + ")");
        }
    }

    // GOOD (the security check itself, as a pure function): canonicalize the
    // request against the root and decide whether it stays inside. No file is
    // read here, only path arithmetic + the existence checks canonicalization
    // itself needs, so this can be unit-tested directly. Returns null when the
    // request is rejected, or the safe, canonical path when it is accepted.
    static Path resolveSafely(Path root, String request) throws IOException {
        Path rootReal = root.toRealPath();
        Path requestPath = Paths.get(request);
        if (requestPath.isAbsolute()) {
            return null;   // absolute path / drive letter: rejected
        }
        Path candidate = rootReal.resolve(requestPath).normalize();
        // toRealPath also resolves symlinks; if the file does not exist yet we
        // trust normalize() instead (there is nothing left to resolve).
        Path real = Files.exists(candidate) ? candidate.toRealPath() : candidate;
        if (!real.startsWith(rootReal)) {
            return null;   // escapes outside the root: rejected
        }
        return real;
    }

    // GOOD: canonicalize + root check + absolute-path rejection, then read.
    static void readSecure(Path root, String request) {
        try {
            Path safe = resolveSafely(root, request);
            if (safe == null) {
                Path rootReal = root.toRealPath();
                Path requestPath = Paths.get(request);
                if (requestPath.isAbsolute()) {
                    System.out.println("   REJECTED: absolute path / drive letter.");
                } else {
                    Path candidate = rootReal.resolve(requestPath).normalize();
                    System.out.println("   REJECTED: escapes outside the root -> "
                            + candidate);
                }
                return;
            }
            byte[] content = Files.readAllBytes(safe);
            System.out.println("   Resolved path: " + safe);
            System.out.println("   READ -> " + new String(content, "UTF-8")
                    .trim());
        } catch (IOException e) {
            System.out.println("   (Read error: " + e.getMessage() + ")");
        }
    }

    public static void main(String[] args) throws IOException {
        Path base = Paths.get("output");
        Path root = base.resolve("data");
        Path secret = base.resolve("secret.txt");
        prepare(root, secret);

        line();
        System.out.println("Root folder (only this should ever be served): " + root);
        System.out.println("STEP 1 - Legitimate request: 'report.txt'");
        System.out.println("[BAD WAY]");
        readBad(root, "report.txt");
        System.out.println("[GOOD WAY]");
        readSecure(root, "report.txt");

        line();
        System.out.println("STEP 2 - ATTACK: '../secret.txt' (outside the root)");
        System.out.println("[BAD WAY]");
        readBad(root, ".." + java.io.File.separator + "secret.txt");
        System.out.println("   ^ The secret file outside the root was leaked.");
        System.out.println("[GOOD WAY]");
        readSecure(root, ".." + java.io.File.separator + "secret.txt");
        System.out.println("   ^ Canonicalization + root check blocked it.");

        line();
        System.out.println("STEP 3 - ATTACK (Windows): '..\\secret.txt' and"
                + " a mixed separator");
        System.out.println("[GOOD WAY] request = '../secret.txt'");
        readSecure(root, "../secret.txt");
        System.out.println("[GOOD WAY] request = an absolute-path attempt");
        readSecure(root, java.io.File.listRoots()[0] + "Windows");

        line();
        System.out.println("Result: appending the user's path to the root and reading it"
                + " is unsafe. Verify with normalize()+toRealPath()+a root check.");
    }
}
