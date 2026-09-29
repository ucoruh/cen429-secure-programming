// CEN429 — Week 4 — Demo 3 (code/week-04/03-undefined-behavior/ub.c, ub_secure.c)
// int y = x + add; with x == INT_MAX is signed integer overflow: undefined behavior (CWE-190). On
// ordinary x86 hardware it silently wraps around to a negative number (two's complement), so the
// program "looks like it runs" while computing the wrong answer. checked_add() checks the boundary
// BEFORE adding (SEI CERT INT32-C) and rejects the operation instead of performing it.
(function (D) {
  'use strict';
  var T = D.T;
  var INT_MAX = 2147483647, INT_MIN = -2147483648;

  // Exact source (code/week-04/03-undefined-behavior/ub.c) — the full file, byte-identical;
  // mode_shift/mode_unaligned/main are shown too even though this animation only walks mode_overflow.
  var VULN_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 3: undefined behavior (VULNERABLE)',
    ' *',
    ' * Some C operations are "undefined behavior": the compiler ASSUMES they NEVER HAPPEN and',
    ' * optimizes accordingly. On x86 most of them cause no visible hardware fault, so the program',
    ' * "looks like it works" — but the result is wrong, and the behavior can change with a new',
    ' * compiler version. UndefinedBehaviorSanitizer (UBSan) catches these AT RUN TIME.',
    ' *',
    ' * Mode:',
    ' *   overflow : signed integer overflow (INT_MAX + 1)        -> CWE-190',
    ' *   shift    : invalid bit shift (1 << 31 / >= width)        -> CWE-190/CWE-758',
    ' *   unaligned: misaligned memory access                      -> CWE-758',
    ' */',
    '#include <limits.h>',
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    'static int mode_overflow(int add)',
    '{',
    '    int x = INT_MAX;',
    '    int y = x + add;             /* UB: signed integer overflow */',
    '    printf("   INT_MAX + %d = %d  (mathematically it should be %lld)\\n",',
    '           add, y, (long long)INT_MAX + add);',
    '    return 0;',
    '}',
    '',
    'static int mode_shift(int n)',
    '{',
    '    int x = 1;',
    '    int y = x << n;               /* UB: if n>=31 it does not fit in an int / undefined */',
    '    printf("   1 << %d = %d\\n", n, y);',
    '    return 0;',
    '}',
    '',
    'static int mode_unaligned(void)',
    '{',
    '    /* Reading a 4-byte int from an address shifted by 1 byte: misaligned access */',
    '    unsigned char buffer[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };',
    '    int *p = (int *)(buffer + 1);   /* UB: violates alignment requirements */',
    '    printf("   int read from a misaligned address = %d\\n", *p);',
    '    return 0;',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    const char *mode = (argc >= 2) ? argv[1] : "overflow";',
    '    if (strcmp(mode, "overflow") == 0)   return mode_overflow(argc >= 3 ? atoi(argv[2]) : 1);',
    '    if (strcmp(mode, "shift") == 0)      return mode_shift(argc >= 3 ? atoi(argv[2]) : 31);',
    '    if (strcmp(mode, "unaligned") == 0)  return mode_unaligned();',
    '    fprintf(stderr, "Usage: %s <overflow|shift|unaligned> [number]\\n", argv[0]);',
    '    return 2;',
    '}'
  ];
  // Exact source (code/week-04/03-undefined-behavior/ub_secure.c) — the full file, byte-identical.
  var SECURE_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 3: undefined behavior (SECURE VERSION)',
    ' *',
    ' * We check every operation EXPLICITLY, BEFORE it runs (SEI CERT C: INT32-C prevent overflow,',
    ' * INT34-C do not perform an invalid shift, EXP36-C do not generate a misaligned pointer). The',
    ' * overflow check uses the compiler builtin (GCC/Clang) where available so it stays portable, and',
    ' * a hand-written check otherwise (MSVC). Instead of a misaligned access, we use memcpy: the',
    ' * compiler turns it into an aligned access, and there is no UB.',
    ' */',
    '#include <limits.h>',
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    '/* Portable checked signed addition. Returns 1 on success, 0 on overflow. */',
    'static int checked_add(int a, int b, int *result)',
    '{',
    '#if defined(__GNUC__) || defined(__clang__)',
    '    return __builtin_add_overflow(a, b, result) ? 0 : 1;',
    '#else',
    '    if ((b > 0 && a > INT_MAX - b) || (b < 0 && a < INT_MIN - b))',
    '        return 0;',
    '    *result = a + b;',
    '    return 1;',
    '#endif',
    '}',
    '',
    'static int mode_overflow(int add)',
    '{',
    '    int y;',
    '    if (!checked_add(INT_MAX, add, &y)) {',
    '        printf("   Rejected: INT_MAX + %d overflows (operation not performed).\\n", add);',
    '        return 0;',
    '    }',
    '    printf("   INT_MAX + %d = %d\\n", add, y);',
    '    return 0;',
    '}',
    '',
    'static int mode_shift(int n)',
    '{',
    '    if (n < 0 || n >= 31) {         /* 0..30 is safe for a 32-bit int */',
    '        printf("   Rejected: %d is outside the valid shift range (0-30).\\n", n);',
    '        return 0;',
    '    }',
    '    int y = 1 << n;',
    '    printf("   1 << %d = %d\\n", n, y);',
    '    return 0;',
    '}',
    '',
    'static int mode_unaligned(void)',
    '{',
    '    unsigned char buffer[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };',
    '    int value;',
    '    memcpy(&value, buffer + 1, sizeof value);  /* no alignment issue */',
    '    printf("   int safely read with memcpy = %d\\n", value);',
    '    return 0;',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    const char *mode = (argc >= 2) ? argv[1] : "overflow";',
    '    if (strcmp(mode, "overflow") == 0)   return mode_overflow(argc >= 3 ? atoi(argv[2]) : 1);',
    '    if (strcmp(mode, "shift") == 0)      return mode_shift(argc >= 3 ? atoi(argv[2]) : 31);',
    '    if (strcmp(mode, "unaligned") == 0)  return mode_unaligned();',
    '    fprintf(stderr, "Usage: %s <overflow|shift|unaligned> [number]\\n", argv[0]);',
    '    return 2;',
    '}'
  ];

  // ------------------------------------------------------------------ data
  function mk(secure, adds) { return { secure: !!secure, adds: adds.slice() }; }

  /** Independent computation: exact double-precision sum + modular reduction into int32 range —
   * a different method than build()'s boundary-comparison-then-truncate logic. */
  function trueOverflow(a, b) { var s = a + b; return s > INT_MAX || s < INT_MIN; }
  function trueWrap(a, b) {
    var s = a + b, range = 4294967296;
    var m = ((s - INT_MIN) % range + range) % range;
    return m + INT_MIN;
  }
  function reference(data) {
    var overflowed = [], values = [];
    data.adds.forEach(function (add) {
      var of = trueOverflow(INT_MAX, add);
      overflowed.push(of);
      if (data.secure) values.push(of ? null : INT_MAX + add);
      else values.push(trueWrap(INT_MAX, add));
    });
    return { secure: !!data.secure, overflowed: overflowed, values: values };
  }

  function build(S, data) {
    var n = data.adds.length;
    S.label('title', { x: 320, y: -22, text: T('`x = INT_MAX`; her `add` için `checked_add(x, add, &y)` mi, çıplak `x + add` mi?', 'x = INT_MAX; for each add, is it a bare x + add, or checked_add(x, add, &y)?'), anchor: 'middle', bold: true, size: 13 });
    S.box('bound', { x: 0, y: 0, w: 190, h: 36, size: 13, mono: true, text: 'INT_MAX = 2147483647', style: 'dim' });
    S.step(data.secure
             ? T('`checked_add(INT_MAX, add, &y)` her seferinde aynı `INT_MAX` sabitiyle çağrılacak.',
                 '`checked_add(INT_MAX, add, &y)` will be called with the same `INT_MAX` constant every time.')
             : T('`x` sabit `INT_MAX` olarak ayarlandı. `y = x + add` her seferinde bu sabitten başlar.',
                 '`x` is fixed at `INT_MAX`. `y = x + add` starts from this same constant every time.'),
           { c: data.secure ? [29, 31] : [21] });

    var W = 560, H = 34, GAP = 6;
    var overflowed = [], values = [];
    for (var i = 0; i < n; i++) {
      var add = data.adds[i];
      var y = i * (H + GAP) + 50;
      S.box('row' + i, { x: 0, y: y, w: 260, h: H, size: 13, mono: true, text: 'add = ' + add, style: 'normal' });
      S.at(i);
      var willOverflow = add > 0;   // with x fixed at INT_MAX, this is exactly checked_add's own boundary test
      overflowed.push(willOverflow);
      if (data.secure) {
        S.step(T('`add = ' + add + '` → `checked_add`: `add > 0 && x > INT_MAX - add`? ' + (willOverflow ? 'EVET (x zaten INT_MAX) — toplama YAPILMADAN reddediliyor.' : 'hayır — güvenle toplanabilir.'),
                  '`add = ' + add + '` → `checked_add`: `add > 0 && x > INT_MAX - add`? ' + (willOverflow ? 'YES (x is already INT_MAX) — rejected BEFORE adding.' : 'no — safe to add.')),
               { c: [{ n: 22, note: T('add=' + add + ' > 0 && x > INT_MAX-add? ' + (willOverflow ? 'evet → reddet' : 'hayır → devam'), 'add=' + add + ' > 0 && x > INT_MAX-add? ' + (willOverflow ? 'yes → reject' : 'no → continue')) },
                    willOverflow ? 23 : { n: 23, skip: true }] });
        if (willOverflow) {
          S.set('row' + i, { style: 'new' });
          S.label('r' + i, { x: 280, y: y + H / 2 + 5, text: T('REDDEDİLDİ — y hiç yazılmadı', 'REJECTED — y was never written'), anchor: 'start', size: 12, bold: true });
          values.push(null);
          S.step(T('`Rejected: INT_MAX + ' + add + ' overflows (operation not performed).`',
                    '`Rejected: INT_MAX + ' + add + ' overflows (operation not performed).`'),
                 { c: [33] });
        } else {
          var val1 = INT_MAX + add;
          S.set('row' + i, { style: 'new' });
          S.label('r' + i, { x: 280, y: y + H / 2 + 5, text: T('kabul edildi: y = ' + val1, 'accepted: y = ' + val1), anchor: 'start', size: 12 });
          values.push(val1);
          S.step(T('`INT_MAX + ' + add + ' = ' + val1 + '` — sınır içinde, gerçek matematiksel sonuç.',
                    '`INT_MAX + ' + add + ' = ' + val1 + '` — within bounds, the real mathematical result.'),
                 { c: [36] });
        }
      } else {
        var wrapped = (INT_MAX + add) | 0;
        values.push(wrapped);
        S.set('row' + i, { style: willOverflow ? 'del' : 'normal' });
        S.label('r' + i, { x: 280, y: y + H / 2 + 5, text: T('y = ' + wrapped + (willOverflow ? ' (SARDI!)' : ''), 'y = ' + wrapped + (willOverflow ? ' (WRAPPED!)' : '')), anchor: 'start', size: 12, bold: willOverflow });
        S.step(T('`int y = x + add;` denetimsiz çalışıyor: `INT_MAX + ' + add + ' = ' + wrapped + '`' + (willOverflow ? ' — 33. bit taşıp atıldı, sonuç YANLIŞ ama program çökmedi.' : ' — bu değer için taşma olmadı.'),
                  '`int y = x + add;` runs unchecked: `INT_MAX + ' + add + ' = ' + wrapped + '`' + (willOverflow ? ' — the 33rd bit was dropped, the result is WRONG but the program did not crash.' : ' — no overflow for this value.')),
               { c: [23, 24, 25] });
      }
    }
    S.at(null);
    S.result = { secure: !!data.secure, overflowed: overflowed, values: values };
    var overflowCount = overflowed.filter(function (x) { return x; }).length;
    if (data.secure) {
      S.step(T(overflowCount + '/' + n + ' toplama reddedildi; kalanı doğru sonuçla kabul edildi. Hiçbir taşma SESSİZCE geçmedi.',
                overflowCount + '/' + n + ' additions were rejected; the rest were accepted with the correct result. No overflow slipped through SILENTLY.'),
             {});
    } else {
      S.step(T(overflowCount + '/' + n + ' toplama tanımsız davranışa (taşma) uğradı — hepsi "başarılı" göründü, hiçbiri çökmedi. UBSan bunları çalışma anında yakalar.',
                overflowCount + '/' + n + ' additions hit undefined behavior (overflow) — every one of them "looked successful," none crashed. UBSan catches these at run time.'),
             {});
    }
  }

  D.define({
    id: 'integer-overflow',
    title: T('İşaretli tamsayı taşması: INT_MAX + add (ub.c)', 'Signed integer overflow: INT_MAX + add (ub.c)'),
    code: function (data) { return { c: data && data.secure ? SECURE_C : VULN_C }; },
    presets: [
      { id: 'normal-mix', level: 'normal', name: T('Normal: 10 toplama, karışık işaret', 'Normal: 10 adds, mixed sign'), data: mk(false, [1, -1, 100, -100, 5, -5, 1000000, -1000000, 2, -2]) },
      { id: 'hard-extreme', level: 'hard', name: T('Zor: uç değerler dahil 12 toplama', 'Hard: 12 adds including extreme values'), data: mk(false, [1, 2, 3, -1, -2, -3, 1000000000, -1000000000, INT_MAX, INT_MIN, 10, -10]) },
      { id: 'edge-zero', level: 'edge', name: T('Uç durum: 0 dahil, tam sınırda', 'Edge case: includes 0, right at the boundary'), data: mk(false, [0, 1, -1, 2, -2, 3, -3, 4, -4, 5]) },
      { id: 'edge-secure', level: 'edge', name: T('Uç durum: güvenli sürüm aynı karışımı reddediyor', 'Edge case: the secure version rejects the same mix'), data: mk(true, [1, -1, 100, -100, 5, -5, 1000000, -1000000, 2, -2]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.adds.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [12, 14], extreme: [12, 16] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var adds = [];
      for (var i = 0; i < n; i++) {
        var mag = D.randInt(r, 0, 2000000000);
        adds.push(D.randInt(r, 0, 1) === 1 ? mag : -mag);
      }
      return mk(D.randInt(r, 0, 1) === 1, adds);
    },
    input: {
      hint: T('[SECURE] add1, add2, … (en az 10 tam sayı)', '[SECURE] add1, add2, … (at least 10 integers)'),
      format: function (data) { return (data.secure ? 'SECURE ' : '') + data.adds.join(', '); },
      tokens: function (data) { return data.adds.map(String); },
      parse: function (text) {
        var s = String(text).trim(), secure = false;
        if (/^SECURE\s+/i.test(s)) { secure = true; s = s.replace(/^SECURE\s+/i, ''); }
        var parts = s.split(/[\s,;]+/).filter(Boolean);
        if (parts.length < 10) throw T('En az 10 tam sayı girin.', 'Enter at least 10 integers.');
        var adds = [];
        for (var i = 0; i < parts.length; i++) {
          if (!/^-?\d+$/.test(parts[i])) throw T('"' + parts[i] + '" bir tam sayı değil.', '"' + parts[i] + '" is not an integer.');
          var v = parseInt(parts[i], 10);
          if (v > INT_MAX || v < INT_MIN) throw T('"' + parts[i] + '" 32-bit int sınırlarını aşıyor.', '"' + parts[i] + '" is outside the 32-bit int range.');
          adds.push(v);
        }
        return mk(secure, adds);
      },
      bad: ['', '1, 2, 3', 'SECURE', 'a, b, c, 1,2,3,4,5,6,7', '1,2,3,4,5,6,7,8,9,99999999999']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
