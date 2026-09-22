// CEN429 - Hafta 5 - Demo 5b: YANSIMA ile dinamik cagri (daha iyi).
// gizliIslem() adi calisma aninda (XOR ile gizli) uretilip yansima ile
// cagrilir. Bytecode'da dogrudan bir 'invokestatic gizliIslem' YOKTUR; yalnizca
// 'getDeclaredMethod' + 'invoke' gorunur. Metot adi duz metin olarak gecmez.
// Sinir: adi cozen kod ve setAccessible cagrisi hala izlenebilir; yansima tek
// basina koruma degildir (RASP + gizleme ile birlikte kullanilir).
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

public class YansimaCagri {

    // "gizliIslem" adinin XOR(0x5A) ile gizlenmis hali.
    private static final byte[] AD = {
        61, 51, 32, 54, 51, 19, 41, 54, 63, 55
    };
    private static final byte ANAHTAR = 0x5A;

    private static String gizliIslem() {
        return "gizli-sonuc-42";
    }

    private static String coz(byte[] veri) {
        byte[] b = new byte[veri.length];
        for (int i = 0; i < veri.length; i++) {
            b[i] = (byte) (veri[i] ^ ANAHTAR);
        }
        return new String(b, StandardCharsets.UTF_8);
    }

    public static void main(String[] args) throws Exception {
        String metotAdi = coz(AD);   // "gizliIslem" calisma aninda olusur
        Method m = YansimaCagri.class.getDeclaredMethod(metotAdi);
        m.setAccessible(true);
        System.out.println("Yansima cagri : " + m.invoke(null));
    }
}
