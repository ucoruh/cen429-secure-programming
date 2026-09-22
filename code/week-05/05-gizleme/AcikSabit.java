// CEN429 - Hafta 5 - Demo 5a: ACIK sabit (kotu ornek).
// Sabit dize kaynak koddan bytecode'un sabit havuzuna DUZ METIN olarak gecer;
// 'javap -c -p' ya da 'strings' ile aninda okunur.  Tum degerler sentetiktir.
public class AcikSabit {
    private static final String GIZLI = "sunucu-anahtari-9F3A";

    public static void main(String[] args) {
        System.out.println("Acik sabit    : " + GIZLI);
    }
}
