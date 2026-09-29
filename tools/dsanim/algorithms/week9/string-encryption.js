// CEN429 — Week 9 — Demo 1, R-07 (code/week-09/01-manual-obfuscation/obfuscated.c)
// The valid token never sits in the binary as a plain string: `ENCODED[]` holds "CEN429-OK" XORed
// byte-by-byte with 0x5A, so `strings` finds nothing. Only at COMPARE time is it decoded into a
// stack buffer, used for the comparison, and then wiped with `memset` IMMEDIATELY — the plaintext
// never outlives the single call that needed it. This animation shows both halves: the byte-level
// decode/wipe cycle (memory view), and — since the wipe runs on EVERY call regardless of outcome —
// that the secret never lingers across the many separate calls a real program makes over time.
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

  var ENCODED = [0x19, 0x1F, 0x14, 0x6E, 0x68, 0x63, 0x77, 0x15, 0x11];
  var VALID = 'CEN429-OK';
  var KEY = 0x5A;

  function mk(tokens) { return { tokens: tokens.slice() }; }

  /** Independent: decode every ENCODED byte with a fresh XOR expression and join into a string —
   * not shared with build()'s byte-by-byte memRow walk. Also checks every token independently. */
  function reference(data) {
    var chars = ENCODED.map(function (b) { return String.fromCharCode(b ^ KEY); });
    return { decoded: chars.join(''), results: data.tokens.map(function (t) { return t === VALID; }) };
  }

  function build(S, data) {
    var n = ENCODED.length;
    S.label('t1', { x: (n * 34) / 2, y: -26, text: T('R-07: dizinin GENEL HAYATI — kodlu duruyor, kullanım anında çözülüyor, HEMEN siliniyor', "R-07: the string's WHOLE LIFETIME — stays encoded, decoded only at use, wiped IMMEDIATELY"), anchor: 'middle', bold: true, size: 13 });
    var encIds = S.memRow('enc', ENCODED.map(function (b) { return { value: b }; }), { x: 0, y: 0, w: 34, h: 32, addrs: false });
    S.label('lenc', { x: -10, y: 16, text: 'ENCODED[] =', anchor: 'end', size: 12, mono: true });
    S.step(T('İkili dosyada duran hâl: 9 bayt, `strings` ile aranınca "CEN429-OK" hiç görünmez — hepsi `0x5A` ile XOR\'lanmış.',
              "At rest in the binary: 9 bytes; searching with `strings` never finds \"CEN429-OK\" — every byte is XORed with `0x5A`."),
           { c: [17, 18] });

    var decIds = S.memRow('dec', ENCODED.map(function () { return {}; }), { x: 0, y: 70, w: 34, h: 32, addrs: false });
    S.label('ldec', { x: -10, y: 86, text: 'decoded[] =', anchor: 'end', size: 12, mono: true });
    var decoded = '';
    for (var i = 0; i < n; i++) {
      var ch = String.fromCharCode(ENCODED[i] ^ KEY);
      decoded += ch;
      S.set(encIds[i], { style: 'hl' });
      S.set(decIds[i], { text: D.hex(ENCODED[i] ^ KEY, 2), style: 'new' });
      S.at(null);
      S.step(T('`decoded[' + i + '] = ENCODED[' + i + '] ^ 0x5A = 0x' + D.hex(ENCODED[i], 2) + ' ^ 0x5A = 0x' + D.hex(ENCODED[i] ^ KEY, 2) + '` (`\'' + ch + '\'`).',
                '`decoded[' + i + '] = ENCODED[' + i + '] ^ 0x5A = 0x' + D.hex(ENCODED[i], 2) + ' ^ 0x5A = 0x' + D.hex(ENCODED[i] ^ KEY, 2) + '` (`\'' + ch + '\'`).'),
             { c: [56] });
      S.set(encIds[i], { style: 'normal' });
    }
    S.label('reveal', { x: (n * 34) / 2, y: 118, text: T('çözülen dize: "' + decoded + '" — TAM OLARAK bu anda, yalnız bu çağrı boyunca belleğe açık.', 'the decoded string: "' + decoded + '" — plaintext in memory ONLY for this call, right now.'), anchor: 'middle', bold: true, size: 13, style: 'hl' });
    S.step(T('9 bayt çözüldü: `decoded = "' + decoded + '"`. Bu, kod boyunca gördüğümüz TEK anlık plaintext.',
              '9 bytes decoded: `decoded = "' + decoded + '"`. This is the ONLY moment the plaintext exists.'),
           { c: [56, 57] });

    for (i = 0; i < n; i++) S.set(decIds[i], { text: '00', style: 'del' });
    S.step(T('`memset(decoded, 0, sizeof decoded);` — çözülen dize HEMEN, kıyaslama biter bitmez sıfırlanır. Bellekte kalıcı bir plaintext YOK.',
              '`memset(decoded, 0, sizeof decoded);` — the decoded string is zeroed IMMEDIATELY, right after the comparison. No lingering plaintext in memory.'),
           { c: [65] });

    // --- Now show this cycle repeats, unchanged, across MANY separate calls (>=10 tokens) ------
    S.remove('reveal');
    S.label('t2', { x: (n * 34) / 2, y: 150, text: T('Aynı döngü, farklı jetonlarla — her çağrıda TEKRAR çözülür, TEKRAR silinir', 'The same cycle, with different tokens — decoded AGAIN and wiped AGAIN on every call'), anchor: 'middle', bold: true, size: 13 });
    var results = [];
    var m = data.tokens.length;
    for (var g = 0; g < m; g++) {
      var token = data.tokens[g];
      var eq = token === VALID;
      results.push(eq);
      S.at(g);
      for (i = 0; i < n; i++) S.set(decIds[i], { text: D.hex(ENCODED[i] ^ KEY, 2), style: 'new' });
      var cmpLine = { n: 61, note: T('constant_time_equals(token, decoded, 9)? ' + (eq ? 'evet' : 'hayır'), 'constant_time_equals(token, decoded, 9)? ' + (eq ? 'yes' : 'no')) };
      S.step(T('Çağrı #' + (g + 1) + ': jeton `"' + token + '"` — `decoded` yeniden "CEN429-OK" olacak şekilde çözülür, kıyaslanır (' + (eq ? 'eşleşti' : 'eşleşmedi') + ').',
                'Call #' + (g + 1) + ': token `"' + token + '"` — `decoded` is rebuilt to "CEN429-OK" again, compared (' + (eq ? 'matched' : 'no match') + ').'),
             { c: [cmpLine] });
      for (i = 0; i < n; i++) S.set(decIds[i], { text: '00', style: 'del' });
      S.step(T('`memset` yine hemen çalışır — plaintext bu çağrının dışına asla sızmaz.',
                '`memset` runs again immediately — the plaintext never leaks past this one call.'),
             { c: [65] });
    }
    S.at(null);
    S.result = reference(data);
    var okCount = results.filter(function (r, i) { return r === (data.tokens[i] === VALID); }).length;
    S.step(T(okCount + '/' + m + ' çağrı doğru sınıflandırıldı; her çağrıda "kodlu → çöz → kullan → sil" döngüsü aynen tekrarlandı.',
              okCount + '/' + m + ' calls were classified correctly; the "encoded -> decode -> use -> wipe" cycle repeated identically every time.'),
           {});
  }

  D.define({
    id: 'string-encryption',
    title: T('Dize şifreleme: kodlu bekler, kullanım anında çözülür, hemen silinir (obfuscated.c, R-07)', 'String encryption: stays encoded, decoded at use, wiped immediately (obfuscated.c, R-07)'),
    code: { c: FULL_C },
    presets: [
      { id: 'normal-mixed', level: 'normal', name: T('Normal: 10 karışık jeton', 'Normal: 10 mixed tokens'), data: mk(['CEN429-OK', 'CEN429-XX', 'short', '', 'wrong-token', 'cen429-ok', 'CEN429-0K', '123456789', 'CEN429-OK', 'XXXXXXXXX']) },
      { id: 'hard-repeat-valid', level: 'hard', name: T('Zor: 12 çağrı, geçerli jeton tekrar tekrar (silme her seferinde çalışıyor mu?)', 'Hard: 12 calls, the valid token repeated (does the wipe run every single time?)'), data: mk(['CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'wrong', 'CEN429-OK', 'CEN429-OK', 'wrong', 'CEN429-OK', 'CEN429-OK', 'wrong', 'CEN429-OK', 'CEN429-OK']) },
      { id: 'edge-never-valid', level: 'edge', name: T('Uç durum: hiçbiri geçerli değil (yine de her seferinde çöz+sil çalışır)', 'Edge case: none are valid (decode+wipe still runs every time)'), data: mk(['AAAAAAAAA', 'BBBBBBBBB', 'CCCCCCCCC', 'DDDDDDDDD', 'EEEEEEEEE', 'FFFFFFFFF', 'GGGGGGGGG', 'HHHHHHHHH', 'IIIIIIIII', 'JJJJJJJJJ']) },
      { id: 'edge-all-valid', level: 'edge', name: T('Uç durum: hepsi geçerli jeton', 'Edge case: every token is valid'), data: mk(['CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK']) }
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
