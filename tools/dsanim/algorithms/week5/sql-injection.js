// CEN429 — Week 5 — Demo 1 (code/week-05/01-sql-injection/SqlDemo.java, sql_injection.py)
// A password value is appended into a SQL query. When it is glued into the query TEXT
// (string concatenation), any single quote in it closes the string literal early — everything
// after that quote is no longer DATA, it becomes SQL SYNTAX (CWE-89). A parameterized query never
// concatenates at all: the value travels to the database engine on the side, so it can never
// change the query's shape, no matter what characters it contains.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var JAVA_SRC = [
    '// CEN429 - Week 5 - Demo 1: SQL injection (Java, JDBC + PreparedStatement)',
    '//',
    '// This program uses the java.sql interface. Nothing extra is needed to COMPILE',
    '// (java.sql ships with the JDK). To RUN it, a SQLite JDBC driver is needed;',
    '// \'prepare.sh\' / \'prepare.ps1\' download it from Maven Central at a PINNED',
    '// version, verified by SHA-256, into lib/. If the driver is missing the demo',
    '// says so and skips the Java section.',
    '//',
    '// The database is created IN MEMORY (jdbc:sqlite::memory:); nothing is written',
    '// to disk or to the system. Every value is synthetic.',
    'import java.sql.Connection;',
    'import java.sql.DriverManager;',
    'import java.sql.PreparedStatement;',
    'import java.sql.ResultSet;',
    'import java.sql.SQLException;',
    'import java.sql.Statement;',
    '',
    'public class SqlDemo {',
    '',
    '    static void line() {',
    '        System.out.println("--------------------------------------------"',
    '                + "------------------");',
    '    }',
    '',
    '    static void setUpDatabase(Connection db) throws SQLException {',
    '        try (Statement st = db.createStatement()) {',
    '            st.execute("CREATE TABLE user ("',
    '                    + " id INTEGER PRIMARY KEY, name TEXT, password TEXT,"',
    '                    + " role TEXT, secret_note TEXT)");',
    '            st.execute("INSERT INTO user (name,password,role,secret_note) VALUES"',
    '                    + " (\'alice\',\'password123\',\'user\',\'Alice private note\'),"',
    '                    + " (\'bob\',\'1234\',\'user\',\'Bob private note\'),"',
    '                    + " (\'admin\',\'S3cr3t-Admin\',\'admin\',\'Admin secret\')");',
    '        }',
    '    }',
    '',
    '    // BAD: builds the SQL text by string concatenation. This is a pure function',
    '    // (no database access) precisely so its output can be unit-tested: it shows',
    '    // the exact text that gets sent to the database engine, character for character.',
    '    static String buildBadQuery(String name, String password) {',
    '        return "SELECT id, name, role FROM user"',
    '                + " WHERE name = \'" + name + "\' AND password = \'" + password + "\'";',
    '    }',
    '',
    '    // GOOD: the parameterized query template never changes shape, no matter what',
    '    // name/password are given -- there is nothing to concatenate. Also a pure',
    '    // function, kept separate from execution for the same testing reason.',
    '    static String buildSecureQuery() {',
    '        return "SELECT id, name, role FROM user WHERE name = ? AND password = ?";',
    '    }',
    '',
    '    // BAD: embeds the input directly into the SQL text (Statement + string concatenation).',
    '    static void loginBad(Connection db, String name, String password) {',
    '        String sql = buildBadQuery(name, password);',
    '        System.out.println("   Generated SQL:");',
    '        System.out.println("   " + sql);',
    '        try (Statement st = db.createStatement();',
    '             ResultSet rs = st.executeQuery(sql)) {',
    '            printResult(rs);',
    '        } catch (SQLException e) {',
    '            System.out.println("   (SQL error: " + e.getMessage() + ")");',
    '        }',
    '    }',
    '',
    '    // GOOD: parameterized query. Input can never become part of the command structure.',
    '    static void loginSecure(Connection db, String name, String password) {',
    '        String sql = buildSecureQuery();',
    '        System.out.println("   Generated SQL (template):");',
    '        System.out.println("   " + sql + "   [values sent separately]");',
    '        try (PreparedStatement ps = db.prepareStatement(sql)) {',
    '            ps.setString(1, name);',
    '            ps.setString(2, password);',
    '            try (ResultSet rs = ps.executeQuery()) {',
    '                printResult(rs);',
    '            }',
    '        } catch (SQLException e) {',
    '            System.out.println("   (SQL error: " + e.getMessage() + ")");',
    '        }',
    '    }',
    '',
    '    static void printResult(ResultSet rs) throws SQLException {',
    '        int count = 0;',
    '        StringBuilder sb = new StringBuilder();',
    '        while (rs.next()) {',
    '            count++;',
    '            sb.append("      id=").append(rs.getInt("id"))',
    '              .append(" name=").append(rs.getString("name"))',
    '              .append(" role=").append(rs.getString("role")).append(\'\\n\');',
    '        }',
    '        if (count == 0) {',
    '            System.out.println("   -> No rows. LOGIN REJECTED.");',
    '        } else {',
    '            System.out.println("   -> " + count + " row(s) returned. LOGIN SUCCESSFUL:");',
    '            System.out.print(sb);',
    '        }',
    '    }',
    '',
    '    public static void main(String[] args) {',
    '        try {',
    '            Class.forName("org.sqlite.JDBC");',
    '        } catch (ClassNotFoundException e) {',
    '            System.out.println("SQLite JDBC driver not found.");',
    '            System.out.println("Download the driver first:  sh prepare.sh  (or"',
    '                    + "  .\\\\prepare.ps1 )");',
    '            System.out.println("The Python demo (sql_injection.py) works without the driver.");',
    '            return;',
    '        }',
    '        try (Connection db = DriverManager.getConnection(',
    '                "jdbc:sqlite::memory:")) {',
    '            setUpDatabase(db);',
    '',
    '            line();',
    '            System.out.println("STEP 1 - Honest login: name=\'alice\'"',
    '                    + " password=\'password123\'");',
    '            System.out.println("[BAD WAY]");',
    '            loginBad(db, "alice", "password123");',
    '            System.out.println("[GOOD WAY]");',
    '            loginSecure(db, "alice", "password123");',
    '',
    '            line();',
    '            System.out.println("STEP 2 - ATTACK: password field is  \' OR \'1\'=\'1");',
    '            String p = "\' OR \'1\'=\'1";',
    '            System.out.println("[BAD WAY]  <-- without knowing the password");',
    '            loginBad(db, "alice", p);',
    '            System.out.println("   ^ Logged in without knowing the password: structure changed.");',
    '            System.out.println("[GOOD WAY]");',
    '            loginSecure(db, "alice", p);',
    '            System.out.println("   ^ Input was searched for as a VALUE: rejected.");',
    '',
    '            line();',
    '            System.out.println("STEP 3 - ATTACK: pulling the admin row");',
    '            String name = "\' OR role=\'admin\' --";',
    '            System.out.println("[BAD WAY]");',
    '            loginBad(db, name, "doesn\'t matter");',
    '            System.out.println("   ^ Another user\'s row was leaked.");',
    '            System.out.println("[GOOD WAY]");',
    '            loginSecure(db, name, "doesn\'t matter");',
    '            System.out.println("   ^ No such name exists: no leak.");',
    '',
    '            line();',
    '            System.out.println("Result: use PreparedStatement; input can never"',
    '                    + " change the command\'s structure.");',
    '        } catch (SQLException e) {',
    '            System.out.println("Connection error: " + e.getMessage());',
    '        }',
    '    }',
    '}'
  ];
  var PY_SRC = [
    '# -*- coding: utf-8 -*-',
    '# CEN429 - Week 5 - Demo 1: SQL injection (Python, built-in sqlite3)',
    '#',
    '# This program needs NO DOWNLOAD: sqlite3 ships with Python. It creates a',
    '# small database at \'output/demo.db\' inside the demo folder, then runs the',
    '# same login two ways:',
    '#   1) BAD  : embeds the user input into the SQL text by string concatenation.',
    '#   2) GOOD : uses a parameterized query (question mark); input is only a VALUE.',
    '#',
    '# The attack only ever touches this demo\'s own database; no system file is',
    '# touched, no network is used. Every value is synthetic.',
    'import os',
    'import sqlite3',
    'import sys',
    '',
    'HERE = os.path.dirname(os.path.abspath(__file__))',
    'OUTPUT = os.path.join(HERE, "output")',
    'DB_PATH = os.path.join(OUTPUT, "demo.db")',
    '',
    '',
    'def line():',
    '    print("-" * 62)',
    '',
    '',
    'def set_up_database():',
    '    """Build a small user table from scratch (synthetic data)."""',
    '    if os.path.isdir(OUTPUT):',
    '        # Clean up a database left over from a previous run.',
    '        if os.path.isfile(DB_PATH):',
    '            os.remove(DB_PATH)',
    '    else:',
    '        os.makedirs(OUTPUT)',
    '    db = sqlite3.connect(DB_PATH)',
    '    db.execute(',
    '        "CREATE TABLE user ("',
    '        " id INTEGER PRIMARY KEY,"',
    '        " name TEXT,"',
    '        " password TEXT,"',
    '        " role TEXT,"',
    '        " secret_note TEXT)"',
    '    )',
    '    db.executemany(',
    '        "INSERT INTO user (name, password, role, secret_note) VALUES (?,?,?,?)",',
    '        [',
    '            ("alice", "password123", "user", "Alice private note"),',
    '            ("bob", "1234", "user", "Bob private note"),',
    '            ("admin", "S3cr3t-Admin", "admin", "Admin secret key"),',
    '        ],',
    '    )',
    '    db.commit()',
    '    return db',
    '',
    '',
    'def build_bad_query(name, password):',
    '    """BAD: the SQL text built by string concatenation. Pure function (no',
    '    database access) so its exact output is unit-testable."""',
    '    return (',
    '        "SELECT id, name, role FROM user "',
    '        "WHERE name = \'" + name + "\' AND password = \'" + password + "\'"',
    '    )',
    '',
    '',
    'def build_secure_query():',
    '    """GOOD: the fixed parameterized template; it never depends on the',
    '    caller\'s values, so there is nothing to concatenate."""',
    '    return "SELECT id, name, role FROM user WHERE name = ? AND password = ?"',
    '',
    '',
    'def login_bad(db, name, password):',
    '    """BAD: embeds the input directly into the SQL text (string concatenation)."""',
    '    query = build_bad_query(name, password)',
    '    print("   Generated SQL:")',
    '    print("   " + query)',
    '    try:',
    '        rows = db.execute(query).fetchall()',
    '    except sqlite3.Error as err:',
    '        print("   (SQL error: " + str(err) + ")")',
    '        return []',
    '    return rows',
    '',
    '',
    'def login_secure(db, name, password):',
    '    """GOOD: parameterized query; input can never become part of the command."""',
    '    query = build_secure_query()',
    '    print("   Generated SQL (template):")',
    '    print("   " + query + "   [values sent separately]")',
    '    return db.execute(query, (name, password)).fetchall()',
    '',
    '',
    'def print_result(rows):',
    '    if not rows:',
    '        print("   -> No rows. LOGIN REJECTED.")',
    '        return',
    '    print("   -> " + str(len(rows)) + " row(s) returned. LOGIN SUCCESSFUL:")',
    '    for r in rows:',
    '        print("      id=" + str(r[0]) + " name=" + r[1] + " role=" + r[2])',
    '',
    '',
    'def main():',
    '    db = set_up_database()',
    '',
    '    line()',
    '    print("STEP 1 - Honest user: name=\'alice\' password=\'password123\'")',
    '    print("[BAD WAY]")',
    '    print_result(login_bad(db, "alice", "password123"))',
    '    print("[GOOD WAY]")',
    '    print_result(login_secure(db, "alice", "password123"))',
    '',
    '    line()',
    '    print("STEP 2 - ATTACK: password field set to  \' OR \'1\'=\'1")',
    '    attacker_password = "\' OR \'1\'=\'1"',
    '    print("[BAD WAY]  <-- expecting a login without knowing the password")',
    '    print_result(login_bad(db, "alice", attacker_password))',
    '    print("   ^ Logged in without knowing the password: query structure changed.")',
    '    print("[GOOD WAY]")',
    '    print_result(login_secure(db, "alice", attacker_password))',
    '    print("   ^ Input was searched for as a VALUE; no such password exists: rejected.")',
    '',
    '    line()',
    '    print("STEP 3 - ATTACK: pulling the admin row through the name field")',
    '    print("         name =  \' OR role=\'admin\' --")',
    '    attacker_name = "\' OR role=\'admin\' --"',
    '    print("[BAD WAY]")',
    '    print_result(login_bad(db, attacker_name, "doesn\'t matter"))',
    '    print("   ^ Another user\'s (admin\'s) row was leaked.")',
    '    print("[GOOD WAY]")',
    '    print_result(login_secure(db, attacker_name, "doesn\'t matter"))',
    '    print("   ^ No such name exists: no leak.")',
    '',
    '    line()',
    '    print("STEP 4 - Why isn\'t \'escaping\' enough by itself?")',
    '    print("   Naive fix: double every single quote ( \' -> \'\' ).")',
    '    print("   But it does nothing when the input sits in a NUMBER context (no")',
    '    print("   quotes at all); escaping rules also differ between databases.")',
    '    print("   The correct fix is ALWAYS a parameterized query (question mark).")',
    '',
    '    db.close()',
    '    line()',
    '    print("Result: do NOT embed input into SQL text. Use a parameterized query;")',
    '    print("input can then never change the command\'s structure.")',
    '',
    '',
    'if __name__ == "__main__":',
    '    sys.exit(main())'
  ];

  // ------------------------------------------------------------------ data + reference
  function mk(value, secure) { return { value: value, secure: !!secure }; }

  /** Independent computation (plain string search, does NOT call build()'s per-character loop):
   * the string literal closes at the FIRST single quote in `value`; everything from there on is
   * no longer data. A parameterized query never concatenates, so it never breaks out at all. */
  function reference(data) {
    if (data.secure) return { breaksOut: false, injected: '' };
    var i = data.value.indexOf('\'');
    if (i < 0) return { breaksOut: false, injected: '' };
    return { breaksOut: true, injected: data.value.slice(i) };
  }

  function build(S, data) {
    var value = data.value, secure = data.secure;
    var CW = 26, CH = 34, GAP = 3, Y = 30;

    S.label('rowLbl', { x: -14, y: Y + CH / 2 + 5, text: T('SQL metni şimdiye kadar =', 'SQL text so far ='), anchor: 'end', size: 14, mono: true });

    if (secure) {
      S.box('tpl', { x: 0, y: Y, w: 260, h: CH, size: 13, mono: true, style: 'dim', text: "... WHERE password = ?" });
      S.label('tplNote', { x: 130, y: Y - 16, text: T('şablon SABİT — hiçbir girdiye bakmaz', 'template is FIXED — it looks at no input'), anchor: 'middle', size: 12, bold: true });
      S.at(null);
      S.step(T('`buildSecureQuery()` çağrılır: döndürdüğü metin sabittir; `password` değerine hiç bakmaz.',
                '`buildSecureQuery()` is called: the text it returns is fixed; it never looks at the `password` value.'),
             { java: [48, 49], py: [63, 66] });

      var pw = Math.max(70, value.length * 11 + 16);
      S.label('paramLbl', { x: -14, y: Y + 76 + CH / 2 + 5, text: T('parametre değeri =', 'parameter value ='), anchor: 'end', size: 14, mono: true });
      S.box('param', { x: 0, y: Y + 76, w: pw, h: CH, size: 14, mono: true, style: 'active', text: value });
      S.brace('paramBrace', { from: 'param', to: 'param', text: T('motora AYRICA gönderilir', 'sent to the engine SEPARATELY'), side: 'bottom' });
      S.step(T('`' + value + '` motora bir DEĞER olarak, sorgu metninin dışında gönderilir.',
                '`' + value + '` is sent to the engine as a VALUE, outside the query text.'),
             { java: [56, 57, 58, 59], py: [43, 46] });

      S.result = reference(data);
      S.step(T('İçinde tek tırnak olsa bile: parametre asla sorgunun YAPISINI değiştiremez. Şablon her zaman aynı kalır.',
                'Even if it contains a quote character: a parameter can never change the query\'s STRUCTURE. The template always stays the same.'),
             { java: [48, 49], py: [66] });

      // Real decision printResult()/print_result() makes: this is decidable here (unlike the
      // vulnerable path's arbitrary injected SQL) because a parameter is ALWAYS compared as a plain
      // value — alice's only row has password 'password123', from the same setUpDatabase() seed data.
      var matchesSecure = (value === 'password123');
      var noteSecureTr = 'count == 0? ' + (matchesSecure
        ? 'hayır — parametre alice\'in gerçek parolasıyla birebir eşleşti, 1 satır döndü'
        : 'evet — parametre alice\'in gerçek parolasıyla eşleşmedi, 0 satır döndü');
      var noteSecureEn = 'count == 0? ' + (matchesSecure
        ? 'no — the parameter matched alice\'s real password exactly, 1 row returned'
        : 'yes — the parameter did not match alice\'s real password, 0 rows returned');
      var noteSecure = T(noteSecureTr, noteSecureEn);
      S.step(matchesSecure
               ? T('`printResult`: LOGIN SUCCESSFUL yazdırılır — ama bu, girdinin SQL YAPISINI değil yalnızca DEĞERİNİ doğru vermesinden kaynaklanır.',
                    '`printResult` prints LOGIN SUCCESSFUL — but only because the parameter\'s VALUE happened to be correct, not because it changed the SQL\'s STRUCTURE.')
               : T('`printResult`: LOGIN REJECTED yazdırılır — parametre farklı bir metin olsa bile sorgunun yapısı asla bozulmadı.',
                    '`printResult` prints LOGIN REJECTED — even though the parameter is different text, the query\'s structure was never broken.'),
             { java: matchesSecure
                 ? [{ n: 90, note: noteSecure }, { n: 91, skip: true }, 93]
                 : [{ n: 90, note: noteSecure }, 91, { n: 93, skip: true }],
               py: matchesSecure
                 ? [{ n: 91, note: noteSecure }, { n: 92, skip: true }, 94]
                 : [{ n: 91, note: noteSecure }, 92, { n: 94, skip: true }] });
      return;
    }

    // ---------------------------------------------------------------- vulnerable (string concatenation)
    var breakAt = -1;
    for (var k = 0; k < value.length; k++) {
      if (value.charAt(k) === '\'' && breakAt < 0) breakAt = k;
    }

    var x = 0;
    var preW = 190;
    S.box('pre', { x: x, y: Y, w: preW, h: CH, size: 12, mono: true, style: 'dim', text: "...password = '" });
    x += preW + GAP;
    S.step(T('`buildBadQuery(name, password)` çağrılır: sabit metin `password` değeriyle DİZE BİRLEŞTİRMEYLE birleştirilecek.',
              '`buildBadQuery(name, password)` is called: the fixed text is about to be joined to `password` by STRING CONCATENATION.'),
           { java: [40, 41], py: [54, 57, 58] });

    for (k = 0; k < value.length; k++) {
      var ch = value.charAt(k);
      var isCode = breakAt >= 0 && k >= breakAt;
      S.box('v' + k, { x: x, y: Y, w: CW, h: CH, size: 14, mono: true, text: ch, style: isCode ? 'del' : 'active' });
      x += CW + GAP;
      S.at(k);
      if (k === breakAt) {
        S.step(T('Karakter ' + (k + 1) + ': `\'` — dize burada erken KAPANIYOR. Bundan sonrası artık VERİ değil, SQL SÖZ DİZİMİNİN bir parçası.',
                  'character ' + (k + 1) + ': `\'` — the string literal CLOSES early right here. Everything from here on is no longer DATA, it is part of the SQL SYNTAX.'),
               { java: [42], py: [59] });
      } else if (isCode) {
        S.step(T('Karakter ' + (k + 1) + ': `' + ch + '` artık sorgunun KOD kısmında, veritabanı motoru tarafından yorumlanıyor.',
                  'character ' + (k + 1) + ': `' + ch + '` is now in the query\'s CODE part, interpreted by the database engine.'),
               { java: [42], py: [59] });
      } else {
        S.step(T('Karakter ' + (k + 1) + ': `' + ch + '` hâlâ sıradan bir VERİ baytı olarak ekleniyor.',
                  'character ' + (k + 1) + ': `' + ch + '` is still appended as an ordinary DATA byte.'),
               { java: [42], py: [59] });
      }
    }
    S.at(null);
    S.box('suf', { x: x, y: Y, w: 26, h: CH, size: 14, mono: true, style: breakAt >= 0 ? 'del' : 'dim', text: "'" });
    S.result = reference(data);
    if (breakAt >= 0) {
      S.step(T('Sonuç: saldırgan METNİ değiştirdi. Enjekte edilen parça: `' + S.result.injected + '`. Bu artık veritabanı motoru tarafından SQL KODU olarak çalıştırılır.',
                'Result: the attacker changed the TEXT. The injected fragment: `' + S.result.injected + '`. The database engine now runs this as SQL CODE.'),
             { java: [42], py: [59] });
    } else {
      S.step(T('Sonuç: girdide tek tırnak yok; sorgunun yapısı bu kez değişmedi — ama bu yol yine de GÜVENLİ SAYILMAZ (parametreli sorgu değil).',
                'Result: the input has no quote character; the query\'s structure did not change this time — but this path is still NOT considered SAFE (it is not a parameterized query).'),
             { java: [42], py: [59] });

      // Real decision printResult()/print_result() makes. Only decidable HERE (structure unchanged,
      // breakAt < 0): the text is compared exactly as if it were a plain value, so the same literal
      // comparison as the secure path applies. (When breakAt >= 0 the structure changed and what the
      // database engine's parser does with the injected text is NOT predictable from character count
      // alone, so no such claim is made for that case — see the `if (breakAt >= 0)` branch above.)
      var matchesBad = (value === 'password123');
      var noteBadTr = 'count == 0? ' + (matchesBad
        ? 'hayır — bu metin alice\'in gerçek parolasıyla birebir aynı, 1 satır döndü'
        : 'evet — bu metin alice\'in gerçek parolasından farklı, 0 satır döndü');
      var noteBadEn = 'count == 0? ' + (matchesBad
        ? 'no — this text is identical to alice\'s real password, 1 row returned'
        : 'yes — this text differs from alice\'s real password, 0 rows returned');
      var noteBad = T(noteBadTr, noteBadEn);
      S.step(matchesBad
               ? T('`printResult`: LOGIN SUCCESSFUL yazdırılır — çünkü metin tesadüfen alice\'in gerçek parolasıyla aynı, yapı değil değer eşleşti.',
                    '`printResult` prints LOGIN SUCCESSFUL — because the text happens to equal alice\'s real password; the VALUE matched, not the structure.')
               : T('`printResult`: LOGIN REJECTED yazdırılır — sorgu yapısı değişmediği için metin sıradan bir değer olarak karşılaştırıldı ve eşleşmedi.',
                    '`printResult` prints LOGIN REJECTED — since the query\'s structure did not change, the text was compared as an ordinary value and did not match.'),
             { java: matchesBad
                 ? [{ n: 90, note: noteBad }, { n: 91, skip: true }, 93]
                 : [{ n: 90, note: noteBad }, 91, { n: 93, skip: true }],
               py: matchesBad
                 ? [{ n: 91, note: noteBad }, { n: 92, skip: true }, 94]
                 : [{ n: 91, note: noteBad }, 92, { n: 94, skip: true }] });
    }
  }

  D.define({
    id: 'sql-injection',
    title: T('SQL enjeksiyonu: dize birleştirme mi, parametreli sorgu mu? (SqlDemo.java)', 'SQL injection: string concatenation vs. a parameterized query (SqlDemo.java)'),
    code: function () { return { java: JAVA_SRC, py: PY_SRC }; },
    presets: [
      { id: 'normal-benign', level: 'normal',
        name: T('Normal: zararsız parola, tırnak yok', 'Normal: a benign password, no quote'),
        data: mk('password123', false) },
      { id: 'hard-classic-bypass', level: 'hard',
        name: T('Zor: klasik atlatma, `\' OR \'1\'=\'1`', 'Hard: the classic bypass, `\' OR \'1\'=\'1`'),
        data: mk("' OR '1'='1", false) },
      { id: 'edge-mid-quote', level: 'edge',
        name: T('Uç durum: tırnak baştan değil, 2. karakterden başlıyor', 'Edge case: the quote is not first, it starts at character 2'),
        data: mk("x' OR '1'='1", false) },
      { id: 'edge-secure-any-quote', level: 'edge', small: true,
        name: T('Uç durum: parametreli sorgu — tek karakter tırnak bile zararsız', 'Edge case: a parameterized query — even a single quote character is harmless'),
        data: mk("'", true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.value.length; },
    random: function (level, r) {
      var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
      function randStr(n) { var s = ''; for (var i = 0; i < n; i++) s += chars.charAt(D.randInt(r, 0, chars.length - 1)); return s; }
      if (level === 'easy') return mk(randStr(D.randInt(r, 10, 13)), false);
      if (level === 'normal') return mk(randStr(D.randInt(r, 10, 18)), false);
      if (level === 'hard') {
        var n = D.randInt(r, 10, 16), s = randStr(n), pos = D.randInt(r, 0, n - 1);
        return mk(s.slice(0, pos) + '\'' + s.slice(pos), false);
      }
      var n2 = D.randInt(r, 10, 20), s2 = randStr(n2);
      if (D.randInt(r, 0, 1) === 1) { var p2 = D.randInt(r, 0, n2 - 1); s2 = s2.slice(0, p2) + '\'' + s2.slice(p2); }
      return mk(s2, true);
    },
    input: {
      hint: T('parola değeri (isteğe bağlı: "SECURE " ile başlat → parametreli sorgu)', 'password value (optionally start with "SECURE " → parameterized query)'),
      format: function (data) { return (data.secure ? 'SECURE ' : '') + data.value; },
      tokens: function (data) { return data.value.split(''); },
      parse: function (text) {
        var s = String(text), secure = false;
        if (/^SECURE\s+/i.test(s)) { secure = true; s = s.replace(/^SECURE\s+/i, ''); }
        if (!s.length) throw T('Değer boş olamaz.', 'The value cannot be empty.');
        if (s.length > 40) throw T('Değer en fazla 40 karakter olabilir.', 'The value may be at most 40 characters.');
        if (!/^[\x20-\x7e]+$/.test(s)) throw T('Yalnızca yazdırılabilir ASCII karakterler kullanın.', 'Use printable ASCII characters only.');
        return mk(s, secure);
      },
      bad: ['', 'x'.repeat(50), 'a\tb', 'a\nb']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
