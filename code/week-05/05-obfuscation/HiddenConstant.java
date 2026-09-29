// CEN429 - Week 5 - Demo 5a: a HIDDEN constant (better).
// The same string is XOR-encrypted BEFORE compilation and embedded as a byte
// array; it is decrypted at run time. This way the plain text does NOT show
// up in the bytecode. Limit: the string still exists in memory once decrypted;
// strong protection needs RASP + a short lifetime too (Week 6). All values are
// synthetic.
import java.nio.charset.StandardCharsets;

public class HiddenConstant {

    // "server-key-9F3A" XOR-encrypted with 0x5A.
    private static final byte[] SECRET = {
        41, 63, 40, 44, 63, 40, 119, 49, 63, 35,
        119, 99, 28, 105, 27
    };
    private static final byte KEY = 0x5A;

    private static String decrypt(byte[] data) {
        byte[] b = new byte[data.length];
        for (int i = 0; i < data.length; i++) {
            b[i] = (byte) (data[i] ^ KEY);
        }
        return new String(b, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) {
        System.out.println("Decrypted constant : " + decrypt(SECRET));
    }
}
