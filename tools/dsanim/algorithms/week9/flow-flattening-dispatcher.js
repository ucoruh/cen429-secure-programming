// CEN429 — Week 9 — Demo 1, R-04 (code/week-09/01-manual-obfuscation/clean.c, obfuscated.c)
// The SAME grant_access() check, two ways. clean.c is a natural if-chain: a reverse engineer
// reads two comparisons and is done. obfuscated.c places every step inside a switch dispatcher
// wrapped in one infinite loop; a `state` variable says which step is next. Every token now
// takes several passes through the SAME dispatcher instead of a direct chain — the control-flow
// graph loses the natural adjacency between steps (the hand-made equivalent of Tigress's
// --Transform=Flatten, week 14).
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-09/01-manual-obfuscation/clean.c), full file, byte-identical.
  var CLEAN_C = [
    '/*',
    ' * CEN429 - Week 9 - Demo 1: CLEAN (unprotected) version.',
    ' * One branch, one return: an easy target for a reverse engineer.',
    ' */',
    '#include <string.h>',
    '#include "common.h"',
    '',
    '/* Constant-time comparison (no early exit -> no timing side channel). */',
    'static int constant_time_equals(const char *a, const char *b, unsigned n)',
    '{',
    '    unsigned diff = 0;',
    '    for (unsigned i = 0; i < n; i++)',
    '        diff |= (unsigned)((unsigned char)a[i] ^ (unsigned char)b[i]);',
    '    return diff == 0;',
    '}',
    '',
    'int grant_access(const char *token)',
    '{',
    '    static const char VALID_TOKEN[] = "CEN429-OK";     /* plainly visible (strings) */',
    '    if (strlen(token) != strlen(VALID_TOKEN))',
    '        return DENIED;',
    '    if (constant_time_equals(token, VALID_TOKEN, (unsigned)strlen(VALID_TOKEN)))',
    '        return GRANTED;',
    '    return DENIED;',
    '}'
  ];
  // Exact source (code/week-09/01-manual-obfuscation/obfuscated.c), full file, byte-identical.
  var OBF_C = [
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
  var STATE_LINE = { START: 48, LENGTH: 51, DECODE: 55, COMPARE: 60, GRANT: 68, DENY: 72, DEFAULT: 76 };

  function mk(flattened, tokens) { return { flattened: !!flattened, tokens: tokens.slice() }; }

  /** Independent: a token grants access iff it equals the literal "CEN429-OK" — not shared with
   * either version's control-flow walk below. */
  function reference(data) {
    return { flattened: !!data.flattened, results: data.tokens.map(function (t) { return t === VALID; }) };
  }

  // ---- flattened (obfuscated.c) walk: mirrors the real switch dispatcher --------------------
  function walkFlat(token) {
    var state = 'START', path = [], guard = 0, result = 0;
    while (state !== null && guard < 8) {
      guard++;
      if (state === 'START') { path.push({ from: 'START', to: 'LENGTH', line: 48 }); state = 'LENGTH'; }
      else if (state === 'LENGTH') {
        var lenOk = token.length === N, next = lenOk ? 'DECODE' : 'DEFAULT';
        path.push({ from: 'LENGTH', to: next, line: 53, note: 'strlen==?' });
        state = next;
      } else if (state === 'DECODE') { path.push({ from: 'DECODE', to: 'COMPARE', line: 55 }); state = 'COMPARE'; }
      else if (state === 'COMPARE') {
        var eq = token === VALID, next2 = eq ? 'GRANT' : 'DENY';
        path.push({ from: 'COMPARE', to: next2, line: 61, note: 'equals?' });
        state = next2;
      } else if (state === 'GRANT') { result = 1; path.push({ from: 'GRANT', to: 'DEFAULT', line: 68 }); state = 'DEFAULT'; }
      else if (state === 'DENY') { result = 0; path.push({ from: 'DENY', to: 'DEFAULT', line: 72 }); state = 'DEFAULT'; }
      else { path.push({ from: 'DEFAULT', to: null, line: 76 }); state = null; }
    }
    return { path: path, result: result };
  }

  function build(S, data) {
    var n = data.tokens.length;
    if (data.flattened) {
      var STATES = ['START', 'LENGTH', 'DECODE', 'COMPARE', 'GRANT', 'DENY', 'DEFAULT'];
      var gap = 140;
      STATES.forEach(function (s, i) { S.circle('s' + s, { x: i * gap, y: 0, r: 28, text: s, size: 10, style: 'dim' }); });
      var seq = ['START', 'LENGTH', 'DECODE', 'COMPARE', 'GRANT', 'DEFAULT'];
      for (var i = 0; i < seq.length - 1; i++) S.arrow('a' + i, { from: 's' + seq[i], to: 's' + seq[i + 1], kind: 'center', style: 'dim' });
      S.arrow('jL', { from: 'sLENGTH', to: 'sDEFAULT', kind: 'center', bend: -90, style: 'dim', text: T('uzunluk uymadı', 'length mismatch') });
      S.arrow('jD', { from: 'sCOMPARE', to: 'sDENY', kind: 'center', bend: -60, style: 'dim', text: T('eşleşmedi', 'no match') });
      S.arrow('jD2', { from: 'sDENY', to: 'sDEFAULT', kind: 'center', style: 'dim' });
      S.pointer('cursor', { target: 'sSTART', side: 'top', text: T('geçerli durum', 'current state') });
      S.label('title', { x: 3 * gap, y: -74, text: T('Dağıtıcı her jeton için baştan başlar ve durumdan duruma sıçrar', 'The dispatcher starts fresh for every token and hops from state to state'), anchor: 'middle', bold: true, size: 13 });
    } else {
      S.label('title', { x: 220, y: -20, text: T('Doğal if-zinciri: ilk başarısız denetimde hemen döner', 'Natural if-chain: returns immediately at the first failed check'), anchor: 'middle', bold: true, size: 13 });
      S.box('chk0', { x: 0, y: 0, w: 260, h: 34, size: 12, mono: true, text: 'strlen(token) != strlen(VALID)?', style: 'dim' });
      S.box('chk1', { x: 0, y: 44, w: 260, h: 34, size: 12, mono: true, text: 'constant_time_equals(...)?', style: 'dim' });
    }

    var results = [];
    for (var g = 0; g < n; g++) {
      var token = data.tokens[g];
      S.at(g);
      if (data.flattened) {
        var w = walkFlat(token);
        results.push(!!w.result);
        S.styleAll('dim', 'circle');
        if (g < 2) {
          S.step(T('Jeton #' + (g + 1) + ': `"' + token + '"` — dağıtıcı `state=START`\'tan başlıyor.',
                    'Token #' + (g + 1) + ': `"' + token + '"` — the dispatcher starts at `state=START`.'),
                 { c: [48] });
          w.path.forEach(function (hop) {
            S.set('s' + hop.from, { style: 'hl' });
            S.set('cursor', { target: 's' + hop.from });
            var lineEntry = hop.note ? { n: hop.line, note: T(hop.note === 'strlen==?' ? ('strlen(token)==' + N + '? ' + (hop.to === 'DECODE' ? 'evet' : 'hayır')) : ('eşit mi? ' + (hop.to === 'GRANT' ? 'evet' : 'hayır')), hop.note === 'strlen==?' ? ('strlen(token)==' + N + '? ' + (hop.to === 'DECODE' ? 'yes' : 'no')) : ('equal? ' + (hop.to === 'GRANT' ? 'yes' : 'no'))) } : hop.line;
            S.step(T('`case ' + hop.from + ':` denetleniyor → sıradaki durum `' + hop.to + '`.',
                      '`case ' + hop.from + ':` is checked → next state is `' + hop.to + '`.'),
                   { c: [lineEntry] });
            S.set('s' + hop.from, { style: 'new' });
          });
          S.set('cursor', { target: 'sDEFAULT' });
          S.set('sDEFAULT', { style: w.result ? 'new' : 'del' });
          S.step(T('`default:` `return ' + (w.result ? 'GRANTED' : 'DENIED') + ';` — `' + w.path.length + '` dağıtıcı geçişinden sonra.',
                    '`default:` `return ' + (w.result ? 'GRANTED' : 'DENIED') + ';` — after `' + w.path.length + '` dispatcher hops.'),
                 { c: [76] });
        } else {
          w.path.forEach(function (hop) { S.set('s' + hop.from, { style: 'new' }); });
          S.set('sDEFAULT', { style: w.result ? 'new' : 'del' });
          var lastHop = w.path[w.path.length - 1];
          var noted = lastHop.note ? { n: lastHop.line, note: T('son geçiş: ' + lastHop.from + ' → ' + lastHop.to, 'last hop: ' + lastHop.from + ' -> ' + lastHop.to) } : lastHop.line;
          S.step(T('Jeton #' + (g + 1) + ': `"' + token + '"` — dağıtıcı `' + w.path.length + '` geçişte `default` döner: `return ' + (w.result ? 'GRANTED' : 'DENIED') + ';`.',
                    'Token #' + (g + 1) + ': `"' + token + '"` — the dispatcher reaches `default` in `' + w.path.length + '` hops: `return ' + (w.result ? 'GRANTED' : 'DENIED') + ';`.'),
                 { c: [noted, 76] });
        }
      } else {
        var lenFail = token.length !== N;
        var eqOk = !lenFail && token === VALID;
        results.push(eqOk);
        S.styleAll('dim', 'box');
        S.set('chk0', { style: lenFail ? 'del' : 'new' });
        var lines;
        if (lenFail) {
          lines = [{ n: 19, note: T('strlen uymuyor? evet → return DENIED', 'strlen mismatch? yes -> return DENIED') }, 20];
        } else {
          S.set('chk1', { style: eqOk ? 'new' : 'del' });
          lines = [{ n: 19, note: T('strlen uymuyor? hayır → devam', 'strlen mismatch? no -> continue') },
                    { n: 22, note: T('eşit mi? ' + (eqOk ? 'evet → GRANTED' : 'hayır → DENIED'), 'equal? ' + (eqOk ? 'yes -> GRANTED' : 'no -> DENIED')) },
                    eqOk ? 23 : 24];
        }
        S.step(T('Jeton #' + (g + 1) + ': `"' + token + '"` — ' + (lenFail ? 'uzunluk uymadı, ilk `if`te `return DENIED`.' : (eqOk ? 'her iki denetimi de geçti, `return GRANTED`.' : 'uzunluk doğru ama içerik uymadı, `return DENIED`.')),
                  'Token #' + (g + 1) + ': `"' + token + '"` — ' + (lenFail ? 'length mismatch, `return DENIED` at the first `if`.' : (eqOk ? 'passed both checks, `return GRANTED`.' : 'length matched but content did not, `return DENIED`.'))),
               { c: lines });
      }
    }
    S.at(null);
    S.result = reference(data);
    var okCount = results.filter(function (r, i) { return r === (data.tokens[i] === VALID); }).length;
    S.step(T(okCount + '/' + n + ' jeton doğru sınıflandırıldı. İki sürüm de AYNI sonucu verir — yalnız kontrol akışı farklı.',
              okCount + '/' + n + ' tokens were classified correctly. Both versions give the EXACT SAME result — only the control flow differs.'),
           {});
  }

  D.define({
    id: 'flow-flattening-dispatcher',
    title: T('Kontrol akışı düzleştirme: dağıtıcı durum makinesi (obfuscated.c, R-04)', 'Control-flow flattening: the dispatcher state machine (obfuscated.c, R-04)'),
    code: function (data) { return { c: data && data.flattened ? OBF_C : CLEAN_C }; },
    presets: [
      { id: 'plain-mixed', level: 'normal', name: T('Normal: düz sürüm (clean.c), 10 karışık jeton', 'Normal: plain version (clean.c), 10 mixed tokens'), data: mk(false, ['CEN429-OK', 'CEN429-XX', 'short', '', 'CEN429-OK', 'cen429-ok', '123456789', 'CEN429-0K', 'CEN429-OKX', 'CEN429-O']) },
      { id: 'flat-mixed', level: 'hard', name: T('Zor: düzleştirilmiş sürüm (obfuscated.c), aynı 10 jeton', 'Hard: flattened version (obfuscated.c), the same 10 tokens'), data: mk(true, ['CEN429-OK', 'CEN429-XX', 'short', '', 'CEN429-OK', 'cen429-ok', '123456789', 'CEN429-0K', 'CEN429-OKX', 'CEN429-O']) },
      { id: 'flat-all-correct', level: 'edge', name: T('Uç durum: düzleştirilmiş, hepsi geçerli jeton (tam dolaşım her seferinde)', 'Edge case: flattened, every token is valid (full traversal every time)'), data: mk(true, ['CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK']) },
      { id: 'flat-all-wrong-length', level: 'edge', name: T('Uç durum: düzleştirilmiş, hepsi yanlış uzunlukta (DECODE\'a hiç girilmiyor)', 'Edge case: flattened, every token has the wrong length (DECODE is never reached)'), data: mk(true, ['', 'a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef', 'abcdefg', 'CEN429-OKX', 'CEN429-O']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.tokens.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [11, 13], extreme: [12, 14] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var tokens = [];
      for (var i = 0; i < n; i++) {
        if (D.randInt(r, 0, 4) === 0) { tokens.push(VALID); continue; }
        var len = D.randInt(r, 0, 12), s = '';
        for (var k = 0; k < len; k++) s += String.fromCharCode(65 + D.randInt(r, 0, 25));
        tokens.push(s);
      }
      return mk(D.randInt(r, 0, 1) === 1, tokens);
    },
    input: {
      hint: T('[FLAT] jeton1,jeton2,…(≥10 dize)', '[FLAT] token1,token2,…(>=10 strings)'),
      format: function (data) { return (data.flattened ? 'FLAT ' : '') + data.tokens.join(','); },
      tokens: function (data) { return data.tokens.slice(); },
      parse: function (text) {
        var s = String(text).trim(), flattened = false;
        if (/^FLAT\s+/i.test(s)) { flattened = true; s = s.replace(/^FLAT\s+/i, ''); }
        var tokens = s.split(',').map(function (t) { return t.trim(); });
        if (tokens.length < 10) throw T('En az 10 jeton girin.', 'Enter at least 10 tokens.');
        for (var i = 0; i < tokens.length; i++) if (!/^[A-Za-z0-9_-]{0,20}$/.test(tokens[i])) throw T('"' + tokens[i] + '" yalnızca harf/rakam/-/_ içermeli.', '"' + tokens[i] + '" must be letters/digits/-/_ only.');
        return mk(flattened, tokens);
      },
      bad: ['', 'CEN429-OK,short', 'FLAT', 'a b,c,d,e,f,g,h,i,j,k', 'a,b,c,d,e,f,g,h,i']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
