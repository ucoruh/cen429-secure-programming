// CEN429 - Hafta 5 - Demo 4: Bytecode ve decompile
//
// Kucuk bir "lisans/PIN denetimi". Amac: derlenmis .class dosyasinin, kaynak
// kod olmadan da 'javap -c -p' ile ne kadar acik okundugunu gostermek.
// Sabit dizeler (PIN, lisans anahtari), private alan/metot adlari ve dallanma
// mantigi bytecode'da acikca gorunur.
//
// TUM degerler sentetiktir; gercek bir urun/anahtar degildir.
public class LisansDenetimi {

    // Koda GOMULU sirlar: bytecode'da acikca gorunur (kotu ornek).
    private static final String GECERLI_PIN = "4729";
    private static final String LISANS_ANAHTARI = "PRO-2026-DEMO";

    private static boolean pinDogru(String girilen) {
        return GECERLI_PIN.equals(girilen);
    }

    private static boolean lisansGecerli(String anahtar) {
        return LISANS_ANAHTARI.equals(anahtar);
    }

    public static void main(String[] args) {
        String pin = (args.length > 0) ? args[0] : "0000";
        System.out.println("Girilen PIN     : " + pin);
        System.out.println("PIN dogru mu?   : " + pinDogru(pin));
        System.out.println("Lisans PRO mu?  : "
                + (lisansGecerli(LISANS_ANAHTARI) ? "EVET (PRO)" : "HAYIR"));
    }
}
