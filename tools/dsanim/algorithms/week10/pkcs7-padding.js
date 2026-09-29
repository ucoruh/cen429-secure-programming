// CEN429 — Week 10 — Demo 4 (code/week-10/04-pkcs7-padding/pkcs7.py)
// PKCS#7 padding (RFC 5652 §6.3) appends N bytes, each of value N, so a message fills whole blocks;
// unpad() checks three things in order — length is a multiple of the block size, the last byte is a
// value that could be a real padding length, and every padding byte actually equals that value — and
// raises the SAME error for all three. Two different-looking failures (or two different response
// times) are exactly what a padding ORACLE attack (Vaudenay, 2002) needs to work.
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    'BLOCK_SIZE = 8  # bytes; small on purpose, so every padded message fits on one line',   // 1
    'def pad(data: bytes, block_size: int = BLOCK_SIZE) -> bytes:',                          // 2
    '    pad_len = block_size - (len(data) % block_size)',                                   // 3
    '    return data + bytes([pad_len]) * pad_len',                                          // 4
    'def unpad(data: bytes, block_size: int = BLOCK_SIZE) -> bytes:',                         // 5
    '    if not data or len(data) % block_size != 0:',                                        // 6
    '        raise ValueError("padding error")',                                              // 7
    '    pad_len = data[-1]',                                                                 // 8
    '    if pad_len < 1 or pad_len > block_size:',                                            // 9
    '        raise ValueError("padding error")',                                              // 10
    '    if data[-pad_len:] != bytes([pad_len]) * pad_len:',                                  // 11
    '        raise ValueError("padding error")',                                              // 12
    '    return data[:-pad_len]'                                                              // 13
  ];
  var BLOCK = 8;

  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }

  function padRef(bytes) {
    var n = BLOCK - (bytes.length % BLOCK);
    return bytes.concat(new Array(n).fill(n));
  }

  /** Independent unpad: a plain, single-pass check (no early-exit staged walk like build() draws). */
  function unpadRef(bytes) {
    if (!bytes.length || bytes.length % BLOCK !== 0) return { ok: false };
    var n = bytes[bytes.length - 1];
    if (n < 1 || n > BLOCK) return { ok: false };
    var good = true;
    for (var i = 0; i < n; i++) if (bytes[bytes.length - 1 - i] !== n) good = false;
    if (!good) return { ok: false };
    return { ok: true, data: bytes.slice(0, bytes.length - n) };
  }

  function corrupt(padded, kind) {
    var out = padded.slice();
    if (kind === 'length') { out.pop(); }
    else if (kind === 'lastbyte') { out[out.length - 1] = 0; }
    else if (kind === 'midbyte') { out[out.length - 2] = out[out.length - 2] ^ 0xff; }
    return out;
  }

  function mk(text, corruption) { return { text: text, corruption: corruption || 'none' }; }

  function reference(data) {
    var padded = padRef(toBytes(data.text));
    var received = corrupt(padded, data.corruption);
    return unpadRef(received);
  }

  function build(S, data) {
    var p = toBytes(data.text), n = p.length;
    var padLen = BLOCK - (n % BLOCK);
    var padded = padRef(p);
    var CW = 24, GAP = 2;
    S.label('plbl', { x: -14, y: 15, text: 'data =', anchor: 'end', size: 13, mono: true });
    for (var i = 0; i < n; i++) S.box('b' + i, { x: i * (CW + GAP), y: 0, w: CW, h: 28, size: 12, text: data.text[i], style: 'normal' });
    S.step(T('Girdi, ' + n + ' bayt: `"' + data.text + '"`. Blok boyu = ' + BLOCK + '.',
              'Input, ' + n + ' bytes: `"' + data.text + '"`. Block size = ' + BLOCK + '.'), { py: [] });

    for (i = n; i < padded.length; i++) S.box('b' + i, { x: i * (CW + GAP), y: 0, w: CW, h: 28, size: 12, text: padded[i], style: 'dim' });
    S.brace('brPad', { from: 'b' + n, to: 'b' + (padded.length - 1), text: T(padLen + ' dolgu baytı', padLen + ' padding bytes'), side: 'bottom' });
    S.step(T('`pad(data)` — `' + padLen + '` bayt eklenir, her biri değeri `' + padLen + '`.',
              '`pad(data)` — `' + padLen + '` bytes are appended, each of value `' + padLen + '`.'), { py: [2, 3, 4] });

    var received = corrupt(padded, data.corruption);
    if (data.corruption !== 'none') {
      var idx = data.corruption === 'length' ? padded.length - 1 : (data.corruption === 'lastbyte' ? padded.length - 1 : padded.length - 2);
      if (data.corruption === 'length') {
        S.remove('b' + (padded.length - 1));
        S.step(T('SALDIRI: son bayt SİLİNDİ — uzunluk artık ' + BLOCK + '\'ın katı değil.',
                  'ATTACK: the last byte is DELETED — the length is no longer a multiple of ' + BLOCK + '.'), { py: [] });
      } else {
        S.set('b' + idx, { style: 'del', text: received[idx] });
        S.step(T('SALDIRI: bayt ' + idx + ' değiştirildi (' + padded[idx] + ' → ' + received[idx] + ').',
                  'ATTACK: byte ' + idx + ' is changed (' + padded[idx] + ' → ' + received[idx] + ').'), { py: [] });
      }
    }

    S.result = reference(data);
    S.remove('brPad');

    // ---- staged unpad() walk, in real execution order --------------------------------------------
    var lengthOk = received.length > 0 && received.length % BLOCK === 0;
    var lines = [5];
    if (!lengthOk) {
      lines.push({ n: 6, note: T('uzunluk geçersiz mi? EVET', 'length invalid? YES') }, 7);
      S.step(T('`unpad` — uzunluk kontrolü BAŞARISIZ: `ValueError("padding error")`.',
                '`unpad` — the length check FAILS: `ValueError("padding error")`.'), { py: lines });
      return;
    }
    lines.push({ n: 6, note: T('uzunluk geçersiz mi? HAYIR', 'length invalid? NO') }, { n: 7, skip: true });
    var readPadLen = received[received.length - 1];
    lines.push(8);
    var rangeBad = readPadLen < 1 || readPadLen > BLOCK;
    if (rangeBad) {
      lines.push({ n: 9, note: T('pad_len (' + readPadLen + ') aralık dışı mı? EVET', 'pad_len (' + readPadLen + ') out of range? YES') }, 10);
      S.step(T('`unpad` — `pad_len = ' + readPadLen + '`; aralık kontrolü BAŞARISIZ: `ValueError("padding error")`.',
                '`unpad` — `pad_len = ' + readPadLen + '`; the range check FAILS: `ValueError("padding error")`.'), { py: lines });
      return;
    }
    lines.push({ n: 9, note: T('pad_len (' + readPadLen + ') aralık dışı mı? HAYIR', 'pad_len (' + readPadLen + ') out of range? NO') }, { n: 10, skip: true });
    var bytesOk = true;
    for (var k = 0; k < readPadLen; k++) if (received[received.length - 1 - k] !== readPadLen) bytesOk = false;
    if (!bytesOk) {
      lines.push({ n: 11, note: T('her dolgu baytı = pad_len mi? HAYIR', 'every padding byte == pad_len? NO') }, 12);
      S.step(T('`unpad` — `pad_len = ' + readPadLen + '`; bayt eşleşme kontrolü BAŞARISIZ: `ValueError("padding error")`.',
                '`unpad` — `pad_len = ' + readPadLen + '`; the byte-match check FAILS: `ValueError("padding error")`.'), { py: lines });
      return;
    }
    lines.push({ n: 11, note: T('her dolgu baytı = pad_len mi? EVET', 'every padding byte == pad_len? YES') }, { n: 12, skip: true }, 13);
    for (i = 0; i < received.length - readPadLen; i++) S.set('b' + i, { style: 'new' });
    for (i = received.length - readPadLen; i < received.length; i++) S.set('b' + i, { style: 'dim' });
    S.step(T('`unpad` — tüm kontroller geçti: orijinal `' + n + '` bayt geri verildi.',
              '`unpad` — every check passes: the original `' + n + '` bytes are returned.'), { py: lines });
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'pkcs7-padding',
    title: T('PKCS#7 dolgu: ekleme ve denetim (pkcs7.py)', 'PKCS#7 padding: adding it and checking it (pkcs7.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-ok', level: 'normal', name: T('Uyar: dolgu doğru, kabul edilir', 'Fits: correct padding, accepted'), data: mk('SecretMessage01', 'none') },
      { id: 'hard-lastbyte', level: 'hard', name: T('Zor: son bayt bozuldu (aralık dışı)', 'Hard: last byte corrupted (out of range)'), data: mk('LongerSecretPayload', 'lastbyte') },
      { id: 'edge-length', level: 'edge', name: T('Uç durum: uzunluk artık blok katı değil', 'Edge case: length is no longer a block multiple'), data: mk('TruncatedMessage1', 'length') },
      { id: 'edge-midbyte', level: 'edge', name: T('Uç durum: bir dolgu baytı bozuldu', 'Edge case: one padding byte corrupted'), data: mk('MidByteCorruption', 'midbyte') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.text.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 16], extreme: [14, 20] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var kinds = level === 'easy' ? ['none', 'none', 'lastbyte'] : ['none', 'lastbyte', 'length', 'midbyte'];
      var kind = kinds[D.randInt(r, 0, kinds.length - 1)];
      // midbyte needs pad_len >= 2 to touch a byte distinct from the last one
      if (kind === 'midbyte' && (BLOCK - (len % BLOCK)) < 2) kind = 'lastbyte';
      return mk(randomWord(r, len), kind);
    },
    input: {
      hint: T('metin|bozulma (bozulma: none/lastbyte/length/midbyte)', 'text|corruption (corruption: none/lastbyte/length/midbyte)'),
      format: function (data) { return data.text + '|' + data.corruption; },
      tokens: function (data) { return data.text.split(''); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: metin|bozulma olmalı.', 'Format must be text|corruption.');
        var s = parts[0], kind = parts[1].trim().toLowerCase();
        if (!/^[A-Za-z0-9]+$/.test(s)) throw T('Metin yalnızca harf ve rakam içerebilir.', 'The text may only contain letters and digits.');
        if (s.length > 24) throw T('En fazla 24 karakter.', 'At most 24 characters.');
        if (['none', 'lastbyte', 'length', 'midbyte'].indexOf(kind) < 0) throw T('Bozulma none, lastbyte, length ya da midbyte olmalı.', 'Corruption must be none, lastbyte, length, or midbyte.');
        if (kind === 'midbyte' && (BLOCK - (s.length % BLOCK)) < 2) throw T('midbyte için pad_len >= 2 gerekir; metin uzunluğunu değiştirin.', 'midbyte needs pad_len >= 2; change the text length.');
        return mk(s, kind);
      },
      bad: ['', 'ONLYONE', 'has space|none', 'ABC|maybe', 'ABCDEFG|midbyte']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
