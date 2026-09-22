// CEN429 - Hafta 5 - Demo 2: Komut enjeksiyonu (Java)
//
// Bir "selamlama araci" bir kullanici adini disari veren bir programa iletir.
//   KOTU  : komut tek bir DIZE olarak kabuga (sh -c / cmd /c) verilir. Girdideki
//           ;  ya da  &  gibi ayiraclar kabukta EK KOMUT baslatir.
//   IYI   : ProcessBuilder'a arguman LISTESI verilir; kabuk yoktur, girdi tek
//           bir arguman olarak, veri gibi gecer. Ayrica izin listesi ile dogrula.
//
// Enjekte edilen komut yalnizca ZARARSIZ bir mesaj basar (echo). Hicbir dosya
// silinmez/degistirilmez; ag kullanilmaz; yonetici yetkisi istenmez.
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

public class KomutDemo {

    static final boolean WINDOWS =
            System.getProperty("os.name").toLowerCase().contains("win");
    // Kontrollu "dis arac": bin/ altindaki Yazici sinifini calistiran java.
    // PATH'teki 'java' kullanilir (bosluklu mutlak yol kabuk dizesini bozardi).
    static final String JAVA = "java";
    // Izin listesi: yalnizca harf, rakam ve alt cizgi (varsayilan-reddet).
    static final Pattern IZINLI = Pattern.compile("^[A-Za-z0-9_]+$");

    static void cizgi() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static void ciktiYaz(Process p) throws Exception {
        try (BufferedReader r = new BufferedReader(
                new InputStreamReader(p.getInputStream()))) {
            String satir;
            while ((satir = r.readLine()) != null) {
                System.out.println("   | " + satir);
            }
        }
        p.waitFor();
    }

    // KOTU: kullanici adi kabuk komut DIZESINE gomulur.
    static void calistirKotu(String ad) throws Exception {
        String komut = JAVA + " -cp bin Yazici Merhaba " + ad;
        String[] cmd = WINDOWS
                ? new String[] {"cmd", "/c", komut}
                : new String[] {"sh", "-c", komut};
        System.out.println("   Kabuga giden komut:");
        System.out.println("   " + komut);
        ciktiYaz(Runtime.getRuntime().exec(cmd));
    }

    // IYI: arguman listesi; kabuk yok. Once izin listesiyle dogrula.
    static void calistirGuvenli(String ad) throws Exception {
        if (!IZINLI.matcher(ad).matches()) {
            System.out.println("   Izin listesi REDDETTI (^[A-Za-z0-9_]+$):");
            System.out.println("   girdi = " + ad);
            System.out.println("   -> Program hic calistirilmadi.");
            return;
        }
        List<String> cmd = new ArrayList<>();
        cmd.add(JAVA);
        cmd.add("-cp");
        cmd.add("bin");
        cmd.add("Yazici");
        cmd.add("Merhaba");
        cmd.add(ad);
        System.out.println("   ProcessBuilder arguman listesi:");
        System.out.println("   " + cmd);
        ciktiYaz(new ProcessBuilder(cmd).redirectErrorStream(true).start());
    }

    public static void main(String[] args) throws Exception {
        String sep = WINDOWS ? "& " : "; ";
        String zararsiz = "echo SIZDI-KOMUT-ENJEKSIYONU";

        cizgi();
        System.out.println("ADIM 1 - Durust girdi: ad = 'Ayse'");
        System.out.println("[KOTU YOL]");
        calistirKotu("Ayse");
        System.out.println("[IYI YOL]");
        calistirGuvenli("Ayse");

        cizgi();
        System.out.println("ADIM 2 - SALDIRI: ad iceriginde ek komut var");
        String kotuAd = "Ayse " + sep + zararsiz;
        System.out.println("   ad = " + kotuAd);
        System.out.println("[KOTU YOL]  <-- kabuk ikinci komutu da calistirir");
        calistirKotu(kotuAd);
        System.out.println("   ^ 'SIZDI...' satiri = enjekte edilen komut kostu.");
        System.out.println("[IYI YOL]  <-- ayni girdi zararsiz bir metin olur");
        calistirGuvenli(kotuAd);
        System.out.println("   ^ Izin listesi bosluk/;/& gordu ve reddetti.");

        cizgi();
        System.out.println("Sonuc: Kabuk uzerinden komut kurma (Runtime.exec"
                + " ile dize). ProcessBuilder + arguman listesi + izin listesi"
                + " kullan.");
    }
}
