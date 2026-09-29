// CEN429 — Week 4 — Demo 1 (code/week-04/01-format-string/leak.c, leak_secure.c)
// printf(buffer) hands the user's own text to printf as the FORMAT argument. Each '%x' in that text makes
// printf read the NEXT stack argument slot and print it as hex — but no argument was ever actually passed, so
// printf reads whatever integer/pointer happens to be sitting in that slot. Enough '%x' specifiers eventually
// reach the slot holding the program's own secret_value: an information leak (CWE-134). '%n' would WRITE the
// character count so far to the address found in a slot instead of reading it — shown here conceptually only
// (never executed: this course never performs a real memory-corrupting write). The fix is one line: a constant
// "%s" format with the user's text passed as an ordinary argument, so it is never scanned at all.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var VULN_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 1: format string vulnerability (VULNERABLE VERSION)',
    ' *',
    ' * The program hands the user\'s text directly to printf as its FORMAT argument:',
    ' * printf(user_text). That is the same as asking the user "what should printf',
    ' * write?" If the user types a format specifier (%x, %p, %n, %s ...):',
    ' *   - %x / %p : READS a value off the stack   -> information leak',
    ' *   - %n      : WRITES to memory              -> crash / code execution',
    ' *',
    ' * The program\'s own "secret" value (secret_value) sits on the stack, near the',
    ' * format buffer; enough %x specifiers dump it to the screen.',
    ' *',
    ' * ETHICS/SAFETY: every attack stays inside this program\'s own memory. Steps',
    ' * that could crash are bounded on Linux with prlimit+timeout, on Windows with',
    ' * demo_prepare(); no system setting changes, no administrator privileges needed.',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    if (argc != 2) {',
    '        fprintf(stderr, "Usage: %s <text>\\n", argv[0]);',
    '        return 1;',
    '    }',
    '',
    '    /* The program\'s "secret" value, which must never leak. On the stack, it',
    '       sits next to the format buffer below. */',
    '    volatile unsigned secret_value = 0x5ECE7u;   /* 388327 */',
    '    char buffer[64];',
    '    snprintf(buffer, sizeof(buffer), "%s", argv[1]);',
    '',
    '    printf("Secret value in memory: 0x%05x (should NOT appear on screen)\\n",',
    '           secret_value);',
    '    printf("Program output -> ");',
    '    printf(buffer);            /* BUG: format string is under user control */',
    '    printf("\\n");',
    '    return 0;',
    '}'
  ];
  var SECURE_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 1: format string vulnerability (SECURE VERSION)',
    ' *',
    ' * The fix is tiny but critical: user data must NEVER be the format argument.',
    ' * We use a constant format ("%s") and pass the data as an ARGUMENT instead.',
    ' * That way any %x / %n the user types is printed as ordinary text; nothing is',
    ' * read from or written to memory because of it.',
    ' *',
    ' * The input length is also validated (defensive programming).',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    '/* The destination buffer used to be 64 bytes in the vulnerable version; here we no longer copy',
    '   into a fixed buffer at all (printf("%s", argv[1]) reads argv[1] directly), but we still cap the',
    '   length so a demo run\'s output stays readable. Pure and bounded: safe to unit-test in-process. */',
    'static int text_length_ok(const char *s)',
    '{',
    '    return strlen(s) < 64;',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    if (argc != 2) {',
    '        fprintf(stderr, "Usage: %s <text>\\n", argv[0]);',
    '        return 1;',
    '    }',
    '    if (!text_length_ok(argv[1])) {',
    '        fprintf(stderr, "Rejected: text too long (63 characters max).\\n");',
    '        return 1;',
    '    }',
    '',
    '    volatile unsigned secret_value = 0x5ECE7u;',
    '    printf("Secret value in memory: 0x%05x (should NOT appear on screen)\\n",',
    '           secret_value);',
    '    printf("Program output -> ");',
    '    printf("%s", argv[1]);     /* CORRECT: constant format, data is the argument */',
    '    printf("\\n");',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ data
  function mk(secure, specCount, secretAt, writeDemo) {
    return { secure: !!secure, specCount: specCount | 0, secretAt: secretAt | 0, writeDemo: !!writeDemo };
  }

  function garbage(i, data) {
    var v = (((i + 1) * 2654435761) ^ (data.specCount * 97 + data.secretAt)) >>> 0;
    return D.hex(v % 0xffffff, 5).toLowerCase();
  }

  /** Independent computation (plain arithmetic, no loop shared with build()). */
  function reference(data) {
    if (data.secure) return { leaked: false };
    return { leaked: data.secretAt >= 1 && data.secretAt <= data.specCount };
  }

  function build(S, data) {
    if (data.secure) {
      S.label('title', { x: 140, y: -18, text: T('güvenli sürüm: sabit bir "%s" biçimi', 'secure version: a constant "%s" format'), anchor: 'middle', bold: true, size: 15 });
      S.box('arg', { x: 0, y: 0, w: 280, h: 40, size: 14, mono: true, text: '"' + '...%x %x %n...' + '"', style: 'new' });
      S.label('argLbl', { x: 140, y: 60, text: T('argv[1] — TEK bir argüman olarak geçiyor', 'argv[1] — passed as ONE single argument'), anchor: 'middle', size: 13 });
      S.step(T('`leak_secure` aynı saldırı metniyle çağrılıyor: `printf("%s", argv[1])`.',
                '`leak_secure` is called with the same attack text: `printf("%s", argv[1])`.'),
             { c: [39] });
      S.set('arg', { style: 'hl' });
      S.step(T('Biçim dizesi HER ZAMAN sabit `"%s"`; içindeki `%x`/`%n` karakterleri hiç taranmaz, düz metin olarak yazılır.',
                'The format string is ALWAYS the constant `"%s"`; the `%x`/`%n` characters inside it are never scanned — they are printed as plain text.'),
             { c: [39] });
      S.result = reference(data);
      S.step(T('Yığın hiç taranmadı: okuma da yazma da olmadı. Tek satırlık düzeltme, açığı tamamen kapatır.',
                'No stack scan ever happened: no read, no write. The one-line fix closes the hole completely.'),
             { c: [39] });
      return;
    }

    var n = data.specCount, W = 62, GAP = 4;
    S.label('title', { x: (n * (W + GAP)) / 2, y: -22,
      text: T('`printf(buffer)` — biçim dizesindeki her `%x` bir sonraki yığın konumunu okur', '`printf(buffer)` — every `%x` in the format string reads the next stack slot'),
      anchor: 'middle', bold: true, size: 14 });
    S.box('secret', { x: 0, y: -78, w: 200, h: 34, size: 13, mono: true, text: '0x' + D.hex(0x5ECE7, 5), style: 'dim' });
    S.label('secretLbl', { x: 210, y: -57, text: T('secret_value — önce KONTROL amaçlı ayrıca yazdırıldı', 'secret_value — printed separately FIRST, as a control'), anchor: 'start', size: 12 });
    S.step(T('Program önce `secret_value`\'yi kendi isteğiyle ekrana yazar (kontrol): `0x05ece7`. Bu satır güvenlidir — sabit biçim kullanır.',
              'The program first prints `secret_value` on its own (a control): `0x05ece7`. This line is safe — it uses a constant format.'),
           { c: [35, 36] });

    for (var i = 0; i < n; i++) {
      S.box('a' + i, { x: i * (W + GAP), y: 0, w: W, h: 40, size: 13, mono: true, above: String(i + 1), text: '', style: 'empty' });
    }
    S.pointer('cursor', { target: 'a0', side: 'top', text: T('%x taranıyor', 'scanning %x') });
    S.step(T('Kullanıcı ' + n + ' tane `%x` içeren bir metin girdi. `buffer` artık biçim dizesi OLARAK kullanılıyor.',
              'The user typed text containing ' + n + ' `%x` markers. `buffer` is now being used AS the format string.'),
           { c: [33, 38] });

    var leaked = false, leakIndex = -1;
    for (i = 0; i < n; i++) {
      S.set('cursor', { target: 'a' + i });
      S.at(i);
      var pos = i + 1;
      if (pos === data.secretAt) {
        S.set('a' + i, { text: D.hex(0x5ECE7, 5).toLowerCase(), style: 'del' });
        S.step(T('`%x` #' + pos + ' tam olarak `secret_value`\'nin durduğu konuma denk geliyor → `5ece7` yazdırılıyor — kontrol satırındakiyle AYNI değer. Sızdı.',
                  '`%x` #' + pos + ' lands exactly on the slot holding `secret_value` → prints `5ece7` — the SAME value as the control line. Leaked.'),
               { c: [38] });
        leaked = true; leakIndex = i;
        if (data.writeDemo && i + 1 < n) {
          S.set('a' + (i + 1), { style: 'hl', above: String(pos + 1) + ' (%n?)' });
          S.label('warn', { x: (i + 1) * (W + GAP) + W / 2, y: 70,
            text: T('%n OLSAYDI: printf buraya YAZARDI (karakter sayısını) — konu burada durur, gerçek bir yazma DENENMEZ',
                     'IF THIS WERE %n: printf would WRITE here (the character count) — the topic stops here, no real write is attempted'),
            anchor: 'middle', size: 12, bold: true });
          S.step(T('Sıradaki belirteç `%n` olsaydı: printf, bu konumdaki değeri bir ADRES sanır ve oraya karakter sayısını YAZARDI (genelde geçersiz adres → çökme; saldırgan kurgularsa → bellek bozulması). Bu ders bunu yalnız KAVRAMSAL gösterir, gerçek bir yazma hiç yapılmaz.',
                    'If the next marker had been `%n`: printf would treat the value at this position as an ADDRESS and WRITE the character count there (usually invalid -> crash; if an attacker controls it -> memory corruption). This course shows this CONCEPTUALLY only — no real write is ever performed.'),
                 { c: [38] });
        }
        for (var j = i + 1; j < n; j++) S.set('a' + j, { style: 'empty' });
        break;
      } else {
        S.set('a' + i, { text: garbage(i, data), style: 'dim' });
        S.step(T('`%x` #' + pos + ' bu konumdaki rastgele değeri okuyor: `' + garbage(i, data) + '` — saldırgana işe yaramaz.',
                  '`%x` #' + pos + ' reads whatever random value is in this slot: `' + garbage(i, data) + '` — not useful to the attacker.'),
               { c: [38] });
      }
    }
    S.remove('cursor');
    S.at(null);
    S.result = reference(data);
    if (!leaked) {
      S.step(T('Yalnız ' + n + ' tane `%x` verildi; `secret_value`\'nin konumu (#' + data.secretAt + ') hiç taranmadı. Bu sefer sızıntı yok — ama bir `%x` daha eklenseydi olurdu.',
                'Only ' + n + ' `%x` markers were given; `secret_value`\'s slot (#' + data.secretAt + ') was never scanned. No leak this time — but one more `%x` would have reached it.'),
             {});
    } else {
      S.step(T('Sonuç: gizli değer ekrana döküldü. Tek satırlık düzeltme (`printf("%s", ...)`) bu taramayı tamamen imkânsız kılar.',
                'Result: the secret value was dumped to the screen. The one-line fix (`printf("%s", ...)`) makes this scan completely impossible.'),
             {});
    }
  }

  D.define({
    id: 'format-string',
    title: T('Biçim dizesi açığı: %x yığını tarar (leak.c)', 'Format string vulnerability: %x scans the stack (leak.c)'),
    code: function (data) { return { c: data && data.secure ? SECURE_C : VULN_C }; },
    presets: [
      { id: 'found', level: 'normal', name: T('Bulundu: 14 belirteçten 9.\'da sızıntı', 'Found: leak at the 9th of 14 markers'), data: mk(false, 14, 9, false) },
      { id: 'edge-exact', level: 'hard', name: T('Zor: tam son belirteçte sızıntı (16/16)', 'Hard: leak on the very last marker (16/16)'), data: mk(false, 16, 16, false) },
      { id: 'not-reached', level: 'edge', name: T('Uç durum: yetersiz belirteç, hedefe ulaşılmıyor', 'Edge case: not enough markers, target not reached'), data: mk(false, 10, 14, false) },
      { id: 'percent-n', level: 'edge', name: T('Uç durum: %n bir sonraki adımda ne yapardı (kavramsal)', 'Edge case: what %n would do next (conceptual)'), data: mk(false, 11, 7, true) },
      { id: 'secure-fixed', level: 'edge', small: true, name: T('Uç durum: güvenli sürüm — hiç tarama yok', 'Edge case: the secure version — no scan at all'), data: mk(true, 0, 0, false) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.secure ? 1 : data.specCount; },
    random: function (level, r) {
      var ranges = { easy: [10, 11], normal: [10, 13], hard: [12, 16], extreme: [12, 16] };
      var rg = ranges[level] || ranges.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var secretAt = D.randInt(r, 1, n + 3);
      return mk(false, n, secretAt, false);
    },
    input: {
      hint: T('belirteç-sayısı hedef-konum [n] (ya da: SECURE)', 'marker-count target-position [n] (or: SECURE)'),
      format: function (data) {
        if (data.secure) return 'SECURE';
        return data.specCount + ' ' + data.secretAt + (data.writeDemo ? ' n' : '');
      },
      tokens: function (data) {
        if (data.secure) return ['argv[1]'];
        var t = []; for (var i = 1; i <= data.specCount; i++) t.push('%x#' + i); return t;
      },
      parse: function (text) {
        var s = String(text).trim();
        if (/^SECURE$/i.test(s)) return mk(true, 0, 0, false);
        var parts = s.split(/\s+/);
        if (parts.length < 2 || parts.length > 3) throw T('"belirteç-sayısı hedef-konum [n]" biçiminde olmalı.', 'Must be "marker-count target-position [n]".');
        if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) throw T('Sayılar tam sayı olmalı.', 'The numbers must be integers.');
        var n = parseInt(parts[0], 10), at = parseInt(parts[1], 10);
        if (n < 1 || n > 16) throw T('Belirteç sayısı 1-16 arasında olmalı.', 'The marker count must be between 1 and 16.');
        if (at < 1) throw T('Hedef konum en az 1 olmalı.', 'The target position must be at least 1.');
        if (parts[2] && parts[2] !== 'n') throw T('Üçüncü alan yalnız "n" olabilir.', 'The third field can only be "n".');
        return mk(false, n, at, !!parts[2]);
      },
      bad: ['', 'SECUR', '0 5', '5 0', 'abc 5', '5 abc', '20 5', '5 5 x']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
