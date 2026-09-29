// CEN429 — Week 1 — Demo 3 (code/week-01/03-overflow-input/login.c, login_secure.c)
// struct session { char name[16]; int admin; }; strcpy(s.name, argv[1]) copies the username BYTE BY BYTE with
// no length check. A name of 16+ characters (15 + the NUL terminator strcpy always appends) runs past the
// 16-byte buffer into `admin`, which sits right behind it in memory — and past that, into the rest of the
// stack. The secure build validates the length (and the character set) BEFORE anything is copied.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (login.c / login_secure.c)
  var VULN_C = [
    '/*',
    ' * CEN429 — Week 1 — Demo 3: Privilege escalation through overflow (VULNERABLE VERSION)',
    ' *',
    ' * Session information is kept in a struct: a 16-byte username, immediately followed by',
    ' * an "admin" flag. The username is copied with strcpy and its length is never checked.',
    ' * A name longer than 16 bytes overwrites the admin field that sits right behind it in',
    ' * memory.',
    ' *',
    ' * In memory (x86-64, little-endian):',
    ' *   offset:  0 ........................ 15 | 16 17 18 19',
    ' *            [ name[0] ............ name[15] ][ admin     ]',
    ' *',
    ' * "checked" build: on Linux, _FORTIFY_SOURCE=2; on Windows, strcpy_s (C11 Annex K) — both',
    ' * know the destination is 16 bytes, so they catch the overflow at run time.',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    'struct session {',
    '    char name[16];',
    '    int  admin;          /* 0 = normal user, non-zero = admin */',
    '};',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    if (argc != 2) {',
    '        fprintf(stderr, "Usage: %s <username>\\n", argv[0]);',
    '        return 1;',
    '    }',
    '',
    '    struct session s;',
    '    s.admin = 0;',
    '',
    '#if defined(CHECKED_BUILD) && defined(_MSC_VER)',
    '    strcpy_s(s.name, sizeof(s.name), argv[1]);   /* Windows "checked" build: a copy that knows the size */',
    '#else',
    '    strcpy(s.name, argv[1]);  /* BUG: the 16-byte destination size is never checked */',
    '#endif',
    '',
    '    printf("Welcome, %s\\n", s.name);',
    '    printf("admin field = %d (0x%08x)\\n", s.admin, (unsigned)s.admin);',
    '    if (s.admin)',
    '        printf(">>> Access granted to the ADMIN panel! <<<\\n");',
    '    else',
    '        printf("Normal user session.\\n");',
    '    return 0;',
    '}'
  ];
  var SECURE_C = [
    '/*',
    ' * CEN429 — Week 1 — Demo 3: Privilege escalation through overflow (SECURE VERSION)',
    ' *',
    ' * Fixes:',
    ' *  1) The input is validated BEFORE it is copied: length and allowed characters',
    ' *     (an allow-list — Cookbook R3.1, "basic input validation").',
    ' *  2) The copy uses snprintf, which knows the destination size.',
    ' *  3) The privilege field sits next to the user input in a separate field, starts out',
    ' *     "secure by default" (0), and only ever changes as the result of validation.',
    ' */',
    '#include <ctype.h>',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    'struct session {',
    '    char name[16];',
    '    int  admin;',
    '};',
    '',
    '/* Username: 1-15 characters, only letters, digits, \'_\' and \'-\'. */',
    'static int name_is_valid(const char *s)',
    '{',
    '    size_t n = strnlen(s, 16);',
    '    if (n == 0 || n >= 16)',
    '        return 0;',
    '    for (size_t i = 0; i < n; i++) {',
    '        unsigned char c = (unsigned char)s[i];',
    '        if (!isalnum(c) && c != \'_\' && c != \'-\')',
    '            return 0;',
    '    }',
    '    return 1;',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    if (argc != 2) {',
    '        fprintf(stderr, "Usage: %s <username>\\n", argv[0]);',
    '        return 1;',
    '    }',
    '    if (!name_is_valid(argv[1])) {',
    '        fprintf(stderr, "Rejected: the name must be 1-15 characters; only letters, digits, _ and - are allowed.\\n");',
    '        return 1;',
    '    }',
    '',
    '    struct session s = { .admin = 0 };',
    '    snprintf(s.name, sizeof(s.name), "%s", argv[1]);',
    '',
    '    printf("Welcome, %s\\n", s.name);',
    '    printf("admin field = %d\\n", s.admin);',
    '    printf("%s\\n", s.admin ? ">>> ADMIN <<<" : "Normal user session.");',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ data helpers
  function padTo(base, n) {
    var s = base.slice(0, n);
    while (s.length < n) s += 'x';
    return s;
  }
  function mk(name, secure) { return { name: name, secure: !!secure }; }

  var NORMAL_NAME = 'alice_baker1';                              // 12 chars — fits, room to spare (task: >= 10)
  var HARD_NAME = padTo('attacker_pwn', 17);                      // exactly 17 — overflow reaches admin's byte 0
  var NUL_SPILL_NAME = padTo('sixteen_bytes', 16);                // exactly 16 — only the NUL terminator spills
  var PAST_STRUCT_NAME = 'A'.repeat(16) + 'B'.repeat(4) + 'C'.repeat(20); // exactly 40 — runs past the whole struct

  function isValidSecureName(s) {
    return s.length >= 1 && s.length <= 15 && /^[A-Za-z0-9_-]+$/.test(s);
  }

  /** Independent re-check for reference() only: build() decides via isValidSecureName()'s regex; this walks
   * character CODES with explicit range comparisons instead of a regex, so a bug in the regex (or in the shared
   * helper) cannot hide from the test. Same rule as name_is_valid() in login_secure.c (1-15 chars, alnum/_/-). */
  function referenceNameValid(s) {
    if (s.length < 1 || s.length > 15) return false;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      var isDigit = c >= 48 && c <= 57;           // '0'-'9'
      var isUpper = c >= 65 && c <= 90;            // 'A'-'Z'
      var isLower = c >= 97 && c <= 122;           // 'a'-'z'
      var isDashOrUnderscore = c === 45 || c === 95; // '-' or '_'
      if (!isDigit && !isUpper && !isLower && !isDashOrUnderscore) return false;
    }
    return true;
  }

  /** Independent computation (does NOT call build()'s per-byte loop): simulates strcpy writing name.length
   * characters + one NUL terminator into a 16-byte buffer immediately followed by a 4-byte little-endian int,
   * using a plain flat byte array. */
  function reference(data) {
    if (data.secure) {
      return { accepted: referenceNameValid(data.name), admin: 0, oob: false, pastStruct: false };
    }
    var buf = [];
    for (var i = 0; i <= data.name.length; i++) buf[i] = i < data.name.length ? data.name.charCodeAt(i) : 0;
    var b16 = buf[16] || 0, b17 = buf[17] || 0, b18 = buf[18] || 0, b19 = buf[19] || 0;
    var admin = (b16 | (b17 << 8) | (b18 << 16) | (b19 << 24)) >>> 0;
    return {
      accepted: true,
      admin: admin,
      oob: data.name.length + 1 > 16,     // the write (characters + terminator) reached past the 16-byte buffer
      pastStruct: data.name.length + 1 > 20  // it reached past the whole 20-byte struct (name + admin)
    };
  }

  function hexByte(n) { return D.hex(n & 0xff, 2); }

  function build(S, data) {
    var name = data.name, secure = data.secure;
    var SW = 30, SGAP = 3, SY = 0;              // source-row cell geometry
    var BW = 30, BGAP = 2, BY = 110;            // destination memRow cell geometry

    // ---- source row: the raw argv[1] the "attacker" (or a normal user) typed, visible from step 1 ----
    S.label('srcLbl', { x: -14, y: SY + 22, text: 'argv[1] =', anchor: 'end', size: 14, mono: true });
    for (var k = 0; k < name.length; k++) {
      S.box('s' + k, { x: k * (SW + SGAP), y: SY, w: SW, h: 30, size: 14, mono: true, text: name[k], style: 'normal' });
    }

    if (secure) {
      var ok = isValidSecureName(name);
      S.step(T('`login_secure` çağrılıyor: `' + name + '` (' + name.length + ' karakter).',
                '`login_secure` is called: `' + name + '` (' + name.length + ' characters).'),
             { c: [37] });
      S.label('chk', { x: (Math.max(name.length, 1) * (SW + SGAP)) / 2, y: SY + 60,
                        text: T('uzunluk kontrol ediliyor: 1-15 mi?', 'checking length: is it 1-15?'), anchor: 'middle', size: 14 });
      var lenNote = T('n=' + name.length + ': 0 mı? hayır — ' + name.length + ' >= 16 mı? ' + (name.length >= 16 ? 'evet → reddet' : 'hayır → devam'),
                       'n=' + name.length + ': == 0? no — ' + name.length + ' >= 16? ' + (name.length >= 16 ? 'yes -> reject' : 'no -> continue'));
      S.step(T('`name_is_valid` önce UZUNLUĞU kontrol eder — hiçbir bayt henüz kopyalanmadı.',
                'name_is_valid checks the LENGTH first — no byte has been copied yet.'),
             { c: [24, { n: 25, note: lenNote }] });
      if (ok) {
        S.set('chk', { text: T('uzunluk uygun, karakterler kontrol ediliyor…', 'length OK, checking characters…') });
        for (k = 0; k < name.length; k++) S.set('s' + k, { style: 'new' });
        S.step(T('Tüm karakterler harf/rakam/`_`/`-`; ad kabul edildi.', 'Every character is a letter/digit/`_`/`-`; the name is accepted.'),
               { c: [{ n: 27, note: T(name.length + ' bayt için döner: i < n?', 'loops for ' + name.length + ' bytes: i < n?') }, 28,
                     { n: 29, note: T('harf/rakam/_/- değil mi? hayır (hepsi geçerli) → devam', 'not alnum/_/-? no (all valid) -> continue') }, 32] });
        var initBytes = [];
        for (k = 0; k < 16; k++) initBytes.push(k % 4 === 0 ? { addr: 0x1000 + k } : {});
        initBytes.push({ addr: 0x1010, value: 0 });
        S.memRow('b', initBytes, { x: 0, y: BY, w: BW, h: 34, size: 13, gap: BGAP });
        S.set('b16', { w: 4 * (BW + BGAP) - BGAP, text: '00000000' });   // shown as one 4-byte field (never touched byte-by-byte here)
        S.brace('brName', { from: 'b0', to: 'b15', text: 'name[16]', side: 'bottom' });
        S.brace('brAdmin', { from: 'b16', to: 'b16', text: 'admin (4 bayt / 4 bytes)', side: 'bottom' });
        for (k = 0; k < name.length; k++) {
          S.set('b' + k, { text: hexByte(name.charCodeAt(k)), above: name[k], style: 'new' });
          S.at(k);
          S.step(T('`snprintf` bayt ' + (k + 1) + '/' + name.length + ' — `' + name[k] + '` = 0x' + hexByte(name.charCodeAt(k)) + ' yazıyor; hedef boyutu bilir, asla 16\'yı geçmez.',
                    'snprintf writes byte ' + (k + 1) + '/' + name.length + ' — `' + name[k] + '` = 0x' + hexByte(name.charCodeAt(k)) + '; it knows the destination size and never passes 16.'),
                 { c: [48] });
        }
        S.at(null);
        S.result = reference(data);
        S.step(T('`admin` hâlâ 0: taşma hiç olmadı çünkü kontrol kopyalamadan ÖNCE çalıştı.',
                  'admin is still 0: no overflow ever happened, because the check ran BEFORE the copy.'),
               { c: [50, 51, { n: 52, note: T('admin (0) ? ADMIN : normal — 0 boş demek, ikinci dal seçilir', 'admin (0) ? ADMIN : normal — 0 is falsy, the second branch is chosen') }] });
      } else {
        var tooLong = name.length === 0 || name.length >= 16;
        S.set('chk', { text: tooLong ? T('uzunluk uygun değil', 'length is not OK') : T('karakterler geçersiz', 'characters are invalid') });
        S.styleAll('del', 'box');
        if (tooLong) {
          S.step(T('Uzunluk = ' + name.length + ' — izin verilen aralık 1-15. `name_is_valid` karakterlere hiç bakmadan reddediyor.',
                    'Length = ' + name.length + ' — the allowed range is 1-15. name_is_valid rejects it before ever looking at the characters.'),
                 { c: [24, { n: 25, note: lenNote }] });
        } else {
          S.step(T('Uzunluk uygun (1-15) ama en az bir karakter harf/rakam/`_`/`-` değil.',
                    'The length is fine (1-15), but at least one character is not a letter/digit/`_`/`-`.'),
                 { c: [{ n: 27, note: T(name.length + ' bayt için döner: i < n?', 'loops for ' + name.length + ' bytes: i < n?') }, 28,
                       { n: 29, note: T('harf/rakam/_/- değil mi? evet (en az bir tanesi) → reddet', 'not alnum/_/-? yes (at least one) -> reject') }] });
        }
        S.result = reference(data);
        S.step(T('Program çıktısı: "Rejected: the name must be 1-15 characters; only letters, digits, _ and - are allowed." — `struct session` hiç oluşturulmadı.',
                  'Program output: "Rejected: the name must be 1-15 characters; only letters, digits, _ and - are allowed." — the `struct session` was never even created.'),
               { c: [{ n: 42, note: T('name_is_valid(...) == 0? evet → reddet', 'name_is_valid(...) == 0? yes -> reject') }, 43, 44] });
      }
      return;
    }

    // ---------------------------------------------------------------- vulnerable build
    S.step(T('`login` çağrılıyor: `' + name + '` (' + name.length + ' karakter). `struct session` yığında ayrılır.',
              '`login` is called: `' + name + '` (' + name.length + ' characters). `struct session` is allocated on the stack.'),
           { c: [33] });
    var initBytes = [];
    for (k = 0; k < 16; k++) initBytes.push(k % 4 === 0 ? { addr: 0x1000 + k, above: String(k) } : {});
    for (k = 16; k < 20; k++) initBytes.push(k === 16 ? { value: 0, addr: 0x1010, above: '16' } : { value: 0 });
    S.memRow('b', initBytes, { x: 0, y: BY, w: BW, h: 34, size: 13, gap: BGAP });
    S.brace('brName', { from: 'b0', to: 'b15', text: 'name[16]', side: 'bottom' });
    S.brace('brAdmin', { from: 'b16', to: 'b19', text: 'admin', side: 'bottom' });
    S.pointer('cursor', { target: 'b0', side: 'top', text: T('yazılıyor', 'writing') });
    S.step(T('`s.admin = 0` — güvenli varsayılan; `name[]` henüz ilklenmemiş (rastgele yığın verisi).',
              's.admin = 0 — a secure default; name[] is not initialised yet (random stack data).'),
           { c: [34] });

    var region = S.region('tail', { x: 20 * (BW + BGAP) + 20, y: BY - 10, w: 190, h: 54, style: 'empty',
                                     title: T('yığının geri kalanı', 'rest of the stack') });
    S.label('tailTxt', { x: 20 * (BW + BGAP) + 20 + 95, y: BY + 22, text: '', anchor: 'middle', size: 13 });

    var total = name.length + 1;   // strcpy copies name.length characters, THEN one NUL terminator
    var overflowed = false, pastStructCalled = false, tailCount = 0;
    for (var i = 0; i < total; i++) {
      var isNul = i === name.length;
      var ch = isNul ? 0 : name.charCodeAt(i);
      var chDisplay = isNul ? '\\0' : name[i];
      var oobNow = i >= 16;
      if (!overflowed && oobNow) overflowed = true;
      if (i < 20) {
        S.set('b' + i, { text: hexByte(ch), above: chDisplay, style: oobNow ? 'del' : 'new' });
        S.set('cursor', { target: 'b' + i });
        if (i < name.length) S.at(i); else S.at(null);
        if (i < name.length) S.set('s' + i, { style: 'dim' });
        var cap;
        if (i < 16) {
          cap = T('`strcpy` bayt ' + (i + 1) + ': `' + chDisplay + '` = 0x' + hexByte(ch) + ' — `name[' + i + ']` içinde, sınırlar içinde.',
                   'strcpy byte ' + (i + 1) + ': `' + chDisplay + '` = 0x' + hexByte(ch) + ' — inside `name[' + i + ']`, still in bounds.');
        } else if (isNul) {
          cap = T('`strcpy` sonlandırıcı NUL\'ü yazıyor — `name[16]` yok, bu bayt `admin`\'in içine taşıyor (offset ' + i + ').',
                   'strcpy writes the terminating NUL — there is no name[16], so this byte spills into `admin` (offset ' + i + ').');
        } else {
          cap = T('`strcpy` bayt ' + (i + 1) + ': `' + chDisplay + '` = 0x' + hexByte(ch) + ' — 16 baytlık arabelleği AŞIYOR, doğrudan `admin`\'e yazıyor (offset ' + i + ').',
                   'strcpy byte ' + (i + 1) + ': `' + chDisplay + '` = 0x' + hexByte(ch) + ' — PAST the 16-byte buffer, straight into `admin` (offset ' + i + ').');
        }
        S.step(cap, { c: [39] });
      } else {
        pastStructCalled = true;
        tailCount++;
        S.set('cursor', { target: 'tail' });
        S.set('tail', { style: 'del' });
        S.set('tailTxt', { text: T(tailCount + ' bayt daha ezildi…', tailCount + ' more byte(s) smashed…') });
        if (i < name.length) { S.set('s' + i, { style: 'dim' }); S.at(i); } else S.at(null);
        S.step(T('`strcpy` bayt ' + (i + 1) + ': `' + chDisplay + '` — `struct session`\'ın TAMAMINI geçti; yığındaki başka bir şey eziliyor (tanımsız davranış).',
                  'strcpy byte ' + (i + 1) + ': `' + chDisplay + '` — past the WHOLE struct session; something else on the stack is being smashed (undefined behavior).'),
               { c: [39] });
      }
    }
    S.remove('cursor');
    S.result = reference(data);
    var adminVal = S.result.admin;
    if (adminVal !== 0) {
      S.step(T('Sonuç: `admin` = ' + adminVal + ' (0x' + D.hex(adminVal, 8) + ') — sıfır değil, erişim VERİLDİ.' +
                (pastStructCalled ? ' Üstelik yığında `struct session`\'ın ötesi de ezildi (ASan bunu "stack-buffer-overflow" olarak bildirir).' : ''),
                'Result: admin = ' + adminVal + ' (0x' + D.hex(adminVal, 8) + ') — nonzero, access GRANTED.' +
                (pastStructCalled ? ' On top of that, memory past struct session on the stack was smashed too (ASan reports this as a "stack-buffer-overflow").' : '')),
             { c: [42, 43, { n: 44, note: T('admin (' + adminVal + ') != 0? evet → ADMIN erişimi', 'admin (' + adminVal + ') != 0? yes -> ADMIN access') }, 45, { n: 46, skip: true }] });
    } else if (overflowed) {
      S.step(T('Sonuç: `admin` hâlâ 0 — bu isimde taşan bayt (sonlandırıcı NUL) rastlantıyla `admin`\'in ilk baytını da 0 yapıyor. Yine de sınır dışı bir yazma oldu (tanımsız davranış); ASan\'ın "stack-buffer-overflow" olarak yakalayacağı şey tam da bu.',
                'Result: admin is still 0 — the byte that overflowed here (the terminating NUL) happens to also zero admin\'s first byte. The write was still out of bounds (undefined behavior) — exactly what ASan flags as a "stack-buffer-overflow".'),
             { c: [42, 43, { n: 44, note: T('admin (0) != 0? hayır → normal kullanıcı (rastlantı)', 'admin (0) != 0? no -> normal user (coincidence)') }, { n: 45, skip: true }, 46, 47] });
    } else {
      S.step(T('Sonuç: `' + name.length + '` karakter 16 baytlık arabelleğe rahatça sığıyor (sonlandırıcı NUL dahil ' + (name.length + 1) + ' bayt); taşma yok, `admin` = 0, normal kullanıcı oturumu.',
                'Result: ' + name.length + ' characters fit comfortably in the 16-byte buffer (' + (name.length + 1) + ' bytes with the terminating NUL); no overflow, admin = 0, a normal user session.'),
             { c: [42, 43, { n: 44, note: T('admin (0) != 0? hayır → normal kullanıcı', 'admin (0) != 0? no -> normal user') }, { n: 45, skip: true }, 46, 47] });
    }
  }

  D.define({
    id: 'overflow-login',
    title: T('Taşma ile admin olmak (login.c)', 'Becoming admin through overflow (login.c)'),
    code: function (data) { return { c: data && data.secure ? SECURE_C : VULN_C }; },
    presets: [
      { id: 'fits', level: 'normal', name: T('Uyar: normal kullanıcı adı', 'Fits: a normal username'), data: mk(NORMAL_NAME, false) },
      { id: 'overflow-17', level: 'hard', name: T('Taşma: 17 bayt, admin ayarlanıyor', 'Overflow: 17 bytes, sets admin'), data: mk(HARD_NAME, false) },
      { id: 'nul-spill', level: 'edge', name: T('Uç durum: tam 16 bayt, NUL taşıyor', 'Edge case: exactly 16 bytes, the NUL spills'), data: mk(NUL_SPILL_NAME, false) },
      { id: 'past-struct-40', level: 'edge', name: T('Uç durum: 40 bayt, struct\'ın ötesine geçiyor (ASan)', 'Edge case: 40 bytes, runs past the struct (ASan)'), data: mk(PAST_STRUCT_NAME, false) },
      { id: 'secure-rejects', level: 'edge', name: T('Uç durum: güvenli sürüm reddediyor', 'Edge case: the secure version rejects it'), data: mk(HARD_NAME, true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.name.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 14], normal: [10, 18], hard: [17, 26], extreme: [17, 44] };
      var rg = ranges[level] || ranges.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var chars = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
      var s = '';
      for (var i = 0; i < n; i++) s += chars[D.randInt(r, 0, chars.length - 1)];
      return mk(s, false);
    },
    input: {
      hint: T('kullanıcı adı (isteğe bağlı: "SECURE " ile başlat → güvenli sürüm)', 'username (optionally start with "SECURE " → secure build)'),
      format: function (data) { return (data.secure ? 'SECURE ' : '') + data.name; },
      tokens: function (data) { return data.name.split(''); },   // the input tape shows one chip per character (S.at(k) indexes this)
      parse: function (text) {
        var s = String(text), secure = false;
        if (/^SECURE\s+/i.test(s)) { secure = true; s = s.replace(/^SECURE\s+/i, ''); }
        if (!s.length) throw T('İsim boş olamaz.', 'The name cannot be empty.');
        if (s.length > 48) throw T('İsim en fazla 48 karakter olabilir (gösterim için).', 'The name may be at most 48 characters (for display).');
        if (/\s/.test(s)) throw T('İsimde boşluk olamaz (argv tek bir sözcüktür).', 'The name cannot contain whitespace (argv is a single token).');
        if (!/^[\x20-\x7e]+$/.test(s)) throw T('Yalnızca yazdırılabilir ASCII karakterler kullanın.', 'Use printable ASCII characters only.');
        return mk(s, secure);
      },
      bad: ['', '   ', 'has space', 'x'.repeat(60)]
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
