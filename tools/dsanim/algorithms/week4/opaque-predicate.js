// CEN429 — Week 4 — Demo 7 extra (code/week-04/07-flow-flattening/opaque.c)
// An opaque predicate is a condition the PROGRAM AUTHOR knows the answer to in advance (always true,
// or always false, for every possible input) but that a disassembler cannot prove without deep
// reasoning. This one rests on a number-theory fact: a perfect square modulo 4 is never 2 — so
// `(x*x) % 4 != 2` is true for EVERY int x, and `(x*x) % 4 == 2` is false for every int x. The demo
// proves it empirically (sweeping many x values, defender's view) rather than trusting the algebra
// alone, then shows a decoy branch that LOOKS reachable but never runs.
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-04/07-flow-flattening/opaque.c), full file, byte-identical.
  var FULL_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 7 (extra): opaque predicates.',
    ' *',
    ' * An opaque predicate is a condition whose truth value the PROGRAM AUTHOR knows in advance (always',
    ' * true, or always false, for every possible input) but which is hard for a static analyzer or',
    ' * disassembler to prove without deep reasoning. Obfuscators insert them to add branches that LOOK',
    ' * reachable in the disassembly but never actually execute (or always execute), wasting a reverse',
    ' * engineer\'s time on a dead end.',
    ' *',
    ' * This demo\'s predicate is a small number-theory fact: for ANY integer x, (x*x) % 4 is always 0 or',
    ' * 1 -- it can never be 2 or 3 (a perfect square is never congruent to 2 or 3 modulo 4). So the',
    ' * condition below is ALWAYS TRUE, for every int x, without exception.',
    ' *',
    ' * VIEW: written from the DEFENDER\'s/evaluator\'s side -- what the predicate does, how we can MEASURE',
    ' * that it really is always-true/false, and its limits (it slows down reading; it does not make',
    ' * analysis impossible).',
    ' */',
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    '/* ALWAYS TRUE for every int x: a perfect square modulo 4 is never 2. */',
    'int opaque_true(int x)',
    '{',
    '    return ((x * x) % 4) != 2;',
    '}',
    '',
    '/* ALWAYS FALSE for every int x: the same fact, negated. */',
    'int opaque_false(int x)',
    '{',
    '    return ((x * x) % 4) == 2;',
    '}',
    '',
    '/* The decoy branch: reachable-LOOKING in the disassembly (there is a real conditional jump to it),',
    '   but never actually taken, because opaque_false() never returns nonzero. */',
    'static void decoy_branch(int x)',
    '{',
    '    printf("   [decoy] unreachable: opaque_false(%d) was somehow true.\\n", x);',
    '}',
    '',
    '/* The real check, guarded by an always-true opaque predicate: adds a branch a decompiler must',
    '   consider, that always resolves the same way. */',
    'static int real_check(const char *guess)',
    '{',
    '    return strlen(guess) == 4 && guess[0] == \'4\' && guess[1] == \'2\' &&',
    '           guess[2] == \'9\' && guess[3] == \'1\';',
    '}',
    '',
    'int pin_verify_obfuscated(const char *guess, int x)',
    '{',
    '    if (opaque_false(x)) {         /* looks like a real branch; never taken for ANY x */',
    '        decoy_branch(x);',
    '        return -1;                  /* dead code: never returned */',
    '    }',
    '    if (opaque_true(x)) {          /* looks like a real branch; ALWAYS taken for ANY x */',
    '        return real_check(guess) ? 1 : 0;',
    '    }',
    '    return -2;                      /* dead code: never returned (opaque_true is always true) */',
    '}'
  ];

  function mk(xs, guess) { return { xs: xs.slice(), guess: guess }; }

  /** Independent: recompute (x*x)%4 for every x with a functional map/every chain, and the PIN
   * result with a plain string comparison — neither is shared with build()'s row-by-row loop.
   * Uses BigInt (exact integer arithmetic), not the double-precision `x * x`: for |x| beyond about
   * 94 million, x*x exceeds Number.MAX_SAFE_INTEGER (2^53) and loses precision in its low bits —
   * which are exactly the bits `% 4` reads — so a plain-double square can silently round to the
   * WRONG remainder for large x (verified: x=2147483647 gives remainder 0 in double math, but the
   * true remainder, from x being odd, is 1). The edge-extremes preset exists precisely to exercise
   * this range, so the reference must be exact there. */
  function reference(data) {
    var mods = data.xs.map(function (x) { return Number((BigInt(x) * BigInt(x)) % 4n); });
    var allSafe = mods.every(function (m) { return m !== 2; });
    return { allSafe: allSafe, mods: mods, pinResult: data.guess === '4291' };
  }

  function build(S, data) {
    var n = data.xs.length, H = 30, GAP = 4;
    // Exact x*x via BigInt for the same reason as reference() above (double precision is not enough
    // once |x| is large, and this row's very purpose is to display x*x to the student).
    var sqStrs = data.xs.map(function (x) { return (BigInt(x) * BigInt(x)).toString(); });
    // Box width must fit the widest text that will appear in the x or x*x row: with INT_MAX/INT_MIN-
    // range values (edge-extremes preset) x*x can be a 19-20 digit number, far past a fixed 60px box.
    var maxLen = 0;
    for (var mi = 0; mi < n; mi++) {
      maxLen = Math.max(maxLen, String(data.xs[mi]).length, sqStrs[mi].length);
    }
    var W = Math.max(60, maxLen * 11 + 16);
    S.label('lx', { x: -10, y: 22, text: 'x =', anchor: 'end', size: 13, mono: true });
    S.label('lsq', { x: -10, y: 22 + (H + GAP), text: 'x*x =', anchor: 'end', size: 13, mono: true });
    S.label('lmod', { x: -10, y: 22 + 2 * (H + GAP), text: '(x*x)%4 =', anchor: 'end', size: 13, mono: true });
    S.step(T('Bir sayı-kuramı gerçeği: tam kare bir sayının 4 ile bölümünden kalan HİÇBİR ZAMAN 2 olamaz. `opaque_true(x) = ((x*x)%4 != 2)` her `x` için DOĞRUdur.',
              'A number-theory fact: a perfect square\'s remainder mod 4 can NEVER be 2. `opaque_true(x) = ((x*x)%4 != 2)` is TRUE for every `x`.'),
           { c: [22, 24, 25] });

    var allSafe = true, mods = [];
    for (var i = 0; i < n; i++) {
      var x = data.xs[i], sq = sqStrs[i], mod = Number((BigInt(x) * BigInt(x)) % 4n);
      mods.push(mod);
      if (mod === 2) allSafe = false;
      S.box('x' + i, { x: i * (W + GAP), y: 0, w: W, h: H, size: 12, mono: true, text: String(x), style: 'normal', above: '#' + (i + 1) });
      S.box('q' + i, { x: i * (W + GAP), y: H + GAP, w: W, h: H, size: 11, mono: true, text: sq, style: 'dim' });
      S.box('m' + i, { x: i * (W + GAP), y: 2 * (H + GAP), w: W, h: H, size: 12, mono: true, text: String(mod), style: mod === 2 ? 'del' : 'new' });
      S.at(i);
      S.step(T('`x=' + x + '`: `x*x=' + sq + '`, `' + sq + ' % 4 = ' + mod + '`' + (mod === 2 ? ' — BEKLENMEDİK! (bu asla olmamalı)' : ' — 2 değil, öngörüldüğü gibi.'),
                'x=' + x + ': x*x=' + sq + ', ' + sq + ' % 4 = ' + mod + (mod === 2 ? ' — UNEXPECTED! (this should never happen)' : ' — not 2, as predicted.')),
             { c: [24] });
    }
    S.at(null);

    var x0 = data.xs[0], x1 = data.xs[n - 1];
    var r0 = 4, r1 = 4;
    S.label('pinTitle', { x: (n * (W + GAP)) / 2, y: 2 * (H + GAP) + 60, text: T('`pin_verify_obfuscated("' + data.guess + '", x)` — sonuç x\'e göre DEĞİŞİR Mİ?', '`pin_verify_obfuscated("' + data.guess + '", x)` — does the result DEPEND on x?'), anchor: 'middle', bold: true, size: 13 });
    var real = data.guess === '4291';
    S.box('call0', { x: 0, y: 2 * (H + GAP) + 80, w: 260, h: 34, size: 12, mono: true, text: 'x=' + x0 + ' -> ' + (real ? 1 : 0), style: 'new' });
    S.box('call1', { x: 280, y: 2 * (H + GAP) + 80, w: 260, h: 34, size: 12, mono: true, text: 'x=' + x1 + ' -> ' + (real ? 1 : 0), style: 'new' });
    S.step(T('`opaque_false(x)` her zaman YANLIŞ olduğundan `decoy_branch` hiç çağrılmaz; `opaque_true(x)` her zaman DOĞRU olduğundan asıl denetime her zaman girilir. Sonuç yalnız `guess`\'e bağlı, `x`\'e değil.',
              '`opaque_false(x)` is always FALSE so `decoy_branch` is never called; `opaque_true(x)` is always TRUE so the real check always runs. The result depends only on `guess`, never on `x`.'),
           { c: [
               { n: 52, note: T('opaque_false(x)? HER x için hayır', 'opaque_false(x)? no, for every x') },
               { n: 53, skip: true },
               { n: 56, note: T('opaque_true(x)? HER x için evet', 'opaque_true(x)? yes, for every x') },
               { n: 57, note: T('real_check(guess) ? 1 : 0 → ' + (real ? 1 : 0), 'real_check(guess) ? 1 : 0 → ' + (real ? 1 : 0)) }
             ] });

    S.result = reference(data);
    S.step(allSafe
             ? T(n + '/' + n + ' değer için `(x*x)%4 != 2` doğrulandı — 2 hiç görülmedi. Yem dal (`decoy_branch`) tersine mühendisin okuması gereken ölü bir yoldur, hiçbir zaman çalışmaz.',
                 n + '/' + n + ' values confirm `(x*x)%4 != 2` — 2 never appeared. The decoy branch (`decoy_branch`) is a dead path a reverse engineer must read, but it never runs.')
             : T('Beklenmeyen bir 2 görüldü — bu, opak yüklemin iddiasını ÇÜRÜTÜR (gerçek matematikte olmaz, yalnız bir uygulama hatasını gösterir).',
                 'An unexpected 2 appeared — this would DISPROVE the opaque predicate\'s claim (impossible in real math; it would only indicate an implementation bug).'),
           {});
  }

  D.define({
    id: 'opaque-predicate',
    title: T('Opak yüklem: (x*x) % 4 asla 2 değildir (opaque.c)', 'Opaque predicate: (x*x) % 4 is never 2 (opaque.c)'),
    code: { c: FULL_C },
    presets: [
      { id: 'small-positive', level: 'normal', name: T('Normal: 10 küçük pozitif x', 'Normal: 10 small positive x values'), data: mk([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], '4291') },
      { id: 'mixed-sign', level: 'hard', name: T('Zor: 12 değer, negatif ve büyük karışık', 'Hard: 12 values, mixed negative and large'), data: mk([-7, -3, -1, 0, 1, 3, 7, 100, -100, 1000, -1000, 99999], '1234') },
      { id: 'edge-extremes', level: 'edge', name: T('Uç durum: 10 uç değer (INT sınırlarına yakın)', 'Edge case: 10 extreme values (near INT bounds)'), data: mk([2147483647, -2147483648, 46340, -46340, 0, 1, -1, 2, -2, 65536], '4291') },
      { id: 'edge-wrong-guess', level: 'edge', name: T('Uç durum: yanlış PIN, sonuç yine de x\'ten bağımsız', 'Edge case: wrong PIN, the result is still independent of x'), data: mk([5, 10, 15, 20, 25, 30, 35, 40, 45, 50], '0000') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.xs.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [11, 13], extreme: [12, 15] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var maxMag = { easy: 20, normal: 1000, hard: 1000000, extreme: 2000000000 }[level] || 1000;
      var xs = [];
      for (var i = 0; i < n; i++) {
        var v = D.randInt(r, 0, maxMag);
        xs.push(D.randInt(r, 0, 1) === 1 ? v : -v);
      }
      var guess = D.randInt(r, 0, 3) === 0 ? '4291' : String(D.randInt(r, 0, 9999)).padStart(4, '0');
      return mk(xs, guess);
    },
    input: {
      hint: T('x1,x2,…(≥10 tam sayı) | tahmin', 'x1,x2,…(>=10 integers) | guess'),
      format: function (data) { return data.xs.join(',') + ' | ' + data.guess; },
      tokens: function (data) { return data.xs.map(String); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('"x1,x2,… | tahmin" biçiminde olmalı.', 'Must be "x1,x2,... | guess".');
        var xs = parts[0].split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        if (xs.length < 10) throw T('En az 10 tam sayı girin.', 'Enter at least 10 integers.');
        var nums = [];
        for (var i = 0; i < xs.length; i++) {
          if (!/^-?\d+$/.test(xs[i])) throw T('"' + xs[i] + '" bir tam sayı değil.', '"' + xs[i] + '" is not an integer.');
          nums.push(parseInt(xs[i], 10));
        }
        var guess = parts[1].trim();
        if (!/^\d{1,8}$/.test(guess)) throw T('Tahmin yalnızca rakamlardan oluşmalı.', 'The guess must contain digits only.');
        return mk(nums, guess);
      },
      bad: ['', '1,2,3 | 4291', '1,2,3,4,5,6,7,8,9,10', '1,2,3,4,5,6,7,8,9,10 | abcd', '1,x,3,4,5,6,7,8,9,10 | 4291']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
