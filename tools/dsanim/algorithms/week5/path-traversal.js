// CEN429 — Week 5 — Demo 3 (code/week-05/03-path-traversal/PathDemo.java, path_traversal.py)
// A requested path is resolved one segment at a time against a served root folder: an ordinary name
// descends one level, '.' is a no-op, and '..' goes up one level — but if '..' is asked for while
// already AT the root, that request tries to leave the served folder entirely (CWE-22). The insecure
// path never checks for this; the secure path canonicalizes the result and rejects anything that would
// end up outside the root.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var JAVA_SRC = [
    '// CEN429 - Week 5 - Demo 3: path traversal (Java)',
    '//',
    '// A "file server" should only ever hand out files under output/data/.',
    '//   BAD  : the request is appended straight onto the root; ../secret.txt',
    '//          escapes OUTSIDE the root.',
    '//   GOOD : the path is canonicalized (normalize + toRealPath) and checked to',
    '//          still be INSIDE the root; an absolute path / drive letter is also',
    '//          rejected.',
    '//',
    '// ALL files are produced under the demo folder\'s output/; nothing is ever',
    '// written or read outside it. All content is synthetic.',
    'import java.io.IOException;',
    'import java.nio.file.Files;',
    'import java.nio.file.Path;',
    'import java.nio.file.Paths;',
    '',
    'public class PathDemo {',
    '',
    '    static void line() {',
    '        System.out.println("--------------------------------------------"',
    '                + "------------------");',
    '    }',
    '',
    '    static void prepare(Path root, Path secret) throws IOException {',
    '        Files.createDirectories(root);',
    '        Files.write(root.resolve("report.txt"),',
    '                "Public report (synthetic).\\n".getBytes("UTF-8"));',
    '        Files.write(secret,',
    '                "SECRET: synthetic admin note (outside the root).\\n"',
    '                        .getBytes("UTF-8"));',
    '    }',
    '',
    '    // BAD: no check at all. The request is appended to the root and read.',
    '    static void readBad(Path root, String request) {',
    '        try {',
    '            Path target = root.resolve(request);',
    '            byte[] content = Files.readAllBytes(target);',
    '            System.out.println("   Resolved path: " + target.normalize());',
    '            System.out.println("   READ -> " + new String(content, "UTF-8")',
    '                    .trim());',
    '        } catch (IOException e) {',
    '            System.out.println("   (Read error: " + e.getMessage() + ")");',
    '        }',
    '    }',
    '',
    '    // GOOD (the security check itself, as a pure function): canonicalize the',
    '    // request against the root and decide whether it stays inside. No file is',
    '    // read here, only path arithmetic + the existence checks canonicalization',
    '    // itself needs, so this can be unit-tested directly. Returns null when the',
    '    // request is rejected, or the safe, canonical path when it is accepted.',
    '    static Path resolveSafely(Path root, String request) throws IOException {',
    '        Path rootReal = root.toRealPath();',
    '        Path requestPath = Paths.get(request);',
    '        if (requestPath.isAbsolute()) {',
    '            return null;   // absolute path / drive letter: rejected',
    '        }',
    '        Path candidate = rootReal.resolve(requestPath).normalize();',
    '        // toRealPath also resolves symlinks; if the file does not exist yet we',
    '        // trust normalize() instead (there is nothing left to resolve).',
    '        Path real = Files.exists(candidate) ? candidate.toRealPath() : candidate;',
    '        if (!real.startsWith(rootReal)) {',
    '            return null;   // escapes outside the root: rejected',
    '        }',
    '        return real;',
    '    }',
    '',
    '    // GOOD: canonicalize + root check + absolute-path rejection, then read.',
    '    static void readSecure(Path root, String request) {',
    '        try {',
    '            Path safe = resolveSafely(root, request);',
    '            if (safe == null) {',
    '                Path rootReal = root.toRealPath();',
    '                Path requestPath = Paths.get(request);',
    '                if (requestPath.isAbsolute()) {',
    '                    System.out.println("   REJECTED: absolute path / drive letter.");',
    '                } else {',
    '                    Path candidate = rootReal.resolve(requestPath).normalize();',
    '                    System.out.println("   REJECTED: escapes outside the root -> "',
    '                            + candidate);',
    '                }',
    '                return;',
    '            }',
    '            byte[] content = Files.readAllBytes(safe);',
    '            System.out.println("   Resolved path: " + safe);',
    '            System.out.println("   READ -> " + new String(content, "UTF-8")',
    '                    .trim());',
    '        } catch (IOException e) {',
    '            System.out.println("   (Read error: " + e.getMessage() + ")");',
    '        }',
    '    }',
    '',
    '    public static void main(String[] args) throws IOException {',
    '        Path base = Paths.get("output");',
    '        Path root = base.resolve("data");',
    '        Path secret = base.resolve("secret.txt");',
    '        prepare(root, secret);',
    '',
    '        line();',
    '        System.out.println("Root folder (only this should ever be served): " + root);',
    '        System.out.println("STEP 1 - Legitimate request: \'report.txt\'");',
    '        System.out.println("[BAD WAY]");',
    '        readBad(root, "report.txt");',
    '        System.out.println("[GOOD WAY]");',
    '        readSecure(root, "report.txt");',
    '',
    '        line();',
    '        System.out.println("STEP 2 - ATTACK: \'../secret.txt\' (outside the root)");',
    '        System.out.println("[BAD WAY]");',
    '        readBad(root, ".." + java.io.File.separator + "secret.txt");',
    '        System.out.println("   ^ The secret file outside the root was leaked.");',
    '        System.out.println("[GOOD WAY]");',
    '        readSecure(root, ".." + java.io.File.separator + "secret.txt");',
    '        System.out.println("   ^ Canonicalization + root check blocked it.");',
    '',
    '        line();',
    '        System.out.println("STEP 3 - ATTACK (Windows): \'..\\\\secret.txt\' and"',
    '                + " a mixed separator");',
    '        System.out.println("[GOOD WAY] request = \'../secret.txt\'");',
    '        readSecure(root, "../secret.txt");',
    '        System.out.println("[GOOD WAY] request = an absolute-path attempt");',
    '        readSecure(root, java.io.File.listRoots()[0] + "Windows");',
    '',
    '        line();',
    '        System.out.println("Result: appending the user\'s path to the root and reading it"',
    '                + " is unsafe. Verify with normalize()+toRealPath()+a root check.");',
    '    }',
    '}'
  ];
  var PY_SRC = [
    '# -*- coding: utf-8 -*-',
    '# CEN429 - Week 5 - Demo 3: path traversal (Python, pathlib)',
    '#',
    '#   BAD  : the request is appended straight onto the root; ../secret.txt',
    '#          escapes OUTSIDE the root.',
    '#   GOOD : the path is canonicalized with .resolve() and checked to still be',
    '#          INSIDE the root (Path.is_relative_to); an absolute path is rejected.',
    '#',
    '# ALL files are produced under the demo folder\'s output/; nothing is ever',
    '# read outside it. NO DOWNLOAD REQUIRED.',
    'import os',
    'import sys',
    'from pathlib import Path',
    '',
    'HERE = Path(__file__).resolve().parent',
    'BASE = HERE / "output"',
    'ROOT = BASE / "data"',
    'SECRET = BASE / "secret.txt"',
    '',
    '',
    'def line():',
    '    print("-" * 62)',
    '',
    '',
    'def prepare():',
    '    ROOT.mkdir(parents=True, exist_ok=True)',
    '    (ROOT / "report.txt").write_text(',
    '        "Public report (synthetic).\\n", encoding="utf-8")',
    '    SECRET.write_text(',
    '        "SECRET: synthetic admin note (outside the root).\\n", encoding="utf-8")',
    '',
    '',
    'def read_bad(request):',
    '    # No check at all. The request is appended to the root and read.',
    '    target = ROOT / request',
    '    try:',
    '        content = target.read_text(encoding="utf-8").strip()',
    '        print("   Resolved path: " + os.path.normpath(str(target)))',
    '        print("   READ -> " + content)',
    '    except OSError as err:',
    '        print("   (Read error: " + str(err) + ")")',
    '',
    '',
    'def is_within_root(candidate, root):',
    '    # Python 3.9+: is_relative_to. Fallback for older versions.',
    '    try:',
    '        return candidate.is_relative_to(root)',
    '    except AttributeError:',
    '        return os.path.commonpath([str(candidate), str(root)]) == str(root)',
    '',
    '',
    'def resolve_safely(request):',
    '    """GOOD (the security check itself, as a pure function): canonicalize the',
    '    request against ROOT and decide whether it stays inside. Returns None when',
    '    the request is rejected, or the safe, canonical Path when accepted."""',
    '    root = ROOT.resolve()',
    '    if os.path.isabs(request):',
    '        return None   # absolute path / drive letter: rejected',
    '    candidate = (root / request).resolve()',
    '    if not is_within_root(candidate, root):',
    '        return None   # escapes outside the root: rejected',
    '    return candidate',
    '',
    '',
    'def read_secure(request):',
    '    safe = resolve_safely(request)',
    '    if safe is None:',
    '        if os.path.isabs(request):',
    '            print("   REJECTED: absolute path / drive letter.")',
    '        else:',
    '            candidate = (ROOT.resolve() / request).resolve()',
    '            print("   REJECTED: escapes outside the root -> " + str(candidate))',
    '        return',
    '    try:',
    '        content = safe.read_text(encoding="utf-8").strip()',
    '        print("   Resolved path: " + str(safe))',
    '        print("   READ -> " + content)',
    '    except OSError as err:',
    '        print("   (Read error: " + str(err) + ")")',
    '',
    '',
    'def main():',
    '    prepare()',
    '',
    '    line()',
    '    print("Root folder (only this should ever be served): " + str(ROOT))',
    '    print("STEP 1 - Legitimate request: \'report.txt\'")',
    '    print("[BAD WAY]")',
    '    read_bad("report.txt")',
    '    print("[GOOD WAY]")',
    '    read_secure("report.txt")',
    '',
    '    line()',
    '    print("STEP 2 - ATTACK: \'../secret.txt\' (outside the root)")',
    '    print("[BAD WAY]")',
    '    read_bad(os.path.join("..", "secret.txt"))',
    '    print("   ^ The secret file outside the root was leaked.")',
    '    print("[GOOD WAY]")',
    '    read_secure(os.path.join("..", "secret.txt"))',
    '    print("   ^ resolve() + root check blocked it.")',
    '',
    '    line()',
    '    print("STEP 3 - ATTACK: an absolute-path attempt")',
    '    print("[GOOD WAY] request = an absolute path")',
    '    bad = "C:\\\\Windows" if os.name == "nt" else "/etc/hostname"',
    '    read_secure(bad)',
    '',
    '    line()',
    '    print("Result: appending the user\'s path to the root and reading it is")',
    '    print("unsafe. Verify with resolve() + a root check + rejecting absolute paths.")',
    '',
    '',
    'if __name__ == "__main__":',
    '    sys.exit(main())'
  ];

  // ------------------------------------------------------------------ data + reference
  function mk(request, secure) { return { request: request, secure: !!secure }; }
  function segmentsOf(request) { return request.split('/').filter(function (s) { return s.length > 0; }); }

  /** Independent computation: a single left-to-right character scan (no split()/filter(), no call to
   * segmentsOf() — build() uses that shared helper for its own per-segment drawing loop, so a bug in its
   * splitting must NOT be able to hide from this check). A segment is processed the instant a '/' or the
   * end of the string is reached, WITHOUT ever materializing an array of segments: '.' is a no-op, a
   * plain name adds one level, '..' removes one level -- unless the depth is already 0, in which case
   * that '..' tries to go ABOVE the root (escapes). */
  function reference(data) {
    var s = data.request, depth = 0, escaped = false, buf = '';
    for (var i = 0; i <= s.length; i++) {
      var atSep = (i === s.length) || s.charAt(i) === '/';
      if (!atSep) { buf += s.charAt(i); continue; }
      if (buf.length) {
        if (buf === '..') { if (depth > 0) depth--; else escaped = true; }
        else if (buf !== '.') depth++;
      }
      buf = '';
    }
    if (data.secure) return { accepted: !escaped, escaped: escaped };
    return { accepted: true, escaped: escaped };
  }

  function build(S, data) {
    var request = data.request, secure = data.secure;
    var segs = segmentsOf(request);
    var CH = 34, GAP = 4, Y = 20, Y2 = 100;

    S.label('reqLbl', { x: -14, y: Y + CH / 2 + 5, text: T('istek yolu =', 'request path ='), anchor: 'end', size: 14, mono: true });
    var x = 0;
    for (var i = 0; i < segs.length; i++) {
      var w = Math.max(CH, segs[i].length * 11 + 12);
      S.box('seg' + i, { x: x, y: Y, w: w, h: CH, size: 13, mono: true, text: segs[i], style: 'dim' });
      x += w + GAP;
    }
    if (!segs.length) S.box('seg_empty', { x: 0, y: Y, w: 90, h: CH, size: 13, mono: true, text: T('(boş)', '(empty)'), style: 'dim' });

    S.label('resLbl', { x: -14, y: Y2 + CH / 2 + 5, text: T('köke göre kanonik konum =', 'canonical location relative to root ='), anchor: 'end', size: 14, mono: true });
    S.box('resolved', { x: 0, y: Y2, w: 220, h: CH, size: 14, mono: true, text: T('(kök)', '(root)'), style: 'active' });

    S.at(null);
    S.step(T((secure ? '`resolveSafely(root, request)`' : '`readBad(root, request)`') + ' çağrılır: köke göre `' + request + '` çözülmeye başlanıyor.',
              (secure ? '`resolveSafely(root, request)`' : '`readBad(root, request)`') + ' is called: resolving `' + request + '` against the root begins.'),
           secure ? { java: [51, 52], py: [52, 56] } : { java: [32, 34], py: [33, 34] });

    var stack = [], escapedEver = false;
    for (i = 0; i < segs.length; i++) {
      var seg = segs[i];
      S.set('seg' + i, { style: 'active' });
      S.at(i);
      if (seg === '.') {
        S.step(T('Öğe ' + (i + 1) + ': `.` — "aynı klasör" anlamına gelir, konum değişmez.',
                  'element ' + (i + 1) + ': `.` — means "same folder", the location does not change.'),
               secure ? { java: [57], py: [59] } : { java: [34], py: [34] });
      } else if (seg === '..') {
        if (stack.length) {
          var popped = stack.pop();
          S.set('seg' + i, { style: 'new' });
          S.step(T('Öğe ' + (i + 1) + ': `..` — bir üst klasöre çıkılıyor (`' + popped + '`\'dan geri). Hâlâ kökün İÇİNDE.',
                    'element ' + (i + 1) + ': `..` — goes up one folder (back out of `' + popped + '`). Still INSIDE the root.'),
                 secure ? { java: [57], py: [59] } : { java: [34], py: [34] });
        } else {
          escapedEver = true;
          S.set('seg' + i, { style: 'del' });
          S.set('resolved', { style: 'del' });
          S.step(T('Öğe ' + (i + 1) + ': `..` — ama zaten KÖKTEYİZ. Bu istek kökün DIŞINA çıkmaya çalışıyor!',
                    'element ' + (i + 1) + ': `..` — but we are already AT the root. This request tries to go OUTSIDE the root!'),
                 secure ? { java: [57], py: [59] } : { java: [34], py: [34] });
        }
      } else {
        stack.push(seg);
        S.set('seg' + i, { style: 'new' });
        S.step(T('Öğe ' + (i + 1) + ': `' + seg + '` — bir alt klasöre iniliyor.',
                  'element ' + (i + 1) + ': `' + seg + '` — descends into a subfolder.'),
               secure ? { java: [57], py: [59] } : { java: [34], py: [34] });
      }
      S.set('resolved', { text: stack.length ? stack.join('/') : T('(kök)', '(root)'), style: escapedEver ? 'del' : 'active' });
    }
    S.at(null);
    S.result = reference(data);

    if (secure) {
      if (escapedEver) {
        S.set('resolved', { style: 'del' });
        S.step(T('Sonuç: kanoniklleştirilmiş yol kökün dışına çıktığı için `resolveSafely` `null` döndürür — istek REDDEDİLİR.',
                  'Result: since the canonicalized path lands outside the root, `resolveSafely` returns `null` — the request is REJECTED.'),
               { java: [{ n: 61, note: T('gerçek yol kökle mi başlıyor? hayır → reddet', 'does the real path start with the root? no → reject') }, 62, { n: 64, skip: true }],
                 py: [{ n: 60, note: T('aday kökün içinde mi? hayır → reddet', 'is the candidate inside the root? no → reject') }, 61, { n: 62, skip: true }] });
      } else {
        S.set('resolved', { style: 'new' });
        S.step(T('Sonuç: kanoniklleştirilmiş yol hâlâ kökün İÇİNDE — `resolveSafely` gerçek yolu döndürür, dosya okunur.',
                  'Result: the canonicalized path is still INSIDE the root — `resolveSafely` returns the real path, the file is read.'),
               { java: [{ n: 61, note: T('gerçek yol kökle mi başlıyor? evet → izin ver', 'does the real path start with the root? yes → allow') }, { n: 62, skip: true }, 64],
                 py: [{ n: 60, note: T('aday kökün içinde mi? evet → izin ver', 'is the candidate inside the root? yes → allow') }, { n: 61, skip: true }, 62] });
      }
    } else {
      if (escapedEver) {
        S.step(T('Sonuç: hiçbir denetim yapılmadığı için dosya YİNE DE okunur — kökün dışındaki bir dosya sızdırılır.',
                  'Result: since there is no check at all, the file is read ANYWAY — a file outside the root is leaked.'),
               { java: [34, 35, 36], py: [34, 35, 36] });
      } else {
        S.step(T('Sonuç: bu istek kökün dışına çıkmadı, ama bu yol yine de GÜVENLİ SAYILMAZ — hiçbir zaman denetlenmiyor.',
                  'Result: this particular request did not escape the root, but this path is still NOT considered SAFE — it is never checked at all.'),
               { java: [34, 35, 36], py: [34, 35, 36] });
      }
    }
  }

  D.define({
    id: 'path-traversal',
    title: T('Yol geçişi: kanonikleştirme ve kök denetimi (PathDemo.java)', 'Path traversal: canonicalization and the root check (PathDemo.java)'),
    code: function () { return { java: JAVA_SRC, py: PY_SRC }; },
    presets: [
      { id: 'normal-subpath', level: 'normal',
        name: T('Normal: alt klasördeki meşru bir dosya', 'Normal: a legitimate file in a subfolder'),
        data: mk('reports/2026/summary.txt', false) },
      { id: 'hard-parent-escape', level: 'hard',
        name: T('Zor: `../secret.txt` — doğrudan kökün dışına', 'Hard: `../secret.txt` — straight outside the root'),
        data: mk('../secret.txt', false) },
      { id: 'edge-descend-then-escape', level: 'edge',
        name: T('Uç durum: önce alt klasöre in, sonra iki kez çık', 'Edge case: descend into a subfolder, then go up twice'),
        data: mk('sub/../../secret.txt', false) },
      { id: 'edge-secure-rejects', level: 'edge',
        name: T('Uç durum: güvenli sürüm `../secret.txt`\'i reddediyor', 'Edge case: the secure version rejects `../secret.txt`'),
        data: mk('../secret.txt', true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.request.length; },
    random: function (level, r) {
      var words = ['reports', 'archive', 'images', 'data-files', 'documents', 'notes', 'invoices', 'backups'];
      function w() { return words[D.randInt(r, 0, words.length - 1)]; }
      function joinN(n) { var a = []; for (var i = 0; i < n; i++) a.push(w()); return a.join('/'); }
      if (level === 'easy') return mk(joinN(D.randInt(r, 1, 2)) + '-file.txt', false);
      if (level === 'normal') return mk(joinN(D.randInt(r, 2, 3)) + '-file.txt', false);
      if (level === 'hard') {
        var n = D.randInt(r, 1, 3), ups = [];
        for (var i = 0; i < n; i++) ups.push('..');
        return mk(ups.join('/') + '/' + joinN(1) + '-file.txt', false);
      }
      var n2 = D.randInt(r, 0, 3), parts = [];
      for (var j = 0; j < n2; j++) parts.push('..');
      parts.push(joinN(D.randInt(r, 1, 2)) + '-file.txt');
      return mk(parts.join('/'), true);
    },
    input: {
      hint: T('istek yolu (isteğe bağlı: "SECURE " ile başlat → güvenli sürüm)', 'request path (optionally start with "SECURE " → secure version)'),
      format: function (data) { return (data.secure ? 'SECURE ' : '') + data.request; },
      tokens: function (data) { return segmentsOf(data.request); },
      parse: function (text) {
        var s = String(text), secure = false;
        if (/^SECURE\s+/i.test(s)) { secure = true; s = s.replace(/^SECURE\s+/i, ''); }
        if (!s.length) throw T('Yol boş olamaz.', 'The path cannot be empty.');
        if (s.length > 60) throw T('Yol en fazla 60 karakter olabilir.', 'The path may be at most 60 characters.');
        if (!/^[A-Za-z0-9_.\/-]+$/.test(s)) throw T('Yalnızca harf, rakam, `_`, `-`, `.` ve `/` kullanın.', 'Use only letters, digits, `_`, `-`, `.` and `/`.');
        return mk(s, secure);
      },
      bad: ['', 'x'.repeat(80), 'has space', 'bad*char?.txt']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
