// CEN429 - Hafta 5 - Demo 3: Yol gecisi / path traversal (Java)
//
// Bir "dosya sunucusu" yalnizca cikti/veri/ altindaki dosyalari vermelidir.
//   KOTU  : istek dogrudan koke eklenir; ../gizli.txt kokun DISINA cikar.
//   IYI   : yol kanoniklestirilir (normalize + toRealPath) ve kokun ICINDE
//           kaldigi dogrulanir; mutlak yol / surucu harfi de reddedilir.
//
// TUM dosyalar demo klasorundeki cikti/ altinda uretilir; demo klasorunun
// disina asla cikilmaz. Butun icerik sentetiktir.
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class YolDemo {

    static void cizgi() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static void hazirla(Path kok, Path gizli) throws IOException {
        Files.createDirectories(kok);
        Files.write(kok.resolve("rapor.txt"),
                "Herkese acik rapor (sentetik).\n".getBytes("UTF-8"));
        Files.write(gizli,
                "GIZLI: sentetik yonetici notu (kok disinda).\n"
                        .getBytes("UTF-8"));
    }

    // KOTU: hicbir denetim yok. Istek koke eklenir ve okunur.
    static void okuKotu(Path kok, String istek) {
        try {
            Path hedef = kok.resolve(istek);
            byte[] icerik = Files.readAllBytes(hedef);
            System.out.println("   Cozulen yol: " + hedef.normalize());
            System.out.println("   OKUNDU -> " + new String(icerik, "UTF-8")
                    .trim());
        } catch (IOException e) {
            System.out.println("   (Okuma hatasi: " + e.getMessage() + ")");
        }
    }

    // IYI: kanoniklestir + kok denetimi + mutlak yol reddi.
    static void okuGuvenli(Path kok, String istek) {
        try {
            Path kokReal = kok.toRealPath();
            Path istekYol = Paths.get(istek);
            if (istekYol.isAbsolute()) {
                System.out.println("   REDDEDILDI: mutlak yol / surucu harfi.");
                return;
            }
            Path aday = kokReal.resolve(istekYol).normalize();
            // toRealPath link'leri de cozer; dosya yoksa normalize'e guveniriz.
            Path gercek = Files.exists(aday) ? aday.toRealPath() : aday;
            if (!gercek.startsWith(kokReal)) {
                System.out.println("   REDDEDILDI: kok disina cikiyor -> "
                        + gercek);
                return;
            }
            byte[] icerik = Files.readAllBytes(gercek);
            System.out.println("   Cozulen yol: " + gercek);
            System.out.println("   OKUNDU -> " + new String(icerik, "UTF-8")
                    .trim());
        } catch (IOException e) {
            System.out.println("   (Okuma hatasi: " + e.getMessage() + ")");
        }
    }

    public static void main(String[] args) throws IOException {
        Path taban = Paths.get("cikti");
        Path kok = taban.resolve("veri");
        Path gizli = taban.resolve("gizli.txt");
        hazirla(kok, gizli);

        cizgi();
        System.out.println("Kok klasor (yalniz buradan sunulmali): " + kok);
        System.out.println("ADIM 1 - Mesru istek: 'rapor.txt'");
        System.out.println("[KOTU YOL]");
        okuKotu(kok, "rapor.txt");
        System.out.println("[IYI YOL]");
        okuGuvenli(kok, "rapor.txt");

        cizgi();
        System.out.println("ADIM 2 - SALDIRI: '../gizli.txt' (kok disi)");
        System.out.println("[KOTU YOL]");
        okuKotu(kok, ".." + java.io.File.separator + "gizli.txt");
        System.out.println("   ^ Kok disindaki gizli dosya sizdirildi.");
        System.out.println("[IYI YOL]");
        okuGuvenli(kok, ".." + java.io.File.separator + "gizli.txt");
        System.out.println("   ^ Kanoniklestirme + kok denetimi engelledi.");

        cizgi();
        System.out.println("ADIM 3 - SALDIRI (Windows): '..\\gizli.txt' ve"
                + " karisik ayirac");
        System.out.println("[IYI YOL] istek = '../gizli.txt'");
        okuGuvenli(kok, "../gizli.txt");
        System.out.println("[IYI YOL] istek = mutlak yol denemesi");
        okuGuvenli(kok, java.io.File.listRoots()[0] + "Windows");

        cizgi();
        System.out.println("Sonuc: Kullanici yolunu koke ekleyip okuma."
                + " normalize()+toRealPath()+kok denetimi ile dogrula.");
    }
}
