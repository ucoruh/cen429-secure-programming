// CEN429 - Week 5 - Demo 5a: a PLAIN constant (bad example).
// The constant string passes from source code into the bytecode's constant
// pool as PLAIN TEXT; 'javap -c -p' or 'strings' reads it instantly. All
// values are synthetic.
public class PlainConstant {
    private static final String SECRET = "server-key-9F3A";

    public static void main(String[] args) {
        System.out.println("Plain constant  : " + SECRET);
    }
}
