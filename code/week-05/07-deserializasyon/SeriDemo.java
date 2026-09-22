// CEN429 - Hafta 5 - Demo 7: Guvenli seri durumdan cikarma (deserialization)
//
// Guvenilmez veriyi filtresiz cozmek TEHLIKELIDIR: gelen bayt akisi, bekledigimiz
// disinda siniflar olusturabilir (gadget zinciri -> uzaktan kod calistirma).
// Bu demo ZARARLI zincir YAZMAZ; yalnizca cozumu gosterir: ObjectInputFilter ile
// yalnizca BEKLENEN siniflara izin ver (allow-list), gerisini reddet.
//
// Butun siniflar zararsizdir (sadece veri tutar). Diske/aga/sisteme dokunulmaz.
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InvalidClassException;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

public class SeriDemo {

    // BEKLENEN (izinli) sinif: sadece iki alan tutar.
    static class Ayar implements Serializable {
        private static final long serialVersionUID = 1L;
        String ad;
        int deger;
        Ayar(String ad, int deger) { this.ad = ad; this.deger = deger; }
        public String toString() { return "Ayar(ad=" + ad + ", deger=" + deger + ")"; }
    }

    // BEKLENMEYEN sinif: gercek saldirida bir "gadget" olurdu; burada zararsiz.
    static class BaskaSinif implements Serializable {
        private static final long serialVersionUID = 1L;
        String yuk = "beklenmeyen-sinif";
        public String toString() { return "BaskaSinif(yuk=" + yuk + ")"; }
    }

    static void cizgi() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static byte[] serilestir(Object o) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(o);
        }
        return bos.toByteArray();
    }

    // KOTU: filtre yok. Akistaki HER sinif olusturulur.
    static void cozKotu(byte[] veri, String etiket) {
        try (ObjectInputStream ois = new ObjectInputStream(
                new ByteArrayInputStream(veri))) {
            Object o = ois.readObject();
            System.out.println("   [" + etiket + "] KABUL -> " + o
                    + "  (" + o.getClass().getSimpleName() + ")");
        } catch (Exception e) {
            System.out.println("   [" + etiket + "] hata: " + e.getClass()
                    .getSimpleName());
        }
    }

    // IYI: yalnizca Ayar + java.base siniflarina izin ver; gerisini reddet.
    static void cozGuvenli(byte[] veri, String etiket) {
        ObjectInputFilter filtre = ObjectInputFilter.Config.createFilter(
                "SeriDemo$Ayar;java.base/*;!*");
        try (ObjectInputStream ois = new ObjectInputStream(
                new ByteArrayInputStream(veri))) {
            ois.setObjectInputFilter(filtre);
            Object o = ois.readObject();
            System.out.println("   [" + etiket + "] KABUL -> " + o);
        } catch (InvalidClassException e) {
            System.out.println("   [" + etiket + "] REDDEDILDI (filtre): "
                    + "beklenmeyen sinif engellendi.");
        } catch (Exception e) {
            System.out.println("   [" + etiket + "] REDDEDILDI: "
                    + e.getClass().getSimpleName());
        }
    }

    public static void main(String[] args) throws Exception {
        byte[] beklenen = serilestir(new Ayar("zaman-asimi", 30));
        byte[] beklenmeyen = serilestir(new BaskaSinif());

        cizgi();
        System.out.println("ADIM 1 - FILTRESIZ cozme (kotu): her sinif kabul");
        cozKotu(beklenen, "beklenen Ayar");
        cozKotu(beklenmeyen, "beklenmeyen BaskaSinif");
        System.out.println("   ^ Filtre olmadan gelen HER sinif olusturulur;");
        System.out.println("     gercekte bu bir gadget zinciri olabilirdi.");

        cizgi();
        System.out.println("ADIM 2 - ObjectInputFilter ile (iyi): allow-list");
        cozGuvenli(beklenen, "beklenen Ayar");
        cozGuvenli(beklenmeyen, "beklenmeyen BaskaSinif");
        System.out.println("   ^ Yalnizca beklenen sinif gecti; digeri reddedildi.");

        cizgi();
        System.out.println("Sonuc: Guvenilmez veriyi filtresiz cozme. En iyisi:");
        System.out.println("Java yerine JSON gibi VERI bicimleri kullan; zorunluysa");
        System.out.println("ObjectInputFilter ile siniflari allow-list yap.");
    }
}
