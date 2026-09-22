// CEN429 - Hafta 5 - Demo 5a: GIZLENMIS sabit (daha iyi).
// Ayni dize derleme ONCESI XOR ile sifrelenip byte dizisi olarak gomulur;
// calisma aninda cozulur. Boylece bytecode'da duz metin olarak GORUNMEZ.
// Sinir: cozme noktasinda dize bellekte olusur; guclu koruma icin RASP + kisa
// omur gerekir (Hafta 6). Tum degerler sentetiktir.
import java.nio.charset.StandardCharsets;

public class GizliSabit {

    // "sunucu-anahtari-9F3A" dizesinin XOR(0x5A) ile sifrelenmis hali.
    private static final byte[] GIZLI = {
        41, 47, 52, 47, 57, 47, 119, 59, 52, 59,
        50, 46, 59, 40, 51, 119, 99, 28, 105, 27
    };
    private static final byte ANAHTAR = 0x5A;

    private static String coz(byte[] veri) {
        byte[] b = new byte[veri.length];
        for (int i = 0; i < veri.length; i++) {
            b[i] = (byte) (veri[i] ^ ANAHTAR);
        }
        return new String(b, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) {
        System.out.println("Cozulen sabit : " + coz(GIZLI));
    }
}
