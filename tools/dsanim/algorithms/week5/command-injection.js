// CEN429 — Week 5 — Demo 2 (code/week-05/02-command-injection/CommandDemo.java, command_injection.py)
// A name value is handed to an external program. When it is glued into a single shell command STRING
// (Runtime.exec(String) / subprocess shell=True), the shell tokenizes that whole string itself: a bare
// ';' or '&' token is not "just another argument" to the shell, it ends the current command and starts a
// NEW one (CWE-78). An argv LIST (ProcessBuilder / subprocess with a list) never goes through a shell's
// tokenizer at all: the whole value arrives as exactly one argv element, no matter what it contains.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var JAVA_SRC = [
    '// CEN429 - Week 5 - Demo 2: command injection (Java)',
    '//',
    '// A "greeting tool" passes a user name to an external program.',
    '//   BAD  : the command is given to the shell (sh -c / cmd /c) as a single',
    '//          STRING. Separators like \';\' or \'&\' in the input start an EXTRA',
    '//          command in the shell.',
    '//   GOOD : ProcessBuilder is given an argument LIST; there is no shell, the',
    '//          input passes through as a single argument, like data. It is also',
    '//          checked against an allow-list first.',
    '//',
    '// The injected command only ever prints a HARMLESS message (echo). No file is',
    '// deleted/changed; no network is used; no administrator privilege is needed.',
    'import java.io.BufferedReader;',
    'import java.io.InputStreamReader;',
    'import java.util.ArrayList;',
    'import java.util.List;',
    'import java.util.regex.Pattern;',
    '',
    'public class CommandDemo {',
    '',
    '    static final boolean WINDOWS =',
    '            System.getProperty("os.name").toLowerCase().contains("win");',
    '    // The controlled "external tool": java running the Printer class in bin/.',
    '    // The \'java\' on PATH is used (an absolute path with spaces would break the',
    '    // shell command string).',
    '    static final String JAVA = "java";',
    '    // Allow-list: only letters, digits and underscore (default-deny).',
    '    static final Pattern ALLOWED = Pattern.compile("^[A-Za-z0-9_]+$");',
    '',
    '    static void line() {',
    '        System.out.println("--------------------------------------------"',
    '                + "------------------");',
    '    }',
    '',
    '    static void printOutput(Process p) throws Exception {',
    '        try (BufferedReader r = new BufferedReader(',
    '                new InputStreamReader(p.getInputStream()))) {',
    '            String out;',
    '            while ((out = r.readLine()) != null) {',
    '                System.out.println("   | " + out);',
    '            }',
    '        }',
    '        p.waitFor();',
    '    }',
    '',
    '    // BAD: builds the single shell command STRING. Pure function (no process',
    '    // is started here) so the exact text handed to the shell can be unit-tested.',
    '    static String buildBadCommand(String name) {',
    '        return JAVA + " -cp bin Printer Hello " + name;',
    '    }',
    '',
    '    // GOOD: the allow-list check, as a pure predicate. Default-deny: anything',
    '    // that is not letters/digits/underscore is rejected, including the',
    '    // separators a shell would treat specially (space, ; & | `).',
    '    static boolean isAllowed(String name) {',
    '        return ALLOWED.matcher(name).matches();',
    '    }',
    '',
    '    // GOOD: the exact argument list ProcessBuilder would run. Pure function so',
    '    // it can be unit-tested without starting a process; there is no shell',
    '    // involved, so \'name\' is never re-parsed -- it is exactly one element.',
    '    static List<String> buildSecureArgs(String name) {',
    '        List<String> cmd = new ArrayList<>();',
    '        cmd.add(JAVA);',
    '        cmd.add("-cp");',
    '        cmd.add("bin");',
    '        cmd.add("Printer");',
    '        cmd.add("Hello");',
    '        cmd.add(name);',
    '        return cmd;',
    '    }',
    '',
    '    // BAD: the user name is embedded into a shell command STRING.',
    '    static void runBad(String name) throws Exception {',
    '        String command = buildBadCommand(name);',
    '        String[] cmd = WINDOWS',
    '                ? new String[] {"cmd", "/c", command}',
    '                : new String[] {"sh", "-c", command};',
    '        System.out.println("   Command sent to the shell:");',
    '        System.out.println("   " + command);',
    '        printOutput(Runtime.getRuntime().exec(cmd));',
    '    }',
    '',
    '    // GOOD: argument list; no shell. Validated against the allow-list first.',
    '    static void runSecure(String name) throws Exception {',
    '        if (!isAllowed(name)) {',
    '            System.out.println("   Allow-list REJECTED it (^[A-Za-z0-9_]+$):");',
    '            System.out.println("   input = " + name);',
    '            System.out.println("   -> The program was never run.");',
    '            return;',
    '        }',
    '        List<String> cmd = buildSecureArgs(name);',
    '        System.out.println("   ProcessBuilder argument list:");',
    '        System.out.println("   " + cmd);',
    '        printOutput(new ProcessBuilder(cmd).redirectErrorStream(true).start());',
    '    }',
    '',
    '    public static void main(String[] args) throws Exception {',
    '        String sep = WINDOWS ? "& " : "; ";',
    '        String harmless = "echo LEAKED-COMMAND-INJECTION";',
    '',
    '        line();',
    '        System.out.println("STEP 1 - Honest input: name = \'Alice\'");',
    '        System.out.println("[BAD WAY]");',
    '        runBad("Alice");',
    '        System.out.println("[GOOD WAY]");',
    '        runSecure("Alice");',
    '',
    '        line();',
    '        System.out.println("STEP 2 - ATTACK: name contains an extra command");',
    '        String badName = "Alice " + sep + harmless;',
    '        System.out.println("   name = " + badName);',
    '        System.out.println("[BAD WAY]  <-- the shell also runs the second command");',
    '        runBad(badName);',
    '        System.out.println("   ^ The \'LEAKED...\' line = the injected command ran.");',
    '        System.out.println("[GOOD WAY]  <-- the same input is just harmless text");',
    '        runSecure(badName);',
    '        System.out.println("   ^ The allow-list saw a space/;/& and rejected it.");',
    '',
    '        line();',
    '        System.out.println("Result: building a command through the shell (Runtime.exec"',
    '                + " with a string) is dangerous. Use ProcessBuilder + argument list"',
    '                + " + an allow-list.");',
    '    }',
    '}'
  ];
  var PY_SRC = [
    '# -*- coding: utf-8 -*-',
    '# CEN429 - Week 5 - Demo 2: command injection (Python)',
    '#',
    '#   BAD  : subprocess ... shell=True  ->  input goes to the shell as text;',
    '#          \';\' or \'&\' starts an extra command.',
    '#   GOOD : subprocess ... [argument list]  ->  no shell; input is one argument.',
    '#',
    '# The injected command only ever prints a HARMLESS message. No file is',
    '# deleted/changed; no network is used. NO DOWNLOAD REQUIRED.',
    'import os',
    'import re',
    'import subprocess',
    'import sys',
    '',
    'WINDOWS = os.name == "nt"',
    'ALLOWED = re.compile(r"^[A-Za-z0-9_]+$")',
    '',
    '',
    'def line():',
    '    print("-" * 62)',
    '',
    '',
    'def print_output(completed):',
    '    for out in (completed.stdout or "").splitlines():',
    '        print("   | " + out)',
    '',
    '',
    'def build_bad_command(name):',
    '    """BAD: the single shell command STRING. Pure function (no process',
    '    started), kept separate so the exact text handed to the shell is testable."""',
    '    if WINDOWS:',
    '        return "echo TOOL OUTPUT: Hello " + name',
    '    return \'echo "TOOL OUTPUT: Hello" \' + name',
    '',
    '',
    'def is_allowed(name):',
    '    """GOOD: the allow-list predicate. Default-deny: anything that is not',
    '    letters/digits/underscore is rejected, including shell separators."""',
    '    return ALLOWED.match(name) is not None',
    '',
    '',
    'def build_secure_args(name):',
    '    """GOOD: the exact argument list subprocess would run. No shell is',
    '    involved, so \'name\' is never re-parsed -- it is exactly one element."""',
    '    return [sys.executable, "-c",',
    '            "import sys; print(\'TOOL OUTPUT: Hello\', sys.argv[1])", name]',
    '',
    '',
    'def run_bad(name):',
    '    full = build_bad_command(name)',
    '    print("   Command sent to the shell:")',
    '    print("   " + full)',
    '    print_output(subprocess.run(full, shell=True, capture_output=True, text=True))',
    '',
    '',
    'def run_secure(name):',
    '    if not is_allowed(name):',
    '        print("   Allow-list REJECTED it (^[A-Za-z0-9_]+$):")',
    '        print("   input = " + name)',
    '        print("   -> The program was never run.")',
    '        return',
    '    cmd = build_secure_args(name)',
    '    print("   Argument list:")',
    '    print("   [python, -c, ...] ... \'" + name + "\'")',
    '    print_output(subprocess.run(cmd, capture_output=True, text=True))',
    '',
    '',
    'def main():',
    '    sep = "& " if WINDOWS else "; "',
    '    harmless = "echo LEAKED-COMMAND-INJECTION"',
    '',
    '    line()',
    '    print("STEP 1 - Honest input: name = \'Alice\'")',
    '    print("[BAD WAY]")',
    '    run_bad("Alice")',
    '    print("[GOOD WAY]")',
    '    run_secure("Alice")',
    '',
    '    line()',
    '    print("STEP 2 - ATTACK: name contains an extra command")',
    '    bad_name = "Alice " + sep + harmless',
    '    print("   name = " + bad_name)',
    '    print("[BAD WAY]  <-- the shell also runs the second command")',
    '    run_bad(bad_name)',
    '    print("   ^ The \'LEAKED...\' line = the injected command ran.")',
    '    print("[GOOD WAY]  <-- the same input is just harmless text")',
    '    run_secure(bad_name)',
    '    print("   ^ The allow-list saw a space/;/& and rejected it.")',
    '',
    '    line()',
    '    print("Result: shell=True + string concatenation is DANGEROUS. Use an")',
    '    print("argument list (shell=False) + an allow-list.")',
    '',
    '',
    'if __name__ == "__main__":',
    '    sys.exit(main())'
  ];

  // ------------------------------------------------------------------ data + reference
  function mk(value, secure) { return { value: value, secure: !!secure }; }
  var METACHARS = { ';': 1, '&': 1, '|': 1 };

  function tokenize(value) { return value.trim().length ? value.trim().split(/\s+/) : []; }

  /** Independent computation: a manual character scan (no split(), no call to tokenize() — build() uses
   * that shared helper for its own token-by-token drawing loop, so a bug in tokenize()'s regex must NOT
   * be able to hide from this check). Walks the raw string looking for a ';'/'&'/'|' character that has
   * whitespace (or a string edge) on BOTH sides — that is what makes it a standalone shell token instead
   * of just a character inside a word. The first such character ends the current command right there;
   * everything after it is a brand-new command, not an argument. An argv list is never tokenized by a
   * shell at all, so this never happens for the secure path. */
  function reference(data) {
    if (data.secure) return { newCommand: false, injected: '' };
    var s = data.value, n = s.length;
    for (var i = 0; i < n; i++) {
      var ch = s.charAt(i);
      if (!METACHARS[ch]) continue;
      var beforeOk = (i === 0) || /\s/.test(s.charAt(i - 1));
      var afterOk = (i === n - 1) || /\s/.test(s.charAt(i + 1));
      if (beforeOk && afterOk) {
        return { newCommand: true, boundary: i, injected: s.slice(i + 1).replace(/^\s+/, '') };
      }
    }
    return { newCommand: false, injected: '' };
  }

  function build(S, data) {
    var value = data.value, secure = data.secure;
    var CH = 34, GAP = 4, Y = 30;
    var ALLOWED_RE = /^[A-Za-z0-9_]+$/;

    if (secure) {
      // Real first line of runSecure()/run_secure(): the allow-list check runs BEFORE anything else,
      // so this must be the animation's first step too, with the real true/false outcome for `value`.
      var allowed = ALLOWED_RE.test(value);
      var nameW = Math.max(90, value.length * 9 + 16);
      S.label('nameLbl', { x: -14, y: Y + CH / 2 + 5, text: T('isAllowed\'e verilen `name` =', '`name` passed to isAllowed ='), anchor: 'end', size: 14, mono: true });
      S.box('name', { x: 0, y: Y, w: nameW, h: CH, size: 13, mono: true, style: 'active', text: value });
      S.at(null);
      S.step(T('`runSecure(name)` önce izin listesini dener: `isAllowed(name)`.',
                '`runSecure(name)` first tries the allow-list: `isAllowed(name)`.'),
             { java: [{ n: 86, note: T('isAllowed(name)? ' + (allowed ? 'evet — yalnızca harf/rakam/alt çizgi' : 'hayır — izin verilmeyen bir karakter var'),
                                        'isAllowed(name)? ' + (allowed ? 'yes — only letters/digits/underscore' : 'no — a disallowed character is present')) }],
               py: [{ n: 57, note: T('is_allowed(name)? ' + (allowed ? 'evet' : 'hayır'), 'is_allowed(name)? ' + (allowed ? 'yes' : 'no')) }] });

      if (!allowed) {
        S.set('name', { style: 'del' });
        S.label('rejLbl', { x: nameW + 20, y: Y + CH / 2 + 5, text: T('REDDEDİLDİ', 'REJECTED'), anchor: 'start', size: 14, bold: true });
        S.step(T('İzin listesi REDDETTİ: `' + value + '` yalnızca harf/rakam/alt çizgiden oluşmuyor (boşluk/`;`/`&` gibi bir karakter var).',
                  'The allow-list REJECTED it: `' + value + '` is not only letters/digits/underscore (it has a character like space/`;`/`&`).'),
               { java: [87, 88, 89, 90], py: [58, 59, 60, 61] });
        S.result = reference(data);
        S.step(T('Sonuç: fonksiyon burada `return` eder — `buildSecureArgs`/`ProcessBuilder` HİÇ ÇAĞRILMAZ; argv listesinin bağışıklığı bu girdi için hiç sınanmadı bile.',
                  'Result: the function `return`s right here — `buildSecureArgs`/`ProcessBuilder` is NEVER called; the argv list\'s immunity is not even tested for this input.'),
               { java: [{ n: 92, skip: true }], py: [{ n: 62, skip: true }] });
        return;
      }

      S.set('name', { style: 'new' });
      Y += 60;
      S.label('rowLbl', { x: -14, y: Y + CH / 2 + 5, text: T('Argv listesi (sabit önek) =', 'argv list (fixed prefix) ='), anchor: 'end', size: 14, mono: true });
      S.box('tpl', { x: 0, y: Y, w: 250, h: CH, size: 12, mono: true, style: 'dim', text: "[java, -cp, bin, Printer, Hello]" });
      S.label('tplNote', { x: 125, y: Y - 16, text: T('sabit argümanlar — kabuk hiç çalışmaz', 'fixed arguments — no shell ever runs'), anchor: 'middle', size: 12, bold: true });
      S.step(T('İzin listesi ONAYLADI — kod ret bloğunu (soluk, üstü çizili) ATLAR ve `buildSecureArgs(name)`e devam eder: ilk 5 öğe SABİTTİR, `name`\'e hiç bakmadan üretilir.',
                'The allow-list PASSED — the code SKIPS the rejection block (dimmed, struck through) and continues to `buildSecureArgs(name)`: the first 5 elements are FIXED, produced without looking at `name` at all.'),
             { java: [{ n: 87, skip: true }, { n: 88, skip: true }, { n: 89, skip: true }, { n: 90, skip: true }, 92],
               py: [{ n: 58, skip: true }, { n: 59, skip: true }, { n: 60, skip: true }, { n: 61, skip: true }, 62] });

      var pw = Math.max(90, value.length * 9 + 16);
      S.label('paramLbl', { x: -14, y: Y + 76 + CH / 2 + 5, text: T('6. argv öğesi =', 'argv element 6 ='), anchor: 'end', size: 14, mono: true });
      S.box('param', { x: 0, y: Y + 76, w: pw, h: CH, size: 13, mono: true, style: 'active', text: value });
      S.brace('paramBrace', { from: 'param', to: 'param', text: T('TEK bir argüman — kabuk tarafından hiç ayrıştırılmıyor', 'ONE single argument — never tokenized by a shell'), side: 'bottom' });
      S.step(T('`' + value + '` bütünüyle TEK argv öğesi olur; içinde boşluk, `;` ya da `&` olsa bile bölünmez.',
                '`' + value + '` becomes ONE argv element in its entirety; even with spaces, `;` or `&` inside it, it is never split.'),
             { java: [92], py: [62] });

      S.result = reference(data);
      S.step(T('Sonuç: `ProcessBuilder`/`subprocess` bu listeyi kabuk KULLANMADAN doğrudan işletim sistemine verir — ayrıştıracak bir kabuk yok.',
                'Result: ProcessBuilder/subprocess hands this list straight to the operating system WITHOUT a shell — there is no shell to do any parsing.'),
             { java: [95], py: [65] });
      return;
    }

    S.label('rowLbl', { x: -14, y: Y + CH / 2 + 5, text: T('Kabuğun gördüğü metin =', 'Text the shell sees ='), anchor: 'end', size: 14, mono: true });

    // ---------------------------------------------------------------- vulnerable (single shell string)
    var toks = tokenize(value);
    var boundary = -1;
    for (var i = 0; i < toks.length; i++) { if (METACHARS[toks[i]]) { boundary = i; break; } }

    var x = 0;
    var preW = 170;
    S.box('pre', { x: x, y: Y, w: preW, h: CH, size: 12, mono: true, style: 'dim', text: "java ... Printer Hello" });
    x += preW + GAP;
    S.step(T('`buildBadCommand(name)` çağrılır: sabit metin `name` ile DİZE BİRLEŞTİRMEYLE birleştirilip TEK bir kabuk komutu oluşturuluyor.',
              '`buildBadCommand(name)` is called: the fixed text is joined to `name` by STRING CONCATENATION into ONE shell command.'),
           { java: [48, 49], py: [28, 32, 33] });

    for (i = 0; i < toks.length; i++) {
      var tok = toks[i];
      var isNew = boundary >= 0 && i >= boundary;
      var isBoundaryTok = i === boundary;
      var w = Math.max(CH, tok.length * 11 + 12);
      S.box('t' + i, { x: x, y: Y, w: w, h: CH, size: 13, mono: true, text: tok, style: isNew ? 'del' : 'active' });
      x += w + GAP;
      S.at(i);
      if (isBoundaryTok) {
        S.step(T('Belirteç ' + (i + 1) + ': `' + tok + '` — kabuk için bu bir ARGÜMAN değil, "geçerli komut burada bitti, YENİ bir komut başlıyor" demek.',
                  'token ' + (i + 1) + ': `' + tok + '` — to the shell this is not an ARGUMENT, it means "the current command ends here, a NEW command starts".'),
               { java: [49], py: [32, 33] });
      } else if (isNew) {
        S.step(T('Belirteç ' + (i + 1) + ': `' + tok + '` artık YENİ komutun bir parçası olarak çalıştırılacak.',
                  'token ' + (i + 1) + ': `' + tok + '` will now run as part of the NEW command.'),
               { java: [49], py: [32, 33] });
      } else {
        S.step(T('Belirteç ' + (i + 1) + ': `' + tok + '` hâlâ ilk komutun sıradan bir argümanı.',
                  'token ' + (i + 1) + ': `' + tok + '` is still an ordinary argument of the first command.'),
               { java: [49], py: [32, 33] });
      }
    }
    S.at(null);
    S.result = reference(data);
    if (boundary >= 0) {
      S.step(T('Sonuç: kabuk İKİ komut çalıştırdı. İkinci (enjekte edilen) komut: `' + (S.result.injected || '(boş)') + '`.',
                'Result: the shell ran TWO commands. The second (injected) command: `' + (S.result.injected || '(empty)') + '`.'),
             { java: [49], py: [32, 33] });
    } else {
      S.step(T('Sonuç: bu girdide bir kabuk ayıracı (`;`/`&`/`|`) yok; bu kez ikinci komut başlamadı — yine de bu yol GÜVENLİ SAYILMAZ.',
                'Result: this input has no shell separator (`;`/`&`/`|`); no second command started this time — this path is still NOT considered SAFE.'),
             { java: [49], py: [32, 33] });
    }
  }

  D.define({
    id: 'command-injection',
    title: T('Komut enjeksiyonu: kabuk dizesi mi, argv listesi mi? (CommandDemo.java)', 'Command injection: a shell string vs. an argv list (CommandDemo.java)'),
    code: function () { return { java: JAVA_SRC, py: PY_SRC }; },
    presets: [
      { id: 'normal-plain-name', level: 'normal',
        name: T('Normal: sıradan bir kullanıcı adı, tek belirteç', 'Normal: an ordinary user name, a single token'),
        data: mk('Alice_Johnson_42', false) },
      { id: 'hard-semicolon', level: 'hard',
        name: T('Zor: `;` ile ikinci komut (Linux tarzı)', 'Hard: a second command via `;` (Linux-style)'),
        data: mk('Alice ; echo LEAKED', false) },
      { id: 'edge-ampersand', level: 'edge',
        name: T('Uç durum: `&` ile ikinci komut (Windows tarzı)', 'Edge case: a second command via `&` (Windows-style)'),
        data: mk('Alice & echo LEAKED-COMMAND-INJECTION', false) },
      { id: 'edge-secure-semicolon', level: 'edge',
        name: T('Uç durum: aynı zararlı girdi izin listesine ÇARPAR — argv hiç sınanmaz', 'Edge case: the same hostile input hits the allow-list FIRST — argv is never even tested'),
        data: mk('Alice ; echo LEAKED', true) },
      { id: 'edge-secure-allowed', level: 'edge',
        name: T('Uç durum: izin listesinden geçen girdi — argv listesi tek öğe olarak işletim sistemine ulaşır', 'Edge case: an input that passes the allow-list — the argv list reaches the OS as one element'),
        data: mk('Alice_Johnson_42', true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.value.length; },
    random: function (level, r) {
      var names = ['Alice', 'Bob87', 'Cem_92', 'Deniz', 'Elif_K', 'Furkan', 'GizemT', 'Hakan1'];
      var payloads = ['echo LEAKED', 'echo SECOND-CMD', 'echo OOPS', 'echo GOT-IN'];
      function name() { return names[D.randInt(r, 0, names.length - 1)] + D.randInt(r, 10, 99); }
      if (level === 'easy' || level === 'normal') {
        var base = name() + '_' + name();
        return mk(base.length >= 10 ? base : base + '_ok', false);
      }
      var sep = D.randInt(r, 0, 1) === 0 ? ';' : '&';
      var payload = payloads[D.randInt(r, 0, payloads.length - 1)];
      var v = name() + ' ' + sep + ' ' + payload;
      return mk(v, level === 'extreme');
    },
    input: {
      hint: T('ad değeri (isteğe bağlı: "SECURE " ile başlat → argv listesi)', 'name value (optionally start with "SECURE " → argv list)'),
      format: function (data) { return (data.secure ? 'SECURE ' : '') + data.value; },
      tokens: function (data) { return tokenize(data.value); },
      parse: function (text) {
        var s = String(text), secure = false;
        if (/^SECURE\s+/i.test(s)) { secure = true; s = s.replace(/^SECURE\s+/i, ''); }
        if (!s.trim().length) throw T('Değer boş olamaz.', 'The value cannot be empty.');
        if (s.length > 48) throw T('Değer en fazla 48 karakter olabilir.', 'The value may be at most 48 characters.');
        if (!/^[\x20-\x7e]+$/.test(s)) throw T('Yalnızca yazdırılabilir ASCII karakterler kullanın.', 'Use printable ASCII characters only.');
        return mk(s, secure);
      },
      bad: ['', '   ', 'x'.repeat(60), 'a\tb']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
