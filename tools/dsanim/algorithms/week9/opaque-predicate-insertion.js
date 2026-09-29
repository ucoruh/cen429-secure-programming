// CEN429 — Week 9 — Demo 1, R-01 (code/week-09/01-manual-obfuscation/obfuscated.c)
// An opaque predicate is a condition (or, as here, an opaque CONSTANT) whose value the program's
// AUTHOR knows in advance for every possible input, but which a static analyzer cannot prove
// without real reasoning. `opaque_zero(x) = (x*(x+1)) & 1` rests on a number-theory fact: the
// product of two consecutive integers is always even, so `& 1` is always 0 — for EVERY unsigned
// x, without exception. grant_access() folds this into `state = START + opaque_zero(...)`, so to
// a disassembler it LOOKS like `state` could become START+1 (an invalid enum value); it never
// does. The demo proves the identity empirically (sweeping many x, defender's/evaluator's view)
// the same way section 10 later shows a deobfuscator would.
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-09/01-manual-obfuscation/obfuscated.c), full file, byte-identical.
  var FULL_C = [
    '/*',
    ' * CEN429 - Week 9 - Demo 1: OBFUSCATED version (same behavior, hand-hardened).',
    ' * Rules applied (same names as the slides/notes):',
    ' *   R-01 opaque predicate  : the branch is tied to an always-true arithmetic identity.',
    ' *   R-04 flattening        : control flow is moved into a single switch dispatcher.',
    ' *   R-05 randomized exit   : on failure, the state variable is pushed to an undefined value,',
    ' *                            exiting through the default case.',
    ' *   R-07 constant encoding : the valid token string stays XOR-encoded, is decoded only at use,',
    ' *                            and is wiped IMMEDIATELY after use.',
    ' *   R-08 opaque boolean    : the result is not a plain 0/1; it is derived from two fields.',
    ' * Behavior is IDENTICAL to clean.c; only readability drops and cost rises.',
    ' */',
    '#include <string.h>',
    '#include "common.h"',
    '',
    '/* Encoded "CEN429-OK" (each byte ^ 0x5A). Not plainly visible with `strings`. */',
    'static const unsigned char ENCODED[] = {',
    '    0x19, 0x1F, 0x14, 0x6E, 0x68, 0x63, 0x77, 0x15, 0x11  /* "CEN429-OK", each byte ^ 0x5A */',
    '};',
    '#define ENCODED_LEN ((unsigned)(sizeof ENCODED))',
    '',
    '/* R-01: x*(x+1) is always even -> always 0. Hard for static analysis to prove. */',
    'static int opaque_zero(unsigned x) { return (int)((x * (x + 1u)) & 1u); }',
    '',
    '/* R-08: opaque boolean; a ^ b == 0xFFFF -> GRANTED. */',
    'typedef struct { unsigned a, b; } Decision;',
    'static int decision_grants(Decision d) { return (d.a ^ d.b) == 0xFFFFu; }',
    '',
    'static int constant_time_equals(const unsigned char *a, const char *b, unsigned n)',
    '{',
    '    unsigned diff = 0;',
    '    for (unsigned i = 0; i < n; i++)',
    '        diff |= (unsigned)(a[i] ^ (unsigned char)b[i]);',
    '    return diff == 0;',
    '}',
    '',
    'int grant_access(const char *token)',
    '{',
    '    enum { START, LENGTH, DECODE, COMPARE, GRANT, DENY, DONE = 99 };',
    '    int state = START + opaque_zero((unsigned)strlen(token)); /* opaque: still START */',
    '    unsigned n = ENCODED_LEN;',
    '    char decoded[ENCODED_LEN + 1];',
    '    Decision d = { 0, 0 };',
    '    int result = DENIED;',
    '',
    '    for (;;) {',
    '        switch (state) {',
    '        case START:',
    '            state = LENGTH;',
    '            break;',
    '        case LENGTH:',
    '            /* R-05: on a length mismatch, jump to an undefined state -> default -> DENY */',
    '            state = (strlen(token) == n) ? DECODE : (DONE + 7);',
    '            break;',
    '        case DECODE:',
    '            for (unsigned i = 0; i < n; i++) decoded[i] = (char)(ENCODED[i] ^ 0x5A);',
    '            decoded[n] = \'\\0\';',
    '            state = COMPARE;',
    '            break;',
    '        case COMPARE:',
    '            if (constant_time_equals((const unsigned char *)token, decoded, n))',
    '                d.a = 0xA3C1u, d.b = 0x5C3Eu;   /* a^b == 0xFFFF -> grant */',
    '            else',
    '                d.a = 0x1111u, d.b = 0x2222u;   /* not granted */',
    '            memset(decoded, 0, sizeof decoded);  /* R-07: wipe the decoded string IMMEDIATELY */',
    '            state = decision_grants(d) ? GRANT : DENY;',
    '            break;',
    '        case GRANT:',
    '            result = GRANTED;',
    '            state = -1;                          /* default -> exit (success also exits via default) */',
    '            break;',
    '        case DENY:',
    '            result = DENIED;',
    '            state = -2;',
    '            break;',
    '        default:                                  /* R-05 randomized exit point */',
    '            return result;',
    '        }',
    '    }',
    '}'
  ];

  function mk(xs) { return { xs: xs.slice() }; }

  /** Independent: recompute (x*(x+1))&1 for every x with a fresh expression (a plain modulo
   * instead of the bitwise-AND form used in opaque_zero itself) — not shared with build(). */
  function reference(data) {
    var mods = data.xs.map(function (x) { return (x * (x + 1)) % 2; });
    var allZero = mods.every(function (m) { return m === 0; });
    return { allZero: allZero, mods: mods };
  }

  function build(S, data) {
    var n = data.xs.length, W = 64, H = 30, GAP = 4;
    S.label('lx', { x: -10, y: 22, text: 'x =', anchor: 'end', size: 13, mono: true });
    S.label('lprod', { x: -10, y: 22 + (H + GAP), text: 'x*(x+1) =', anchor: 'end', size: 13, mono: true });
    S.label('lmod', { x: -10, y: 22 + 2 * (H + GAP), text: '& 1 =', anchor: 'end', size: 13, mono: true });
    S.step(T('Bir sayı-kuramı gerçeği: ardışık iki tam sayının çarpımı HER ZAMAN çifttir. `opaque_zero(x) = (x*(x+1)) & 1` her `x` için `0`DIR.',
              'A number-theory fact: the product of two consecutive integers is ALWAYS even. `opaque_zero(x) = (x*(x+1)) & 1` is `0` for every `x`.'),
           { c: [22, 23] });

    var allZero = true, mods = [];
    for (var i = 0; i < n; i++) {
      var x = data.xs[i], prod = x * (x + 1), mod = prod & 1;
      mods.push(mod);
      if (mod !== 0) allZero = false;
      S.box('x' + i, { x: i * (W + GAP), y: 0, w: W, h: H, size: 12, mono: true, text: String(x), style: 'normal', above: '#' + (i + 1) });
      S.box('p' + i, { x: i * (W + GAP), y: H + GAP, w: W, h: H, size: 10, mono: true, text: String(prod), style: 'dim' });
      S.box('m' + i, { x: i * (W + GAP), y: 2 * (H + GAP), w: W, h: H, size: 12, mono: true, text: String(mod), style: mod !== 0 ? 'del' : 'new' });
      S.at(i);
      S.step(T('`x=' + x + '`: `x*(x+1)=' + prod + '`, `' + prod + ' & 1 = ' + mod + '`' + (mod !== 0 ? ' — BEKLENMEDİK! (asla olmamalı)' : ' — 0, öngörüldüğü gibi.'),
                'x=' + x + ': x*(x+1)=' + prod + ', ' + prod + ' & 1 = ' + mod + (mod !== 0 ? ' — UNEXPECTED! (should never happen)' : ' — 0, as predicted.')),
             { c: [23] });
    }
    S.at(null);

    S.label('useTitle', { x: (n * (W + GAP)) / 2, y: 2 * (H + GAP) + 60, text: T('`grant_access` içindeki gerçek kullanım — satır 40', 'The real use inside `grant_access` — line 40'), anchor: 'middle', bold: true, size: 13 });
    S.box('useLine', { x: 0, y: 2 * (H + GAP) + 80, w: n * (W + GAP) - GAP, h: 40, size: 12, mono: true, text: 'state = START + opaque_zero(...)', style: 'active' });
    S.step(T('Bir tersine derleyici bu satırı görünce `state`\'in `START` YA DA `START+1` (geçersiz bir enum) olabileceğini düşünür — oysa `opaque_zero` HER ZAMAN 0 döndüğü için sonuç HER ZAMAN `START`tır. Görünürdeki "belirsizlik" sahtedir.',
              'A disassembler seeing this line assumes `state` could become `START` OR `START+1` (an invalid enum) — but since `opaque_zero` ALWAYS returns 0, the result is ALWAYS `START`. The apparent "uncertainty" is fake.'),
           { c: [40] });

    S.result = reference(data);
    S.step(allZero
             ? T(n + '/' + n + ' değer için `(x*(x+1)) & 1 == 0` doğrulandı — hiç `1` görülmedi. `state` yalnız `START`tan başlar; R-04\'teki dağıtıcı bunun üstüne inşa edilir.',
                 n + '/' + n + ' values confirm `(x*(x+1)) & 1 == 0` — `1` never appeared. `state` only ever starts at `START`; R-04\'s dispatcher is built on top of this.')
             : T('Beklenmeyen bir `1` görüldü — bu, opak yüklemin iddiasını ÇÜRÜTÜR (gerçek matematikte olmaz, yalnız bir uygulama hatasını gösterir).',
                 'An unexpected `1` appeared — this would DISPROVE the opaque predicate\'s claim (impossible in real math; it would only indicate an implementation bug).'),
           {});
  }

  D.define({
    id: 'opaque-predicate-insertion',
    title: T('Opak yüklem ekleme: (x*(x+1)) & 1 asla 1 değildir (obfuscated.c, R-01)', 'Opaque predicate insertion: (x*(x+1)) & 1 is never 1 (obfuscated.c, R-01)'),
    code: { c: FULL_C },
    presets: [
      { id: 'small-nonneg', level: 'normal', name: T('Normal: 10 küçük strlen değeri (0..20)', 'Normal: 10 small strlen-like values (0..20)'), data: mk([0, 1, 2, 3, 4, 5, 7, 9, 12, 20]) },
      { id: 'mixed-large', level: 'hard', name: T('Zor: 12 değer, büyük ve karışık', 'Hard: 12 values, large and mixed'), data: mk([100, 255, 256, 1000, 4095, 4096, 65535, 65536, 99999, 123456, 7, 8]) },
      { id: 'edge-extremes', level: 'edge', name: T('Uç durum: 10 büyük değer (JS güvenli tamsayı sınırının altında, taşma yok)', 'Edge case: 10 large values (kept under the JS safe-integer bound, no overflow)'), data: mk([0, 1, 90000000, 89999999, 50000000, 46341, 46340, 65536, 65535, 2]) },
      { id: 'edge-strlen-of-token', level: 'edge', name: T('Uç durum: gerçekçi jeton uzunlukları (0..20)', 'Edge case: realistic token lengths (0..20)'), data: mk([0, 1, 5, 8, 9, 9, 10, 15, 18, 20]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.xs.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [11, 13], extreme: [12, 15] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      // Capped at 90,000,000 (well under sqrt(2^53)) so x*(x+1) stays an EXACT JS double -- no
      // silent floating-point rounding that could flip the observed parity for huge x.
      var maxMag = { easy: 20, normal: 1000, hard: 1000000, extreme: 90000000 }[level] || 1000;
      var xs = [];
      for (var i = 0; i < n; i++) xs.push(D.randInt(r, 0, maxMag));
      return mk(xs);
    },
    input: {
      hint: T('x1,x2,…(≥10 negatif olmayan tam sayı)', 'x1,x2,…(>=10 non-negative integers)'),
      format: function (data) { return data.xs.join(','); },
      tokens: function (data) { return data.xs.map(String); },
      parse: function (text) {
        var parts = String(text).split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        if (parts.length < 10) throw T('En az 10 tam sayı girin.', 'Enter at least 10 integers.');
        var nums = [];
        for (var i = 0; i < parts.length; i++) {
          if (!/^\d+$/.test(parts[i])) throw T('"' + parts[i] + '" negatif olmayan bir tam sayı değil.', '"' + parts[i] + '" is not a non-negative integer.');
          nums.push(parseInt(parts[i], 10));
        }
        return mk(nums);
      },
      bad: ['', '1,2,3', '1,2,3,4,5,6,7,8,9,-1', '1,2,3,4,5,6,7,8,9,abc', '1,2,3,4,5,6,7,8,9,1.5']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
