// CEN429 — Week 14 — one transform, step by step, on small code (matches docs/week-14 §3's worked
// examples, now with the same English identifiers as code/week-14/01-source-to-source/source.c).
// Three presets = three transforms: Flatten (control flow -> a while/switch dispatcher), Encode-
// Arithmetic (a+b -> an equal mixed boolean-arithmetic expression, week 9's own referenced identity),
// Add-Opaque (wraps a check in a provably-always-true predicate — the exact math fallback_transform.py
// uses, code/week-14/01-source-to-source/fallback_transform.py).
(function (D) {
  'use strict';
  var T = D.T;

  var C_FLATTEN = [
    'int grant_access(const char *token)',
    '{',
    '    if (token_is_valid(token)) return GRANTED;',
    '    return DENIED;',
    '}',
    '',
    '/* AFTER Flatten (conceptual -- real output depends on version/compiler): */',
    'int grant_access(const char *token)',
    '{',
    '    int _state = 7341;          /* scattered, unpredictable start state */',
    '    int _result;',
    '    while (1) {',
    '        switch (_state) {',
    '            case 7341:',
    '                _state = token_is_valid(token) ? 2098 : 5560;',
    '                break;',
    '            case 2098:',
    '                _result = GRANTED;',
    '                _state = 9999;',
    '                break;',
    '            case 5560:',
    '                _result = DENIED;',
    '                _state = 9999;',
    '                break;',
    '            case 9999:',
    '                return _result;',
    '        }',
    '    }',
    '}'
  ];
  var C_ARITH = [
    'int combine(int a, int b)',
    '{',
    '    return a + b;',
    '}',
    '',
    '/* AFTER EncodeArithmetic (conceptual): the SAME value, a mixed boolean-arithmetic (MBA)',
    '   expression instead of a plain add (week 9\'s (a^b) + 2*(a&b) = a+b identity, automated). */',
    'int combine(int a, int b)',
    '{',
    '    return (a ^ b) + 2 * (a & b);',
    '}'
  ];
  // Real lines from code/week-14/01-source-to-source/fallback_transform.py's transform() (the
  // function this file's real end-to-end test, pipeline_check.py, actually runs) — not conceptual.
  var PY_OPAQUE = [
    'def transform(source_text: str, seed: int) -> str:',
    '    if LITERAL_OLD not in source_text or RETURN_OLD not in source_text:',
    '        sys.exit(',
    '            "fallback_transform.py: source.c does not match the shape this fallback "',
    '            "understands (it is written for THIS demo\'s source.c only, not general C -- "',
    '            "that is exactly what makes it a fallback and not a replacement for Tigress)."',
    '        )',
    '    mask = (seed * 2654435761) >> 24 & 0xFF',
    '    q = (seed * 40503) & 0x3F'
  ];

  function mkFlatten(valid) { return { transform: 'flatten', valid: !!valid }; }
  function mkArith(a, b) { return { transform: 'encode-arithmetic', a: a, b: b }; }
  function mkOpaque(seed) { return { transform: 'add-opaque', seed: seed }; }

  function reference(data) {
    if (data.transform === 'flatten')
      return { transform: 'flatten', result: data.valid ? 'GRANTED' : 'DENIED' };
    if (data.transform === 'encode-arithmetic')
      return { transform: 'encode-arithmetic', sum: data.a + data.b, mba: (data.a ^ data.b) + 2 * (data.a & data.b) };
    var q = (data.seed * 40503) & 0x3F;
    return { transform: 'add-opaque', q: q, alwaysTrue: (q * q) % 4 !== 2 };
  }

  function buildFlatten(S, data) {
    S.label('t1', { x: 0, y: -18, text: T('ÖNCE — düzleştirilmemiş', 'BEFORE — not flattened'), anchor: 'start', bold: true, size: 14 });
    S.box('stateBox', { x: 0, y: 10, w: 160, h: 34, size: 13, text: T('durum: (yok)', 'state: (none)'), style: 'dim' });
    S.box('resultBox', { x: 180, y: 10, w: 160, h: 34, size: 13, text: T('sonuç: (yok)', 'result: (none)'), style: 'empty' });
    S.step(T('Orijinal: tek `if`, tek dal noktası.', 'Original: one `if`, one branch point.'),
      { c: [{ n: 3, note: T('token_is_valid? ' + (data.valid ? 'evet' : 'hayır'), 'token_is_valid? ' + (data.valid ? 'yes' : 'no')) }, 4] });

    S.label('t2', { x: 0, y: 70, text: T('SONRA — Flatten uygulanmış', 'AFTER — Flatten applied'), anchor: 'start', bold: true, size: 14 });
    S.step(T('`if`/`return` yapısı kayboldu; yerine `while(1)` içinde bir `switch` DAĞITICISI geldi.',
              'The `if`/`return` structure is gone; a `switch` DISPATCHER inside `while(1)` replaces it.'),
      { c: [8, 9, 10, 11, 12, 13] });

    S.set('stateBox', { text: T('durum: 7341', 'state: 7341'), style: 'hl' });
    var nextState = data.valid ? 2098 : 5560;
    S.step(T('`case 7341`: karar burada — sonraki durum ' + nextState + '.', '`case 7341`: the decision happens here — next state ' + nextState + '.'),
      { c: [14, { n: 15, note: T('token_is_valid? ' + (data.valid ? 'evet -> 2098' : 'hayır -> 5560'), 'token_is_valid? ' + (data.valid ? 'yes -> 2098' : 'no -> 5560')) }, 16] });

    S.set('stateBox', { text: T('durum: ' + nextState, 'state: ' + nextState), style: 'hl' });
    if (data.valid) {
      S.set('resultBox', { text: 'GRANTED', style: 'new' });
      S.step(T('`case 2098`: sonuç GRANTED, sıradaki durum 9999.', '`case 2098`: result GRANTED, next state 9999.'),
        { c: [17, 18, 19, 20, { n: 21, skip: true }, { n: 22, skip: true }, { n: 23, skip: true }, { n: 24, skip: true }] });
    } else {
      S.set('resultBox', { text: 'DENIED', style: 'del' });
      S.step(T('`case 5560`: sonuç DENIED, sıradaki durum 9999.', '`case 5560`: result DENIED, next state 9999.'),
        { c: [{ n: 17, skip: true }, { n: 18, skip: true }, { n: 19, skip: true }, { n: 20, skip: true }, 21, 22, 23, 24] });
    }
    S.set('stateBox', { text: T('durum: 9999', 'state: 9999'), style: 'new' });
    S.step(T('`case 9999`: döngü biter, aynı sonuç döner — davranış korundu.', '`case 9999`: the loop ends, the SAME result is returned — behavior preserved.'),
      { c: [25, 26] });
    S.result = reference(data);
  }

  function buildArith(S, data) {
    S.label('a1', { x: 0, y: -18, text: T('ÖNCE — düz toplama', 'BEFORE — plain addition'), anchor: 'start', bold: true, size: 14 });
    S.box('aBox', { x: 0, y: 10, w: 90, h: 34, size: 14, text: 'a = ' + data.a, style: 'normal' });
    S.box('bBox', { x: 100, y: 10, w: 90, h: 34, size: 14, text: 'b = ' + data.b, style: 'normal' });
    S.step(T('`combine(a, b)` yalnız `a + b` döndürür — bir tersine derleyicide anında tanınır bir toplama.',
              '`combine(a, b)` just returns `a + b` — instantly recognizable as an addition in a disassembler.'), { c: [1, 2, 3] });

    S.label('a2', { x: 0, y: 70, text: T('SONRA — EncodeArithmetic uygulanmış (MBA)', 'AFTER — EncodeArithmetic applied (MBA)'), anchor: 'start', bold: true, size: 14 });
    var xorv = data.a ^ data.b, andv = data.a & data.b, twice = 2 * andv, mba = xorv + twice;
    S.box('xorBox', { x: 0, y: 100, w: 130, h: 30, size: 12, text: '(a^b) = ' + xorv, style: 'active' });
    S.box('andBox', { x: 140, y: 100, w: 150, h: 30, size: 12, text: '2*(a&b) = ' + twice, style: 'active' });
    S.box('mbaBox', { x: 300, y: 100, w: 130, h: 30, size: 12, text: 'toplam = ' + mba, style: 'dim' });
    S.step(T('Aynı sonucu veren ama okunması zor bir ifadeye çevrildi: `(a^b) + 2*(a&b)`.',
              'Rewritten to an equal-value but hard-to-read expression: `(a^b) + 2*(a&b)`.'), { c: [8, 9, 10] });

    S.set('mbaBox', { style: mba === data.a + data.b ? 'new' : 'del' });
    S.step(T('Denetim: (a^b) + 2*(a&b) = ' + mba + ', a + b = ' + (data.a + data.b) + ' — ' + (mba === data.a + data.b ? 'eşit, davranış korundu.' : 'FARKLI (beklenmez)!'),
              'Check: (a^b) + 2*(a&b) = ' + mba + ', a + b = ' + (data.a + data.b) + ' — ' + (mba === data.a + data.b ? 'equal, behavior preserved.' : 'DIFFERENT (unexpected)!')), {});
    S.result = reference(data);
  }

  function buildOpaque(S, data) {
    var q = (data.seed * 40503) & 0x3F;
    S.label('o1', { x: 0, y: -18, text: T('GERÇEK KOD — fallback_transform.py', 'REAL CODE — fallback_transform.py'), anchor: 'start', bold: true, size: 14 });
    S.step(T('Bu, `pipeline_check.py`nin gerçekten çalıştırdığı fonksiyonun ilk satırları (kavramsal değil).',
              'These are the actual opening lines of the function `pipeline_check.py` really runs (not conceptual).'),
      { py: [1] });
    S.step(T('Koruma: kaynak beklenen şekle uymuyorsa, dönüşüm sessizce yanlış kod üretmez — çıkar.',
              'Guard: if the source does not match the expected shape, the transform does not silently miscompile — it exits.'),
      { py: [{ n: 2, note: T('kaynak beklenen şekilde mi? evet (source.c ile eşleşiyor)', 'does the source match? yes (it matches source.c)') }, { n: 3, skip: true }, { n: 4, skip: true }, { n: 5, skip: true }, { n: 6, skip: true }, { n: 7, skip: true }] });
    S.step(T('Tohumdan (' + data.seed + ') bir sabit türetilir: q = ' + q + '.', 'A constant is derived from the seed (' + data.seed + '): q = ' + q + '.'),
      { py: [8, 9] });

    S.box('qBox', { x: 0, y: 40, w: 140, h: 32, size: 13, text: 'q = ' + q, style: 'active' });
    var alwaysTrue = (q * q) % 4 !== 2;
    S.box('predBox', { x: 160, y: 40, w: 260, h: 32, size: 12, text: '(q*q) % 4 != 2', style: alwaysTrue ? 'new' : 'del' });
    S.label('proof', { x: 0, y: 96, text: T('Kanıt: tam kare mod 4 yalnız 0 ya da 1 olabilir (Collberg-Thomborson-Low 1997) — asla 2 değil.',
                                              'Proof: a perfect square mod 4 is only ever 0 or 1 (Collberg-Thomborson-Low 1997) — never 2.'), anchor: 'start', size: 12 });
    S.step(T('(' + q + '*' + q + ') % 4 = ' + ((q * q) % 4) + ' — hiçbir zaman 2 değil, öyleyse yüklem HER q için doğru; dal her zaman aynı yönden geçer, ama q her tohumda farklı bayt üretir.',
              '(' + q + '*' + q + ') % 4 = ' + ((q * q) % 4) + ' — never 2, so the predicate is true for EVERY q; the branch always goes the same way, yet q makes every seed\'s bytes different.'), {});
    S.result = reference(data);
  }

  function build(S, data) {
    if (data.transform === 'flatten') return buildFlatten(S, data);
    if (data.transform === 'encode-arithmetic') return buildArith(S, data);
    return buildOpaque(S, data);
  }

  D.define({
    id: 'transform-step-by-step',
    title: T('Bir dönüşüm, adım adım: Flatten / EncodeArithmetic / AddOpaque',
              'One transform, step by step: Flatten / EncodeArithmetic / AddOpaque'),
    code: function (data) {
      if (data.transform === 'flatten') return { c: C_FLATTEN };
      if (data.transform === 'encode-arithmetic') return { c: C_ARITH };
      return { py: PY_OPAQUE };
    },
    minSize: 1,
    presets: [
      { id: 'flatten-granted', level: 'normal', name: T('Normal: Flatten, geçerli jeton -> GRANTED', 'Normal: Flatten, valid token -> GRANTED'), small: true,
        data: mkFlatten(true) },
      { id: 'arith-typical', level: 'hard', name: T('Zor: EncodeArithmetic, tipik değerler', 'Hard: EncodeArithmetic, typical values'), small: true,
        data: mkArith(37, 58) },
      { id: 'opaque-seed-zero', level: 'edge', name: T('Uç durum: AddOpaque, tohum 0 (q = 0, yine de her zaman doğru)', 'Edge case: AddOpaque, seed 0 (q = 0, still always true)'), small: true,
        data: mkOpaque(0) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    random: function (level, r) {
      var pick = D.randInt(r, 0, 2);
      if (pick === 0) return mkFlatten(D.randInt(r, 0, 1) === 1);
      if (pick === 1) {
        var lo = { easy: -5, normal: -50, hard: -500, extreme: -50000 }[level] || -50;
        var hi = -lo;
        return mkArith(D.randInt(r, lo, hi), D.randInt(r, lo, hi));
      }
      var seedHi = { easy: 100, normal: 9999, hard: 999999, extreme: 999999999 }[level] || 9999;
      return mkOpaque(D.randInt(r, 0, seedHi));
    },
    input: {
      hint: T('flatten:valid|invalid  ·  arith:<a>,<b>  ·  opaque:<tohum>',
              'flatten:valid|invalid  ·  arith:<a>,<b>  ·  opaque:<seed>'),
      format: function (data) {
        if (data.transform === 'flatten') return 'flatten:' + (data.valid ? 'valid' : 'invalid');
        if (data.transform === 'encode-arithmetic') return 'arith:' + data.a + ',' + data.b;
        return 'opaque:' + data.seed;
      },
      parse: function (text) {
        var s = String(text).trim();
        var m1 = s.match(/^flatten:(valid|invalid)$/);
        if (m1) return mkFlatten(m1[1] === 'valid');
        var m2 = s.match(/^arith:(-?\d+),(-?\d+)$/);
        if (m2) return mkArith(parseInt(m2[1], 10), parseInt(m2[2], 10));
        var m3 = s.match(/^opaque:(\d+)$/);
        if (m3) return mkOpaque(parseInt(m3[1], 10));
        throw T('Biçim: "flatten:valid|invalid" ya da "arith:<a>,<b>" ya da "opaque:<tohum>" olmalı.',
                'Format must be "flatten:valid|invalid" or "arith:<a>,<b>" or "opaque:<seed>".');
      },
      bad: ['', 'flatten:maybe', 'arith:x,y', 'arith:1', 'opaque:-1', 'opaque:']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
