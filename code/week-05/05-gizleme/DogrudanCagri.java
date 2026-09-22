// CEN429 - Hafta 5 - Demo 5b: DOGRUDAN cagri (kotu ornek icin karsilastirma).
// gizliIslem() dogrudan cagrilir; bytecode'da 'invokestatic ... gizliIslem'
// olarak acikca gorunur ve capraz-referans araclarinca izlenir.
public class DogrudanCagri {

    private static String gizliIslem() {
        return "gizli-sonuc-42";
    }

    public static void main(String[] args) {
        System.out.println("Dogrudan cagri: " + gizliIslem());
    }
}
