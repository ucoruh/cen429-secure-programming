// CEN429 - Week 5 - Demo 5b: a dynamic call via REFLECTION (better).
// The name of hiddenOperation() is produced at run time (XOR-hidden) and
// invoked through reflection. There is NO direct 'invokestatic hiddenOperation'
// in the bytecode; only 'getDeclaredMethod' + 'invoke' are visible. The method
// name never appears as plain text. Limit: the code that decodes the name and
// the setAccessible call are still traceable; reflection alone is not
// protection (it is used together with RASP + obfuscation).
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

public class ReflectionCall {

    // "hiddenOperation" XOR-hidden with 0x5A.
    private static final byte[] NAME = {
        50, 51, 62, 62, 63, 52, 21, 42, 63, 40,
        59, 46, 51, 53, 52
    };
    private static final byte KEY = 0x5A;

    private static String hiddenOperation() {
        return "hidden-result-42";
    }

    private static String decrypt(byte[] data) {
        byte[] b = new byte[data.length];
        for (int i = 0; i < data.length; i++) {
            b[i] = (byte) (data[i] ^ KEY);
        }
        return new String(b, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) throws Exception {
        String methodName = decrypt(NAME);   // "hiddenOperation" is produced at run time
        Method m = ReflectionCall.class.getDeclaredMethod(methodName);
        m.setAccessible(true);
        System.out.println("Reflection call : " + m.invoke(null));
    }
}
