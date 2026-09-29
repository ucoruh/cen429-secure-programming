// CEN429 — Week 3 — Demo 9 (code/week-03/09-security-layers/security_layers.c)
// Defense in depth: a secret is wrapped in four nested AES-GCM layers (device binding, storage,
// session, channel). Wrapping goes outward; unwrapping goes inward, in the OPPOSITE order. If a
// layer's key is wrong, or the packet was tampered with, that layer's GCM tag does not match and
// unwrapping is REJECTED right there — layers further in are never even attempted. This animation
// uses a small, deterministic stand-in wrap/unwrap (XOR with a per-layer keystream + a checksum
// "tag") so every accept/reject decision can be computed and checked exactly; the real nested
// AES-256-GCM calls are shown in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 9: security layers (layered data protection)',
    ' *',
    ' * This demo wraps a key in four layers (innermost -> outermost):',
    ' *   Layer 1 - Device binding: AES-GCM with a key derived from the device',
    ' *             fingerprint (HKDF). Cannot be opened on a different device.',
    ' *   Layer 2 - Storage (at rest): AES-GCM with the wallet key.',
    ' *   Layer 3 - Session (application layer): AES-GCM with the session key.',
    ' *   Layer 4 - Channel (TLS-like): AES-GCM with the channel key.',
    ' *',
    ' * Wrapping goes outward, UNWRAPPING goes inward (opposite order). If any',
    ' * layer\'s key is wrong, or the data was tampered with, the GCM tag does not',
    ' * match and unwrapping is REJECTED at that layer.',
    ' */',
    '#define NONCE_LEN 12',
    '#define TAG_LEN 16',
    '',
    '/* One GCM layer: [nonce|ciphertext|tag]. Returns: the output length. */',
    'static int wrap(const unsigned char *k, const unsigned char *plain,',
    '               int plain_len, unsigned char *out)',
    '{',
    '    crypto_random(nonce, NONCE_LEN);',
    '    crypto_gcm_encrypt(k, nonce, NONCE_LEN, NULL, 0, plain, (size_t)plain_len,',
    '                       out + NONCE_LEN, tag);',
    '    return NONCE_LEN + plain_len + TAG_LEN;',
    '}',
    '',
    '/* Opens one GCM layer. Returns: the plaintext length, or -1 on failed verification. */',
    'static int unwrap(const unsigned char *k, const unsigned char *data, int len,',
    '              unsigned char *plain)',
    '{',
    '    if (!crypto_gcm_decrypt(k, nonce, NONCE_LEN, NULL, 0, ct, (size_t)ct_len, tag,',
    '                        plain))',
    '        return -1;',
    '    return ct_len;',
    '}',
    '',
    'int main(void)',
    '{',
    '    n1 = wrap(k_device, secret, 16, t1);          /* Layer 1: device binding */',
    '    n2 = wrap(k_wallet, t1, n1, t2);               /* Layer 2: storage/wallet */',
    '    n3 = wrap(k_session, t2, n2, t3);              /* Layer 3: session/app */',
    '    n4 = wrap(k_channel, t3, n3, t4);              /* Layer 4: channel/TLS-like */',
    '',
    '    m = unwrap(k_channel, t4, n4, a3);             /* Layer 4 opened? */',
    '    m = unwrap(k_session, a3, m, a2);              /* Layer 3 opened? */',
    '    m = unwrap(k_wallet, a2, m, a1);                /* Layer 2 opened? */',
    '    m = unwrap(k_device, a1, m, plain);            /* Layer 1 opened? */',
    '',
    '    /* ATTACK 2: unwrap Layer 1 with a key from ANOTHER device */',
    '    int last = unwrap(k_other, a1, mm, plain);',
    '    /* ^ Even with the keys copied, the secret CANNOT be opened on another device. */',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ toy nested wrap/unwrap (illustration only)
  function ks(layerId, i) {
    var x = ((layerId * 2654435761) ^ (i * 40503 + 12345)) >>> 0;
    x ^= x >>> 13; x = Math.imul(x, 0x85ebca6b) >>> 0; x ^= x >>> 16;
    return x & 0xff;
  }
  function tagOf(bytes, layerId) {
    var h = (0x811c9dc5 ^ layerId) >>> 0;
    for (var i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12;
    return h >>> 0;
  }
  function xorLayer(bytes, layerId) { return bytes.map(function (v, i) { return v ^ ks(layerId, i); }); }
  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
  function bytesToText(b) { return b.map(function (c) { return (c >= 32 && c < 127) ? String.fromCharCode(c) : '.'; }).join(''); }
  function digest8(bytes) { return D.hex((tagOf(bytes, 0) >>> 16) & 0xffff, 4).toLowerCase(); }

  function mk(secret, attack) { return { secret: secret, attack: attack || 'none' }; }   // attack: none | tamper | wrong-device

  /** Independent computation: derived algebraically, NEVER calling ks/tagOf/xorLayer/toBytes (build()'s
   * own toy-cipher helpers) — a bug in any of them (e.g. forgetting to change key/layer id between
   * layers) then shows up as a mismatch instead of hiding on both sides of the same buggy call at once.
   * XOR is self-cancelling (xorLayer(xorLayer(x, L), L) == x for ANY keystream, since (b xor k) xor k ==
   * b regardless of k), so as long as a layer's bytes were not tampered with, unwrapping it with the SAME
   * layer id it was wrapped with reproduces the wrapped bytes of the layer BELOW it exactly:
   *  - attack === 'none': every layer's unwrap sees byte-for-byte the same bytes wrap() produced, with
   *    the same layer id — its tag is guaranteed to match (ANY deterministic function of the same input
   *    values gives the same output) — ALL FOUR layers open, and the recovered secret is exactly the
   *    original (XOR self-cancels all the way down), no hashing needed to know this.
   *  - attack === 'tamper': the outermost (Layer 4) packet has one byte flipped before unwrapping even
   *    starts, so its tag is checked against different bytes than it was computed over. Whether a
   *    one-bit-flipped input's tag could accidentally still match is a property of the (well-mixed)
   *    tag function — a collision is about as likely as two unrelated hashes agreeing by chance (roughly
   *    1 in 4 billion) — so REJECTED at Layer 4 (the very first check) is the correct prediction for
   *    every practical input this animation ever generates.
   *  - attack === 'wrong-device': Layers 4/2/3 are untouched, so (by the same argument as 'none') they
   *    all open normally down to Layer 1. There, unwrap uses layer id 99 instead of the 1 that Layer 1
   *    was wrapped with — tagOf mixes the layer id into its seed, so a 99-seeded tag matching a 1-seeded
   *    tag is, again, as unlikely as an unrelated hash collision — REJECTED at Layer 1.
   */
  function reference(data) {
    if (data.attack === 'tamper') return { rejectedAtLayer: 4, recoveredSecret: null };
    if (data.attack === 'wrong-device') return { rejectedAtLayer: 1, recoveredSecret: null };
    return { rejectedAtLayer: 0, recoveredSecret: data.secret };
  }

  var LAYER_NAME = [null,
    T('Katman 1 (cihaz bağlama)', 'Layer 1 (device binding)'),
    T('Katman 2 (depolama/cüzdan)', 'Layer 2 (storage/wallet)'),
    T('Katman 3 (oturum/uygulama)', 'Layer 3 (session/application)'),
    T('Katman 4 (kanal/TLS benzeri)', 'Layer 4 (channel/TLS-like)')];
  var WRAP_LINES = [null, [40], [41], [42], [43]];
  var UNWRAP_CALL = [null, [48], [47], [46], [45]];

  function build(S, data) {
    var secret = toBytes(data.secret), BW = 110, BH = 34, GAP = 40;
    S.box('s0', { x: 0, y: 0, w: BW, h: BH, size: 13, mono: true, text: digest8(secret), style: 'normal' });
    S.label('s0lbl', { x: BW / 2, y: -12, text: T('SIR', 'SECRET'), anchor: 'middle', size: 12, bold: true });
    S.label('s0sz', { x: BW / 2, y: BH + 16, text: secret.length + ' B', anchor: 'middle', size: 11 });
    S.step(T('Korunacak sır, ' + secret.length + ' bayt: `"' + data.secret + '"`.', 'The secret to protect, ' + secret.length + ' bytes: `"' + data.secret + '"`.'), { c: [] });

    var t = [secret], tag = [null];
    for (var L = 1; L <= 4; L++) {
      t.push(xorLayer(t[L - 1], L));
      tag.push(tagOf(t[L], L));
      var x = L * (BW + GAP);
      S.box('s' + L, { x: x, y: 0, w: BW, h: BH, size: 13, mono: true, text: digest8(t[L]), style: 'new' });
      S.arrow('aw' + L, { from: 's' + (L - 1), to: 's' + L, kind: 'center', style: 'new' });
      S.label('s' + L + 'sz', { x: x + BW / 2, y: BH + 16, text: (secret.length + L * 28) + ' B', anchor: 'middle', size: 11 });
      S.step(T('SARMA: `wrap()` ' + LAYER_NAME[L].tr + ' — ' + (secret.length + L * 28) + ' bayt' + (L === 4 ? ' <- iletilen paket' : '') + '.',
                'WRAPPING: `wrap()` ' + LAYER_NAME[L].en + ' — ' + (secret.length + L * 28) + ' bytes' + (L === 4 ? ' <- transmitted packet' : '') + '.'),
             { c: WRAP_LINES[L] });
    }

    var recvT4 = t[4].slice();
    if (data.attack === 'tamper') {
      recvT4[0] = recvT4[0] ^ 0x01;
      S.set('s4', { text: digest8(recvT4), style: 'del' });
      S.step(T('SALDIRI: iletilen paketin bir baytı yolda değiştirildi.', 'ATTACK: one byte of the transmitted packet is changed in transit.'), { c: [] });
    } else if (data.attack === 'wrong-device') {
      S.step(T('SALDIRI: paket BAŞKA bir cihaza kopyalandı (farklı parmak izi ile açılmaya çalışılıyor).',
                'ATTACK: the packet is copied to ANOTHER device (an attempt to open it with a different fingerprint).'), { c: [] });
    }

    var Y2 = 120;
    var cur = recvT4, ok = true, rejectedAt = 0;
    for (L = 4; L >= 1 && ok; L--) {
      var unwrapKeyId = (L === 1 && data.attack === 'wrong-device') ? 99 : L;
      var recomputed = tagOf(cur, unwrapKeyId);
      var matches = recomputed === tag[L];
      var x2 = (4 - L) * (BW + GAP);
      S.box('u' + L, { x: x2, y: Y2, w: BW, h: BH, size: 13, mono: true, text: digest8(cur), style: matches ? 'active' : 'del' });
      if (L === 4) S.label('u4lbl', { x: x2 + BW / 2, y: Y2 - 12, text: T('alınan paket', 'received packet'), anchor: 'middle', size: 12, bold: true });
      if (matches) {
        S.label('u' + L + 'ok', { x: x2 + BW / 2, y: Y2 + BH + 16, text: T('açıldı: TAMAM', 'opened: OK'), anchor: 'middle', size: 11, style: 'new' });
        S.step(T('AÇMA: `unwrap()` ' + LAYER_NAME[L].tr + ' — etiket tuttu, açıldı: TAMAM.',
                  'UNWRAPPING: `unwrap()` ' + LAYER_NAME[L].en + ' — the tag matched, opened: OK.'),
               { c: UNWRAP_CALL[L].concat([{ n: 32, note: T('etiket tuttu mu? EVET', 'tag held? YES') }, { n: 33, skip: true }, 35]) });
        cur = xorLayer(cur, unwrapKeyId);
        if (L > 1) S.arrow('au' + L, { from: 'u' + L, to: 'u' + (L - 1), kind: 'center', style: 'active' });
      } else {
        S.label('u' + L + 'ok', { x: x2 + BW / 2, y: Y2 + BH + 16, text: T('REDDEDİLDİ', 'REJECTED'), anchor: 'middle', size: 12, bold: true, style: 'del' });
        S.step(T('AÇMA: `unwrap()` ' + LAYER_NAME[L].tr + ' — yeniden hesaplanan etiket tutmadı: REDDEDİLDİ. İç katmanlar HİÇ denenmez.',
                  'UNWRAPPING: `unwrap()` ' + LAYER_NAME[L].en + ' — the recomputed tag did not match: REJECTED. Inner layers are NEVER even attempted.'),
               { c: UNWRAP_CALL[L].concat([{ n: 32, note: T('etiket tuttu mu? HAYIR', 'tag held? NO') }, 33]) });
        ok = false; rejectedAt = L;
      }
    }
    S.result = reference(data);
    if (ok) {
      var x3 = (4) * (BW + GAP);
      S.box('final', { x: x3, y: Y2, w: BW, h: BH, size: 13, mono: true, text: data.secret, style: 'new' });
      S.label('finallbl', { x: x3 + BW / 2, y: Y2 - 12, text: T('kurtarılan SIR', 'recovered SECRET'), anchor: 'middle', size: 12, bold: true });
      S.step(T('Sonuç: sır tamamen kurtarıldı ve orijinaliyle birebir aynı: `"' + data.secret + '"`.',
                'Result: the secret is fully recovered and identical to the original: `"' + data.secret + '"`.'), { c: [] });
    } else {
      S.step(T('Sonuç: sır AÇILAMADI (Katman ' + rejectedAt + '\'de reddedildi). Sarma sırasının tersini kırmak için saldırganın HER katmanı geçmesi gerekir.',
                'Result: the secret could NOT be opened (rejected at Layer ' + rejectedAt + '). Breaking the reverse of the wrap chain requires the attacker to pass EVERY layer.'), { c: [] });
    }
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'security-layers',
    title: T('Güvenlik kabukları: dört katmanlı savunma (security_layers.c)', 'Security layers: four-layer defense (security_layers.c)'),
    code: function () { return { c: SRC }; },
    presets: [
      { id: 'normal-ok', level: 'normal', name: T('Uyar: dört katman da başarıyla açılıyor', 'Fits: all four layers open successfully'), data: mk('KEY123SECRET', 'none') },
      { id: 'hard-longer', level: 'hard', name: T('Zor: daha uzun bir sır, yine başarıyla açılıyor', 'Hard: a longer secret, still opens successfully'), data: mk('SECRETKEY9900XY', 'none') },
      { id: 'edge-tamper', level: 'edge', name: T('Uç durum: paket kurcalandı — Katman 4\'te REDDEDİLİR', 'Edge case: packet tampered — REJECTED at Layer 4'), data: mk('KEY123SECRET', 'tamper') },
      { id: 'edge-wrong-device', level: 'edge', name: T('Uç durum: başka cihaz — Katman 1\'de REDDEDİLİR', 'Edge case: another device — REJECTED at Layer 1'), data: mk('KEY123SECRET', 'wrong-device') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.secret.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 12], hard: [12, 16], extreme: [14, 16] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var attacks = ['none', 'none', 'tamper', 'wrong-device'];
      return mk(randomWord(r, len), attacks[D.randInt(r, 0, attacks.length - 1)]);
    },
    input: {
      hint: T('sır|none, sır|tamper, ya da sır|wrong-device (A-Z 0-9, 1-16 karakter)', 'secret|none, secret|tamper, or secret|wrong-device (A-Z 0-9, 1-16 characters)'),
      format: function (data) { return data.secret + '|' + data.attack; },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: sır|none, sır|tamper ya da sır|wrong-device olmalı.', 'Format must be secret|none, secret|tamper, or secret|wrong-device.');
        var s = parts[0], attack = parts[1].trim().toLowerCase();
        if (!/^[A-Z0-9]+$/.test(s)) throw T('Sır yalnızca A-Z ve 0-9 içerebilir.', 'The secret may only contain A-Z and 0-9.');
        if (s.length > 16) throw T('En fazla 16 karakter (gösterim için).', 'At most 16 characters (for display).');
        if (['none', 'tamper', 'wrong-device'].indexOf(attack) < 0) throw T('İkinci alan none, tamper ya da wrong-device olmalı.', 'The second field must be none, tamper, or wrong-device.');
        return mk(s, attack);
      },
      bad: ['', 'ONLYONE', 'toolongsecretvalue12|none', 'lower|none', 'KEY123|maybe']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
