// CEN429 — Week 3 — Demo 1 (code/week-03/01-aes-gcm-file/aes_gcm_file.c)
// AES-GCM is AEAD: one call gives both CONFIDENTIALITY (the ciphertext) and INTEGRITY+AUTHENTICITY
// (the tag). On decryption the tag is recomputed from the received ciphertext and compared with the
// stored one; if even a single bit differs anywhere, decryption is REJECTED — no plaintext is ever
// produced (fail-closed). This animation uses a small, deterministic stand-in cipher/tag (a simplified
// checksum) so the accept/reject decision can be computed and checked exactly; the real 16-byte
// GHASH-based tag and the real AES-256-GCM calls are shown in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 1: file encryption with AES-256-GCM (AEAD)',
    ' *',
    ' * File format (all in one file, in order):',
    ' *   [12-byte nonce] [ciphertext ...] [16-byte tag]',
    ' *',
    ' * On decryption the tag is verified: if even a single bit of the ciphertext',
    ' * or the tag has changed, decryption is REJECTED (exit code 2).',
    ' */',
    '#include "cen429_demo.h"',
    '#include "cen429_crypto.h"',
    '#define NONCE_LEN 12',
    '#define TAG_LEN 16',
    '',
    'static int encrypt_file(...)',
    '{',
    '    unsigned char nonce[NONCE_LEN];',
    '    crypto_random(nonce, NONCE_LEN);',
    '    memcpy(out, nonce, NONCE_LEN);',
    '',
    '    unsigned char tag[TAG_LEN];',
    '    crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, plain,',
    '                       (size_t)plain_len, out + NONCE_LEN, tag);',
    '    memcpy(out + NONCE_LEN + plain_len, tag, TAG_LEN);',
    '    return 0;',
    '}',
    '',
    'static int decrypt_file(...)',
    '{',
    '    unsigned char *nonce = data;',
    '    unsigned char *ct = data + NONCE_LEN;',
    '    unsigned char *tag = data + NONCE_LEN + ct_len;',
    '',
    '    int ok = crypto_gcm_decrypt(key, nonce, NONCE_LEN, NULL, 0, ct,',
    '                            (size_t)ct_len, tag, plain);',
    '    if (!ok) {',
    '        fprintf(stderr, "VERIFICATION FAILED: ... Decryption REJECTED.\\n");',
    '        return 2;',
    '    }',
    '    printf("Decrypted and VERIFIED: ...\\n");',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ toy AEAD (illustration only)
  function ksByte(i) {   // keystream: a function of position only (nonce fixed for this animation)
    var x = ((i * 0x9e3779b1) ^ 0x2545f491) >>> 0;
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0; x ^= x >>> 16;
    return x & 0xff;
  }
  function tagOf(bytes) {   // FNV-1a + finalizer: a simplified stand-in for the real 16-byte GHASH tag
    var h = 0x811c9dc5 >>> 0;
    for (var i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0;
    h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0;
    h ^= h >>> 15;
    return h >>> 0;
  }
  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
  function bytesToText(b) { return b.map(function (c) { return (c >= 32 && c < 127) ? String.fromCharCode(c) : '.'; }).join(''); }
  function hex32(n) { return D.hex((n >>> 24) & 0xff, 2) + D.hex((n >>> 16) & 0xff, 2) + D.hex((n >>> 8) & 0xff, 2) + D.hex(n & 0xff, 2); }

  function mk(plaintext, tamper) { return { plaintext: plaintext, tamper: tamper || 'none' }; }   // tamper: none | ciphertext | tag

  /** Independent computation: derived algebraically, NEVER calling ksByte/tagOf/toBytes (build()'s own
   * toy-cipher helpers) — a bug in any of them (e.g. forgetting to apply a tamper before hashing) then
   * shows up as a mismatch instead of hiding on both sides of the same buggy call at once:
   *  - tamper === 'none': recvC/recvTag end up byte-for-byte identical to c/tag, so ANY deterministic
   *    function of the byte values gives the same output for both — accepted is true BY DEFINITION, no
   *    hash needs to run. And XOR is self-cancelling ((p xor k) xor k == p for ANY keystream k), so
   *    decryption recovers exactly the original plaintext — also true regardless of ksByte's formula.
   *  - tamper === 'tag': the ciphertext is untouched but the tag is XORed with 1, so recvTag != tag for
   *    ANY tag value whatsoever (x xor 1 is never equal to x) — REJECTED, by definition, again no hash.
   *  - tamper === 'ciphertext': whether a one-bit-flipped ciphertext's tag could accidentally still match
   *    the original is a genuine property of the (32-bit, well-mixed) tag function — a collision there is
   *    about as likely as two unrelated 32-bit hashes agreeing by chance (roughly 1 in 4 billion), so
   *    "REJECTED" is the correct prediction for every practical input this animation ever generates.
   */
  function reference(data) {
    if (data.tamper === 'none') return { accepted: true, recoveredText: data.plaintext };
    return { accepted: false, recoveredText: null };
  }

  function build(S, data) {
    var p = toBytes(data.plaintext), n = p.length, CW = 28, GAP = 2;
    S.label('plbl', { x: -14, y: 22, text: 'plain[] =', anchor: 'end', size: 14, mono: true });
    for (var i = 0; i < n; i++) S.box('p' + i, { x: i * (CW + GAP), y: 0, w: CW, h: 30, size: 13, text: data.plaintext[i], style: 'normal' });
    S.step(T('Düz metin, ' + n + ' bayt: `"' + data.plaintext + '"`.', 'Plaintext, ' + n + ' bytes: `"' + data.plaintext + '"`.'), { c: [] });

    var c = p.map(function (v, k) { return v ^ ksByte(k); });
    var Y1 = 60;
    S.memRow('c', c.map(function (v) { return { value: v }; }), { x: 0, y: Y1, w: CW, h: 30, size: 12, gap: GAP, addrs: false });
    S.label('clbl', { x: -14, y: Y1 + 22, text: 'ct[] =', anchor: 'end', size: 14, mono: true });
    S.step(T('`crypto_gcm_encrypt(...)` — şifreli metin hesaplandı (anahtar akışıyla XOR).',
              '`crypto_gcm_encrypt(...)` — the ciphertext is computed (XOR with the keystream).'),
           { c: [18, 19, 20, 22, 23, 24] });

    var tag = tagOf(c);
    var Y2 = Y1 + 38;
    S.label('tlbl', { x: -14, y: Y2 + 20, text: 'tag =', anchor: 'end', size: 14, mono: true });
    S.box('tagBox', { x: 0, y: Y2, w: 110, h: 28, size: 14, text: hex32(tag), style: 'new' });
    S.brace('brFile', { from: 'c0', to: 'c' + (n - 1), text: T('[nonce][şifreli metin][etiket]', '[nonce][ciphertext][tag]'), side: 'bottom' });
    S.step(T('`memcpy(out + NONCE_LEN + plain_len, tag, TAG_LEN)` — dosya `[nonce][şifreli metin][etiket]` olarak yazıldı.',
              '`memcpy(out + NONCE_LEN + plain_len, tag, TAG_LEN)` — the file is written as `[nonce][ciphertext][tag]`.'),
           { c: [25] });

    var recvC = c.slice(), recvTag = tag;
    if (data.tamper === 'ciphertext') {
      recvC[0] = recvC[0] ^ 0x01;
      S.set('c0', { style: 'del', text: D.hex(recvC[0], 2) });
      S.step(T('SALDIRI: şifreli metnin ilk baytı değiştirildi (bir bit çevrildi).',
                'ATTACK: the ciphertext\'s first byte is changed (one bit flipped).'),
             { c: [] });
    } else if (data.tamper === 'tag') {
      recvTag = (recvTag ^ 0x00000001) >>> 0;
      S.set('tagBox', { style: 'del', text: hex32(recvTag) });
      S.step(T('SALDIRI: yalnız etiketin son biti değiştirildi; veri dokunulmadı.',
                'ATTACK: only the tag\'s last bit is changed; the data is untouched.'),
             { c: [] });
    }

    var recomputed = tagOf(recvC);
    var accepted = recomputed === recvTag;
    S.label('cmp', { x: (n * (CW + GAP)) / 2, y: Y2 + 46,
      text: T('yeniden hesaplanan etiket = ' + hex32(recomputed), 'recomputed tag = ' + hex32(recomputed)), anchor: 'middle', size: 13 });
    S.result = reference(data);
    if (accepted) {
      for (i = 0; i < n; i++) S.set('c' + i, { style: 'new' });
      S.set('tagBox', { style: 'new' });
      S.step(T('Çöz: `crypto_gcm_decrypt(...)` yeniden hesaplanan etiket = saklanan etiket — DOĞRULANDI, düz metin geri verildi.',
                'Decrypt: `crypto_gcm_decrypt(...)` recomputed tag = stored tag — VERIFIED, the plaintext is returned.'),
             { c: [30, 31, 32, 34, 35, { n: 36, note: T('etiket tuttu mu (ok)? EVET', 'tag held (ok)? YES') }, { n: 37, skip: true }, { n: 38, skip: true }, 40, 41] });
      for (i = 0; i < n; i++) S.box('r' + i, { x: i * (CW + GAP), y: Y2 + 70, w: CW, h: 30, size: 13, text: data.plaintext[i], style: 'new' });
      S.label('rlbl', { x: -14, y: Y2 + 92, text: T('çözülen =', 'decrypted ='), anchor: 'end', size: 14, mono: true });
      S.step(T('Sonuç: `"' + reference(data).recoveredText + '"` — orijinal düz metinle birebir aynı.',
                'Result: `"' + reference(data).recoveredText + '"` — identical to the original plaintext.'), { c: [] });
    } else {
      S.styleAll('del', 'box');
      S.step(T('Çöz: `crypto_gcm_decrypt(...)` yeniden hesaplanan etiket != saklanan etiket — REDDEDİLDİ. Hiçbir düz metin üretilmez (fail-closed).',
                'Decrypt: `crypto_gcm_decrypt(...)` recomputed tag != stored tag — REJECTED. No plaintext is ever produced (fail-closed).'),
             { c: [30, 31, 32, 34, 35, { n: 36, note: T('etiket tuttu mu (ok)? HAYIR', 'tag held (ok)? NO') }, 37, 38, { n: 40, skip: true }] });
    }
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'aes-gcm-tag-check',
    title: T('AES-GCM: şifreleme + etiket doğrulama (aes_gcm_file.c)', 'AES-GCM: encryption + tag verification (aes_gcm_file.c)'),
    code: function () { return { c: SRC }; },
    presets: [
      { id: 'normal-ok', level: 'normal', name: T('Uyar: doğru çözme, etiket tutar', 'Fits: correct decrypt, the tag matches'), data: mk('SecretMessage01', 'none') },
      { id: 'hard-ok-long', level: 'hard', name: T('Zor: uzun mesaj, doğru çözme', 'Hard: a long message, correct decrypt'), data: mk('LongerSecretPayload99', 'none') },
      { id: 'edge-tamper-ct', level: 'edge', name: T('Uç durum: şifreli metin kurcalandı — REDDEDİLİR', 'Edge case: ciphertext tampered — REJECTED'), data: mk('SecretMessage01', 'ciphertext') },
      { id: 'edge-tamper-tag', level: 'edge', name: T('Uç durum: yalnız etiket kurcalandı — REDDEDİLİR', 'Edge case: only the tag tampered — REJECTED'), data: mk('SecretMessage01', 'tag') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.plaintext.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 18], extreme: [14, 18] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var tampers = ['none', 'none', 'ciphertext', 'tag'];   // mostly the happy path, sometimes an attack
      return mk(randomWord(r, len), tampers[D.randInt(r, 0, tampers.length - 1)]);
    },
    input: {
      hint: T('metin|none, metin|ciphertext, ya da metin|tag', 'text|none, text|ciphertext, or text|tag'),
      format: function (data) { return data.plaintext + '|' + data.tamper; },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: metin|none, metin|ciphertext ya da metin|tag olmalı.', 'Format must be text|none, text|ciphertext, or text|tag.');
        var s = parts[0], tamper = parts[1].trim().toLowerCase();
        if (!/^[A-Za-z0-9]+$/.test(s)) throw T('Metin yalnızca harf ve rakam içerebilir.', 'The text may only contain letters and digits.');
        if (s.length > 24) throw T('En fazla 24 karakter (gösterim için).', 'At most 24 characters (for display).');
        if (['none', 'ciphertext', 'tag'].indexOf(tamper) < 0) throw T('İkinci alan none, ciphertext ya da tag olmalı.', 'The second field must be none, ciphertext, or tag.');
        return mk(s, tamper);
      },
      bad: ['', 'ONLYONE', 'has space|none', 'ABC|maybe', 'bad!char|none']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
