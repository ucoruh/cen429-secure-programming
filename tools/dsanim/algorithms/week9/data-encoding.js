// CEN429 — Week 9 — Demo 1, R-08 (code/week-09/01-manual-obfuscation/obfuscated.c)
// R-08 replaces a plain 0/1 boolean with an OPAQUE boolean split across two fields: `Decision {
// unsigned a, b; }`, granted only when `a ^ b == 0xFFFF`. A memory dump no longer shows a single
// telltale byte that flips between "denied" and "granted" — it shows two 32-bit-ish values whose
// RELATIONSHIP (not their raw bits) carries the answer. This is DATA-family obfuscation: it
// hides what a *variable* (the result) really means, the same family as R-07's string encoding
// (encoding CONTENT) and R-09's variable splitting (encoding STRUCTURE) covered in the notes.
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

  function mk(tokens) { return { tokens: tokens.slice() }; }

  /** Independent: a token grants access iff it equals the literal "CEN429-OK" — a plain string
   * comparison, never by building a Decision{a,b} pair the way build() does. */
  function reference(data) {
    return { results: data.tokens.map(function (t) { return t === VALID; }) };
  }

  function build(S, data) {
    var n = data.tokens.length;
    S.label('naiveTitle', { x: 150, y: -26, text: T('Saf (naif) sürüm: tek bayt, 0 ya da 1', 'Naive version: one byte, 0 or 1'), anchor: 'middle', bold: true, size: 13 });
    var naiveId = S.box('naive', { x: 60, y: 0, w: 80, h: 40, size: 16, mono: true, text: '?', style: 'dim' });
    S.label('splitTitle', { x: 480, y: -26, text: T('R-08 opak boolean: iki alan, ilişkileri sonucu belirler', 'R-08 opaque boolean: two fields, their RELATIONSHIP decides the result'), anchor: 'middle', bold: true, size: 13 });
    var aId = S.box('fa', { x: 380, y: 0, w: 110, h: 40, size: 13, mono: true, text: 'a = ????', style: 'dim' });
    var bId = S.box('fb', { x: 500, y: 0, w: 110, h: 40, size: 13, mono: true, text: 'b = ????', style: 'dim' });
    var xorId = S.box('fxor', { x: 620, y: 0, w: 140, h: 40, size: 13, mono: true, text: 'a^b = ????', style: 'dim' });
    S.step(T('İki gösterim karşılaştırılıyor: solda saf bir `int result` (0/1), sağda `Decision{a,b}` — belleği dökümleyen biri solda anlamı hemen görür, sağda görmez.',
              'Two representations, side by side: a plain `int result` (0/1) on the left, `Decision{a,b}` on the right — a memory dump reveals the meaning instantly on the left, not on the right.'),
           { c: [26, 27] });

    var results = [];
    for (var i = 0; i < n; i++) {
      var token = data.tokens[i];
      S.at(i);
      var eq = token === VALID;
      results.push(eq);
      var a = eq ? 0xA3C1 : 0x1111, b = eq ? 0x5C3E : 0x2222, x = a ^ b;
      S.set(naiveId, { text: eq ? '1' : '0', style: eq ? 'new' : 'del' });
      S.set(aId, { text: 'a = 0x' + D.hex(a, 4), style: 'hl' });
      S.set(bId, { text: 'b = 0x' + D.hex(b, 4), style: 'hl' });
      S.set(xorId, { text: 'a^b = 0x' + D.hex(x, 4), style: x === 0xFFFF ? 'new' : 'del' });
      var ifLine = { n: 61, note: T('constant_time_equals(...)? ' + (eq ? 'evet' : 'hayır'), 'constant_time_equals(...)? ' + (eq ? 'yes' : 'no')) };
      var assignLine = eq ? 62 : 64;
      var grantsLine = { n: 66, note: T('a^b == 0xFFFF? ' + (x === 0xFFFF ? 'evet → GRANT' : 'hayır → DENY'), 'a^b == 0xFFFF? ' + (x === 0xFFFF ? 'yes -> GRANT' : 'no -> DENY')) };
      if (i < 2) {
        S.step(T('Jeton #' + (i + 1) + ': `"' + token + '"` — eşleşme ' + (eq ? 'başarılı' : 'başarısız') + ', `d.a = 0x' + D.hex(a, 4) + '`, `d.b = 0x' + D.hex(b, 4) + '` atanır.',
                  'Token #' + (i + 1) + ': `"' + token + '"` — the match ' + (eq ? 'succeeded' : 'failed') + ', `d.a = 0x' + D.hex(a, 4) + '`, `d.b = 0x' + D.hex(b, 4) + '` are assigned.'),
               { c: [ifLine, assignLine] });
        S.step(T('`decision_grants(d)`: `a ^ b = 0x' + D.hex(x, 4) + '`' + (x === 0xFFFF ? ', `== 0xFFFF` → GRANTED.' : ', `!= 0xFFFF` → DENIED.'),
                  '`decision_grants(d)`: `a ^ b = 0x' + D.hex(x, 4) + '`' + (x === 0xFFFF ? ', `== 0xFFFF` -> GRANTED.' : ', `!= 0xFFFF` -> DENIED.')),
               { c: [grantsLine] });
      } else {
        S.step(T('Jeton #' + (i + 1) + ': `"' + token + '"` — `d = {0x' + D.hex(a, 4) + ', 0x' + D.hex(b, 4) + '}`, `a^b = 0x' + D.hex(x, 4) + '` → `' + (eq ? 'GRANTED' : 'DENIED') + '`.',
                  'Token #' + (i + 1) + ': `"' + token + '"` — `d = {0x' + D.hex(a, 4) + ', 0x' + D.hex(b, 4) + '}`, `a^b = 0x' + D.hex(x, 4) + '` -> `' + (eq ? 'GRANTED' : 'DENIED') + '`.'),
               { c: [ifLine, grantsLine] });
      }
    }
    S.at(null);
    S.result = reference(data);
    var okCount = results.filter(function (r, i) { return r === (data.tokens[i] === VALID); }).length;
    S.step(T(okCount + '/' + n + ' jeton doğru sınıflandırıldı. `a`/`b`\'nin tek başlarına 0x1111/0x2222/0xA3C1/0x5C3E olması bir şey söylemez — yalnız `a^b`nin `0xFFFF`e eşit olup olmadığı sayılır.',
              okCount + '/' + n + ' tokens were classified correctly. `a`/`b` on their own (0x1111/0x2222/0xA3C1/0x5C3E) say nothing — only whether `a^b` equals `0xFFFF` counts.'),
           {});
  }

  D.define({
    id: 'data-encoding',
    title: T('Veri kodlama: opak boolean, tek bitin iki alana bölünmesi (obfuscated.c, R-08)', 'Data encoding: an opaque boolean, one bit split into two fields (obfuscated.c, R-08)'),
    code: { c: FULL_C },
    presets: [
      { id: 'normal-mixed', level: 'normal', name: T('Normal: 10 karışık jeton', 'Normal: 10 mixed tokens'), data: mk(['CEN429-OK', 'CEN429-XX', 'short', '', 'wrong-token', 'cen429-ok', 'CEN429-0K', '123456789', 'CEN429-OK', 'XXXXXXXXX']) },
      { id: 'hard-alternating', level: 'hard', name: T('Zor: 12 jeton, GRANTED/DENIED dönüşümlü (alan çifti her defasında değişir)', 'Hard: 12 tokens, alternating GRANTED/DENIED (the field pair changes every time)'), data: mk(['CEN429-OK', 'no', 'CEN429-OK', 'no', 'CEN429-OK', 'no', 'CEN429-OK', 'no', 'CEN429-OK', 'no', 'CEN429-OK', 'no']) },
      { id: 'edge-never-granted', level: 'edge', name: T('Uç durum: hiçbiri geçerli değil (a^b hiçbir zaman 0xFFFF olmuyor)', 'Edge case: none are valid (a^b never becomes 0xFFFF)'), data: mk(['AAAAAAAAA', 'BBBBBBBBB', 'CCCCCCCCC', 'DDDDDDDDD', 'EEEEEEEEE', 'FFFFFFFFF', 'GGGGGGGGG', 'HHHHHHHHH', 'IIIIIIIII', 'JJJJJJJJJ']) },
      { id: 'edge-all-granted', level: 'edge', name: T('Uç durum: hepsi geçerli (a^b hep 0xFFFF)', 'Edge case: all valid (a^b is always 0xFFFF)'), data: mk(['CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK']) }
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
