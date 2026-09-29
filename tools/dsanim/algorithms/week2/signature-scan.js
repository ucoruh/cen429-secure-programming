// CEN429 — Week 2 — Demo 1 (code/week-02/01-signature-scanner/scanner.c: contains())
// A signature scanner's simplest method: does a known byte SEQUENCE (a "pattern" signature) appear
// anywhere in the file? The scanner slides the pattern one byte at a time over the file and compares.
// Strength: survives small unrelated changes elsewhere in the file (unlike a whole-file hash).
// Weakness: a polymorphic sample that re-encodes its body with a different key defeats it completely
// (see the emulation method, which decodes first and then re-applies this same pattern search).
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (scanner.c 122-131)
  var CONTAINS_C = [
    'static int contains(const unsigned char *v, size_t n, const char *pattern)',
    '{',
    '    size_t m = strlen(pattern);',
    '    if (m == 0 || m > n)',
    '        return 0;',
    '    for (size_t i = 0; i + m <= n; i++)',
    '        if (memcmp(v + i, pattern, m) == 0)',
    '            return 1;',
    '    return 0;',
    '}'
  ];
  // BASE = 1: CONTAINS_C is the WHOLE excerpt shown in the code panel, so `{c:[N]}` below addresses
  // the panel's own Nth displayed line (scanner.c 122-131 in the real file — see the comment above).
  var BASE = 1;

  function mk(buffer, pattern) { return { buffer: buffer, pattern: pattern }; }

  /** Independent: relies on the JS engine's own indexOf, never the byte-by-byte loop build() draws. */
  function reference(data) {
    var m = data.pattern.length, n = data.buffer.length;
    if (m === 0 || m > n) return { found: false, at: -1 };
    var at = data.buffer.indexOf(data.pattern);
    return { found: at >= 0, at: at };
  }

  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function randChar(r) { return ALPHA.charAt(D.randInt(r, 0, ALPHA.length - 1)); }
  function randText(r, n) { var s = ''; for (var i = 0; i < n; i++) s += randChar(r); return s; }

  /** Builds a buffer with several NEAR-MISS occurrences of `pattern` (all but the last byte match)
   * so a "not found" run still has interesting, honest tension instead of just random noise. */
  function withNearMisses(r, n, pattern, count) {
    var buf = randText(r, n).split('');
    var m = pattern.length;
    var used = [];
    for (var k = 0; k < count && n - m - 1 >= 0; k++) {
      var pos = D.randInt(r, 0, n - m);
      if (used.indexOf(pos) >= 0) continue;
      used.push(pos);
      for (var i = 0; i < m - 1; i++) buf[pos + i] = pattern.charAt(i);
      var wrong;
      do { wrong = randChar(r); } while (wrong === pattern.charAt(m - 1));
      buf[pos + m - 1] = wrong;
    }
    return buf.join('');
  }

  function W() { return 30; }

  function build(S, data) {
    var n = data.buffer.length, m = data.pattern.length, w = W(), gap = 4;
    S.label('bufLbl', { x: -46, y: 18, text: T('dosya =', 'file ='), anchor: 'end', size: 14, bold: true });
    for (var i = 0; i < n; i++) {
      S.box('b' + i, { x: i * (w + gap), y: 0, w: w, h: 34, size: 15, above: String(i), text: data.buffer.charAt(i), style: 'normal' });
    }
    S.label('patLbl', { x: -46, y: 76, text: T('imza =', 'signature ='), anchor: 'end', size: 14, bold: true });
    if (m > 0) {
      for (var k = 0; k < m; k++) {
        S.box('p' + k, { x: k * (w + gap), y: 58, w: w, h: 34, size: 15, text: data.pattern.charAt(k), style: 'active' });
      }
    } else {
      S.label('patEmpty', { x: 0, y: 76, text: T('(boş dize)', '(empty string)'), anchor: 'start', size: 14, style: 'dim' });
    }
    S.at(0);

    // Degenerate cases handled first, as their own single step (matches contains()'s own early `if`).
    if (m === 0) {
      S.step(T('`strlen(pattern)` sıfır: boş imza hiçbir zaman eşleşmez, döngü hiç çalışmaz.',
                '`strlen(pattern)` is zero: an empty signature never matches, the loop never runs.'),
             { c: [BASE + 2, { n: BASE + 3, note: T('m(0) == 0 || m > n? evet (m==0)', 'm(0) == 0 || m > n? yes (m==0)') }, BASE + 4] });
      S.result = reference(data);
      return;
    }
    if (m > n) {
      S.step(T('İmza (' + m + ' bayt), dosyadan (' + n + ' bayt) uzun: hiç denemeye gerek yok.',
                'The signature (' + m + ' bytes) is longer than the file (' + n + ' bytes): there is nothing to try.'),
             { c: [BASE + 2, { n: BASE + 3, note: T('m(' + m + ') == 0 || m > n(' + n + ')? evet (m>n)', 'm(' + m + ') == 0 || m > n(' + n + ')? yes (m>n)') }, BASE + 4] });
      S.result = reference(data);
      return;
    }

    S.step(T('`memcmp` ile ' + m + ' baytlık imza, dosya üzerinde bir baytlık adımlarla ' + (n - m + 1) + ' konumda denenecek.',
              'The ' + m + '-byte signature is tried at ' + (n - m + 1) + ' positions across the file, one byte at a time, with `memcmp`.'),
           { c: [{ n: BASE + 3, note: T('m(' + m + ') == 0 || m > n(' + n + ')? hayır', 'm(' + m + ') == 0 || m > n(' + n + ')? no') },
                 { n: BASE + 4, skip: true }, { n: BASE + 5, note: T('i(0) + m(' + m + ') <= n(' + n + ')? evet', 'i(0) + m(' + m + ') <= n(' + n + ')? yes') }] });

    var winner = -1;
    for (var pos = 0; pos <= n - m && winner < 0; pos++) {
      S.at(pos);
      for (k = 0; k < m; k++) S.set('p' + k, { x: (pos + k) * (w + gap) });
      for (i = pos; i < pos + m; i++) S.set('b' + i, { style: 'hl' });

      if (pos === 0) {
        // First position: detailed, byte by byte.
        var mismatchAt = -1;
        for (k = 0; k < m; k++) {
          var ok = data.buffer.charAt(pos + k) === data.pattern.charAt(k);
          S.set('b' + (pos + k), { style: ok ? 'active' : 'del' });
          S.set('p' + k, { style: ok ? 'active' : 'del' });
          S.step(T('konum 0: `' + data.buffer.charAt(pos + k) + '` ' + (ok ? '==' : '!=') + ' `' + data.pattern.charAt(k) + '` ' + (ok ? '(eşleşti)' : '(uymadı, dur)'),
                    'position 0: `' + data.buffer.charAt(pos + k) + '` ' + (ok ? '==' : '!=') + ' `' + data.pattern.charAt(k) + '` ' + (ok ? '(matches)' : '(mismatch, stop)')),
                 { c: ok ? [{ n: BASE + 6, note: T('bayt ' + k + ' eşleşti mi (henüz)? evet', 'byte ' + k + ' matches (so far)? yes') }]
                         : [{ n: BASE + 6, note: T('memcmp == 0? hayır (bayt ' + k + ' uymadı)', 'memcmp == 0? no (byte ' + k + ' mismatched)') }, { n: BASE + 7, skip: true }] });
          if (!ok) { mismatchAt = k; break; }
        }
        if (mismatchAt < 0) {
          winner = pos;
          for (i = pos; i < pos + m; i++) S.set('b' + i, { style: 'new' });
          for (k = 0; k < m; k++) S.set('p' + k, { style: 'new' });
          S.step(T('Konum 0\'da tüm ' + m + ' bayt eşleşti — İMZA BULUNDU, arama burada durur.',
                    'All ' + m + ' bytes matched at position 0 — SIGNATURE FOUND, the search stops here.'),
                 { c: [{ n: BASE + 6, note: T('memcmp == 0? evet (' + m + ' bayt da eşleşti)', 'memcmp == 0? yes (all ' + m + ' bytes matched)') }, BASE + 7] });
        } else {
          for (i = pos; i < pos + m; i++) S.set('b' + i, { style: 'dim' });
          for (k = 0; k < m; k++) S.set('p' + k, { style: 'active' });
        }
      } else {
        // Later positions: one step each.
        var matched = data.buffer.substr(pos, m) === data.pattern;
        for (i = pos; i < pos + m; i++) S.set('b' + i, { style: matched ? 'new' : 'dim' });
        for (k = 0; k < m; k++) S.set('p' + k, { style: matched ? 'new' : 'active' });
        var loopNote = { n: BASE + 5, note: T('i(' + pos + ') + m(' + m + ') <= n(' + n + ')? evet', 'i(' + pos + ') + m(' + m + ') <= n(' + n + ')? yes') };
        if (matched) {
          winner = pos;
          S.step(T('konum ' + pos + ': `' + data.buffer.substr(pos, m) + '` == `' + data.pattern + '` — İMZA BULUNDU.',
                    'position ' + pos + ': `' + data.buffer.substr(pos, m) + '` == `' + data.pattern + '` — SIGNATURE FOUND.'),
                 { c: [loopNote, { n: BASE + 6, note: T('memcmp == 0? evet', 'memcmp == 0? yes') }, BASE + 7] });
        } else {
          S.step(T('konum ' + pos + ': `' + data.buffer.substr(pos, m) + '` != `' + data.pattern + '`, devam.',
                    'position ' + pos + ': `' + data.buffer.substr(pos, m) + '` != `' + data.pattern + '`, keep going.'),
                 { c: [loopNote, { n: BASE + 6, note: T('memcmp == 0? hayır', 'memcmp == 0? no') }, { n: BASE + 7, skip: true }] });
        }
      }
    }
    S.at(null);
    S.result = reference(data);
    if (winner < 0) {
      S.styleAll('dim', 'box'); // nothing matched: fade the whole scene to show the search is over
      S.step(T('Bütün ' + (n - m + 1) + ' konum denendi, hiçbiri tutmadı — imza bu dosyada YOK.',
                'All ' + (n - m + 1) + ' positions were tried, none matched — the signature is NOT in this file.'),
             { c: [{ n: BASE + 5, note: T('i(' + (n - m + 1) + ') + m <= n? hayır (döngü bitti)', 'i(' + (n - m + 1) + ') + m <= n? no (loop ended)') }, BASE + 8] });
    }
  }

  D.define({
    id: 'signature-scan',
    title: T('İmza taraması: bilinen bir bayt dizisi aranıyor (scanner.c)', 'Signature scan: searching for a known byte sequence (scanner.c)'),
    code: { c: CONTAINS_C },
    presets: [
      { id: 'normal-found-middle', level: 'normal',
        name: T('Normal: imza dosyanın ortasında bulunuyor', 'Normal: the signature is found in the middle of the file'),
        data: mk('QK' + 'BLUE' + 'ZTVXPMR', 'BLUE') },
      { id: 'hard-near-misses', level: 'hard',
        name: T('Zor: birçok neredeyse-eşleşme var, gerçek imza yok', 'Hard: many near-misses, the real signature is absent'),
        data: mk(withNearMisses(D.rng(20260222), 18, 'CAT42', 3), 'CAT42') },
      { id: 'edge-found-start', level: 'edge',
        name: T('Uç durum: imza tam konum 0\'da', 'Edge case: the signature is at position 0 exactly'),
        data: mk('SIG3' + 'KLMNOPQRSTUV', 'SIG3') },
      { id: 'edge-found-end', level: 'edge',
        name: T('Uç durum: imza dosyanın son olabilecek konumunda', 'Edge case: the signature is at the last possible position'),
        data: mk('KLMNOPQRSTUV' + 'ENDX', 'ENDX') },
      { id: 'edge-empty-pattern', level: 'edge', small: true,
        name: T('Uç durum: boş imza (her zaman "yok")', 'Edge case: an empty signature (always "not found")'),
        data: mk('ABCDEFGHIJKLMNOP', '') },
      { id: 'edge-pattern-too-long', level: 'edge', small: true,
        name: T('Uç durum: imza dosyadan uzun (hiç denenmez)', 'Edge case: the signature is longer than the file (never even tried)'),
        data: mk('SHORTFILE1', 'WAYTOOLONGSIGNATURE') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.buffer.length; },
    random: function (level, r) {
      var n = level === 'easy' ? D.randInt(r, 10, 12) : level === 'normal' ? D.randInt(r, 12, 16) :
              level === 'hard' ? D.randInt(r, 16, 22) : D.randInt(r, 20, 28);
      var patLen = D.randInt(r, 3, 5);
      var pattern = randText(r, patLen);
      var found = level === 'easy' || r() < 0.5;
      if (!found) return mk(withNearMisses(r, n, pattern, D.randInt(r, 1, 3)), pattern);
      var pos = D.randInt(r, 0, n - patLen);
      var chars = randText(r, n).split('');
      for (var i = 0; i < patLen; i++) chars[pos + i] = pattern.charAt(i);
      return mk(chars.join(''), pattern);
    },
    input: {
      hint: T('DOSYAMETNİ | imza=İMZA', 'FILETEXT | signature=SIGNATURE'),
      format: function (data) { return data.buffer + ' | signature=' + data.pattern; },
      tokens: function (data) { return data.buffer.split(''); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('"METİN | imza=İMZA" biçiminde olmalı.', 'Must be "TEXT | signature=SIGNATURE".');
        var buf = parts[0].trim();
        var m = parts[1].trim().match(/^signature=(.*)$/);
        if (!buf) throw T('Dosya metni boş olamaz.', 'The file text cannot be empty.');
        if (!m) throw T('İkinci parça "signature=..." ile başlamalı.', 'The second part must start with "signature=".');
        if (!/^[A-Za-z0-9]*$/.test(buf) || !/^[A-Za-z0-9]*$/.test(m[1])) throw T('Yalnızca harf/rakam kullanın.', 'Use letters/digits only.');
        return mk(buf, m[1]);
      },
      bad: ['', 'no separator here', 'abc | badformat', 'abc|signature=$$$']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
