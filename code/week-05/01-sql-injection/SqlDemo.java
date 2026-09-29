// CEN429 - Week 5 - Demo 1: SQL injection (Java, JDBC + PreparedStatement)
//
// This program uses the java.sql interface. Nothing extra is needed to COMPILE
// (java.sql ships with the JDK). To RUN it, a SQLite JDBC driver is needed;
// 'prepare.sh' / 'prepare.ps1' download it from Maven Central at a PINNED
// version, verified by SHA-256, into lib/. If the driver is missing the demo
// says so and skips the Java section.
//
// The database is created IN MEMORY (jdbc:sqlite::memory:); nothing is written
// to disk or to the system. Every value is synthetic.
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class SqlDemo {

    static void line() {
        System.out.println("--------------------------------------------"
                + "------------------");
    }

    static void setUpDatabase(Connection db) throws SQLException {
        try (Statement st = db.createStatement()) {
            st.execute("CREATE TABLE user ("
                    + " id INTEGER PRIMARY KEY, name TEXT, password TEXT,"
                    + " role TEXT, secret_note TEXT)");
            st.execute("INSERT INTO user (name,password,role,secret_note) VALUES"
                    + " ('alice','password123','user','Alice private note'),"
                    + " ('bob','1234','user','Bob private note'),"
                    + " ('admin','S3cr3t-Admin','admin','Admin secret')");
        }
    }

    // BAD: builds the SQL text by string concatenation. This is a pure function
    // (no database access) precisely so its output can be unit-tested: it shows
    // the exact text that gets sent to the database engine, character for character.
    static String buildBadQuery(String name, String password) {
        return "SELECT id, name, role FROM user"
                + " WHERE name = '" + name + "' AND password = '" + password + "'";
    }

    // GOOD: the parameterized query template never changes shape, no matter what
    // name/password are given -- there is nothing to concatenate. Also a pure
    // function, kept separate from execution for the same testing reason.
    static String buildSecureQuery() {
        return "SELECT id, name, role FROM user WHERE name = ? AND password = ?";
    }

    // BAD: embeds the input directly into the SQL text (Statement + string concatenation).
    static void loginBad(Connection db, String name, String password) {
        String sql = buildBadQuery(name, password);
        System.out.println("   Generated SQL:");
        System.out.println("   " + sql);
        try (Statement st = db.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            printResult(rs);
        } catch (SQLException e) {
            System.out.println("   (SQL error: " + e.getMessage() + ")");
        }
    }

    // GOOD: parameterized query. Input can never become part of the command structure.
    static void loginSecure(Connection db, String name, String password) {
        String sql = buildSecureQuery();
        System.out.println("   Generated SQL (template):");
        System.out.println("   " + sql + "   [values sent separately]");
        try (PreparedStatement ps = db.prepareStatement(sql)) {
            ps.setString(1, name);
            ps.setString(2, password);
            try (ResultSet rs = ps.executeQuery()) {
                printResult(rs);
            }
        } catch (SQLException e) {
            System.out.println("   (SQL error: " + e.getMessage() + ")");
        }
    }

    static void printResult(ResultSet rs) throws SQLException {
        int count = 0;
        StringBuilder sb = new StringBuilder();
        while (rs.next()) {
            count++;
            sb.append("      id=").append(rs.getInt("id"))
              .append(" name=").append(rs.getString("name"))
              .append(" role=").append(rs.getString("role")).append('\n');
        }
        if (count == 0) {
            System.out.println("   -> No rows. LOGIN REJECTED.");
        } else {
            System.out.println("   -> " + count + " row(s) returned. LOGIN SUCCESSFUL:");
            System.out.print(sb);
        }
    }

    public static void main(String[] args) {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            System.out.println("SQLite JDBC driver not found.");
            System.out.println("Download the driver first:  sh prepare.sh  (or"
                    + "  .\\prepare.ps1 )");
            System.out.println("The Python demo (sql_injection.py) works without the driver.");
            return;
        }
        try (Connection db = DriverManager.getConnection(
                "jdbc:sqlite::memory:")) {
            setUpDatabase(db);

            line();
            System.out.println("STEP 1 - Honest login: name='alice'"
                    + " password='password123'");
            System.out.println("[BAD WAY]");
            loginBad(db, "alice", "password123");
            System.out.println("[GOOD WAY]");
            loginSecure(db, "alice", "password123");

            line();
            System.out.println("STEP 2 - ATTACK: password field is  ' OR '1'='1");
            String p = "' OR '1'='1";
            System.out.println("[BAD WAY]  <-- without knowing the password");
            loginBad(db, "alice", p);
            System.out.println("   ^ Logged in without knowing the password: structure changed.");
            System.out.println("[GOOD WAY]");
            loginSecure(db, "alice", p);
            System.out.println("   ^ Input was searched for as a VALUE: rejected.");

            line();
            System.out.println("STEP 3 - ATTACK: pulling the admin row");
            String name = "' OR role='admin' --";
            System.out.println("[BAD WAY]");
            loginBad(db, name, "doesn't matter");
            System.out.println("   ^ Another user's row was leaked.");
            System.out.println("[GOOD WAY]");
            loginSecure(db, name, "doesn't matter");
            System.out.println("   ^ No such name exists: no leak.");

            line();
            System.out.println("Result: use PreparedStatement; input can never"
                    + " change the command's structure.");
        } catch (SQLException e) {
            System.out.println("Connection error: " + e.getMessage());
        }
    }
}
