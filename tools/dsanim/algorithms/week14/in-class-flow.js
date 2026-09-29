// CEN429 — Week 14 — Demo 1 (code/week-14/01-source-to-source/pipeline_check.py)
// The in-class / in-CI routine, four stages: OBFUSCATE -> COMPARE -> MEASURE -> DIVERSIFY. This is
// exactly what pipeline_check.py automates (see its real lines in the code panel): transform once,
// check every token still matches the original (COMPARE), note the cost (MEASURE — see the
// obfuscation-measurement.js animation for the full table), then repeat with a second seed and check
// the two variants differ in bytes (DIVERSIFY).
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    'orig_exe = tmp / f"orig{exe_suffix}"',
    'compile_c(SOURCE, orig_exe)',
    'baseline = {t: run_prog(orig_exe, t) for t in TOKENS}',
    'for seed in SEEDS:',
    '    variant_c = tmp / f"variant_{seed}.c"',
    '    make_variant(seed, variant_c)',
    '    variant_exe = tmp / f"variant_{seed}{exe_suffix}"',
    '    compile_c(variant_c, variant_exe)',
    '    for token in TOKENS:',
    '        out = run_prog(variant_exe, token)',
    '        if out != baseline[token]:',
    '            sys.exit(f"FAIL: SEMANTIC MISMATCH seed={seed} token={token!r}: "',
    '                     f"original produced {baseline[token]!r}, variant produced {out!r}")',
    'b1, b2 = variant_exes[0].read_bytes(), variant_exes[1].read_bytes()',
    'if b1 == b2:',
    '    sys.exit(f"FAIL: DIVERSIFICATION FAILED -- seeds {SEEDS[0]} and {SEEDS[1]} produced "',
    '             "byte-identical binaries")'
  ];
  var STAGES = ['OBFUSCATE', 'COMPARE', 'MEASURE', 'DIVERSIFY'];
  var SUPERSET = ['CEN429-OK', 'wrong-token', '', 'short', 'CEN429-OKX', '123456789', 'XEN429-OX',
    'cen429-ok', ' CEN429-OK', 'CEN429-OK ', 'CEN429-0K', 'CEN4Z9-OK', 'CEN429-Ok', 'CEN429-O'];

  function expectedFor(token) { return token === 'CEN429-OK' ? 1 : 0; }

  function mk(tokens, seed1, seed2, mismatchIndex) {
    return { tokens: tokens.slice(), seed1: seed1, seed2: seed2,
      mismatchIndex: mismatchIndex === undefined ? -1 : mismatchIndex };
  }

  function reference(data) {
    var compareOk = data.tokens.every(function (tok, i) {
      var orig = expectedFor(tok);
      var variant = (i === data.mismatchIndex) ? (1 - orig) : orig;
      return orig === variant;
    });
    var diversifyOk = data.seed1 !== data.seed2;
    return { compareOk: compareOk, diversifyOk: diversifyOk };
  }

  function build(S, data) {
    var tokens = data.tokens, n = tokens.length;
    var SW = 130, SH = 38, GAP = 20;
    for (var i = 0; i < STAGES.length; i++) {
      S.box('st' + i, { x: i * (SW + GAP), y: 0, w: SW, h: SH, size: 13, text: STAGES[i], style: 'dim' });
      if (i > 0) S.arrow('sa' + i, { from: 'st' + (i - 1), to: 'st' + i, kind: 'center' });
    }
    S.label('flowLbl', { x: 0, y: -18, text: T('Sınıf içi/CI akışı', 'In-class / CI routine'), anchor: 'start', bold: true, size: 16 });

    // --- OBFUSCATE ------------------------------------------------------------------------------
    S.set('st0', { style: 'hl' });
    S.step(T('OBFUSCATE: orijinal derlenir, tohum ' + data.seed1 + ' ile bir değişken üretilir.',
              'OBFUSCATE: the original compiles, seed ' + data.seed1 + ' generates one variant.'), { py: [1, 2, 3] });
    S.set('st0', { style: 'new' }); S.set('st1', { style: 'hl' });

    // --- COMPARE (walk the token list) -----------------------------------------------------------
    var RY = 70, RW = 130;
    S.label('rowOrig', { x: 0, y: RY + 20, text: T('temel =', 'baseline ='), anchor: 'end', size: 12 });
    S.label('rowVar', { x: 0, y: RY + 20 + 30, text: T('değişken =', 'variant ='), anchor: 'end', size: 12 });
    for (i = 0; i < n; i++) {
      var x = 130 + i * (RW + 4);
      S.box('o' + i, { x: x, y: RY, w: RW, h: 28, size: 10, above: String(i), text: '"' + (tokens[i] || '(empty)') + '"', style: 'empty' });
      S.box('v' + i, { x: x, y: RY + 30, w: RW, h: 28, size: 11, text: '', style: 'empty' });
    }
    var mismatchSeen = false, detail = Math.min(4, n);
    for (i = 0; i < n; i++) {
      S.at(i);
      var orig = expectedFor(tokens[i]), variant = (i === data.mismatchIndex) ? (1 - orig) : orig;
      var ok = orig === variant;
      S.set('o' + i, { style: 'hl' });
      S.set('v' + i, { text: variant ? 'GRANTED' : 'DENIED', style: ok ? 'new' : 'del' });
      if (!ok && !mismatchSeen) {
        mismatchSeen = true;
        S.step(T('EŞLEŞMEDİ: "' + tokens[i] + '" temelde ' + (orig ? 'GRANTED' : 'DENIED') + ', değişkende ' + (variant ? 'GRANTED' : 'DENIED') + ' — pipeline_check.py burada DURUR.',
                  'MISMATCH: "' + tokens[i] + '" is ' + (orig ? 'GRANTED' : 'DENIED') + ' at baseline, ' + (variant ? 'GRANTED' : 'DENIED') + ' in the variant — pipeline_check.py STOPS here.'),
          { py: [{ n: 9, note: T('bu jeton işleniyor', 'processing this token') }, 10, { n: 11, note: T('out != baseline[token]? evet', 'out != baseline[token]? yes') }, 12, 13] });
      } else if (i < detail) {
        S.step(T('"' + tokens[i] + '": temel = değişken (' + (orig ? 'GRANTED' : 'DENIED') + ').', '"' + tokens[i] + '": baseline = variant (' + (orig ? 'GRANTED' : 'DENIED') + ').'),
          { py: [{ n: 9, note: T('bu jeton işleniyor', 'processing this token') }, 10, { n: 11, note: T('out != baseline[token]? hayır', 'out != baseline[token]? no') }] });
      }
      S.set('o' + i, { style: ok ? 'new' : 'del' });
    }
    S.at(null);
    S.set('st1', { style: mismatchSeen ? 'del' : 'new' });

    // --- MEASURE (brief) -------------------------------------------------------------------------
    S.set('st2', { style: 'hl' });
    S.step(T('MEASURE: maliyet not edilir (ayrıntılı tablo: obfuscation-measurement animasyonu).',
              'MEASURE: cost is noted (full table: the obfuscation-measurement animation).'), {});
    S.set('st2', { style: 'new' });

    // --- DIVERSIFY --------------------------------------------------------------------------------
    S.set('st3', { style: 'hl' });
    var diversifyOk = data.seed1 !== data.seed2;
    S.box('seedBoxA', { x: 0, y: 170, w: 140, h: 30, size: 12, text: T('tohum A: ' + data.seed1, 'seed A: ' + data.seed1), style: 'active' });
    S.box('seedBoxB', { x: 150, y: 170, w: 140, h: 30, size: 12, text: T('tohum B: ' + data.seed2, 'seed B: ' + data.seed2), style: 'active' });
    S.box('bytesBox', { x: 300, y: 170, w: 180, h: 30, size: 12, text: diversifyOk ? T('baytlar FARKLI', 'bytes DIFFER') : T('baytlar AYNI (beklenmez)', 'bytes SAME (unexpected)'), style: diversifyOk ? 'new' : 'del' });
    S.step(T('DIVERSIFY: ikinci tohumla (' + data.seed2 + ') ikinci bir değişken üretilir; baytlar ' + (diversifyOk ? 'farklı olmalı.' : 'AYNI çıktı — bu bir hata!'),
              'DIVERSIFY: a second variant is generated with the second seed (' + data.seed2 + '); the bytes must ' + (diversifyOk ? 'differ.' : 'be — but here they are SAME, a bug!')),
      { py: [14, { n: 15, note: T('b1 == b2? ' + (diversifyOk ? 'hayır' : 'evet -> HATA') , 'b1 == b2? ' + (diversifyOk ? 'no' : 'yes -> ERROR')) }].concat(diversifyOk ? [] : [16, 17]) });
    S.set('st3', { style: diversifyOk ? 'new' : 'del' });

    if (!mismatchSeen && diversifyOk)
      S.step(T('PIPELINE CHECK PASSED: davranış korundu, çeşitlendirme çalışıyor.', 'PIPELINE CHECK PASSED: behavior preserved, diversification works.'), {});
    else
      S.step(T('PIPELINE CHECK FAILED: yukarıdaki adım nedeniyle akış burada durur.', 'PIPELINE CHECK FAILED: the flow stops at the step above.'), {});

    S.result = reference(data);
  }

  D.define({
    id: 'in-class-flow',
    title: T('Sınıf içi akış: gizle -> karşılaştır -> ölç -> çeşitlendir', 'In-class flow: obfuscate -> compare -> measure -> diversify'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'all-pass', level: 'normal', name: T('Normal: her jeton eşleşiyor, tohumlar farklı -> PASSED', 'Normal: every token matches, seeds differ -> PASSED'),
        data: mk(SUPERSET.slice(0, 11), 1001, 2002) },
      { id: 'all-pass-many-tokens', level: 'hard', name: T('Zor: tüm 14 jeton, PASSED', 'Hard: all 14 tokens, PASSED'),
        data: mk(SUPERSET.slice(), 1001, 2002) },
      { id: 'edge-mismatch-and-same-seed', level: 'edge', name: T('Uç durum: bir uyuşmazlık VE aynı tohum iki kez -> FAILED', 'Edge case: one mismatch AND the same seed twice -> FAILED'),
        data: mk(SUPERSET.slice(0, 10), 1001, 1001, 3) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.tokens.length; },
    random: function (level, r) {
      var n = { easy: 10, normal: 11, hard: 13, extreme: SUPERSET.length }[level] || 10;
      var idxs = [0];
      var pool = []; for (var i = 1; i < SUPERSET.length; i++) pool.push(i);
      while (idxs.length < n && pool.length) idxs.push(pool.splice(D.randInt(r, 0, pool.length - 1), 1)[0]);
      idxs.sort(function (a, b) { return a - b; });
      var tokens = idxs.map(function (i) { return SUPERSET[i]; });
      var seed1 = D.randInt(r, 1000, 9999);
      var sameSeed = D.randInt(r, 0, 9) === 0;
      var seed2 = sameSeed ? seed1 : D.randInt(r, 1000, 9999);
      var mismatch = D.randInt(r, 0, 9) === 0 ? D.randInt(r, 0, tokens.length - 1) : -1;
      return mk(tokens, seed1, seed2, mismatch);
    },
    input: {
      hint: T('tokens=a,b,c|seed1=1001|seed2=2002|mismatch=none|<indeks>', 'tokens=a,b,c|seed1=1001|seed2=2002|mismatch=none|<index>'),
      format: function (data) {
        return 'tokens=' + data.tokens.map(function (t) { return t === '' ? '(empty)' : t; }).join(',') +
          '|seed1=' + data.seed1 + '|seed2=' + data.seed2 + '|mismatch=' + (data.mismatchIndex < 0 ? 'none' : data.mismatchIndex);
      },
      tokens: function (data) { return data.tokens.map(function (t) { return t === '' ? '(empty)' : t; }); },
      parse: function (text) {
        var m = String(text).match(/^tokens=(.*)\|seed1=(\d+)\|seed2=(\d+)\|mismatch=(none|\d+)$/);
        if (!m) throw T('Biçim: "tokens=a,b,c|seed1=<sayı>|seed2=<sayı>|mismatch=none|<indeks>" olmalı.',
                          'Format must be "tokens=a,b,c|seed1=<number>|seed2=<number>|mismatch=none|<index>".');
        var tokens = m[1].split(',').map(function (t) { return t === '(empty)' ? '' : t; });
        if (tokens.length < 1) throw T('En az bir jeton gerekir.', 'At least one token is required.');
        var mismatch = m[4] === 'none' ? -1 : parseInt(m[4], 10);
        if (mismatch >= tokens.length) throw T('mismatch indeksi jeton listesinin dışında.', 'mismatch index is outside the token list.');
        return mk(tokens, parseInt(m[2], 10), parseInt(m[3], 10), mismatch);
      },
      bad: ['', 'tokens=a,b|seed1=x|seed2=2|mismatch=none', 'tokens=a,b|seed1=1|seed2=2|mismatch=99',
            'seed1=1|seed2=2|mismatch=none']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
