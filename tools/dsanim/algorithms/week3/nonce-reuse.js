// CEN429 — Week 3 — Demo 2 (code/week-03/02-nonce-reuse/nonce_reuse.c)
// AES-GCM encrypts by XORing the plaintext with a keystream built from the key and the nonce:
// C = P XOR AA(key, nonce). If the SAME nonce encrypts two DIFFERENT messages, both use the SAME
// keystream, so C1 XOR C2 = P1 XOR P2 — the keystream cancels out and leaks the XOR of the two
// plaintexts. This animation uses a small, deterministic stand-in keystream (a function of the nonce
// and the byte position only — never a real key) so the leak can be computed and checked exactly the
// same way the real AES-GCM keystream would leak: identical nonce -> identical keystream -> the XOR
// relation holds; different nonce -> it does not. The real cipher (AES-GCM) is shown in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 2: the danger of reusing a nonce (IV)',
    ' *',
    ' * AES-GCM provides confidentiality through a "counter mode" (CTR) stream: a',
    ' * keystream is generated from the key and the nonce and XORed with the',
    ' * plaintext:  C = P XOR AA(key, nonce)',
    ' *',
    ' * If the SAME key + SAME nonce encrypts two DIFFERENT messages, both',
    ' * messages use the SAME keystream. Then:',
    ' *     C1 XOR C2 = (P1 XOR AA) XOR (P2 XOR AA) = P1 XOR P2',
    ' * The keystream cancels out; an attacker recovers the XOR of the two',
    ' * plaintexts. If the attacker knows one message, the other is fully',
    ' * recovered. (In GCM, reusing a nonce also completely breaks authentication.)',
    ' */',
    '#include "cen429_demo.h"',
    '#include "cen429_crypto.h"',
    '#define NONCE_LEN 12',
    '',
    'static void xor_bytes(const unsigned char *a, const unsigned char *b,',
    '                      unsigned char *out, int len)',
    '{',
    '    for (int i = 0; i < len; i++)',
    '        out[i] = (unsigned char)(a[i] ^ b[i]);',
    '}',
    '',
    'int main(void)',
    '{',
    '    /* --- BAD: the same nonce for both messages --- */',
    '    unsigned char nonce_same[NONCE_LEN];',
    '    memset(nonce_same, 0x00, NONCE_LEN);',
    '    crypto_gcm_encrypt(key, nonce_same, NONCE_LEN, NULL, 0, p1,',
    '                       (size_t)len, c1, tag);',
    '    crypto_gcm_encrypt(key, nonce_same, NONCE_LEN, NULL, 0, p2,',
    '                       (size_t)len, c2, tag);',
    '    xor_bytes(c1, c2, cxor, len);',
    '',
    '    if (memcmp(cxor, pxor, len) == 0)',
    '        printf("  ==> C1 xor C2 == P1 xor P2 : the keystream LEAKED!\\n");',
    '    else',
    '        printf("  ==> not equal\\n");',
    '',
    '    /* If the attacker knows P1: P2 = (C1 xor C2) xor P1. */',
    '    unsigned char p2_recovered[64];',
    '    xor_bytes(cxor, p1, p2_recovered, len);',
    '',
    '    /* --- GOOD: a different nonce for each message --- */',
    '    unsigned char nonce_a[NONCE_LEN], nonce_b[NONCE_LEN];',
    '    memset(nonce_a, 0x00, NONCE_LEN);',
    '    memset(nonce_b, 0x00, NONCE_LEN);',
    '    nonce_b[NONCE_LEN - 1] = 0x01;                /* a different nonce */',
    '    crypto_gcm_encrypt(key, nonce_a, NONCE_LEN, NULL, 0, p1,',
    '                       (size_t)len, c1, tag);',
    '    crypto_gcm_encrypt(key, nonce_b, NONCE_LEN, NULL, 0, p2,',
    '                       (size_t)len, c2, tag);',
    '    xor_bytes(c1, c2, cxor, len);',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ toy keystream (illustration only)
  // A deterministic function of (nonce, position) ONLY — no key modelled at all, since the lesson is
  // about the nonce, not the key. Same nonce at the same position ALWAYS gives the same keystream byte,
  // exactly the property that makes real AES-GCM leak under nonce reuse.
  function ksByte(nonce, i) {
    var x = ((nonce ^ 0x9e3779b9) + i * 0x85ebca6b) >>> 0;
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0; x ^= x >>> 16;
    return x & 0xff;
  }
  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
  function encryptToy(msg, nonce) { return toBytes(msg).map(function (c, i) { return c ^ ksByte(nonce, i); }); }
  function xorArr(a, b) { return a.map(function (v, i) { return v ^ b[i]; }); }
  function sameArr(a, b) { return a.length === b.length && a.every(function (v, i) { return v === b[i]; }); }
  function bytesToText(b) { return b.map(function (c) { return (c >= 32 && c < 127) ? String.fromCharCode(c) : '.'; }).join(''); }

  function mk(p1, p2, sameNonce) { return { p1: p1, p2: p2, sameNonce: !!sameNonce }; }

  /** Independent computation: derived algebraically, NOT by re-running the toy cipher (encryptToy/
   * ksByte are build()'s own helpers; calling them here would let a bug in the toy keystream hide
   * from both sides at once). When both messages use the SAME nonce, they are XORed with the SAME
   * keystream byte at every position, so C1 xor C2 == P1 xor P2 for ANY deterministic keystream —
   * that is just XOR algebra, (a xor k) xor (b xor k) == a xor b, true regardless of what k is. So
   * "leaked" follows directly from the sameNonce flag, and when it holds, the recovered P2 is
   * provably P2 itself: (C1 xor C2) xor P1 == (P1 xor P2) xor P1 == P2. */
  function reference(data) {
    var leaked = data.sameNonce;
    return { leaked: leaked, recoveredP2: leaked ? data.p2 : null };
  }

  function hexRow(S, prefix, y, bytes) {
    var cells = bytes.map(function (v) { return { value: v }; });
    return S.memRow(prefix, cells, { x: 0, y: y, w: 26, h: 32, size: 12, gap: 2, addrs: false });
  }

  function build(S, data) {
    var p1 = data.p1, p2 = data.p2, n = p1.length;
    var CW = 26, GAP = 2;
    // Three columns (P1/P2, then C1/C2, then the two XORs + recovery), not one tall stack of 7 rows —
    // dsanim's still-frame export is always forced to a fixed WIDTH, so a tall single column blows up the
    // exported image's height. Side by side keeps each pair (input/output/comparison) visually grouped
    // while keeping the overall picture landscape-shaped.
    // +100 (not +46): the "C1 =" / "C2 =" / "C1 xor C2 =" labels are right-aligned INTO the gap between
    // columns, so the gap must be wide enough for that label text to clear the previous column's last
    // byte box — a narrow gap here made the label text overlap the neighboring column's boxes.
    var COLW = n * (CW + GAP) + 100, X0 = 0, X1 = COLW, X2 = 2 * COLW;
    var ROW0 = 0, ROW1 = 44, ROW2 = 88;

    S.label('p1lbl', { x: X0 - 14, y: 22, text: 'P1 =', anchor: 'end', size: 14, mono: true });
    S.label('p2lbl', { x: X0 - 14, y: 66, text: 'P2 =', anchor: 'end', size: 14, mono: true });
    for (var i = 0; i < n; i++) {
      S.box('p1_' + i, { x: X0 + i * (CW + GAP), y: ROW0, w: CW, h: 30, size: 13, text: p1[i], style: 'normal' });
      S.box('p2_' + i, { x: X0 + i * (CW + GAP), y: ROW1, w: CW, h: 30, size: 13, text: p2[i], style: 'normal' });
    }
    S.step(T('İki düz metin, eşit uzunlukta (' + n + ' bayt): `P1` ve `P2`.',
              'Two plaintexts, equal length (' + n + ' bytes): `P1` and `P2`.'),
           { c: [] });

    var nonce1 = 0, nonce2 = data.sameNonce ? 0 : 1;
    S.label('nonceLbl', { x: X0 + n * (CW + GAP) / 2, y: -18,
      text: data.sameNonce ? T('AYNI nonce her ikisinde de: 0x00...00', 'the SAME nonce for both: 0x00...00')
                            : T('FARKLI nonce: P1 -> 0x00...00, P2 -> 0x00...01', 'DIFFERENT nonces: P1 -> 0x00...00, P2 -> 0x00...01'),
      anchor: 'middle', size: 13, bold: true, style: data.sameNonce ? 'del' : 'new' });
    S.step(T(data.sameNonce ? 'Kötü durum: her iki mesaj da AYNI nonce ile şifrelenecek.' : 'İyi durum: her mesaj FARKLI bir nonce ile şifrelenecek.',
              data.sameNonce ? 'Bad case: both messages will be encrypted with the SAME nonce.' : 'Good case: each message gets a DIFFERENT nonce.'),
           { c: [29, 30] });

    var c1 = encryptToy(p1, nonce1), c2 = encryptToy(p2, nonce2);
    hexRow(S, 'c1_', ROW0, c1);
    for (i = 0; i < n; i++) S.set('c1_' + i, { x: X1 + i * (CW + GAP), y: ROW0 });
    S.label('c1lbl', { x: X1 - 14, y: 22, text: 'C1 =', anchor: 'end', size: 14, mono: true });
    S.step(T('`crypto_gcm_encrypt(key, nonce' + (data.sameNonce ? '_same' : '_a') + ', ...)` — `C1` hesaplandı.',
              '`crypto_gcm_encrypt(key, nonce' + (data.sameNonce ? '_same' : '_a') + ', ...)` — `C1` computed.'),
           { c: [31, 32] });

    hexRow(S, 'c2_', ROW1, c2);
    for (i = 0; i < n; i++) S.set('c2_' + i, { x: X1 + i * (CW + GAP), y: ROW1 });
    S.label('c2lbl', { x: X1 - 14, y: 66, text: 'C2 =', anchor: 'end', size: 14, mono: true });
    S.step(T('`crypto_gcm_encrypt(key, nonce' + (data.sameNonce ? '_same' : '_b') + ', ...)` — `C2` hesaplandı.',
              '`crypto_gcm_encrypt(key, nonce' + (data.sameNonce ? '_same' : '_b') + ', ...)` — `C2` computed.'),
           { c: [33, 34] });

    var cxor = xorArr(c1, c2), pxor = xorArr(toBytes(p1), toBytes(p2));
    hexRow(S, 'cx_', ROW0, cxor);
    for (i = 0; i < n; i++) S.set('cx_' + i, { x: X2 + i * (CW + GAP), y: ROW0 });
    S.label('cxlbl', { x: X2 - 14, y: 22, text: 'C1 xor C2 =', anchor: 'end', size: 13, mono: true });
    S.step(T('`xor_bytes(c1, c2, cxor, len)` — şifreli metinlerin XOR\'u hesaplandı.',
              '`xor_bytes(c1, c2, cxor, len)` — the XOR of the ciphertexts is computed.'),
           { c: [35, 19, 20, { n: 22, note: T('i < len? EVET, ' + n + ' bayt için yineleniyor', 'i < len? YES, iterating over ' + n + ' bytes') }, 23] });

    hexRow(S, 'px_', ROW1, pxor);
    for (i = 0; i < n; i++) S.set('px_' + i, { x: X2 + i * (CW + GAP), y: ROW1 });
    S.label('pxlbl', { x: X2 - 14, y: 66, text: 'P1 xor P2 =', anchor: 'end', size: 13, mono: true });
    var leaked = sameArr(cxor, pxor);
    for (var k = 0; k < n; k++) { S.set('cx_' + k, { style: leaked ? 'del' : 'new' }); S.set('px_' + k, { style: leaked ? 'del' : 'new' }); }
    S.result = reference(data);
    S.step(leaked
      ? T('`C1 xor C2 == P1 xor P2` — anahtar akışı birbirini GÖTÜRDÜ: bu, düz metinlerin XOR\'unu SIZDIRIR!',
          '`C1 xor C2 == P1 xor P2` — the keystream CANCELS OUT: this LEAKS the XOR of the plaintexts!')
      : T('`C1 xor C2 != P1 xor P2` — farklı nonce farklı anahtar akışı verdi, hiçbir ilişki kalmadı: sızıntı YOK.',
          '`C1 xor C2 != P1 xor P2` — different nonces gave different keystreams, no relation survives: no leak.'),
      leaked
        ? { c: [{ n: 37, note: T('memcmp(cxor, pxor, len) == 0? EVET -> sızdı', 'memcmp(cxor, pxor, len) == 0? YES -> leaked') }, 38, { n: 40, skip: true }] }
        : { c: [{ n: 37, note: T('memcmp(cxor, pxor, len) == 0? HAYIR -> sızmadı', 'memcmp(cxor, pxor, len) == 0? NO -> no leak') }, { n: 38, skip: true }, 40] });

    if (leaked) {
      var recBytes = xorArr(cxor, toBytes(p1));
      for (i = 0; i < n; i++) S.box('rec_' + i, { x: X2 + i * (CW + GAP), y: ROW2, w: CW, h: 30, size: 13, text: bytesToText([recBytes[i]]), style: 'new' });
      S.label('reclbl', { x: X2 - 14, y: 110, text: T('kurtarılan P2 =', 'recovered P2 ='), anchor: 'end', size: 13, mono: true });
      S.step(T('Saldırgan `P1`\'i biliyorsa: `P2 = (C1 xor C2) xor P1` — `P2`\'yi HİÇ anahtar olmadan tamamen kurtarır.',
                'If the attacker knows `P1`: `P2 = (C1 xor C2) xor P1` — fully recovers `P2` with NO key at all.'),
             { c: [43, 44] });
    }
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'nonce-reuse',
    title: T('Nonce tekrarının tehlikesi (nonce_reuse.c)', 'The danger of nonce reuse (nonce_reuse.c)'),
    code: function () { return { c: SRC }; },
    presets: [
      { id: 'normal-leak', level: 'normal', name: T('Uyar: aynı nonce, sızıntı var', 'Fits: same nonce, there is a leak'), data: mk('ATTACK_AT_DAWN', 'SEND_100K_USDX', true) },
      { id: 'hard-long', level: 'hard', name: T('Zor: aynı nonce, daha uzun mesajlar', 'Hard: same nonce, longer messages'), data: mk('THE_VAULT_OPENS_AT_0600H', 'WIRE_450000_TO_ACCT_9182', true) },
      { id: 'edge-diff-nonce', level: 'edge', name: T('Uç durum: farklı nonce, sızıntı YOK', 'Edge case: different nonces, NO leak'), data: mk('ATTACK_AT_DAWN', 'SEND_100K_USDX', false) },
      { id: 'edge-identical', level: 'edge', name: T('Uç durum: iki mesaj da aynı', 'Edge case: both messages identical'), data: mk('REPEAT_PASSWORD1', 'REPEAT_PASSWORD1', true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.p1.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 16], extreme: [14, 16] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var same = D.randInt(r, 0, 3) !== 0;   // mostly "same nonce" (the lesson), occasionally the good case
      return mk(randomWord(r, len), randomWord(r, len), same);
    },
    input: {
      hint: T('P1|P2|AYNI ya da P1|P2|FARKLI (eşit uzunlukta, A-Z 0-9 _)', 'P1|P2|SAME or P1|P2|DIFF (equal length, A-Z 0-9 _)'),
      format: function (data) { return data.p1 + '|' + data.p2 + '|' + (data.sameNonce ? 'SAME' : 'DIFF'); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 3) throw T('Biçim: P1|P2|AYNI ya da P1|P2|FARKLI olmalı.', 'Format must be P1|P2|SAME or P1|P2|DIFF.');
        var p1 = parts[0], p2 = parts[1], tag = parts[2].trim().toUpperCase();
        if (!/^[A-Z0-9_]+$/.test(p1) || !/^[A-Z0-9_]+$/.test(p2)) throw T('P1 ve P2 yalnızca A-Z, 0-9, _ içerebilir.', 'P1 and P2 may only contain A-Z, 0-9, _.');
        if (p1.length !== p2.length) throw T('P1 ve P2 eşit uzunlukta olmalı.', 'P1 and P2 must be equal length.');
        if (p1.length > 24) throw T('En fazla 24 karakter (gösterim için).', 'At most 24 characters (for display).');
        if (tag !== 'SAME' && tag !== 'FARKLI' && tag !== 'DIFF') throw T('Üçüncü alan AYNI ya da FARKLI olmalı.', 'The third field must be SAME or DIFF.');
        return mk(p1, p2, tag === 'SAME');
      },
      bad: ['', 'ONLYONE', 'ABC|AB|SAME', 'has space|abc|SAME', 'ABC|abc|MAYBE']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
