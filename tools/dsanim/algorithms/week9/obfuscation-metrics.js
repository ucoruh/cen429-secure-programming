// CEN429 — Week 9 — Section 9 (code/week-09/01-manual-obfuscation/{clean.c,obfuscated.c})
// Collberg's four dimensions — potency, resilience, cost, stealth — evaluated on the REAL
// before/after pair this week's demo builds. The two headline numbers (27->49 instructions,
// 4->9 branches/calls in `grant_access` alone) are the actual `objdump` measurement captured
// from the compiled demo (see code/week-09/01-manual-obfuscation/demo.sh STEP 3), not invented.
// Potency and cost get a number here; resilience and stealth cannot be read off a static count
// (that needs a real deobfuscation attempt, covered in the `deobfuscation` animation) — this
// animation also sweeps >=10 tokens through BOTH versions to show the same trade-off dynamically:
// the obfuscated dispatcher always takes MORE steps per call than the clean if-chain.
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

  var VALID = 'CEN429-OK';
  var N = VALID.length;
  // Real measurement: code/week-09/01-manual-obfuscation/demo.sh STEP 3 (WSL, objdump -d, function-
  // scoped to `grant_access` only). See code/GLOSSARY.md / progress notes for the captured run.
  var CLEAN_INSTR = 27, OBF_INSTR = 49, CLEAN_BR = 4, OBF_BR = 9;

  function mk(tokens) { return { tokens: tokens.slice() }; }

  /** Independent: a token grants access iff it equals the literal "CEN429-OK" — never derived
   * from the operation-count walk build() performs below. */
  function reference(data) {
    return { results: data.tokens.map(function (t) { return t === VALID; }) };
  }

  /** How many statements clean.c's if-chain executes for this token (hand-counted from the real
   * file: line 20 always; +1 for the early return, or +1 for the content check +1 for its return). */
  function cleanOps(token) { return token.length !== N ? 2 : 4; }

  /** How many dispatcher hops obfuscated.c's switch takes for this token (mirrors the real
   * state machine; used only to COUNT steps for this animation, never for reference()). */
  function obfOps(token) {
    var state = 'START', hops = 0, guard = 0;
    while (state !== null && guard < 8) {
      guard++; hops++;
      if (state === 'START') state = 'LENGTH';
      else if (state === 'LENGTH') state = token.length === N ? 'DECODE' : 'DEFAULT';
      else if (state === 'DECODE') state = 'COMPARE';
      else if (state === 'COMPARE') state = token === VALID ? 'GRANT' : 'DENY';
      else if (state === 'GRANT' || state === 'DENY') state = 'DEFAULT';
      else state = null;
    }
    return hops;
  }

  function build(S, data) {
    var n = data.tokens.length;

    // --- Part 1: the two STATIC (headline) metrics, from the real objdump measurement ----------
    S.label('t1', { x: 200, y: -28, text: T('Statik ölçüm (gerçek `objdump`, yalnız `grant_access`)', 'Static measurement (real `objdump`, `grant_access` only)'), anchor: 'middle', bold: true, size: 13 });
    var instrBox = S.box('instr', { x: 0, y: 0, w: 260, h: 44, size: 13, mono: true, text: 'komut: ' + CLEAN_INSTR + ' -> ' + OBF_INSTR, style: 'active' });
    var brBox = S.box('br', { x: 280, y: 0, w: 260, h: 44, size: 13, mono: true, text: 'dal/çağrı: ' + CLEAN_BR + ' -> ' + OBF_BR, style: 'active' });
    S.step(T('`clean.c` ' + CLEAN_INSTR + ' komut / ' + CLEAN_BR + ' dal-çağrı → `obfuscated.c` ' + OBF_INSTR + ' komut / ' + OBF_BR + ' dal-çağrı (gerçek ölçüm, demo.sh 3. adım).',
              '`clean.c` ' + CLEAN_INSTR + ' instructions / ' + CLEAN_BR + ' branches-calls -> `obfuscated.c` ' + OBF_INSTR + ' instructions / ' + OBF_BR + ' branches-calls (real measurement, demo.sh step 3).'),
           { c: [37] });

    var potencyBefore = CLEAN_BR + 1, potencyAfter = OBF_BR + 1;
    var potencyPct = Math.round(((potencyAfter - potencyBefore) / potencyBefore) * 1000) / 10;
    var costPct = Math.round(((OBF_INSTR - CLEAN_INSTR) / CLEAN_INSTR) * 1000) / 10;
    S.set(instrBox, { text: T('Maliyet (cost): (' + OBF_INSTR + '-' + CLEAN_INSTR + ')/' + CLEAN_INSTR + ' = +%' + costPct, 'Cost: (' + OBF_INSTR + '-' + CLEAN_INSTR + ')/' + CLEAN_INSTR + ' = +' + costPct + '%'), style: 'new' });
    S.set(brBox, { text: T('Güç (potency): ' + potencyBefore + '→' + potencyAfter + ' = +%' + potencyPct, 'Potency: ' + potencyBefore + '->' + potencyAfter + ' = +' + potencyPct + '%'), style: 'new' });
    S.step(T('**Güç** (çevrimsel karmaşıklık ≈ dal+1): `' + potencyBefore + ' → ' + potencyAfter + '`, `+%' + potencyPct + '`. **Maliyet**: `+%' + costPct + '` komut. İkisi de bölüm 9\'daki gerçek sayılardır.',
              '**Potency** (cyclomatic complexity ~ branches+1): `' + potencyBefore + ' -> ' + potencyAfter + '`, `+' + potencyPct + '%`. **Cost**: `+' + costPct + '%` instructions. Both are the real section-9 numbers.'),
           {});

    S.label('t1b', { x: 200, y: 60, text: T('Dayanıklılık ve gizlilik burada sayılamaz — bölüm 10 (deobfuscation) ve gerçek bir istatistiksel karşılaştırma gerekir.', 'Resilience and stealth cannot be counted here — they need section 10 (deobfuscation) and a real statistical comparison.'), anchor: 'middle', size: 12, style: 'dim' });
    S.step(T('Bu ikisi (**dayanıklılık**, **gizlilik**) yalnız komut/dal saymakla ölçülmez — sırasıyla bölüm 10 ve gizlenmiş kodun istatistiksel dikkat çekiciliği gerekir.',
              'These two (**resilience**, **stealth**) cannot be measured by counting alone — they need section 10 and how statistically noticeable the obfuscated code is, respectively.'),
           {});

    // --- Part 2: DYNAMIC cost, per token (>=10 real tokens, real dispatcher walk) --------------
    S.remove('t1b');
    S.label('t2', { x: 200, y: 90, text: T('Dinamik maliyet: her çağrıda kaç adım gerçekten çalışıyor?', 'Dynamic cost: how many steps actually run per call?'), anchor: 'middle', bold: true, size: 13 });
    var results = [];
    var totalClean = 0, totalObf = 0;
    for (var i = 0; i < n; i++) {
      var token = data.tokens[i];
      S.at(i);
      var c = cleanOps(token), o = obfOps(token);
      totalClean += c; totalObf += o;
      results.push(token === VALID);
      S.box('c' + i, { x: i * 58, y: 120, w: 52, h: 28, size: 10, mono: true, text: 'clean:' + c, style: 'dim', above: '#' + (i + 1) });
      S.box('o' + i, { x: i * 58, y: 152, w: 52, h: 28, size: 10, mono: true, text: 'obf:' + o, style: 'hl' });
      var lenOk = token.length === N;
      var lines = lenOk
        ? [{ n: 53, note: T('strlen==' + N + '? evet', 'strlen==' + N + '? yes') }, { n: 61, note: T('eşit mi? ' + (token === VALID ? 'evet' : 'hayır'), 'equal? ' + (token === VALID ? 'yes' : 'no')) }]
        : [{ n: 53, note: T('strlen==' + N + '? hayır', 'strlen==' + N + '? no') }];
      S.step(T('Jeton #' + (i + 1) + ': `"' + token + '"` — `clean.c` ' + c + ' adım çalıştırır, `obfuscated.c` ' + o + ' dağıtıcı geçişi yapar (`' + o + '/' + c + '` kat).',
                'Token #' + (i + 1) + ': `"' + token + '"` — `clean.c` runs ' + c + ' step(s), `obfuscated.c` takes ' + o + ' dispatcher hop(s) (`' + o + '/' + c + '`x).'),
             { c: lines });
    }
    S.at(null);
    S.result = reference(data);
    var avgRatio = Math.round((totalObf / totalClean) * 100) / 100;
    S.step(T(n + ' çağrı toplamında: `clean.c` ' + totalClean + ' adım, `obfuscated.c` ' + totalObf + ' adım — ortalama `' + avgRatio + '` kat daha fazla iş. Karar kuralı (bölüm 9): düşük değerli varlığa hafif kural (R-07) yeter, yüksek değerli varlık bu maliyeti hak eder.',
              'Across ' + n + ' calls: `clean.c` ' + totalClean + ' step(s), `obfuscated.c` ' + totalObf + ' step(s) — on average `' + avgRatio + '`x more work. Decision rule (section 9): a low-value asset only needs a light rule (R-07); a high-value asset earns this cost.'),
           {});
  }

  D.define({
    id: 'obfuscation-metrics',
    title: T('Gizlemenin ölçülmesi: güç, dayanıklılık, maliyet, gizlilik (öncesi/sonrası)', 'Measuring obfuscation: potency, resilience, cost, stealth (before/after)'),
    code: { c: FULL_C },
    presets: [
      { id: 'normal-mixed', level: 'normal', name: T('Normal: 10 karışık jeton', 'Normal: 10 mixed tokens'), data: mk(['CEN429-OK', 'CEN429-XX', 'short', '', 'wrong-token', 'cen429-ok', 'CEN429-0K', '123456789', 'CEN429-OK', 'XXXXXXXXX']) },
      { id: 'hard-mostly-full-path', level: 'hard', name: T('Zor: 12 jeton, çoğu doğru uzunlukta (dağıtıcı çoğunlukla tam dolaşıyor)', 'Hard: 12 tokens, most the right length (dispatcher mostly takes the full path)'), data: mk(['CEN429-OK', 'XEN429-OK', 'CEN429-OX', 'CEN429-Ok', 'cen429-OK', 'CEN429_OK', 'CEN4290OK', 'CEN429OK-', 'NEC429-OK', 'CEN429-KO', 'short', '']) },
      { id: 'edge-length-extremes', level: 'edge', name: T('Uç durum: uzunluk hiç uymuyor (en ucuz yol, her seferinde)', 'Edge case: length never matches (cheapest path, every time)'), data: mk(['', 'a', 'ab', 'abc', 'CEN429-OK-TOO-LONG', 'x', 'xy', 'xyz', 'CEN429-OKX', 'CEN429-O']) },
      { id: 'edge-all-valid', level: 'edge', name: T('Uç durum: hepsi geçerli (en pahalı yol, her seferinde)', 'Edge case: all valid (most expensive path, every time)'), data: mk(['CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.tokens.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [11, 13], extreme: [12, 15] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var tokens = [];
      for (var i = 0; i < n; i++) {
        if (D.randInt(r, 0, 3) === 0) { tokens.push(VALID); continue; }
        var len = D.randInt(r, 0, 12), s = '';
        for (var k = 0; k < len; k++) s += String.fromCharCode(65 + D.randInt(r, 0, 25));
        tokens.push(s);
      }
      return mk(tokens);
    },
    input: {
      hint: T('jeton1,jeton2,…(≥10 dize)', 'token1,token2,…(>=10 strings)'),
      format: function (data) { return data.tokens.join(','); },
      tokens: function (data) { return data.tokens.slice(); },
      parse: function (text) {
        var parts = String(text).split(',').map(function (t) { return t.trim(); });
        if (parts.length < 10) throw T('En az 10 jeton girin.', 'Enter at least 10 tokens.');
        for (var i = 0; i < parts.length; i++) if (!/^[A-Za-z0-9_-]{0,20}$/.test(parts[i])) throw T('"' + parts[i] + '" yalnızca harf/rakam/-/_ içermeli.', '"' + parts[i] + '" must be letters/digits/-/_ only.');
        return mk(parts);
      },
      bad: ['', 'CEN429-OK,short', 'a,b,c,d,e,f,g,h,i', 'a b,c,d,e,f,g,h,i,j,k', 'toolong-token-name-way-past-twenty-chars,b,c,d,e,f,g,h,i,j']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
