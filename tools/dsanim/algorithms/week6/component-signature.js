// CEN429 — Week 6 — Demo 6 (code/week-06/06-component-signature/signature.c)
// Before a "plugin module" is loaded, its detached signature (a digest of the module bytes — a simplified
// stand-in for the real HMAC-SHA-256 in signature.c) is recomputed and compared with the one saved when the
// module was built. If the module was repackaged (even one byte appended or changed), the digest no longer
// matches and loading is refused — the same idea Android uses to verify an APK's signature.
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
    'unsigned char mac[32];',
    'crypto_hmac_sha256(SIGNING_KEY, sizeof(SIGNING_KEY), data, size, mac);',
    '',
    'unsigned char diff = 0;',
    'for (int i = 0; i < 32; i++)',
    '    diff |= (unsigned char)(expected[i] ^ mac[i]);',
    'if (diff == 0)',
    '    printf("Module signature HELD -> safe to load.\\n");',
    'else {',
    '    printf("Module signature DID NOT HOLD -> REPACKAGED/modified.\\n");',
    '    printf("Loading REJECTED.\\n");',
    '}'
  ];

  /** The FNV-1a-style fold, front to back — this is the mechanism itself (build() below performs the same
   * steps, one at a time, to animate them). */
  function digest(bytes) {
    return bytes.reduce(function (acc, b) {
      return Math.imul((acc ^ b) >>> 0, 0x01000193) >>> 0;
    }, 0x811c9dc5 >>> 0);
  }

  function mk(bytes, tamper) { return { bytes: bytes.slice(), tamper: (tamper === undefined || tamper === null) ? null : tamper.slice() }; }

  /** Independent computation: does NOT recompute the digest at all (that arithmetic is exactly what
   * build() animates step by step). Instead it checks the SEMANTIC precondition the mechanism relies on —
   * the signature can only hold when the loaded bytes are byte-for-byte identical to the signed bytes,
   * same length included — the same way flow-counter.js's reference() checks sequence equality instead of
   * re-deriving a hash chain. */
  function reference(data) {
    var loaded = data.tamper === null ? data.bytes : data.tamper;
    var holds = loaded.length === data.bytes.length && loaded.every(function (b, i) { return b === data.bytes[i]; });
    return { holds: holds };
  }

  function build(S, data) {
    var bytes = data.bytes, n = bytes.length;
    var W = 30, GAP = 3;
    S.label('modLbl', { x: -14, y: 20, text: T('modül baytları =', 'module bytes ='), anchor: 'end', size: 14, mono: true });
    var ids = S.memRow('m', bytes.map(function (b) { return { value: b }; }), { x: 0, y: 0, w: W, h: 32, gap: GAP, addrs: false });
    for (var i = 0; i < n; i++) S.set(ids[i], { above: String(i) });

    S.box('sig', { x: 0, y: 90, w: 150, h: 32, size: 14, text: '00000000', style: 'active' });
    S.label('sigLbl', { x: -14, y: 110, text: T('imza (özet) =', 'signature (digest) ='), anchor: 'end', size: 14, mono: true });
    S.step(T('Üretim zamanı: modülün ' + n + ' baytı imzalanıyor (özet çıkarılıyor).', 'Build time: the module\'s ' + n + ' bytes are signed (digested).'), { c: [1, 2] });
    var golden = 0x811c9dc5 >>> 0;
    for (i = 0; i < n; i++) {
      golden = Math.imul((golden ^ bytes[i]) >>> 0, 0x01000193) >>> 0;
      S.set(ids[i], { style: 'hl' }); S.set('sig', { text: hex32(golden) }); S.at(i);
      if (i < 3) S.step(T('bayt ' + i + ' = 0x' + D.hex(bytes[i], 2) + ' katlanıyor -> imza = 0x' + hex32(golden), 'byte ' + i + ' = 0x' + D.hex(bytes[i], 2) + ' folded in -> signature = 0x' + hex32(golden)), { c: [1] });
      S.set(ids[i], { style: 'new' });
    }
    S.at(null);
    S.box('golden', { x: 170, y: 90, w: 130, h: 32, size: 13, text: hex32(golden), style: 'new' });
    S.label('goldenLbl', { x: 235, y: 78, text: T('module.sig kaydedildi', 'module.sig saved'), anchor: 'middle', size: 12, bold: true });
    S.step(T('İmza kaydedildi: 0x' + hex32(golden) + ' -> module.sig', 'The signature was saved: 0x' + hex32(golden) + ' -> module.sig'), {});

    var loaded = data.tamper === null ? bytes : data.tamper;
    if (data.tamper !== null) {
      S.styleAll('dim', 'box');
      S.remove.apply(S, ids);
      var ids2 = S.memRow('m', loaded.map(function (b) { return { value: b }; }), { x: 0, y: 0, w: W, h: 32, gap: GAP, addrs: false });
      for (i = 0; i < loaded.length; i++) S.set(ids2[i], { above: String(i), style: i < bytes.length && loaded[i] === bytes[i] ? 'normal' : 'del' });
      S.step(T('Saldırı: modül YENİDEN PAKETLENDİ (' + bytes.length + ' -> ' + loaded.length + ' bayt).', 'Attack: the module was REPACKAGED (' + bytes.length + ' -> ' + loaded.length + ' bytes).'), {});
    } else {
      S.step(T('Yükleme öncesi doğrulama: modül değişmedi, aynı ' + n + ' bayt yeniden okunuyor.', 'Verify before loading: the module is unchanged, the same ' + n + ' bytes are read again.'), {});
    }
    var actual = digest(loaded);
    S.box('actual', { x: 170, y: 140, w: 130, h: 32, size: 13, text: hex32(actual), style: golden === actual ? 'new' : 'del' });
    S.label('actualLbl', { x: 235, y: 128, text: T('hesaplanan', 'computed'), anchor: 'middle', size: 12 });
    S.step(T('Yeniden hesaplanan imza: 0x' + hex32(actual) + '.', 'The recomputed signature: 0x' + hex32(actual) + '.'), { c: [1] });

    var holds = golden === actual;
    S.result = { holds: holds };
    if (holds) {
      S.step(T('0x' + hex32(golden) + ' == 0x' + hex32(actual) + ' -> imza TUTTU, güvenle yüklenebilir.', '0x' + hex32(golden) + ' == 0x' + hex32(actual) + ' -> the signature HELD, safe to load.'),
             { c: [4, { n: 5, note: T('i = 0..31 döngüsü tamamlandı', 'the i = 0..31 loop completed') }, 6,
                    { n: 7, note: T('diff == 0? evet', 'diff == 0? yes') }, 8,
                    { n: 9, skip: true }, { n: 10, skip: true }, { n: 11, skip: true }] });
    } else {
      S.step(T('0x' + hex32(golden) + ' != 0x' + hex32(actual) + ' -> imza TUTMADI, yükleme REDDEDİLDİ.', '0x' + hex32(golden) + ' != 0x' + hex32(actual) + ' -> the signature DID NOT HOLD, loading REJECTED.'),
             { c: [4, { n: 5, note: T('i = 0..31 döngüsü tamamlandı', 'the i = 0..31 loop completed') }, 6,
                    { n: 7, note: T('diff == 0? hayır', 'diff == 0? no') }, { n: 8, skip: true }, 9, 10, 11] });
    }
  }

  D.define({
    id: 'component-signature',
    title: T('Bileşen imzası doğrulama: repackaging yakalama (signature.c)', 'Component signature verification: catching repackaging (signature.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'holds', level: 'normal', name: T('Normal: modül değişmedi, imza tutuyor', 'Normal: module unchanged, signature holds'),
        data: mk([0x56, 0x45, 0x52, 0x53, 0x49, 0x4f, 0x4e, 0x3d, 0x31, 0x2e, 0x30], null) },
      { id: 'appended-byte', level: 'hard', name: T('Zor: sona bir bayt eklendi (repackaging)', 'Hard: one byte appended at the end (repackaging)'),
        data: mk([0x50, 0x41, 0x59, 0x4d, 0x45, 0x4e, 0x54, 0x2d, 0x4d, 0x4f, 0x44, 0x55, 0x4c, 0x45], [0x50, 0x41, 0x59, 0x4d, 0x45, 0x4e, 0x54, 0x2d, 0x4d, 0x4f, 0x44, 0x55, 0x4c, 0x45, 0x58]) },
      { id: 'edge-min-size-changed-byte', level: 'edge', name: T('Uç durum: tam olarak 10 bayt, ortadaki bir bayt değişti', 'Edge case: exactly 10 bytes, one middle byte changed'),
        data: mk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 99, 6, 7, 8, 9, 10]) },
      { id: 'edge-truncated', level: 'edge', name: T('Uç durum: modül KISALTILDI (son bayt silindi)', 'Edge case: the module was TRUNCATED (the last byte removed)'),
        data: mk([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110], [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.bytes.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 11], normal: [10, 12], hard: [12, 14], extreme: [13, 16] };
      var rg = ranges[level] || ranges.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var bytes = [];
      for (var i = 0; i < n; i++) bytes.push(D.randInt(r, 0, 255));
      var tampered = D.randInt(r, 0, 1) === 1;
      var tamper = null;
      if (tampered) {
        tamper = bytes.slice();
        var kind = D.randInt(r, 0, 2);
        if (kind === 0) tamper[D.randInt(r, 0, n - 1)] ^= 0xFF;          // flip one byte
        else if (kind === 1) tamper.push(D.randInt(r, 0, 255));          // append a byte
        else tamper.pop();                                               // truncate
      }
      return mk(bytes, tamper);
    },
    input: {
      hint: T('onaltılık baytlar (isteğe bağlı sonda: TAMPER=b1,b2,…)', 'hex bytes (optionally end with: TAMPER=b1,b2,…)'),
      format: function (data) {
        var s = data.bytes.map(function (b) { return D.hex(b, 2); }).join(' ');
        return data.tamper === null ? s : s + ' TAMPER=' + data.tamper.map(function (b) { return D.hex(b, 2); }).join(',');
      },
      tokens: function (data) { return data.bytes.map(function (b) { return D.hex(b, 2); }); },
      parse: function (text) {
        var s = String(text).trim();
        var tamper = null;
        var m = s.match(/\s+TAMPER=([0-9a-fA-F,]+)\s*$/i);
        if (m) { tamper = m[1].split(',').map(function (h) { return parseInt(h, 16); }); s = s.slice(0, m.index); }
        var toks = s.split(/\s+/).filter(Boolean);
        if (!toks.length) throw T('En az bir bayt girin.', 'Enter at least one byte.');
        var bytes = [];
        for (var i = 0; i < toks.length; i++) {
          if (!/^[0-9a-fA-F]{1,2}$/.test(toks[i])) throw T('"' + toks[i] + '" geçerli bir onaltılık bayt değil.', '"' + toks[i] + '" is not a valid hex byte.');
          bytes.push(parseInt(toks[i], 16));
        }
        if (tamper) for (var j = 0; j < tamper.length; j++) if (!(tamper[j] >= 0 && tamper[j] <= 255)) throw T('TAMPER baytları 00-ff aralığında olmalı.', 'TAMPER bytes must be in the range 00-ff.');
        return mk(bytes, tamper);
      },
      bad: ['', 'zz', '1 2 TAMPER=', '100 200', '1 2 TAMPER=zz']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
