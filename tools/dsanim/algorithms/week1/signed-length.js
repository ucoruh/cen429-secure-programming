// CEN429 — Week 1 — Demo 4 (code/week-01/04-signed-length/copy.c)
// copy_record() only checks the UPPER bound (length > RECORD_SIZE). A negative length passes that check; when it
// is handed to memcpy's third parameter (size_t, unsigned), the negative int is reinterpreted bit-for-bit as a
// huge unsigned 64-bit value (two's complement): -1 becomes 18446744073709551615. This animation runs a sweep of
// length values through the real check and shows the int -> size_t conversion for every one that slips through.
(function (D) {
  'use strict';
  var T = D.T;

  var CODE_C = [
    '#define RECORD_SIZE 16',
    '',
    'static int copy_record(char *dest, const char *source, int length)',
    '{',
    '    if (length > RECORD_SIZE)          /* BUG: the lower bound (negative) is never checked */',
    '        return -1;',
    '    memcpy(dest, source, length);      /* int -> size_t: -1 -> 2^64 - 1 */',
    '    return 0;',
    '}'
  ];
  var L = { check: 5, reject: 6, memcpy: 7, ok: 8 };
  var TWO_64 = 18446744073709551616n;

  function mk(calls) { return { calls: calls }; }

  /** Independent computation: BigInt two's-complement conversion done with a plain formula (2^64 + length for a
   * negative length), not build()'s per-call loop. */
  function reference(data) {
    return data.calls.map(function (length) {
      var rejected = length > 16;
      if (rejected) return { length: length, rejected: true, sizeT: null };
      var big = length < 0 ? (TWO_64 + BigInt(length)) : BigInt(length);
      return { length: length, rejected: false, sizeT: big.toString() };
    });
  }

  function build(S, data) {
    var calls = data.calls, n = calls.length;
    var CW = 70, CH = 34, GAP = 6;
    S.label('title', { x: 0, y: -20, text: T('copy_record(dest, source, length) — ' + n + ' çağrı', 'copy_record(dest, source, length) — ' + n + ' calls'), anchor: 'start', size: 14, bold: true });
    for (var i = 0; i < n; i++) {
      S.box('c' + i, { x: 0, y: i * (CH + GAP), w: CW, h: CH, size: 13, mono: true, text: String(calls[i]), style: 'normal', above: i === 0 ? T('uzunluk', 'length') : undefined });
    }
    var outX = CW + 60;
    S.label('outTitle', { x: outX, y: -20, text: T('sonuç', 'outcome'), anchor: 'start', size: 14, bold: true });

    calls.forEach(function (length, idx) {
      S.set('c' + idx, { style: 'active' });
      S.at(idx);
      var rejected = length > 16;
      var checkNote = T(length + ' > 16? ' + (rejected ? 'evet → reddet' : 'hayır → devam (alt sınır hiç sorulmadı)'),
                         length + ' > 16? ' + (rejected ? 'yes -> reject' : 'no -> continue (the lower bound was never asked)'));
      if (rejected) {
        S.set('c' + idx, { style: 'dim' });
        S.label('o' + idx, { x: outX, y: idx * (CH + GAP) + CH / 2 + 4, text: T('reddedildi (uzunluk > 16)', 'rejected (length > 16)'), anchor: 'start', size: 12 });
        var cap1 = idx < 3
          ? T('`length` = ' + length + ' > 16 -> `if` doğru, fonksiyon `-1` döner, `memcpy` HİÇ ÇAĞRILMAZ.',
              '`length` = ' + length + ' > 16 -> the `if` is true, the function returns `-1`, `memcpy` is NEVER called.')
          : T('`length` = ' + length + ': reddedildi.', '`length` = ' + length + ': rejected.');
        S.step(cap1, { c: [{ n: L.check, note: checkNote }, L.reject, { n: L.memcpy, skip: true }] });
      } else {
        S.set('c' + idx, { style: length < 0 ? 'del' : 'new' });
        var big = length < 0 ? (TWO_64 + BigInt(length)) : BigInt(length);
        var sizeT = big.toString();
        S.label('o' + idx, { x: outX, y: idx * (CH + GAP) + CH / 2 + 4, text: 'size_t = ' + sizeT, anchor: 'start', size: 12, mono: true });
        if (length < 0) {
          var cap2 = idx < 5
            ? T('`length` = ' + length + ' ≤ 16 -> `if` YANLIŞ (kontrol yalnız ÜST sınıra bakıyor) -> `memcpy`\'e geçiyor. `int` -> `size_t` dönüşümünde ikiye tümleyen ' + length + '\'i ' + sizeT + ' yapar — DEV bir kopya denenir.',
                '`length` = ' + length + ' <= 16 -> the `if` is FALSE (the check only looks at the UPPER bound) -> reaches `memcpy`. The int -> size_t conversion turns ' + length + ' into ' + sizeT + ' via two\'s complement — a HUGE copy is attempted.')
            : T('`length` = ' + length + ' -> size_t ' + sizeT + ' (yine dev bir kopya).', '`length` = ' + length + ' -> size_t ' + sizeT + ' (again a huge copy).');
          S.step(cap2, { c: [{ n: L.check, note: checkNote }, { n: L.reject, skip: true }, L.memcpy] });
        } else {
          var cap3 = idx < 5
            ? T('`length` = ' + length + ' ≤ 16 -> güvenle ' + length + ' bayt kopyalanır.', '`length` = ' + length + ' <= 16 -> safely copies ' + length + ' bytes.')
            : T('`length` = ' + length + ' -> ' + length + ' bayt kopyalandı.', '`length` = ' + length + ' -> copied ' + length + ' bytes.');
          S.step(cap3, { c: [{ n: L.check, note: checkNote }, { n: L.reject, skip: true }, L.memcpy, L.ok] });
        }
      }
    });
    S.at(null);
    S.result = reference(data);
    var badCount = S.result.filter(function (r) { return !r.rejected && r.length < 0; }).length;
    S.step(T(n + ' çağrının ' + badCount + " tanesi negatif uzunlukla geçti ve devasa bir size_t'ye dönüştü — tek bir alt sınır denetimi (`length < 0`) hepsini önlerdi.",
              badCount + ' of the ' + n + ' calls got through with a negative length and turned into a huge size_t — a single lower-bound check (`length < 0`) would have stopped every one of them.'),
           {});
  }

  D.define({
    id: 'signed-length',
    title: T('İşaretli uzunluk -> size_t: -1 devasa bir sayı olur (copy.c)', 'Signed length -> size_t: -1 becomes a huge number (copy.c)'),
    code: { c: CODE_C },
    presets: [
      { id: 'typical-sweep', level: 'normal', name: T('Normal: karışık uzunluklar (10 çağrı)', 'Normal: a mix of lengths (10 calls)'), data: mk([5, 16, 17, -1, 8, 0, 12, 20, -5, 16]) },
      { id: 'wide-sweep', level: 'hard', name: T('Zor: geniş aralık, çok negatif ve çok büyük (12 çağrı)', 'Hard: a wide range, very negative and very large (12 calls)'), data: mk([-1, -2, -16, -100, 17, 100, 1000, -1000, 15, 16, 0, -2147483648]) },
      { id: 'edge-all-negative', level: 'edge', name: T('Uç durum: hepsi negatif (10 çağrı, hepsi geçer)', 'Edge case: all negative (10 calls, all get through)'), data: mk([-1, -2, -3, -4, -5, -8, -16, -32, -64, -128]) },
      { id: 'edge-boundary', level: 'edge', name: T('Uç durum: 16/17 sınırının tam üzerinde (10 çağrı)', 'Edge case: right at the 16/17 boundary (10 calls)'), data: mk([14, 15, 16, 17, 18, -1, 0, 16, 17, -16]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.calls.length; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 11, hard: 13, extreme: 16 };
      var n = counts[level] || 10;
      var ranges = { easy: [-20, 20], normal: [-100, 100], hard: [-100000, 100000], extreme: [-2147483648, 2147483647] };
      var rg = ranges[level] || ranges.normal;
      var out = [];
      for (var i = 0; i < n; i++) out.push(D.randInt(r, rg[0], rg[1]));
      return mk(out);
    },
    input: {
      hint: T('uzunluk, uzunluk, … (en az 10 tamsayı)', 'length, length, … (at least 10 integers)'),
      format: function (data) { return data.calls.join(', '); },
      tokens: function (data) { return data.calls.map(String); },
      parse: function (text) {
        var toks = String(text).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir uzunluk girin.', 'Enter at least one length.');
        var out = [];
        toks.forEach(function (t) {
          if (!/^-?\d+$/.test(t)) throw T('"' + t + '" bir tamsayı değil.', '"' + t + '" is not an integer.');
          var n2 = parseInt(t, 10);
          if (n2 < -2147483648 || n2 > 2147483647) throw T('"' + t + '" 32-bit `int` aralığının dışında.', '"' + t + '" is outside the 32-bit `int` range.');
          out.push(n2);
        });
        return mk(out);
      },
      bad: ['', 'x, y', '99999999999999999999', '1,2,three,4', '1.5, 2']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
