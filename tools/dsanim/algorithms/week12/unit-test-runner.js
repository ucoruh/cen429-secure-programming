// CEN429 — Week 12 — Demo 1 (code/week-12/01-unit-test/test_runner.c: card()). Every test is a "test
// card": id, purpose, observed evidence, decision (PASS/FAIL). The exit code equals the number of failed
// cards. The "normal" preset below reproduces the real program's six T-01..T-06 cards byte-identically;
// the larger presets extend the same POOL with synthetic cards to satisfy the ≥10-input-values rule.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static int passed = 0, failed = 0;',
    '',
    'static void card(const char *id, const char *purpose, int condition, const char *observed)',
    '{',
    '    const char *decision = condition ? "PASS" : "FAIL";',
    '    if (condition) passed++; else failed++;',
    '    printf("  [%s] %-6s %s\\n", id, decision, purpose);',
    '    printf("        observed: %s\\n", observed);',
    '}',
    '',
    'printf("\\nRESULT: %d passed, %d failed.\\n", passed, failed);',
    'return failed;   /* exit code = number of failed tests */'
  ];

  // The real six cards from test_runner.c, byte-identical purposes, in the real program's order.
  var REAL_CARDS = [
    { id: 'T-01', purpose: T('Geçerli girdi kabul edilir', 'Valid input is accepted') },
    { id: 'T-02', purpose: T('Boşluk/metakarakter reddedilir', 'Whitespace/metacharacters are rejected') },
    { id: 'T-03', purpose: T('Boş girdi reddedilir', 'Empty input is rejected') },
    { id: 'T-04', purpose: T('32 karakterden uzun girdi reddedilir', 'Input longer than 32 characters is rejected') },
    { id: 'T-05', purpose: T('Normal toplama doğru', 'Normal addition is correct') },
    { id: 'T-06', purpose: T('Taşma önceden yakalanır', 'Overflow is caught before it happens') }
  ];
  var SYNTH_PURPOSES = [
    T('Alt çizgi kabul edilir', 'Underscore is accepted'),
    T('32 karakter tam sınırda kabul edilir', 'Exactly 32 characters is accepted at the boundary'),
    T('Negatif toplama doğru', 'Negative addition is correct'),
    T('INT_MIN sınırında taşma yakalanır', 'Overflow at INT_MIN is caught'),
    T('Sıfır + sıfır doğru', 'Zero plus zero is correct'),
    T('ASCII olmayan bayt reddedilir', 'A non-ASCII byte is rejected'),
    T('Yerleşik satır sonu reddedilir', 'An embedded newline is rejected'),
    T('Tek karakter kabul edilir', 'A single character is accepted')
  ];

  /** results: array of booleans (true = PASS), one per card, in order. Cards beyond index 5 are synthetic. */
  function mk(results) { return { results: results.slice() }; }

  function cardOf(i) {
    if (i < REAL_CARDS.length) return { id: REAL_CARDS[i].id, purpose: REAL_CARDS[i].purpose };
    var s = SYNTH_PURPOSES[(i - REAL_CARDS.length) % SYNTH_PURPOSES.length];
    return { id: 'T-' + String(i + 1).padStart(2, '0'), purpose: s };
  }

  function reference(data) {
    var passed = data.results.filter(Boolean).length;
    return { passed: passed, failed: data.results.length - passed, exitCode: data.results.length - passed };
  }

  function build(S, data) {
    var n = data.results.length;
    S.step(T('=== S16 Birim Testleri: ' + n + ' test kartı çalışıyor ===', '=== S16 Unit Tests: ' + n + ' test card(s) running ==='), { c: [1] });

    var passed = 0, failed = 0;
    var Y = 0, H = 40, GAP = 4;
    for (var i = 0; i < n; i++) {
      var card = cardOf(i), ok = data.results[i];
      S.at(i);
      S.box('id' + i, { x: 0, y: Y, w: 60, h: H - 6, size: 12, text: card.id, style: 'dim' });
      S.box('p' + i, { x: 66, y: Y, w: 300, h: H - 6, size: 11, mono: false, text: card.purpose, style: 'normal' });
      S.box('d' + i, { x: 372, y: Y, w: 80, h: H - 6, size: 13, text: ok ? 'PASS' : 'FAIL', style: ok ? 'new' : 'del' });
      if (ok) passed++; else failed++;
      if (i < 6) {
        S.step(T('`' + card.id + '` ' + (ok ? 'GEÇTİ' : 'KALDI') + ': ' + card.purpose.tr,
                  '`' + card.id + '` ' + (ok ? 'PASSED' : 'FAILED') + ': ' + card.purpose.en),
               { c: [{ n: 5, note: T('condition? ' + (ok ? 'evet -> PASS' : 'hayır -> FAIL'), 'condition? ' + (ok ? 'yes -> PASS' : 'no -> FAIL')) },
                      { n: 6, note: T('condition? ' + (ok ? 'evet -> passed++' : 'hayır -> failed++'), 'condition? ' + (ok ? 'yes -> passed++' : 'no -> failed++')) }, 7, 8] });
      }
      Y += H + GAP;
    }
    S.at(null);
    if (n > 6) S.step(T('Kalan ' + (n - 6) + ' kart da aynı şekilde çalıştı; sonuçlar yukarıda.', 'The remaining ' + (n - 6) + ' card(s) ran the same way; results are above.'), {});

    S.box('summary', { x: 0, y: Y + 10, w: 452, h: 40, size: 14, text: T('SONUÇ: ', 'RESULT: ').tr + passed + T(' geçti, ', ' passed, ').tr + failed + T(' kaldı.', ' failed.').tr, style: failed === 0 ? 'new' : 'del' });
    S.set('summary', { text: 'RESULT: ' + passed + ' passed, ' + failed + ' failed.' });
    S.step(T('RESULT: ' + passed + ' passed, ' + failed + ' failed. Çıkış kodu = ' + failed + '.',
              'RESULT: ' + passed + ' passed, ' + failed + ' failed. Exit code = ' + failed + '.'), { c: [10, 11] });

    S.result = { passed: passed, failed: failed, exitCode: failed };
    S.step(T(failed === 0 ? 'Çıkış kodu 0: CI bu sonucu "geçti" sayar; bu tablo S16\'ya girer.' : 'Çıkış kodu sıfır değil: CI bu çalıştırmayı "başarısız" işaretler; KALDI kartları bir bulguya dönüşür.',
              failed === 0 ? 'Exit code 0: CI treats this run as passing; this table becomes S16.' : 'Exit code is non-zero: CI marks this run as failing; the FAILED cards turn into a finding.'), {});
  }

  D.define({
    id: 'unit-test-runner',
    title: T('Birim test koşucusu: test kartları (test_runner.c)', 'Unit test runner: test cards (test_runner.c)'),
    code: { c: C },
    presets: [
      { id: 'normal-all-pass', level: 'normal', name: T('Normal: gerçek program — altı kartın hepsi GEÇTİ', 'Normal: the real program — all six cards PASS'), data: mk([true, true, true, true, true, true]) },
      { id: 'hard-mixed', level: 'hard', name: T('Zor: genişletilmiş kart kümesi, karışık sonuç', 'Hard: an extended card set, a mixed result'), data: mk([true, true, false, true, true, false, true, true, false, true, true]) },
      { id: 'edge-one-fail', level: 'edge', name: T('Uç durum: yalnız bir kart KALDI', 'Edge case: exactly one card FAILS'), data: mk([true, true, true, true, true, true, true, true, true, false]) },
      { id: 'edge-all-fail', level: 'edge', name: T('Uç durum: bütün kartlar KALDI', 'Edge case: every card FAILS'), data: mk(Array(10).fill(false)) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.results.length; },
    minSize: 6,
    random: function (level, r) {
      var n = { easy: 6, normal: D.randInt(r, 10, 12), hard: D.randInt(r, 11, 13), extreme: D.randInt(r, 12, 14) }[level] || 6;
      var passBias = { easy: 1, normal: 0.75, hard: 0.55, extreme: 0.35 }[level];
      var arr = [];
      for (var i = 0; i < n; i++) arr.push(r() < passBias);
      return mk(arr);
    },
    input: {
      hint: T('dizi=<P/F harfleri, ör. PPFPPP>', 'sequence=<P/F letters, e.g. PPFPPP>'),
      format: function (data) { return data.results.map(function (b) { return b ? 'P' : 'F'; }).join(''); },
      tokens: function (data) { return data.results.map(function (b, i) { return cardOf(i).id; }); },
      parse: function (text) {
        var s = String(text).trim().toUpperCase();
        if (!/^[PF]+$/.test(s)) throw T('Biçim: yalnız P ve F harflerinden oluşmalı (ör. "PPFPPP").', 'Format must consist only of the letters P and F (e.g. "PPFPPP").');
        if (s.length < 1 || s.length > 30) throw T('Uzunluk 1..30 aralığında olmalı.', 'The length must be in the range 1..30.');
        return mk(s.split('').map(function (ch) { return ch === 'P'; }));
      },
      bad: ['', 'PPXFPP', 'ppfppp7', String(new Array(40).join('P')), 'P P F']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
