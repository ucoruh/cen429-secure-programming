// CEN429 — Week 1 — Demo 2 (code/week-01/02-password-in-memory/password.c)
// log_in() reads a password into a stack array, uses it, then tries to wipe it. WIPE=0 never wipes; WIPE=1
// calls memset() — which an optimizing compiler is FREE to delete, because the array is never read again after
// that line ("dead store elimination"); WIPE=2 calls explicit_bzero()/SecureZeroMemory(), which the compiler
// cannot remove because the platform promises the call is never optimized away. This animation shows the same
// buffer under all three modes and whether a memory dump taken right after would still contain the password.
(function (D) {
  'use strict';
  var T = D.T;

  var CODE_C = [
    'unsigned long log_in(const char *file)',
    '{',
    '    char password[64];',
    '',
    '    /* Low-level read: no stdio buffering is used, the password lives only in this array. */',
    '    int fd = file_open(file);',
    '    if (fd < 0)',
    '        return 0;',
    '    int n = (int)file_read(fd, password, sizeof(password) - 1);',
    '    file_close(fd);',
    '    if (n <= 0)',
    '        return 0;',
    '    while (n > 0 && (password[n - 1] == \'\\n\' || password[n - 1] == \'\\r\'))',
    '        n--;',
    '    password[n] = \'\\0\';',
    '',
    '    unsigned long key = derive_key(password, (size_t)n);',
    '',
    '#if WIPE == 1',
    '    memset(password, 0, sizeof(password));         /* "dead store": never read again */',
    '#elif WIPE == 2',
    '#ifdef _WIN32',
    '    SecureZeroMemory(password, sizeof(password));  /* the compiler cannot remove this */',
    '#else',
    '    explicit_bzero(password, sizeof(password));    /* the compiler cannot remove this */',
    '#endif',
    '#endif',
    '    return key;',
    '}'
  ];
  var L = { open: 6, fdCheck: 7, read: 9, lenCheck: 11, trim: 13, terminate: 15, derive: 17, memset: 20, bzero: 24 };

  function mk(password, wipe) { return { password: password, wipe: wipe }; }

  function hexByte(n) { return D.hex(n & 0xff, 2); }

  /** Independent computation (a plain map over the characters, not build()'s memRow byte loop): only WIPE == 2
   * actually clears the bytes; WIPE == 0 and WIPE == 1 (removed by the optimizer) both leave the password intact. */
  function reference(data) {
    var wiped = data.wipe === 2;
    var finalBytes = data.password.split('').map(function (c) { return wiped ? 0 : c.charCodeAt(0); });
    return { finalBytes: finalBytes, foundInDump: !wiped };
  }

  function build(S, data) {
    var pw = data.password, n = pw.length;
    var BW = 30, BGAP = 2, BY = 60;
    S.label('bufLbl', { x: -14, y: BY + 20, text: 'password[] =', anchor: 'end', size: 14, mono: true });
    var initBytes = [];
    for (var k = 0; k < n; k++) initBytes.push(k % 4 === 0 ? { addr: 0x2000 + k } : {});
    S.memRow('b', initBytes, { x: 0, y: BY, w: BW, h: 34, size: 12, gap: BGAP });
    S.brace('brPw', { from: 'b0', to: 'b' + (n - 1), text: T('parola (' + n + ' bayt)', 'password (' + n + ' bytes)'), side: 'bottom' });

    S.step(T('`file_open` dosyayı açtı; koruma `if (fd < 0)` denetlenir — açılış başarılı olduğu için YANLIŞ, devam edilir.',
              '`file_open` opened the file; the guard `if (fd < 0)` is checked — FALSE since the open succeeded, execution continues.'),
           { c: [L.open, { n: L.fdCheck, note: T('fd < 0 mı? hayır (açılış başarılı)', 'fd < 0? no (open succeeded)') }] });
    S.step(T('`file_read` dosyadan okuyor; parola yalnız bu 64 baytlık dizide duruyor.',
              '`file_read` reads from the file; the password lives only in this 64-byte array.'),
           { c: [L.read] });
    for (k = 0; k < n; k++) {
      S.set('b' + k, { text: hexByte(pw.charCodeAt(k)), above: pw[k], style: 'new' });
      S.at(k);
    }
    S.step(T('Okunan bayt sayısı denetlenir (`if (n <= 0)` — YANLIŞ, ' + n + ' bayt okundu) ve sondaki `\\n`/`\\r` kırpılır (bu parolada hiç yok, döngü 0 kez döner); sonlandırıcı `\\0` yazıldı.',
              'The byte count is checked (`if (n <= 0)` — FALSE, ' + n + ' bytes were read) and any trailing `\\n`/`\\r` is trimmed (none here, the loop runs 0 times); the terminating `\\0` is written.'),
           { c: [
             { n: L.lenCheck, note: T('n <= 0 mı? hayır (' + n + ' bayt)', 'n <= 0? no (' + n + ' bytes)') },
             { n: L.trim, note: T('sonda \\n/\\r var mı? hayır — 0 yineleme', 'trailing \\n/\\r? no — 0 iterations') },
             L.terminate
           ] });

    S.at(null);
    S.label('keyLbl', { x: n * (BW + BGAP) / 2, y: BY - 24, text: T('anahtar hesaplanıyor…', 'computing the key…'), anchor: 'middle', size: 13 });
    S.step(T('`derive_key()` parolayı okuyup bir anahtar hesaplıyor — bu, parolanın son kez okunduğu yer.',
              '`derive_key()` reads the password and computes a key — this is the last time the password is read.'),
           { c: [L.derive] });
    S.remove('keyLbl');

    if (data.wipe === 0) {
      S.step(T('`WIPE == 0`: hiçbir silme kodu bile yazılmadı. Fonksiyon döner, bayt dizisi olduğu gibi kalır.',
                '`WIPE == 0`: no wipe code was even written. The function returns, the byte array is left exactly as is.'),
             { c: [] });
    } else if (data.wipe === 1) {
      S.step(T('`WIPE == 1`: kaynakta `memset(password, 0, ...)` YAZIYOR — ama derleyici şöyle düşünür: "bu diziye bundan sonra hiç bakılmıyor, sıfırlamanın programın sonucuna etkisi yok" ve çağrıyı SİLER ("dead store elimination"). Bayt dizisi değişmeden kalır.',
                '`WIPE == 1`: the source WRITES `memset(password, 0, ...)` — but the compiler reasons "this array is never looked at again, zeroing it changes nothing about the program\'s result" and DELETES the call ("dead store elimination"). The byte array is left unchanged.'),
             { c: [L.memset] });
    } else {
      for (k = 0; k < n; k++) S.set('b' + k, { style: 'active' });
      S.step(T('`WIPE == 2`: `explicit_bzero` (Linux) / `SecureZeroMemory` (Windows) çağrılıyor — platform bu çağrının ASLA kaldırılmayacağını garanti eder.',
                '`WIPE == 2`: `explicit_bzero` (Linux) / `SecureZeroMemory` (Windows) is called — the platform guarantees this call is NEVER removed.'),
             { c: [L.bzero] });
      for (k = 0; k < n; k++) S.set('b' + k, { text: '00', above: undefined, style: 'del' });
      S.step(T('Bütün ' + n + ' bayt gerçekten 0 ile üzerine yazıldı.',
                'All ' + n + ' bytes are genuinely overwritten with 0.'),
             { c: [L.bzero] });
    }

    S.result = reference(data);
    if (S.result.foundInDump) {
      S.step(T('Şimdi bellek dökümü alınsa: parola HÂLÂ orada — "RESULT: password FOUND in the dump".',
                'If a memory dump were taken now: the password is STILL there — "RESULT: password FOUND in the dump".'),
             {});
    } else {
      S.step(T('Şimdi bellek dökümü alınsa: parola artık orada değil — "RESULT: password not found in the dump".',
                'If a memory dump were taken now: the password is no longer there — "RESULT: password not found in the dump".'),
             {});
    }
  }

  D.define({
    id: 'password-wipe',
    title: T('Bellekte kalan parola: memset vs explicit_bzero (password.c)', 'Password left in memory: memset vs explicit_bzero (password.c)'),
    code: { c: CODE_C },
    presets: [
      { id: 'memset-surprise', level: 'normal', name: T('Normal: WIPE=1, memset yazılı ama silinmiş (21 bayt)', 'Normal: WIPE=1, memset written but optimized away (21 bytes)'), data: mk('Secret-Password-2026', 1) },
      { id: 'never-wipes', level: 'hard', name: T('Zor: WIPE=0, hiç silme yok (24 bayt)', 'Hard: WIPE=0, no wipe at all (24 bytes)'), data: mk('Tr0ub4dor&3-Extended!', 0) },
      { id: 'explicit-bzero-fix', level: 'edge', name: T('Uç durum: WIPE=2, gerçekten silinir', 'Edge case: WIPE=2, genuinely wiped'), data: mk('Secret-Password-2026', 2) },
      { id: 'near-buffer-limit', level: 'edge', name: T('Uç durum: tam 63 baytlık dizinin sınırında parola', 'Edge case: a password exactly at the 63-byte buffer limit'), data: mk('x'.repeat(59) + 'END!', 1) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.password.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 16], normal: [10, 24], hard: [20, 40], extreme: [20, 60] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!-_';
      var s = '';
      for (var i = 0; i < len; i++) s += chars[D.randInt(r, 0, chars.length - 1)];
      return mk(s, D.randInt(r, 0, 2));
    },
    input: {
      hint: T('parola @ mod (0|1|2)', 'password @ mode (0|1|2)'),
      format: function (data) { return data.password + ' @ ' + data.wipe; },
      tokens: function (data) { return data.password.split(''); },
      parse: function (text) {
        var m = String(text).match(/^(.*)@\s*([0-2])\s*$/);
        if (!m) throw T('Biçim: "parola @ 0|1|2" olmalı.', 'Format must be "password @ 0|1|2".');
        var pw = m[1].replace(/\s+$/, '');
        if (!pw.length) throw T('Parola boş olamaz.', 'The password cannot be empty.');
        if (pw.length > 63) throw T('Parola en fazla 63 bayt olabilir (dizi 64 bayt, 1 sonlandırıcı için).', 'The password may be at most 63 bytes (the array is 64 bytes, 1 for the terminator).');
        if (!/^[\x20-\x7e]+$/.test(pw)) throw T('Yalnızca yazdırılabilir ASCII karakterler kullanın.', 'Use printable ASCII characters only.');
        return mk(pw, parseInt(m[2], 10));
      },
      bad: ['', 'no-mode-here', 'x @ 3', 'x @ -1', 'x'.repeat(70) + ' @ 1']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
