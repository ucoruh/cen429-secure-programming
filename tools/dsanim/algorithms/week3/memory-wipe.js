// CEN429 — Week 3 — Demo 8 (code/week-03/08-memory-wipe/memory_wipe.c)
// A secret sits in memory the whole time it is "in use". Three layers protect it there: (1) turn off
// crash/error dumps so it can never land in a file, (2) lock the page so it is never written to swap,
// (3) once the secret is no longer needed, overwrite it with crypto_wipe() — unlike memset, this call
// cannot be removed by the compiler as a "dead store" (Week 1 Demo 2 showed memset get optimized away).
// This animation shows the buffer as bytes: zero before the secret is written, the secret's bytes after
// strcpy, and all zero again after crypto_wipe(). The Linux branch is shown; Windows uses the equivalent
// SetErrorMode / VirtualLock / SecureZeroMemory calls (see the code panel).
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 8: data in use - keeping and wiping it safely in memory',
    ' *',
    ' * A key/password is at risk the whole time it sits in memory: it can be',
    ' * written to the swap file, end up in a crash dump (core), or be read by a',
    ' * debugger. This demo does not repeat Week 1\'s gcore demonstration; it',
    ' * builds THREE extra layers for data in use:',
    ' *',
    ' *   Layer 1 - close crash/error dumps: the secret must not land in a file.',
    ' *             Linux: setrlimit(RLIMIT_CORE, 0). Windows: SetErrorMode',
    ' *             (in demo_prepare) turns off error dialogs/automatic dumps.',
    ' *   Layer 2 - lock the memory: this page is never written to swap.',
    ' *             Linux: mlock. Windows: VirtualLock.',
    ' *   Layer 3 - wipe securely: once done, the secret is overwritten. Unlike',
    ' *             memset, the compiler cannot remove this as a "dead store".',
    ' *             Linux: OPENSSL_cleanse. Windows: SecureZeroMemory.',
    ' *             (crypto_wipe calls the right one on each platform.)',
    ' *',
    ' * The program reads the buffer back after wiping and confirms it is',
    ' * really zeroed. It only touches its own memory; it changes no system',
    ' * setting.',
    ' */',
    '#include "cen429_demo.h"',
    '#include "cen429_crypto.h"',
    '#include <stdio.h>',
    '#include <string.h>',
    '',
    '#ifdef _WIN32',
    '#include <windows.h>',
    '#else',
    '#include <sys/mman.h>',
    '#include <sys/resource.h>',
    '#include <string.h>',
    '#endif',
    '',
    '#define BUF_LEN 64',
    '',
    'static int nonzero_bytes(const char *p)',
    '{',
    '    int n = 0;',
    '    for (int i = 0; i < BUF_LEN; i++)',
    '        if (p[i] != 0)',
    '            n++;',
    '    return n;',
    '}',
    '',
    'int main(void)',
    '{',
    '    demo_prepare();',
    '',
    '    /* Layer 1: close crash/error dumps. */',
    '#ifdef _WIN32',
    '    printf("Layer 1 - error dialogs/automatic dump turned off "',
    '           "(SetErrorMode): OK\\n");',
    '#else',
    '    struct rlimit rl = { 0, 0 };',
    '    int core_disabled = (setrlimit(RLIMIT_CORE, &rl) == 0);',
    '    printf("Layer 1 - crash dump turned off (RLIMIT_CORE=0): %s\\n",',
    '           core_disabled ? "OK" : "could not be done");',
    '#endif',
    '',
    '    char secret[BUF_LEN];',
    '    memset(secret, 0, sizeof(secret));',
    '    strcpy(secret, "Synthetic-Password-2026");',
    '',
    '    /* Layer 2: protect the memory from being written to swap. */',
    '#ifdef _WIN32',
    '    int lock_ok = VirtualLock(secret, sizeof(secret)) ? 1 : 0;',
    '    printf("Layer 2 - VirtualLock blocked writing to swap: %s\\n",',
    '           lock_ok ? "OK" : "could not be done (working-set limit)");',
    '#else',
    '    int lock_ok = (mlock(secret, sizeof(secret)) == 0);',
    '    printf("Layer 2 - mlock blocked writing to swap: %s\\n",',
    '           lock_ok ? "OK" : "could not be done (ulimit -l may be low)");',
    '#endif',
    '',
    '    printf("Secret in use: length = %zu, non-zero bytes = %d\\n",',
    '           strlen(secret), nonzero_bytes(secret));',
    '',
    '    /* Layer 3: wipe securely once done. */',
    '    crypto_wipe(secret, sizeof(secret));',
    '    printf("Layer 3 - non-zero bytes after secure wipe = %d\\n",',
    '           nonzero_bytes(secret));',
    '    printf("   ==> %s\\n", nonzero_bytes(secret) == 0',
    '           ? "the secret was cleared from memory." : "the secret is still in memory (!)");',
    '',
    '#ifdef _WIN32',
    '    if (lock_ok)',
    '        VirtualUnlock(secret, sizeof(secret));',
    '#else',
    '    if (lock_ok)',
    '        munlock(secret, sizeof(secret));',
    '#endif',
    '',
    '    printf("\\nNote: an OPENSSL_cleanse / SecureZeroMemory call CANNOT be\\n"',
    '           "removed by the compiler as a \\"dead store\\"; memset CAN be removed\\n"',
    '           "at -O2 (see Week 1 Demo 2).\\n");',
    '    return 0;',
    '}'
  ];

  var PAD = 2;         // extra always-zero bytes shown after the secret (the real buffer is 64 bytes;
                        // only a representative slice is drawn so the picture stays readable)
  var CW = 30, GAP = 2, ROWY = 40;

  function mk(secret) { return { secret: secret }; }

  function charCode(ch) { return ch.charCodeAt(0); }

  /** Independent computation: the secret's own characters are never 0x00 (own-values input rejects any
   * character outside printable ASCII 0x21-0x7e), so the non-zero count before wiping is simply the
   * secret's length; after crypto_wipe() every byte of the WHOLE buffer is 0x00. */
  function reference(data) {
    return { beforeNonzero: data.secret.length, afterNonzero: 0 };
  }

  function build(S, data) {
    var secret = data.secret, n = secret.length, total = n + PAD;
    S.label('rowLbl', { x: -14, y: ROWY + 22, text: 'secret[] =', anchor: 'end', size: 14, mono: true });

    var initBytes = [];
    for (var i = 0; i < total; i++) initBytes.push(i % 4 === 0 ? { above: String(i) } : {});
    S.memRow('b', initBytes, { x: 0, y: ROWY, w: CW, h: 34, size: 13, gap: GAP, addrs: false });
    for (i = 0; i < total; i++) S.set('b' + i, { text: '00', style: 'empty' });
    S.brace('brBuf', { from: 'b0', to: 'b' + (total - 1), text: T('BUF_LEN baytlık arabellek (ilk ' + total + ' bayt gösteriliyor)',
      'the BUF_LEN buffer (first ' + total + ' bytes shown)'), side: 'bottom' });
    S.step(T('`char secret[BUF_LEN];` `memset(secret, 0, sizeof(secret));` — arabellek her zaman ÖNCE sıfırlanır.',
              '`char secret[BUF_LEN];` `memset(secret, 0, sizeof(secret));` — the buffer is ALWAYS zeroed FIRST.'),
           { c: [62, 63] });

    var midX = total * (CW + GAP) / 2;
    S.label('statusTop', { x: midX, y: ROWY - 26,
      text: T('Katman 1: çökme/hata dökümü KAPALI', 'Layer 1: crash/error dump OFF'), anchor: 'middle', size: 13, bold: true, style: 'new' });
    S.label('statusBottom', { x: midX, y: ROWY + 100, text: '', anchor: 'middle', size: 13, style: 'normal' });
    S.step(T('Katman 1 — `setrlimit(RLIMIT_CORE, 0)` (Linux): sır artık bir çökme dosyasına asla düşemez.',
              'Layer 1 — `setrlimit(RLIMIT_CORE, 0)` (Linux): the secret can no longer land in a crash file at all.'),
           { c: [56, 57, 58, { n: 59, note: T('başarılı mı? EVET (core_disabled=1)', 'succeeded? YES (core_disabled=1)') }] });

    for (i = 0; i < n; i++) S.set('b' + i, { text: D.hex(charCode(secret[i]), 2), above: secret[i], style: 'new' });
    S.step(T('`strcpy(secret, "' + secret + '")` — ' + n + ' bayt yazıldı; kalan ' + PAD + ' bayt hâlâ sıfır.',
              '`strcpy(secret, "' + secret + '")` — ' + n + ' bytes written; the remaining ' + PAD + ' bytes are still zero.'),
           { c: [64] });

    S.set('statusTop', { text: T('Katman 2: bellek KİLİTLİ (takasa yazılamaz)', 'Layer 2: memory LOCKED (cannot go to swap)'), style: 'active' });
    S.styleAll('active', 'box');
    for (i = n; i < total; i++) S.set('b' + i, { style: 'empty' });
    S.step(T('Katman 2 — `mlock(secret, sizeof(secret))` (Linux): bu sayfa artık takas alanına (swap) hiç yazılmaz.',
              'Layer 2 — `mlock(secret, sizeof(secret))` (Linux): this page can no longer be written to swap at all.'),
           { c: [72, 73, { n: 74, note: T('başarılı mı? EVET (lock_ok=1)', 'succeeded? YES (lock_ok=1)') }] });

    S.styleAll('new', 'box');
    for (i = n; i < total; i++) S.set('b' + i, { style: 'empty' });
    var before = reference(data).beforeNonzero;
    S.set('statusBottom', { text: T('uzunluk = ' + n + ', dolu bayt = ' + before, 'length = ' + n + ', non-zero bytes = ' + before), style: 'normal' });
    S.step(T('Sır kullanımda: `strlen(secret)` = ' + n + ', `nonzero_bytes(secret)` = ' + before + '.',
              'The secret is in use: `strlen(secret)` = ' + n + ', `nonzero_bytes(secret)` = ' + before + '.'),
           { c: [77, 78] });

    S.set('statusTop', { text: T('Katman 3: crypto_wipe() ile SİLİNİYOR', 'Layer 3: WIPING with crypto_wipe()'), style: 'del' });
    for (i = 0; i < total; i++) S.set('b' + i, { text: '00', above: undefined, style: 'del' });
    S.step(T('`crypto_wipe(secret, sizeof(secret))` — her bayt 0x00 ile üzerine yazılır (derleyici bu çağrıyı "ölü yazma" olarak KALDIRAMAZ).',
              '`crypto_wipe(secret, sizeof(secret))` — every byte is overwritten with 0x00 (the compiler CANNOT remove this call as a "dead store").'),
           { c: [81] });

    S.result = reference(data);
    for (i = 0; i < total; i++) S.set('b' + i, { style: 'empty' });
    S.set('statusTop', { text: T('Bitti: sır güvenle silindi', 'Done: the secret is safely wiped'), style: 'dim' });
    S.set('statusBottom', { text: T('dolu bayt = 0  ==>  sır bellekten temizlendi', 'non-zero bytes = 0  ==>  the secret was cleared from memory'), style: 'new' });
    S.step(T('`nonzero_bytes(secret)` = 0 — sır bellekten tamamen temizlendi.',
              '`nonzero_bytes(secret)` = 0 — the secret is completely cleared from memory.'),
           { c: [82, 83, 84, { n: 85, note: T('dolu bayt = 0 mı? EVET -> temizlendi', 'non-zero bytes = 0? YES -> cleared') }] });
  }

  D.define({
    id: 'memory-wipe',
    title: T('Bellekte güvenli silme (memory_wipe.c)', 'Secure wiping in memory (memory_wipe.c)'),
    code: function () { return { c: SRC }; },
    presets: [
      { id: 'normal', level: 'normal', name: T('Uyar: orta uzunlukta bir sır', 'Fits: a medium-length secret'), data: mk('temp-password1') },
      { id: 'hard-real', level: 'hard', name: T('Zor: demoya benzer, uzun bir sır', 'Hard: a long secret, close to the demo\'s real one'), data: mk('Synthetic-Pwd26') },
      { id: 'edge-one', level: 'edge', small: true, name: T('Uç durum: tek karakterlik sır', 'Edge case: a one-character secret'), data: mk('X') },
      { id: 'edge-symbols', level: 'edge', name: T('Uç durum: özel karakterler', 'Edge case: special characters'), data: mk('!@#$%^&*()_+-=') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.secret.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 16], extreme: [14, 16] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_!@#';
      var s = '';
      for (var i = 0; i < len; i++) s += chars[D.randInt(r, 0, chars.length - 1)];
      return mk(s);
    },
    input: {
      hint: T('bir sır metni (1-16 karakter, boşluksuz, yazdırılabilir ASCII)', 'a secret string (1-16 characters, no spaces, printable ASCII)'),
      format: function (data) { return data.secret; },
      parse: function (text) {
        var s = String(text);
        if (!s.length) throw T('Sır boş olamaz.', 'The secret cannot be empty.');
        if (s.length > 16) throw T('Sır en fazla 16 karakter olabilir (gösterim için).', 'The secret may be at most 16 characters (for display).');
        if (!/^[\x21-\x7e]+$/.test(s)) throw T('Yalnızca boşluksuz, yazdırılabilir ASCII karakterler kullanın.', 'Use printable, non-whitespace ASCII characters only.');
        return mk(s);
      },
      bad: ['', ' ', 'has space', 'x'.repeat(30), 'tab\tchar']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
