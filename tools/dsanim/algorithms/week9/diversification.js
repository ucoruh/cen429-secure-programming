// CEN429 — Week 9 — Demo 2 (code/week-09/02-diversification/diversified.c)
// The SAME source compiled twice, with `SEED=1001` and `SEED=2002`, produces binaries that are
// behaviorally IDENTICAL (same GRANTED/DENIED for every token) but structurally DIFFERENT: MASK
// (the string-encoding key) and C0..C3 (the flattening case values) are both derived from SEED,
// so the two binaries' encoded bytes and generated instructions differ. A patch/crack written
// against one seed's binary does not transfer to the other's (measured for real in demo.sh: the
// two compiled binaries differ at dozens of bytes — this animation shows WHY, at the source level).
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-09/02-diversification/diversified.c), full file, byte-identical.
  var FULL_C = [
    '/*',
    ' * CEN429 - Week 9 - Demo 2: Diversification.',
    ' * The SAME source, compiled with a different SEED at build time, produces two binaries that',
    ' * are behaviorally IDENTICAL but have DIFFERENT MACHINE CODE. A patch written into one copy',
    ' * does not work on the other.',
    ' * (A hand-written, compiler-macro imitation of Tigress\'s --Seed; see week-14 for the real tool.)',
    ' *',
    ' * SEED determines the string-encoding mask and the flattening\'s case values; the RESULT stays',
    ' * the same but the GENERATED CODE changes. SAFE: synthetic, no file/network/system operation.',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '',
    '#ifndef SEED',
    '#define SEED 1001',
    '#endif',
    '',
    '/* Mask and case base derived from the seed (compile-time constants). */',
    '#define MASK  ((unsigned char)((SEED * 2654435761u) >> 24))',
    '#define C0    ((SEED * 40503u) & 0x3F)',
    '#define C1    (C0 + 7)',
    '#define C2    (C0 + 19)',
    '#define C3    (C0 + 41)',
    '',
    'static const char VALID_TOKEN[] = "CEN429-OK";',
    '',
    '#if defined(__GNUC__) || defined(__clang__)',
    '__attribute__((noinline))',
    '#endif',
    'int grant_access(const char *token)',
    '{',
    '    unsigned n = (unsigned)(sizeof VALID_TOKEN - 1);',
    '    int state = C0;',
    '    int result = 0;',
    '    unsigned char encoded[sizeof VALID_TOKEN];',
    '    /* Encode the string with the seed-dependent mask (different bytes for every seed). */',
    '    for (unsigned i = 0; i < n; i++) encoded[i] = (unsigned char)(VALID_TOKEN[i] ^ MASK);',
    '',
    '    for (;;) {',
    '        if (state == C0) { state = (strlen(token) == n) ? C1 : 999; }',
    '        else if (state == C1) {',
    '            unsigned diff = 0;',
    '            for (unsigned i = 0; i < n; i++)',
    '                diff |= (unsigned)((unsigned char)(token[i] ^ MASK) ^ encoded[i]);',
    '            state = diff ? C3 : C2;',
    '        }',
    '        else if (state == C2) { result = 1; state = -1; }',
    '        else if (state == C3) { result = 0; state = -1; }',
    '        else { memset(encoded, 0, sizeof encoded); return result; }  /* random/single exit */',
    '    }',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    const char *token = (argc > 1) ? argv[1] : "CEN429-OK";',
    '    printf("[seed %d] grant_access(\\"%s\\") = %s\\n", (int)SEED, token, grant_access(token) ? "GRANTED" : "DENIED");',
    '    return 0;',
    '}'
  ];

  var VALID = 'CEN429-OK';
  var SEEDS = [1001, 2002];

  /** MASK/C0 exactly as the C macros compute them: SEED * 2654435761 wraps at 32 bits (unsigned
   * multiplication in C), so we replicate that wraparound with `% 4294967296` before shifting. */
  function maskFor(seed) {
    var prod = (seed * 2654435761) % 4294967296;
    return Math.floor(prod / 16777216) & 0xFF; // >> 24, then (unsigned char)
  }
  function c0For(seed) { return (seed * 40503) & 0x3F; }
  function encodedFor(seed) {
    var m = maskFor(seed);
    var out = [];
    for (var i = 0; i < VALID.length; i++) out.push(VALID.charCodeAt(i) ^ m);
    return out;
  }

  function mk(tokens) { return { tokens: tokens.slice() }; }

  /** Independent: a token grants access iff it equals the literal "CEN429-OK" — plain string
   * comparison, computed the SAME way regardless of seed, never through MASK/encoded[] at all. */
  function reference(data) {
    var perSeed = {};
    SEEDS.forEach(function (seed) {
      perSeed[seed] = data.tokens.map(function (t) { return t === VALID; });
    });
    return perSeed;
  }

  function build(S, data) {
    var n = data.tokens.length;
    var enc = {}; SEEDS.forEach(function (seed) { enc[seed] = encodedFor(seed); });
    var m1001 = maskFor(1001), m2002 = maskFor(2002);

    S.label('t1', { x: 200, y: -28, text: T('Aynı kaynak, iki TOHUM — MASK farklı, kodlanmış baytlar farklı', 'Same source, two SEEDs — MASK differs, encoded bytes differ'), anchor: 'middle', bold: true, size: 13 });
    S.label('l1001', { x: -10, y: 16, text: 'SEED=1001:', anchor: 'end', size: 12, mono: true });
    S.label('l2002', { x: -10, y: 66, text: 'SEED=2002:', anchor: 'end', size: 12, mono: true });
    var row1001 = S.memRow('e1001', enc[1001].map(function (b) { return { value: b }; }), { x: 0, y: 0, w: 32, h: 32, addrs: false });
    var row2002 = S.memRow('e2002', enc[2002].map(function (b) { return { value: b }; }), { x: 0, y: 50, w: 32, h: 32, addrs: false });
    S.step(T('`MASK = (SEED * 2654435761u) >> 24`: `SEED=1001 → MASK=0x' + D.hex(m1001, 2) + '`, `SEED=2002 → MASK=0x' + D.hex(m2002, 2) + '`. Aynı "CEN429-OK" dizesi, İKİ FARKLI bayt dizisine kodlanıyor.',
              '`MASK = (SEED * 2654435761u) >> 24`: `SEED=1001 -> MASK=0x' + D.hex(m1001, 2) + '`, `SEED=2002 -> MASK=0x' + D.hex(m2002, 2) + '`. The same "CEN429-OK" string encodes to TWO DIFFERENT byte sequences.'),
           { c: [19, 37] });

    var diffCount = 0;
    for (var i = 0; i < enc[1001].length; i++) if (enc[1001][i] !== enc[2002][i]) diffCount++;
    S.step(T('9 bayttan `' + diffCount + '` tanesi farklı — bir kopyadan çıkarılan bayt kalıbı diğerinde İŞE YARAMAZ.',
              diffCount + ' of the 9 bytes differ — a byte pattern extracted from one copy does NOT work on the other.'),
           {});

    // --- per-token walk: both seeds must AGREE on GRANTED/DENIED --------------------------------
    S.label('t2', { x: 200, y: 110, text: T('Yine de: her jeton için İKİ TOHUM da AYNI cevabı vermeli', 'Still: for every token, BOTH seeds must give the SAME answer'), anchor: 'middle', bold: true, size: 13 });
    var results = { 1001: [], 2002: [] };
    for (var g = 0; g < n; g++) {
      var token = data.tokens[g];
      S.at(g);
      var lenOk = token.length === VALID.length;
      var lines = [];
      SEEDS.forEach(function (seed) {
        var mask = maskFor(seed);
        var matched = lenOk && token.split('').every(function (ch, idx) { return (ch.charCodeAt(0) ^ mask) === enc[seed][idx]; });
        results[seed].push(matched);
      });
      var c0note = { n: 40, note: T('strlen(token)==' + VALID.length + '? ' + (lenOk ? 'evet' : 'hayır'), 'strlen(token)==' + VALID.length + '? ' + (lenOk ? 'yes' : 'no')) };
      if (lenOk) {
        var diffNote = { n: 45, note: T('diff (kodlanmış kıyas) ' + (results[1001][g] ? '== 0 → eşleşti' : '!= 0 → eşleşmedi'), 'diff (encoded compare) ' + (results[1001][g] ? '== 0 -> matched' : '!= 0 -> no match')) };
        lines = [c0note, diffNote];
      } else {
        lines = [c0note];
      }
      var r1001 = results[1001][g] ? 'GRANTED' : 'DENIED', r2002 = results[2002][g] ? 'GRANTED' : 'DENIED';
      S.box('res' + g, { x: g * 60, y: 140, w: 56, h: 30, size: 10, mono: true, text: r1001 === r2002 ? r1001 : (r1001 + '/' + r2002), style: r1001 === r2002 ? (r1001 === 'GRANTED' ? 'new' : 'dim') : 'del', above: '#' + (g + 1) });
      S.step(T('Jeton #' + (g + 1) + ': `"' + token + '"` — `SEED=1001 → ' + r1001 + '`, `SEED=2002 → ' + r2002 + '`' + (r1001 === r2002 ? ' (AYNI).' : ' (FARKLI — beklenmez!).'),
                'Token #' + (g + 1) + ': `"' + token + '"` — `SEED=1001 -> ' + r1001 + '`, `SEED=2002 -> ' + r2002 + '`' + (r1001 === r2002 ? ' (SAME).' : ' (DIFFERENT — unexpected!).')),
             { c: lines });
    }
    S.at(null);
    S.result = reference(data);
    var agree = data.tokens.filter(function (t, i) { return results[1001][i] === results[2002][i]; }).length;
    S.step(T(agree + '/' + n + ' jeton için iki tohum da AYNI kararı verdi. Çeşitlendirme davranışı DEĞİL, ölçeklenmeyi kırıyor (bölüm 8, Kural 2).',
              agree + '/' + n + ' tokens got the SAME decision from both seeds. Diversification breaks SCALABILITY, not behavior (section 8, Rule 2).'),
           {});
  }

  D.define({
    id: 'diversification',
    title: T('Çeşitlendirme: iki tohum, aynı davranış, farklı ikili (diversified.c)', 'Diversification: two seeds, same behavior, different binaries (diversified.c)'),
    code: { c: FULL_C },
    presets: [
      { id: 'normal-mixed', level: 'normal', name: T('Normal: 10 karışık jeton', 'Normal: 10 mixed tokens'), data: mk(['CEN429-OK', 'CEN429-XX', 'short', '', 'wrong-token', 'cen429-ok', 'CEN429-0K', '123456789', 'CEN429-OK', 'XXXXXXXXX']) },
      { id: 'hard-near-miss', level: 'hard', name: T('Zor: 12 jeton, hepsi doğru uzunlukta ama içerik farklı', 'Hard: 12 tokens, all the right length but different content'), data: mk(['XEN429-OK', 'CXN429-OK', 'CEN429-OX', 'CEN429-Ok', 'cen429-OK', 'CEN429_OK', 'CEN4290OK', 'CEN429OK-', '-CEN429OK', 'CEN429-OK', 'CEN429-KO', 'NEC429-OK']) },
      { id: 'edge-length-extremes', level: 'edge', name: T('Uç durum: uzunluk hiç uymuyor (her iki tohumda da anında red)', 'Edge case: length never matches (instant rejection under both seeds)'), data: mk(['', 'a', 'ab', 'abc', 'CEN429-OK-TOO-LONG', 'x', 'xy', 'xyz', 'CEN429-OKX', 'CEN429-O']) },
      { id: 'edge-all-valid', level: 'edge', name: T('Uç durum: hepsi geçerli jeton (her iki tohum da hep GRANTED)', 'Edge case: every token is valid (both seeds always GRANTED)'), data: mk(['CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK']) }
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
