// CEN429 - Week 5 - Demo 5 unit test (plain Java, no framework/dependency needed).
//
// The demo's whole point is that 'private' does not hide a method or field
// from bytecode inspection or from reflection (with setAccessible(true)); this
// test therefore uses reflection ITSELF to reach the private decrypt()/
// hiddenOperation() members of HiddenConstant/ReflectionCall/DirectCall and
// check they behave correctly -- fitting the lesson rather than working
// around it. The expected decrypted values are computed by an INDEPENDENT XOR
// implementation written here, not by calling the classes' own decrypt().
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

public class TestObfuscation {
    static int checks = 0;
    static int failures = 0;

    static void check(boolean condition, String what) {
        checks++;
        if (!condition) {
            failures++;
            System.out.println("FAIL: " + what);
        }
    }

    // Independent reference implementation: NOT the class's own decrypt().
    static byte[] xor(String s, int key) {
        byte[] in = s.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] out = new byte[in.length];
        for (int i = 0; i < in.length; i++) {
            out[i] = (byte) (in[i] ^ key);
        }
        return out;
    }

    static String invokeDecrypt(Class<?> owner, byte[] data) throws Exception {
        Method m = owner.getDeclaredMethod("decrypt", byte[].class);
        m.setAccessible(true);
        return (String) m.invoke(null, (Object) data);
    }

    public static void main(String[] args) throws Exception {
        // --- HiddenConstant.decrypt: round-trip several strings through our
        //     OWN xor() to build the input, then decrypt via reflection ---
        for (String s : new String[] {"A", "", "Hello", "CEN429", "XOR test!"}) {
            String result = invokeDecrypt(HiddenConstant.class, xor(s, 0x5A));
            check(result.equals(s), "HiddenConstant.decrypt: round-trips '" + s + "' correctly");
        }

        // --- HiddenConstant's real embedded SECRET field decrypts to the
        //     expected constant (read the private field via reflection) ---
        Field secretField = HiddenConstant.class.getDeclaredField("SECRET");
        secretField.setAccessible(true);
        byte[] secretBytes = (byte[]) secretField.get(null);
        check(invokeDecrypt(HiddenConstant.class, secretBytes).equals("server-key-9F3A"),
                "HiddenConstant: the embedded SECRET field decrypts to the expected constant");
        check(secretBytes.length == "server-key-9F3A".length(),
                "HiddenConstant: the encrypted SECRET array has one byte per plain-text character");

        // --- ReflectionCall.decrypt: same independent round-trip check ---
        for (String s : new String[] {"A", "", "hiddenOperation", "abc123"}) {
            String result = invokeDecrypt(ReflectionCall.class, xor(s, 0x5A));
            check(result.equals(s), "ReflectionCall.decrypt: round-trips '" + s + "' correctly");
        }

        // --- ReflectionCall's real embedded NAME field decrypts to the method
        //     name it calls ---
        Field nameField = ReflectionCall.class.getDeclaredField("NAME");
        nameField.setAccessible(true);
        byte[] nameBytes = (byte[]) nameField.get(null);
        check(invokeDecrypt(ReflectionCall.class, nameBytes).equals("hiddenOperation"),
                "ReflectionCall: the embedded NAME field decrypts to 'hiddenOperation'");

        // --- Both classes' private hiddenOperation() are reachable via
        //     reflection and return the same value ---
        Method directMethod = DirectCall.class.getDeclaredMethod("hiddenOperation");
        directMethod.setAccessible(true);
        check("hidden-result-42".equals(directMethod.invoke(null)),
                "DirectCall.hiddenOperation: still returns 'hidden-result-42' when called reflectively");

        Method reflectionMethod = ReflectionCall.class.getDeclaredMethod("hiddenOperation");
        reflectionMethod.setAccessible(true);
        check("hidden-result-42".equals(reflectionMethod.invoke(null)),
                "ReflectionCall.hiddenOperation: returns the same value as DirectCall's");

        // --- The method IS still private (that's the whole point: 'private'
        //     is a compile-time check, not a bytecode-hiding mechanism) ---
        check(Modifier.isPrivate(directMethod.getModifiers()),
                "DirectCall.hiddenOperation: is declared private (javap -p still lists it)");
        check(Modifier.isPrivate(reflectionMethod.getModifiers()),
                "ReflectionCall.hiddenOperation: is declared private too");
        check(Modifier.isPrivate(secretField.getModifiers()),
                "HiddenConstant.SECRET: is declared private");

        // --- Reflection without setAccessible(true) is blocked by the normal
        //     Java access rules -- demonstrating exactly what setAccessible
        //     bypasses. (A fresh, non-accessible Method lookup is used here.) ---
        Method guarded = DirectCall.class.getDeclaredMethod("hiddenOperation");
        boolean threw = false;
        try {
            guarded.invoke(null);
        } catch (IllegalAccessException expected) {
            threw = true;
        } catch (InvocationTargetException unexpected) {
            threw = false;
        }
        check(threw, "DirectCall.hiddenOperation: invoking it WITHOUT setAccessible(true) is rejected");

        System.out.println(checks + " checks, " + failures + " failures");
        if (failures > 0) {
            System.exit(1);
        }
    }
}
