// CEN429 — Week 9 — Section 10 (code/week-09/01-manual-obfuscation/obfuscated.c)
// The EVALUATOR's/deobfuscator's view of R-01. A symbolic-execution or constant-folding tool
// does not need to test every possible `x`: `opaque_zero(x) = (x*(x+1)) & 1` only depends on
// `x mod 2` (multiplication mod 2 is periodic with period 2), so checking the TWO residue
// classes (x even, x odd) is a COMPLETE proof, not just another sample. Once the tool knows
// `opaque_zero(x) == 0` for EVERY x, it can CONSTANT-FOLD `state = START + opaque_zero(...)`
// down to `state = START`, deleting the opaque predicate from its model of the program. This
// is exactly what breaks R-01 — and exactly what it does NOT break: R-04's dispatcher, R-05's
// randomized exit and R-07's string encoding all still stand afterward (section 10.4: cost and
// resilience are not the same thing).
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

  /** Independent proof, done TWO different ways, that must agree:
   *  (a) exhaustive: recompute (x*(x+1))&1 for every sample x directly;
   *  (b) periodic:   opaque_zero(x) only depends on x mod 2, so checking residues 0 and 1 alone
   *      is a COMPLETE proof — computed with a different expression ((x%2)*((x+1)%2)) so it does
   *      not reuse opaque_zero's own bitwise form. Neither is shared with build(). */
  function reference(data) {
    var exhaustive = data.xs.map(function (x) { return (x * (x + 1)) & 1; });
    var residues = [0, 1].map(function (r) { return (r % 2) * ((r + 1) % 2); });
    return {
      exhaustiveAllZero: exhaustive.every(function (v) { return v === 0; }),
      residuesAllZero: residues.every(function (v) { return v === 0; })
    };
  }

  function build(S, data) {
    var n = data.xs.length, W = 60, H = 28, GAP = 4;
    S.label('t1', { x: 200, y: -28, text: T('Değerlendiricinin görüşü: `opaque_zero` sembolik olarak nasıl kırılır?', 'The evaluator\'s view: how is `opaque_zero` broken symbolically?'), anchor: 'middle', bold: true, size: 13 });
    S.label('lx', { x: -10, y: 22, text: 'x =', anchor: 'end', size: 12, mono: true });
    S.label('lmod', { x: -10, y: 22 + (H + GAP), text: 'opaque_zero(x) =', anchor: 'end', size: 12, mono: true });
    S.step(T('Bir sembolik yürütme aracı, `grant_access` içindeki `opaque_zero((unsigned)strlen(token))` çağrısını, `strlen(token)`\'i SEMBOLİK bir `X` olarak işaretleyip izlemeye başlar.',
              'A symbolic-execution tool starts by marking `strlen(token)` in `opaque_zero((unsigned)strlen(token))` as a SYMBOLIC `X` and tracing it.'),
           { c: [40] });

    var allZero = true;
    for (var i = 0; i < n; i++) {
      var x = data.xs[i], v = (x * (x + 1)) & 1;
      if (v !== 0) allZero = false;
      S.box('x' + i, { x: i * (W + GAP), y: 0, w: W, h: H, size: 11, mono: true, text: String(x), style: 'normal', above: '#' + (i + 1) });
      S.box('m' + i, { x: i * (W + GAP), y: H + GAP, w: W, h: H, size: 11, mono: true, text: String(v), style: v !== 0 ? 'del' : 'dim' });
      S.at(i);
      S.step(T('Araç, olası `X=' + x + '`\'i somut bir örnek olarak dener: `opaque_zero(' + x + ') = ' + v + '`.',
                'The tool tries `X=' + x + '` as one concrete sample: `opaque_zero(' + x + ') = ' + v + '`.'),
             { c: [23] });
    }
    S.at(null);

    S.label('t2', { x: 200, y: 2 * (H + GAP) + 40, text: T('SADELEŞTİRME: sonuç yalnız `X mod 2`ye bağlı — 2 kalan sınıfı YETER (kalanlarla tümevarım)', 'SIMPLIFICATION: the result only depends on `X mod 2` — the 2 residue classes are ENOUGH (proof by periodicity)'), anchor: 'middle', bold: true, size: 12 });
    var r0 = (0 % 2) * (1 % 2), r1 = (1 % 2) * (2 % 2);
    S.box('res0', { x: 0, y: 2 * (H + GAP) + 60, w: 160, h: 32, size: 12, mono: true, text: 'X mod 2 = 0 -> ' + r0, style: 'new' });
    S.box('res1', { x: 180, y: 2 * (H + GAP) + 60, w: 160, h: 32, size: 12, mono: true, text: 'X mod 2 = 1 -> ' + r1, style: 'new' });
    S.step(T('Araç ' + n + ' tekil örnek yerine, periyodu (2) fark eder: yalnız `X çift` ve `X tek` durumlarını kanıtlamak, TÜM `X` için kanıt olarak YETER — bu bir sembolik SADELEŞTİRMEdir, kaba kuvvet değil.',
              'Instead of ' + n + ' individual samples, the tool spots the period (2): proving just `X even` and `X odd` is ENOUGH for EVERY `X` — this is a symbolic SIMPLIFICATION, not brute force.'),
           {});

    S.label('t3', { x: 200, y: 2 * (H + GAP) + 110, text: T('SABİT KATLAMA (constant folding): `state = START + opaque_zero(...)` → `state = START`', 'CONSTANT FOLDING: `state = START + opaque_zero(...)` -> `state = START`'), anchor: 'middle', bold: true, size: 12, style: 'hl' });
    S.box('before', { x: 0, y: 2 * (H + GAP) + 130, w: 280, h: 36, size: 11, mono: true, text: 'state = START + opaque_zero(X)  /* belirsiz görünür */', style: 'dim' });
    S.box('after', { x: 300, y: 2 * (H + GAP) + 130, w: 200, h: 36, size: 11, mono: true, text: 'state = START  /* kanıtlandı */', style: 'new' });
    S.step(T('Araç artık `opaque_zero(X) == 0` kanıtını (TÜM `X` için) modeline yazar ve satır 40\'ı sadeleştirir: `state` HER ZAMAN `START`. Opak yüklem, aracın CFG modelinden SİLİNİR.',
              'The tool now records the proof (`opaque_zero(X) == 0` for EVERY X) and simplifies line 40: `state` is ALWAYS `START`. The opaque predicate is DELETED from the tool\'s CFG model.'),
           { c: [40] });

    S.label('t4', { x: 200, y: 2 * (H + GAP) + 190, text: T('Sınır: bu SADECE R-01\'i kırar — R-04 dağıtıcı, R-05 rastgele çıkış, R-07 dize kodlama HÂLÂ ayakta (bölüm 10.4: dayanıklılık ≠ maliyet).', 'Limit: this breaks ONLY R-01 — R-04\'s dispatcher, R-05\'s randomized exit and R-07\'s string encoding are STILL standing (section 10.4: resilience != cost).'), anchor: 'middle', size: 11, style: 'dim' });
    S.step(T('R-01 kırıldı ama iş bitmedi: dağıtıcı (R-04) hâlâ satır 47\'de duruyor, aracın onu da ayrıca çözmesi gerekir — tek bir kuralın kırılması TÜM korumanın kırıldığı anlamına gelmez.',
              'R-01 is broken but the job is not done: the dispatcher (R-04) still stands at line 47, the tool must solve that separately too — breaking one rule does not mean the whole protection is broken.'),
           { c: [{ n: 47, note: T('R-04 hâlâ ayrı bir engel: state\'e göre dağıtım devam ediyor', 'R-04 is still a separate obstacle: dispatch by state continues') }] });

    S.result = reference(data);
    S.step(allZero
             ? T(n + '/' + n + ' örnek VE periyodik kanıt aynı sonuca varıyor: `opaque_zero` her zaman 0. Sembolik sadeleştirme, kaba-kuvvet taramadan çok daha hızlı aynı sonuca ulaşır.',
                 n + '/' + n + ' samples AND the periodic proof reach the same conclusion: `opaque_zero` is always 0. Symbolic simplification reaches the same conclusion far faster than brute-force sweeping.')
             : T('Beklenmeyen bir 1 görüldü — bu, opak yüklemin iddiasını ÇÜRÜTÜR (gerçek matematikte olmaz).',
                 'An unexpected 1 appeared — this would DISPROVE the opaque predicate\'s claim (impossible in real math).'),
           {});
  }

  D.define({
    id: 'deobfuscation',
    title: T('Deobfuscation: sembolik sadeleştirme bir opak yüklemi nasıl kırar (obfuscated.c)', 'Deobfuscation: how symbolic simplification breaks an opaque predicate (obfuscated.c)'),
    code: { c: FULL_C },
    presets: [
      { id: 'small-nonneg', level: 'normal', name: T('Normal: 10 küçük strlen değeri (0..20)', 'Normal: 10 small strlen-like values (0..20)'), data: mk([0, 1, 2, 3, 4, 5, 7, 9, 12, 20]) },
      { id: 'mixed-large', level: 'hard', name: T('Zor: 12 değer, büyük ve karışık', 'Hard: 12 values, large and mixed'), data: mk([100, 255, 256, 1000, 4095, 4096, 65535, 65536, 99999, 123456, 7, 8]) },
      { id: 'edge-extremes', level: 'edge', name: T('Uç durum: 10 büyük değer (JS güvenli tamsayı sınırının altında)', 'Edge case: 10 large values (kept under the JS safe-integer bound)'), data: mk([0, 1, 90000000, 89999999, 50000000, 46341, 46340, 65536, 65535, 2]) },
      { id: 'edge-alternating-parity', level: 'edge', name: T('Uç durum: sırayla çift/tek (periyodu doğrudan gösterir)', 'Edge case: alternating even/odd (shows the period directly)'), data: mk([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.xs.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [11, 13], extreme: [12, 15] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
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
