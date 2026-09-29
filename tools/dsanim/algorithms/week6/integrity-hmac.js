// CEN429 — Week 6 — Demo 1 (code/week-06/01-integrity-hmac/integrity.c)
// The program folds every byte of a target file into a running digest (a simplified stand-in for the real
// HMAC-SHA-256 the C code uses — enough rounds of real SHA-256 to animate honestly would take hundreds of
// steps; this keeps the SHAPE of the mechanism: one accumulator, one byte at a time, order-sensitive). The
// build-time "golden" digest is saved; at verify time the file is re-read and re-digested. If even one byte
// was patched, the digest comes out different and the mismatch is caught.
(function (D) {
  'use strict';
  var T = D.T;
  // D.hex(n, 8) has a known bug for values with bit 31 set (it goes through a signed 32-bit AND
  // internally and can print a leading '-'); this local helper formats a full unsigned 32-bit value
  // safely and is used instead of D.hex(..., 8) throughout this file. D.hex(..., 2) for single bytes
  // is unaffected (values 0-255 never trip the bug) and is still used as-is.
  function hex32(n) {
    var s = (n >>> 0).toString(16).toUpperCase();
    while (s.length < 8) s = '0' + s;
    return s;
  }


  var C = [
    'static int target_hmac(const char *target, unsigned char digest[32],',
    '                        char *path_out, size_t path_size)',
    '{',
    '    /* ... read the whole target file into `data` (read_file) ... */',
    '    int ok = crypto_hmac_sha256(RASP_KEY, sizeof(RASP_KEY), data, size, digest);',
    '    return ok;',
    '}',
    '',
    '/* verify: constant-time compare, avoids a timing leak */',
    'unsigned char diff = 0;',
    'for (int i = 0; i < 32; i++)',
    '    diff |= (unsigned char)(expected[i] ^ digest[i]);',
    'if (diff == 0)',
    '    printf("RESULT: INTEGRITY OK - target unchanged.\\n");',
    'else',
    '    printf("RESULT: PATCH DETECTED - target was modified! (tamper)\\n");'
  ];

  /** Independent expression of the SAME fold (used only by reference(), never by build()):
   * (acc<<5)+acc+byte, algebraically acc*33+byte, but written as shifts+add instead of a multiply. */
  function digestRef(bytes) {
    var acc = 5381 >>> 0;
    for (var i = 0; i < bytes.length; i++) {
      var shifted = ((acc << 5) >>> 0);
      acc = ((shifted + acc + bytes[i]) >>> 0);
    }
    return acc;
  }

  function mk(bytes, patchOffset) { return { bytes: bytes.slice(), patchOffset: patchOffset === undefined ? null : patchOffset }; }

  function reference(data) {
    var golden = digestRef(data.bytes);
    var verifyBytes = data.bytes.slice();
    if (data.patchOffset !== null) verifyBytes[data.patchOffset] = verifyBytes[data.patchOffset] ^ 0xFF;
    var verified = digestRef(verifyBytes);
    return { golden: hex32(golden), verified: hex32(verified), match: golden === verified };
  }

  function foldSteps(S, bytes, accId, rowPrefix, phase) {
    var acc = 5381 >>> 0;
    for (var i = 0; i < bytes.length; i++) {
      acc = ((Math.imul(acc, 33) + bytes[i]) >>> 0);
      S.set(rowPrefix + i, { style: 'hl' });
      S.set(accId, { text: hex32(acc) });
      S.at(i);
      var detailed = phase === 'golden' && i < 4;
      if (detailed) {
        S.step(T('bayt ' + (i + 1) + '/' + bytes.length + ' = 0x' + D.hex(bytes[i], 2) + ' katlanıyor: acc = acc*33 + bayt = 0x' + hex32(acc),
                  'byte ' + (i + 1) + '/' + bytes.length + ' = 0x' + D.hex(bytes[i], 2) + ' folded in: acc = acc*33 + byte = 0x' + hex32(acc)),
               { c: [4] });
      } else {
        S.step(T((phase === 'golden' ? 'altın özet' : 'yeniden hesapla') + ': bayt ' + (i + 1) + ' -> acc = 0x' + hex32(acc),
                  (phase === 'golden' ? 'golden digest' : 'recompute') + ': byte ' + (i + 1) + ' -> acc = 0x' + hex32(acc)),
               { c: [4] });
      }
      S.set(rowPrefix + i, { style: 'new' });
    }
    S.at(null);
    return acc;
  }

  function build(S, data) {
    var bytes = data.bytes, n = bytes.length;
    var W = 34, GAP = 3;
    S.label('srcLbl', { x: -14, y: 15, text: T('kod baytları =', 'code bytes ='), anchor: 'end', size: 14, mono: true });
    var src = S.memRow('s', bytes.map(function (b) { return { value: b }; }), { x: 0, y: 0, w: W, h: 32, gap: GAP, addrs: false });
    for (var i = 0; i < n; i++) S.set(src[i], { above: String(i) });

    S.label('accLbl', { x: -14, y: 95, text: T('özet (acc) =', 'digest (acc) ='), anchor: 'end', size: 14, mono: true });
    S.box('acc', { x: 0, y: 80, w: 140, h: 32, size: 15, text: '00000000', style: 'active' });

    S.step(T('Derleme zamanı: hedefin ' + n + ' baytı sırayla bir özet biriktiricisine (acc) katlanıyor.',
              'Build time: the target\'s ' + n + ' bytes are folded, in order, into a digest accumulator (acc).'),
           { c: [1, 5] });
    var golden = foldSteps(S, bytes, 'acc', 's', 'golden');
    S.box('golden', { x: 160, y: 80, w: 140, h: 32, size: 14, text: hex32(golden), style: 'new' });
    S.label('goldenLbl', { x: 230, y: 68, text: T('altın değer kaydedildi', 'golden value saved'), anchor: 'middle', size: 13, bold: true });
    S.step(T('Altın özet dosyaya yazılır: 0x' + hex32(golden) + '.', 'The golden digest is written to a file: 0x' + hex32(golden) + '.'), { c: [4] });

    // ---- verify pass: possibly patched ----
    var verifyBytes = bytes.slice();
    if (data.patchOffset !== null) {
      verifyBytes[data.patchOffset] = verifyBytes[data.patchOffset] ^ 0xFF;
      S.set(src[data.patchOffset], { value: undefined, text: D.hex(verifyBytes[data.patchOffset], 2), style: 'del', above: String(data.patchOffset) + '!' });
      S.step(T('Saldırı: bayt ' + data.patchOffset + ' (0x' + D.hex(bytes[data.patchOffset], 2) + ') 0x' + D.hex(verifyBytes[data.patchOffset], 2) + ' ile YAMALANDI.',
                'Attack: byte ' + data.patchOffset + ' (0x' + D.hex(bytes[data.patchOffset], 2) + ') was PATCHED to 0x' + D.hex(verifyBytes[data.patchOffset], 2) + '.'),
             {});
    } else {
      S.step(T('Doğrulama zamanı: hedef değişmedi, aynı ' + n + ' bayt yeniden okunuyor.',
                'Verify time: the target is unchanged, the same ' + n + ' bytes are read again.'), {});
    }
    S.set('acc', { text: '00000000' });
    var verified = foldSteps(S, verifyBytes, 'acc', 's', 'verify');
    S.box('verified', { x: 160, y: 130, w: 140, h: 32, size: 14, text: hex32(verified), style: data.patchOffset !== null ? 'del' : 'new' });
    S.label('verifiedLbl', { x: 230, y: 118, text: T('hesaplanan', 'computed'), anchor: 'middle', size: 13 });

    var match = golden === verified;
    S.result = { golden: hex32(golden), verified: hex32(verified), match: match };
    S.set('golden', { style: match ? 'new' : 'normal' });
    S.set('verified', { style: match ? 'new' : 'del' });
    if (match) {
      S.step(T('0x' + hex32(golden) + ' == 0x' + hex32(verified) + ' -> SONUÇ: BÜTÜNLÜK TAMAM.',
                '0x' + hex32(golden) + ' == 0x' + hex32(verified) + ' -> RESULT: INTEGRITY OK.'),
             { c: [10, { n: 11, note: T('i = 0..31 döngüsü tamamlandı', 'the i = 0..31 loop completed') }, 12,
                    { n: 13, note: T('diff == 0? evet', 'diff == 0? yes') }, 14, { n: 15, skip: true }, { n: 16, skip: true }] });
    } else {
      S.step(T('0x' + hex32(golden) + ' != 0x' + hex32(verified) + ' -> SONUÇ: YAMA ALGILANDI.',
                '0x' + hex32(golden) + ' != 0x' + hex32(verified) + ' -> RESULT: PATCH DETECTED.'),
             { c: [10, { n: 11, note: T('i = 0..31 döngüsü tamamlandı', 'the i = 0..31 loop completed') }, 12,
                    { n: 13, note: T('diff == 0? hayır', 'diff == 0? no') }, { n: 14, skip: true }, 15, 16] });
    }
  }

  D.define({
    id: 'integrity-hmac',
    title: T('Öz bütünlük denetimi: bir bayt yamalanınca (integrity.c)', 'Self-integrity check: when one byte is patched (integrity.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'clean', level: 'normal', name: T('Normal: yama yok, bütünlük tamam', 'Normal: no patch, integrity OK'),
        data: mk([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x90, 0x83, 0x04, 0x08], null) },
      { id: 'patched-mid', level: 'hard', name: T('Zor: ortadaki bir bayt yamalandı', 'Hard: a byte in the middle was patched'),
        data: mk([0x55, 0x48, 0x89, 0xe5, 0x48, 0x83, 0xec, 0x10, 0x89, 0x7d, 0xfc, 0x8b, 0x45, 0xfc], 6) },
      { id: 'edge-first-byte', level: 'edge',
        name: T('Uç durum: tam olarak 10 bayt, ilk bayt yamalandı', 'Edge case: exactly 10 bytes, the first byte is patched'),
        data: mk([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a], 0) },
      { id: 'edge-last-byte', level: 'edge',
        name: T('Uç durum: son bayt yamalandı', 'Edge case: the last byte is patched'),
        data: mk([0xde, 0xad, 0xbe, 0xef, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66], 10) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.bytes.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 11], normal: [10, 12], hard: [12, 14], extreme: [13, 16] };
      var rg = ranges[level] || ranges.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var bytes = [];
      for (var i = 0; i < n; i++) bytes.push(D.randInt(r, 0, 255));
      var patched = D.randInt(r, 0, 1) === 1;
      var offset = patched ? D.randInt(r, 0, n - 1) : null;
      return mk(bytes, offset);
    },
    input: {
      hint: T('onaltılık baytlar, boşlukla ayrılmış (isteğe bağlı sonda: PATCH=k)', 'hex bytes, space-separated (optionally end with: PATCH=k)'),
      format: function (data) {
        var s = data.bytes.map(function (b) { return D.hex(b, 2); }).join(' ');
        return data.patchOffset === null ? s : s + ' PATCH=' + data.patchOffset;
      },
      tokens: function (data) { return data.bytes.map(function (b) { return D.hex(b, 2); }); },
      parse: function (text) {
        var s = String(text).trim();
        var patchOffset = null;
        var m = s.match(/\s+PATCH=(\d+)\s*$/i);
        if (m) { patchOffset = parseInt(m[1], 10); s = s.slice(0, m.index); }
        var toks = s.split(/\s+/).filter(Boolean);
        if (!toks.length) throw T('En az bir bayt girin.', 'Enter at least one byte.');
        var bytes = [];
        for (var i = 0; i < toks.length; i++) {
          if (!/^[0-9a-fA-F]{1,2}$/.test(toks[i])) throw T('"' + toks[i] + '" geçerli bir onaltılık bayt değil.', '"' + toks[i] + '" is not a valid hex byte.');
          bytes.push(parseInt(toks[i], 16));
        }
        if (patchOffset !== null && (patchOffset < 0 || patchOffset >= bytes.length)) throw T('PATCH ofseti bayt sayısının içinde olmalı.', 'The PATCH offset must be within the byte count.');
        return mk(bytes, patchOffset);
      },
      bad: ['', 'zz', '1 2 PATCH=99', '100 200', '1'.repeat(2) + ' PATCH=-1']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
