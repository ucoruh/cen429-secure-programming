// CEN429 — Week 9 — Demo 1 (code/week-09/01-manual-obfuscation/obfuscated.c)
// Collberg's taxonomy splits obfuscation into FIVE families by "what it hides": layout, data,
// control flow, preventive (anti-analysis) and virtualization. This animation tags each family
// against REAL lines of grant_access()'s obfuscated version (one small function), then proves —
// by walking the real dispatcher for many tokens — that all of this still computes the exact
// same GRANTED/DENIED answer as clean.c. Virtualization is not shown: it rewrites the WHOLE
// function's machine code, not a single line (see week 9 section 7 / week 14).
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
  var N = VALID.length; // 9, == ENCODED_LEN

  function mk(tokens) { return { tokens: tokens.slice() }; }

  /** Independent: a token grants access iff it equals the literal "CEN429-OK" — straight from the
   * spec, never by walking the dispatcher build() simulates below. */
  function reference(data) {
    return { results: data.tokens.map(function (t) { return t === VALID; }) };
  }

  /** Mirrors obfuscated.c's real state machine, purely to know WHICH lines execute for a given
   * token (so the animation can highlight them) — build()-only, never used by reference(). */
  function walkDispatcher(token) {
    var state = 'START', steps = [], guard = 0, result = 0;
    while (state !== null && guard < 8) {
      guard++;
      if (state === 'START') {
        steps.push({ line: 48, note: null, next: 'LENGTH' });
        state = 'LENGTH';
      } else if (state === 'LENGTH') {
        var lenOk = token.length === N;
        steps.push({ line: 53, note: 'strlen(token) == ' + N + '? ' + (lenOk ? 'evet' : 'hayır'), enNote: 'strlen(token) == ' + N + '? ' + (lenOk ? 'yes' : 'no'), next: lenOk ? 'DECODE' : 'DEFAULT' });
        state = lenOk ? 'DECODE' : 'DEFAULT';
      } else if (state === 'DECODE') {
        steps.push({ line: 55, note: null, next: 'COMPARE' });
        state = 'COMPARE';
      } else if (state === 'COMPARE') {
        var eq = token === VALID;
        steps.push({ line: 61, note: 'constant_time_equals(...)? ' + (eq ? 'evet' : 'hayır'), enNote: 'constant_time_equals(...)? ' + (eq ? 'yes' : 'no'), next: eq ? 'GRANT' : 'DENY' });
        state = eq ? 'GRANT' : 'DENY';
      } else if (state === 'GRANT') {
        result = 1;
        steps.push({ line: 68, note: null, next: 'DEFAULT' });
        state = 'DEFAULT';
      } else if (state === 'DENY') {
        result = 0;
        steps.push({ line: 72, note: null, next: 'DEFAULT' });
        state = 'DEFAULT';
      } else {
        steps.push({ line: 76, note: null, next: null });
        state = null;
      }
    }
    return { steps: steps, result: result };
  }

  function build(S, data) {
    var n = data.tokens.length;

    // --- Part 1: tag the five families against REAL lines (no execution yet) -------------------
    S.label('tourTitle', { x: 200, y: -24, text: T('Beş aile, tek fonksiyon (`grant_access`, obfuscated.c)', 'Five families, one function (`grant_access`, obfuscated.c)'), anchor: 'middle', bold: true, size: 14 });
    S.box('famBox', { x: 0, y: 0, w: 760, h: 40, size: 12, mono: false, text: T('Aşağıdaki 4 aileyi kod panelindeki satırlarla eşleştirelim', 'Let us map the 4 families below to lines in the code panel'), style: 'dim' });
    S.step(T('Bu, gerçek `obfuscated.c` dosyasıdır (80 satır). Beş aileden dördünü BU fonksiyonda, birebir satırlarla görebiliriz.',
              'This is the real `obfuscated.c` file (80 lines). Four of the five families are visible in THIS function, on real lines.'),
           { c: [37] });

    S.set('famBox', { text: T('DÜZEN: arayüz adı `grant_access` okunur (K-06); yerel adlar öğretim için okunur bırakıldı.', 'LAYOUT: the interface name `grant_access` stays readable (K-06); local names were kept readable for teaching.'), style: 'hl' });
    S.step(T('**Düzen** ailesi: adları/biçimi gizler. Burada BİLİNÇLİ OLARAK uygulanmadı (K-06/düzen tek başına yetmez, bölüm 2).',
              '**Layout** family: hides names/formatting. Deliberately NOT applied here (layout alone is not enough, section 2).'),
           { c: [37, 39] });

    S.set('famBox', { text: T('VERİ: jeton `ENCODED[]`de XOR kodlu (R-07); sonuç `Decision` çiftinden türetilen opak boolean (R-08).', 'DATA: the token stays XOR-encoded in `ENCODED[]` (R-07); the result is an opaque boolean from a `Decision` pair (R-08).'), style: 'new' });
    S.step(T('**Veri** ailesi: sabitleri/değişkenleri gizler — R-07 (dize kodlama) ve R-08 (opak boolean) burada.',
              '**Data** family: hides constants/variables — R-07 (string encoding) and R-08 (opaque boolean) live here.'),
           { c: [17, 18, 26, 27] });

    S.set('famBox', { text: T('KONTROL AKIŞI: `opaque_zero` hep 0 döner (R-01); mantık tek bir `switch` dağıtıcısında (R-04).', 'CONTROL FLOW: `opaque_zero` always returns 0 (R-01); logic sits inside one `switch` dispatcher (R-04).'), style: 'active' });
    S.step(T('**Kontrol akışı** ailesi: algoritmanın yapısını gizler — R-01 opak yüklem + R-04 düzleştirme, birlikte.',
              '**Control-flow** family: hides the algorithm\'s structure — R-01 opaque predicate + R-04 flattening, together.'),
           { c: [22, 23, 47] });

    S.set('famBox', { text: T('ÖNLEYİCİ: uzunluk uymazsa `state` geçersiz bir değere sıçrar (R-05); tek çıkış `default`.', 'PREVENTIVE: on a length mismatch `state` jumps to an invalid value (R-05); the single exit is `default`.'), style: 'del' });
    S.step(T('**Önleyici** aile: analiz araçlarının işini hedef alır — R-05 rastgele çıkış, analisti oyalayan sahte bir "case 106" izlenimi verir.',
              '**Preventive** family: targets the analysis tools themselves — R-05\'s randomized exit gives the false impression of a "case 106" that a tool must chase.'),
           { c: [52, 53, 76] });

    S.set('famBox', { text: T('SANALLAŞTIRMA: burada YOK — fonksiyonun TAMAMININ makine koduna uygulanır (bölüm 7).', 'VIRTUALIZATION: not shown here — it applies to the ENTIRE function\'s machine code (section 7).'), style: 'dim' });
    S.step(T('**Sanallaştırma** ailesi bu küçük örnekte YOK: bir satıra değil, fonksiyonun tamamına uygulanan en radikal (ve en pahalı) ailedir.',
              '**Virtualization** family is NOT in this small example: the most radical (and most expensive) family, applied to the whole function, not one line.'),
           {});

    // --- Part 2: prove behavior is preserved — walk the REAL dispatcher for every token --------
    S.remove('famBox');
    S.label('runTitle', { x: 200, y: 90, text: T('Şimdi gerçek dağıtıcıyı her jeton için çalıştıralım — beş ailenin TÜMÜ birlikte, davranış AYNI kalıyor mu?', 'Now let us run the real dispatcher for every token — with ALL families together, does behavior stay the SAME?'), anchor: 'middle', bold: true, size: 13 });
    var results = [];
    for (var i = 0; i < n; i++) {
      var token = data.tokens[i];
      S.at(i);
      var w = walkDispatcher(token);
      results.push(!!w.result);
      S.box('res' + i, { x: i * 64, y: 120, w: 58, h: 30, size: 11, mono: true, text: (token.length > 9 ? token.slice(0, 8) + '…' : token) || '""', style: 'dim', above: '#' + (i + 1) });
      if (i < 2) {
        w.steps.forEach(function (st) {
          S.set('res' + i, { style: 'hl' });
          var cline = st.note ? { n: st.line, note: T(st.note, st.enNote) } : st.line;
          S.step(T('jeton `"' + token + '"`: satır ' + st.line + ' çalışıyor' + (st.note ? ' — ' + st.note : '') + '.',
                    'token `"' + token + '"`: line ' + st.line + ' runs' + (st.note ? ' — ' + st.enNote : '') + '.'),
                 { c: [cline] });
        });
        S.set('res' + i, { text: w.result ? T('GRANTED', 'GRANTED') : T('DENIED', 'DENIED'), style: w.result ? 'new' : 'del' });
      } else {
        var lines = w.steps.map(function (st) { return st.note ? { n: st.line, note: T(st.note, st.enNote) } : st.line; });
        S.set('res' + i, { text: w.result ? 'GRANTED' : 'DENIED', style: w.result ? 'new' : 'del' });
        S.step(T('jeton `"' + token + '"`: dağıtıcı ' + w.steps.length + ' `case` adımından geçip `' + (w.result ? 'GRANTED' : 'DENIED') + '` döndürdü.',
                  'token `"' + token + '"`: the dispatcher passed through ' + w.steps.length + ' `case` steps and returned `' + (w.result ? 'GRANTED' : 'DENIED') + '`.'),
               { c: lines });
      }
    }
    S.at(null);
    S.result = { results: results };
    var okCount = results.filter(function (r, i) { return r === (data.tokens[i] === VALID); }).length;
    S.step(T(okCount + '/' + n + ' jeton, `clean.c`\'nin vereceği cevapla BİREBİR AYNI sonucu verdi — beş aile bir arada uygulanmış olsa da davranış korunuyor.',
              okCount + '/' + n + ' tokens matched EXACTLY what `clean.c` would answer — behavior is preserved even with all families applied together.'),
           {});
  }

  D.define({
    id: 'five-obfuscation-families',
    title: T('Gizlemenin beş ailesi: tek fonksiyonda hepsi bir arada (obfuscated.c)', 'The five obfuscation families: all together in one function (obfuscated.c)'),
    code: { c: FULL_C },
    presets: [
      { id: 'normal-mixed', level: 'normal', name: T('Normal: 10 karışık jeton', 'Normal: 10 mixed tokens'), data: mk(['CEN429-OK', 'CEN429-XX', 'short', '', 'wrong-length', 'cen429-ok', 'CEN429-0K', '123456789', 'CEN429-OK', 'XXXXXXXXX']) },
      { id: 'hard-near-miss', level: 'hard', name: T('Zor: 12 jeton, hepsi doğru uzunlukta ama 1 karakter farklı', 'Hard: 12 tokens, all the right length but 1 char off'), data: mk(['XEN429-OK', 'CXN429-OK', 'CEN429-OX', 'CEN429-Ok', 'cen429-OK', 'CEN429_OK', 'CEN4290OK', 'CEN429OK-', '-CEN429OK', 'CEN429-OK', 'CEN429-KO', 'NEC429-OK']) },
      { id: 'edge-length-extremes', level: 'edge', name: T('Uç durum: uzunluk her zaman uymuyor (DECODE\'a hiç girilmiyor)', 'Edge case: length never matches (DECODE is never reached)'), data: mk(['', 'a', 'ab', 'abc', 'CEN429-OK-TOO-LONG', 'x', 'xy', 'xyz', 'CEN429-OKX', 'CEN429-O']) },
      { id: 'edge-all-valid', level: 'edge', name: T('Uç durum: hepsi geçerli jeton (tam dolaşım hep GRANTED)', 'Edge case: every token is valid (full traversal, always GRANTED)'), data: mk(['CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK', 'CEN429-OK']) }
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
        var len = D.randInt(r, 0, 12);
        var s = '';
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
        if (parts.length < 10) throw T('En az 10 jeton girin (virgülle ayırın).', 'Enter at least 10 tokens (comma-separated).');
        for (var i = 0; i < parts.length; i++) if (!/^[A-Za-z0-9_-]{0,20}$/.test(parts[i])) throw T('"' + parts[i] + '" yalnızca harf/rakam/-/_ içermeli (en fazla 20 karakter).', '"' + parts[i] + '" must be letters/digits/-/_ only (at most 20 chars).');
        return mk(parts);
      },
      bad: ['', 'CEN429-OK,short', 'a,b,c,d,e,f,g,h,i', 'a b,c,d,e,f,g,h,i,j,k', 'toolong-token-name-way-past-twenty-chars,b,c,d,e,f,g,h,i,j']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
