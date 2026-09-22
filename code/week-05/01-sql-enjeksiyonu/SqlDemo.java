// CEN429 - Hafta 5 - Demo 1: SQL enjeksiyonu (Java, JDBC + PreparedStatement)
//
// Bu program java.sql arayuzunu kullanir. Derlemek icin ek bir sey gerekmez
// (java.sql JDK ile gelir). CALISTIRMAK icin bir SQLite JDBC surucusu gerekir;
// onu 'hazirla.sh' / 'hazirla.ps1' Maven Central'dan SABIT surum + SHA-256
// dogrulamasiyla lib/ altina indirir. Surucu yoksa demo bunu soyler ve atlar.
//
// Veritabani BELLEKTE (jdbc:sqlite::memory:) kurulur; diske ya da sisteme
// hicbir sey yazilmaz. Butun degerler sentetiktir.
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class SqlDemo {

    static void cizgi() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static void veritabaniKur(Connection db) throws SQLException {
        try (Statement st = db.createStatement()) {
            st.execute("CREATE TABLE kullanici ("
                    + " id INTEGER PRIMARY KEY, ad TEXT, parola TEXT,"
                    + " rol TEXT, gizli_not TEXT)");
            st.execute("INSERT INTO kullanici (ad,parola,rol,gizli_not) VALUES"
                    + " ('ayse','parola123','kullanici','Ayse ozel notu'),"
                    + " ('mehmet','1234','kullanici','Mehmet ozel notu'),"
                    + " ('admin','S3cr3t-Admin','yonetici','Yonetici siri')");
        }
    }

    // KOTU: girdiyi dogrudan SQL metnine gomer (Statement + dize birlestirme).
    static void girisKotu(Connection db, String ad, String parola) {
        String sql = "SELECT id, ad, rol FROM kullanici"
                + " WHERE ad = '" + ad + "' AND parola = '" + parola + "'";
        System.out.println("   Uretilen SQL:");
        System.out.println("   " + sql);
        try (Statement st = db.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            sonucYaz(rs);
        } catch (SQLException e) {
            System.out.println("   (SQL hatasi: " + e.getMessage() + ")");
        }
    }

    // IYI: parametreli sorgu. Girdi asla komut yapisinin parcasi olamaz.
    static void girisGuvenli(Connection db, String ad, String parola) {
        String sql = "SELECT id, ad, rol FROM kullanici"
                + " WHERE ad = ? AND parola = ?";
        System.out.println("   Uretilen SQL (sablon):");
        System.out.println("   " + sql + "   [degerler ayrica gonderilir]");
        try (PreparedStatement ps = db.prepareStatement(sql)) {
            ps.setString(1, ad);
            ps.setString(2, parola);
            try (ResultSet rs = ps.executeQuery()) {
                sonucYaz(rs);
            }
        } catch (SQLException e) {
            System.out.println("   (SQL hatasi: " + e.getMessage() + ")");
        }
    }

    static void sonucYaz(ResultSet rs) throws SQLException {
        int say = 0;
        StringBuilder sb = new StringBuilder();
        while (rs.next()) {
            say++;
            sb.append("      id=").append(rs.getInt("id"))
              .append(" ad=").append(rs.getString("ad"))
              .append(" rol=").append(rs.getString("rol")).append('\n');
        }
        if (say == 0) {
            System.out.println("   -> Sonuc yok. GIRIS REDDEDILDI.");
        } else {
            System.out.println("   -> " + say + " satir dondu. GIRIS BASARILI:");
            System.out.print(sb);
        }
    }

    public static void main(String[] args) {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            System.out.println("SQLite JDBC surucusu bulunamadi.");
            System.out.println("Once surucuyu indirin:  sh hazirla.sh  (ya da"
                    + "  .\\hazirla.ps1 )");
            System.out.println("Python demosu (sqli.py) surucusuz de calisir.");
            return;
        }
        try (Connection db = DriverManager.getConnection(
                "jdbc:sqlite::memory:")) {
            veritabaniKur(db);

            cizgi();
            System.out.println("ADIM 1 - Durust giris: ad='ayse'"
                    + " parola='parola123'");
            System.out.println("[KOTU YOL]");
            girisKotu(db, "ayse", "parola123");
            System.out.println("[IYI YOL]");
            girisGuvenli(db, "ayse", "parola123");

            cizgi();
            System.out.println("ADIM 2 - SALDIRI: parola alanina  ' OR '1'='1");
            String p = "' OR '1'='1";
            System.out.println("[KOTU YOL]  <-- parolayi bilmeden");
            girisKotu(db, "ayse", p);
            System.out.println("   ^ Parola bilinmeden giris: yapisi degisti.");
            System.out.println("[IYI YOL]");
            girisGuvenli(db, "ayse", p);
            System.out.println("   ^ Girdi bir DEGER olarak arandi: RED.");

            cizgi();
            System.out.println("ADIM 3 - SALDIRI: yonetici satirini cekme");
            String ad = "' OR rol='yonetici' --";
            System.out.println("[KOTU YOL]");
            girisKotu(db, ad, "farketmez");
            System.out.println("   ^ Baska kullanicinin satiri sizdirildi.");
            System.out.println("[IYI YOL]");
            girisGuvenli(db, ad, "farketmez");
            System.out.println("   ^ Boyle bir ad yok: sizinti yok.");

            cizgi();
            System.out.println("Sonuc: PreparedStatement kullan; girdi asla"
                    + " komut yapisini degistiremez.");
        } catch (SQLException e) {
            System.out.println("Baglanti hatasi: " + e.getMessage());
        }
    }
}
