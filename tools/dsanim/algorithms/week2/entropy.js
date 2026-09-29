// CEN429 — Week 2 — Demo 2 (code/week-02/02-entropy/entropy.c: entropy())
// Shannon entropy measures how "mixed up" a run of bytes is: H = -sum(p(b) * log2 p(b)), b = 0..255.
// H=0 (one repeated byte) .. H~8 (fully random/encrypted). Scanning a FILE in fixed-size WINDOWS (-p)
// shows entropy change locally — text next to an encrypted section jumps sharply, which a single
// whole-file average would hide.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (entropy.c 29-44, 122-129)
  var ENTROPY_C = [
    'static double entropy(const unsigned char *v, size_t n)',
    '{',
    '    size_t count[256] = { 0 };',
    '    if (n == 0)',
    '        return 0.0;',
    '    for (size_t i = 0; i < n; i++)',
    '        count[v[i]]++;',
    '    double h = 0.0;',
    '    for (int b = 0; b < 256; b++) {',
    '        if (count[b] == 0)',
    '            continue;',
    '        double p = (double)count[b] / (double)n;',
    '        h -= p * log2(p);',
    '    }',
    '    return h;',
    '}'
  ];
  // ENTROPY_C is shown first in the code panel (positions 1-16), so `{c:[N]}` against it uses BASE=1.
  var BASE = 1;
  var WINDOW_LOOP_C = [
    '            for (size_t o = 0; o < n; o += window) {',
    '                size_t m = n - o < window ? n - o : window;',
    '                double h = entropy(v + o, m);',
    '                bar(h, b, 32);'
  ];
  // WINDOW_LOOP_C is concatenated AFTER ENTROPY_C (16 lines) + 2 filler lines below, so in the
  // combined code panel it starts at position 19 (16 + 2 + 1) — see `code:` at the bottom of this file.
  var WBASE = 19;

  function mk(bytes, window) { return { bytes: bytes, window: window }; }

  function log2(x) { return Math.log(x) / Math.log(2); }

  /** The per-window entropy build() draws: histogram with a plain object, summed by iterating the
   * seen symbols only (for..in). NOT called from reference() — see referenceWindowEntropy() below. */
  function windowEntropy(bytes) {
    if (!bytes.length) return 0;
    var hist = {};
    for (var i = 0; i < bytes.length; i++) hist[bytes[i]] = (hist[bytes[i]] || 0) + 1;
    var h = 0, n = bytes.length;
    for (var sym in hist) {
      var p = hist[sym] / n;
      h -= p * log2(p);
    }
    return h;
  }

  /** Independent reference entropy for one window: sorts a COPY of the bytes, then sums run-lengths
   * of equal values (no hash map, no build()-shared helper at all) -- a structurally different
   * computation from windowEntropy() above, so a bug in either one shows up as a mismatch. */
  function referenceWindowEntropy(bytes) {
    if (!bytes.length) return 0;
    var sorted = bytes.slice().sort(function (a, b) { return a - b; });
    var n = sorted.length, h = 0, i = 0;
    while (i < n) {
      var j = i;
      while (j < n && sorted[j] === sorted[i]) j++;
      var p = (j - i) / n;
      h -= p * log2(p);
      i = j;
    }
    return h;
  }

  function reference(data) {
    var out = [], n = data.bytes.length, w = data.window;
    for (var o = 0; o < n; o += w) {
      var slice = data.bytes.slice(o, Math.min(o + w, n));
      out.push(Math.round(referenceWindowEntropy(slice) * 100) / 100);
    }
    return out;
  }

  function interpret(h) {
    if (h < 1.0) return T('tekdüze', 'uniform');
    if (h < 5.5) return T('düşük', 'low');
    if (h < 7.2) return T('orta', 'medium');
    return T('YÜKSEK', 'HIGH');
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
  function textByte(r) { return CHARS.charCodeAt(D.randInt(r, 0, CHARS.length - 1)); }
  function randomByte(r) { return D.randInt(r, 0, 255); }

  function build(S, data) {
    var n = data.bytes.length, w = data.window, cell = 22, gap = 2, perRow = 16;
    var rowY = 0, rowGap = 90;
    S.label('title', { x: (Math.min(perRow, n) * (cell + gap)) / 2, y: -22,
      text: T(n + ' baytlık dosya, ' + w + ' baytlık pencerelerle taranıyor', n + '-byte file, scanned in ' + w + '-byte windows'),
      anchor: 'middle', bold: true, size: 15 });

    // Draw the whole file up front (memRow, wrapped into rows of `perRow`), so nothing appears from
    // nowhere; a `region` brace-like frame highlights the CURRENT window as we go.
    var ids = [];
    for (var i = 0; i < n; i++) {
      var row = Math.floor(i / perRow), col = i % perRow;
      var id = S.box('b' + i, { x: col * (cell + gap), y: row * rowGap, w: cell, h: cell, size: 10,
        text: D.hex(data.bytes[i], 2), style: 'normal', mono: true });
      ids.push(id);
    }
    S.label('rowLbl', { x: -30, y: 12, text: T('dosya =', 'file ='), anchor: 'end', size: 13, bold: true });
    S.at(0);
    S.step(T('`entropy(v, n)` sıfır bayt için sabit 0.0 döner; aksi halde 256 olası bayt değerinin sayımı tutulur.',
              '`entropy(v, n)` returns a hard 0.0 for zero bytes; otherwise a count of all 256 possible byte values is kept.'),
           { c: [{ n: BASE + 3, note: T('n(' + n + ') == 0? hayır', 'n(' + n + ') == 0? no') }, { n: BASE + 4, skip: true }] });

    var results = [];
    var nWindows = Math.ceil(n / w);
    for (var wi = 0; wi < nWindows; wi++) {
      var o = wi * w, m = Math.min(w, n - o);
      var slice = data.bytes.slice(o, o + m);
      var h = windowEntropy(slice);
      results.push(Math.round(h * 100) / 100);
      S.at(o);
      for (i = 0; i < n; i++) {
        var inWin = i >= o && i < o + m;
        S.set('b' + i, { style: inWin ? 'active' : (i < o ? 'dim' : 'normal') });
      }
      var lab = interpret(h);
      if (wi === 0) {
        S.step(T('Pencere 0 [' + o + '..' + (o + m - 1) + ']: her bayt değerinin sıklığı sayılıyor, sonra H = -sum(p*log2 p) hesaplanıyor.',
                  'Window 0 [' + o + '..' + (o + m - 1) + ']: every byte value\'s frequency is counted, then H = -sum(p*log2 p) is computed.'),
               { c: [{ n: BASE + 5, note: T('i(0) < n(' + m + ')? evet', 'i(0) < n(' + m + ')? yes') }, BASE + 6,
                     { n: BASE + 8, note: T('b(0) < 256? evet', 'b(0) < 256? yes') },
                     { n: BASE + 9, note: T('count[b] == 0? değişken (bayta göre)', 'count[b] == 0? varies (per byte)') },
                     BASE + 11, BASE + 12, BASE + 13] });
        S.label('res' + wi, { x: (Math.min(perRow, n) * (cell + gap)) + 30, y: Math.floor(o / perRow) * rowGap + 12,
          text: 'H=' + h.toFixed(2) + ' (' + lab.en + ')', anchor: 'start', size: 13, bold: true });
      } else {
        S.label('res' + wi, { x: (Math.min(perRow, n) * (cell + gap)) + 30, y: Math.floor(o / perRow) * rowGap + 12,
          text: 'H=' + h.toFixed(2) + ' (' + lab.en + ')', anchor: 'start', size: 13, bold: true });
        var lastWindow = m < w;
        S.step(T('Pencere ' + wi + ' [' + o + '..' + (o + m - 1) + ']: H=' + h.toFixed(2) + ' — ' + lab.tr + '.',
                  'Window ' + wi + ' [' + o + '..' + (o + m - 1) + ']: H=' + h.toFixed(2) + ' — ' + lab.en + '.'),
               { c: [{ n: WBASE, note: T('o(' + o + ') < n(' + n + ')? evet', 'o(' + o + ') < n(' + n + ')? yes') },
                     { n: WBASE + 1, note: T('n-o(' + (n - o) + ') < window(' + w + ')? ' + (lastWindow ? 'evet (son pencere kısa)' : 'hayır (tam pencere)'),
                                              'n-o(' + (n - o) + ') < window(' + w + ')? ' + (lastWindow ? 'yes (short last window)' : 'no (full window)')) },
                     WBASE + 2, WBASE + 3] });
      }
    }
    S.at(null);
    for (i = 0; i < n; i++) S.set('b' + i, { style: 'dim' });
    S.result = results.map(function (x) { return x; });
    var jump = false;
    for (i = 1; i < results.length; i++) if (Math.abs(results[i] - results[i - 1]) > 2.5) jump = true;
    S.step(jump
      ? T('Bitişik pencereler arasında büyük bir sıçrama var: dosyanın bir kısmı diğerinden çok farklı — düz metin yanında şifreli/sıkıştırılmış bir bölüm olabilir.',
          'There is a large jump between adjacent windows: part of the file is very different from the rest — possibly an encrypted/compressed section next to plain text.')
      : T('Pencereler arasında büyük bir sıçrama yok: dosyanın karakteri baştan sona tutarlı.',
          'No large jump between windows: the file\'s character is consistent from start to end.'),
      {});
  }

  D.define({
    id: 'entropy',
    title: T('Kayan pencerede entropi ölçümü (entropy.c)', 'Sliding-window entropy (entropy.c)'),
    code: { c: ENTROPY_C.concat(['', '            /* build.py: run_tests.py sees the -p window loop too (entropy.c 122-129) */']).concat(WINDOW_LOOP_C) },
    presets: [
      { id: 'normal-uniform-text', level: 'normal',
        name: T('Normal: metin baştan sona tutarlı (düşük/orta H)', 'Normal: text is consistent throughout (low/medium H)'),
        data: (function () { var r = D.rng(2), b = []; for (var i = 0; i < 24; i++) b.push(textByte(r)); return mk(b, 8); })() },
      { id: 'hard-text-then-random', level: 'hard',
        name: T('Zor: düz metin, sonra rastgele veri — H sıçrıyor', 'Hard: plain text, then random data — H jumps'),
        data: (function () { var r = D.rng(3), b = []; var i;
          for (i = 0; i < 16; i++) b.push(textByte(r));
          for (i = 0; i < 16; i++) b.push(randomByte(r));
          return mk(b, 8); })() },
      { id: 'edge-uniform-zero', level: 'edge',
        name: T('Uç durum: tek bayt tekrarı, H=0', 'Edge case: one repeated byte, H=0'),
        data: mk(new Array(16).fill(0x41), 8) },
      { id: 'edge-mixed-three-sections', level: 'edge',
        name: T('Uç durum: metin/rastgele/metin, iki sıçrama', 'Edge case: text/random/text, two jumps'),
        data: (function () { var r = D.rng(4), b = []; var i;
          for (i = 0; i < 8; i++) b.push(textByte(r));
          for (i = 0; i < 8; i++) b.push(randomByte(r));
          for (i = 0; i < 8; i++) b.push(textByte(r));
          return mk(b, 8); })() },
      { id: 'edge-window-does-not-divide-evenly', level: 'edge',
        name: T('Uç durum: son pencere daha kısa (bölünmüyor)', 'Edge case: the last window is shorter (does not divide evenly)'),
        data: mk((function () { var r = D.rng(5), b = []; for (var i = 0; i < 19; i++) b.push(textByte(r)); return b; })(), 8) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.bytes.length; },
    random: function (level, r) {
      var w = 8;
      var n = level === 'easy' ? D.randInt(r, 10, 16) : level === 'normal' ? D.randInt(r, 16, 24) :
              level === 'hard' ? D.randInt(r, 24, 32) : D.randInt(r, 24, 32);
      var b = [], sections = level === 'easy' ? 1 : level === 'normal' ? D.randInt(r, 1, 2) : D.randInt(r, 2, 3);
      var per = Math.ceil(n / sections);
      for (var s = 0; s < sections; s++) {
        var isRandom = level !== 'easy' && s % 2 === 1;
        var len = Math.min(per, n - b.length);
        for (var i = 0; i < len; i++) b.push(isRandom ? randomByte(r) : textByte(r));
      }
      return mk(b, w);
    },
    input: {
      hint: T('bayt1,bayt2,… (ondalık, 0-255) | pencere=N', 'byte1,byte2,… (decimal, 0-255) | window=N'),
      format: function (data) { return data.bytes.join(',') + ' | window=' + data.window; },
      tokens: function (data) { return data.bytes.map(function (b) { return D.hex(b, 2); }); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('"baytlar | window=N" biçiminde olmalı.', 'Must be "bytes | window=N".');
        var byteToks = parts[0].split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!byteToks.length) throw T('En az bir bayt girin.', 'Enter at least one byte.');
        var bytes = [];
        for (var i = 0; i < byteToks.length; i++) {
          if (!/^\d+$/.test(byteToks[i])) throw T('"' + byteToks[i] + '" 0-255 arası bir tamsayı değil.', '"' + byteToks[i] + '" is not an integer 0-255.');
          var v = parseInt(byteToks[i], 10);
          if (v < 0 || v > 255) throw T('"' + byteToks[i] + '" 0-255 aralığı dışında.', '"' + byteToks[i] + '" is outside 0-255.');
          bytes.push(v);
        }
        var m = parts[1].trim().match(/^window=(\d+)$/);
        if (!m) throw T('İkinci parça "window=N" biçiminde olmalı.', 'The second part must look like "window=N".');
        var w = parseInt(m[1], 10);
        if (w < 1) throw T('Pencere en az 1 olmalı.', 'The window must be at least 1.');
        return mk(bytes, w);
      },
      bad: ['', '1,2,3', '1,2,3 | window=0', '1,999,3 | window=4', 'a,b,c | window=4']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
