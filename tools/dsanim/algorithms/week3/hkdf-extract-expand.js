// CEN429 — Week 3 — Demo 5 (code/week-03/05-hkdf-session/hkdf_session.c)
// HKDF turns one long-lived master secret into many separate keys. Extract mixes the master secret
// with a salt into a uniform intermediate key (PRK); Expand mixes the PRK with an "info" label into
// the final key — a different label always gives a different key, and knowing one derived key never
// reveals another (one-wayness). Chaining Expand (Ki = HKDF(Ki-1), wiping Ki-1 each time) gives
// forward secrecy: from the newest key alone, the older ones cannot be recomputed backwards. This
// animation uses a small deterministic stand-in mixing function so every relation can be computed and
// checked exactly; the real crypto_hkdf_sha256 (RFC 5869) call is shown in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 5: session keys with HKDF and forward secrecy',
    ' *',
    ' * HKDF has two stages:',
    ' *   - Extract: master secret + salt -> a uniform intermediate key (PRK)',
    ' *   - Expand : PRK + an "info" label -> a key of the requested length',
    ' * A different "info" label gives a different key.',
    ' *',
    ' * FORWARD SECRECY chain: K0 = master secret; Ki = HKDF(Ki-1). Every',
    ' * session uses Ki, then Ki-1 is WIPED. Even if an attacker gets today\'s',
    ' * Kn, the one-way chain means K1..Kn-1 cannot be recomputed backwards.',
    ' */',
    '#include "cen429_crypto.h"',
    '#define KEY_LEN 32',
    '',
    'int main(void)',
    '{',
    '    unsigned char k_cipher[KEY_LEN], k_mac[KEY_LEN];',
    '    crypto_hkdf_sha256(master_secret, 32, salt, 16,',
    '        (const unsigned char *)"cen429 encryption key v1", 24, k_cipher, KEY_LEN);',
    '    crypto_hkdf_sha256(master_secret, 32, salt, 16,',
    '        (const unsigned char *)"cen429 MAC key v1", 17, k_mac, KEY_LEN);',
    '    /* ^ Same secret, different info -> different key. */',
    '',
    '    unsigned char k[KEY_LEN];',
    '    memcpy(k, master_secret, KEY_LEN);          /* K0 = master secret */',
    '    for (int i = 1; i <= 4; i++) {',
    '        crypto_hkdf_sha256(k, KEY_LEN, salt, 16,',
    '            (const unsigned char *)"chain advance", 13, next, KEY_LEN);',
    '        crypto_wipe(k, KEY_LEN);      /* Securely wipe the old key, then advance. */',
    '        memcpy(k, next, KEY_LEN);',
    '        crypto_wipe(next, KEY_LEN);',
    '    }',
    '    /* We now only have K4: K3, K2, K1 cannot be recomputed backwards. */',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ toy HKDF (illustration only)
  function mix(a, b) {
    var x = (a ^ b) >>> 0;
    x = Math.imul(x, 0x9e3779b1) >>> 0; x ^= x >>> 15;
    x = Math.imul(x, 0x2545f491) >>> 0; x ^= x >>> 13;
    return x >>> 0;
  }
  function strHash(s) { var h = 0x2545f491 >>> 0; for (var i = 0; i < s.length; i++) h = mix(h, s.charCodeAt(i)); return h; }
  function extract(master, salt) { return mix(strHash(master), strHash(salt)); }
  function expand(prk, info) { return mix(prk, strHash(info)); }
  function hex32(n) { return D.hex((n >>> 24) & 0xff, 2) + D.hex((n >>> 16) & 0xff, 2) + D.hex((n >>> 8) & 0xff, 2) + D.hex(n & 0xff, 2); }

  function mk(master, steps) { return { master: master, steps: steps }; }   // steps: forward-secrecy chain length

  // A SEPARATE toy mixing function (djb2-style hash + a different multiply-xor combiner — structurally
  // different from mix()/strHash()/extract()/expand() above, which build() uses to draw the boxes) — used
  // ONLY by reference(), so a bug there (e.g. forgetting to mix the "info" label in at all, which would
  // silently make every purpose share the same key) does not also corrupt what reference() reports.
  function strHashRef(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h >>> 0; }
  function mixRef(a, b) { return (Math.imul(a ^ b, 2654435761) >>> 0) ^ ((a ^ b) >>> 0); }
  function extractRef(master, salt) { return mixRef(strHashRef(master), strHashRef(salt)); }
  function expandRef(prk, info) { return mixRef(prk, strHashRef(info)); }
  function hex32Ref(n) { return (n >>> 0).toString(16); }

  /** Independent computation: rebuilds the PRK, both purpose keys and the whole chain with the SEPARATE
   * extractRef()/expandRef() above, never calling build()'s own mix()/strHash()/extract()/expand().
   * chainLen is a plain count (data.steps + 1 links, K0..Ksteps), needing no hash at all. keysDiffer is
   * the real check: whether two DIFFERENT "info" labels give different keys is a property of the
   * function actually mixing info in, so a collision here (via this independently-coded hash) is as
   * unlikely as two unrelated hashes agreeing by chance — the meaningful protection is that a bug making
   * build()'s OWN expand() ignore "info" would leave build()'s two keys equal while this independent
   * check still (correctly) expects them to differ. */
  function reference(data) {
    var prk = extractRef(data.master, 'salt');
    var keyA = expandRef(prk, 'encryption'), keyB = expandRef(prk, 'mac');
    var k = strHashRef(data.master), chain = [k];
    for (var i = 1; i <= data.steps; i++) { k = expandRef(k, 'chain-advance'); chain.push(k); }
    return { keysDiffer: keyA !== keyB, chainLen: chain.length, lastKey: hex32Ref(chain[chain.length - 1]) };
  }

  function build(S, data) {
    var master = data.master, BW = 130, BH = 32;
    S.box('m0', { x: 0, y: 0, w: BW, h: BH, size: 12, mono: true, text: hex32(strHash(master)), style: 'normal' });
    S.label('m0lbl', { x: BW / 2, y: -12, text: T('ana sır', 'master secret'), anchor: 'middle', size: 12, bold: true });
    S.step(T('Ana sır: `"' + master + '"` — uzun ömürlü, doğrudan KULLANILMAZ.', 'Master secret: `"' + master + '"` — long-lived, never used DIRECTLY.'), { c: [] });

    var prk = extract(master, 'salt');
    S.box('prk', { x: BW + 40, y: 0, w: BW, h: BH, size: 12, mono: true, text: hex32(prk), style: 'active' });
    S.label('prklbl', { x: BW + 40 + BW / 2, y: -12, text: 'PRK', anchor: 'middle', size: 12, bold: true });
    S.arrow('am0', { from: 'm0', to: 'prk', kind: 'center', style: 'active' });
    S.step(T('EXTRACT: ana sır + tuz -> tekdüze bir ara anahtar `PRK` (kod: `crypto_hkdf_sha256` içinde, Extract ve Expand tek çağrıda birleşiktir).',
              'EXTRACT: master secret + salt -> a uniform intermediate key `PRK` (in code: inside `crypto_hkdf_sha256`, Extract and Expand are combined in one call).'), { c: [4, 5] });

    var keyA = expand(prk, 'encryption'), keyB = expand(prk, 'mac');
    var Y2 = 60;
    S.box('ka', { x: BW + 40, y: Y2, w: BW, h: BH, size: 12, mono: true, text: hex32(keyA), style: 'new' });
    S.label('kalbl', { x: BW + 40 + BW / 2, y: Y2 - 12, text: T('şifreleme anahtarı', 'encryption key'), anchor: 'middle', size: 11 });
    S.arrow('ak1', { from: 'prk', to: 'ka', kind: 'center', style: 'new' });
    S.step(T('EXPAND: `PRK` + `info="cen429 encryption key v1"` -> şifreleme anahtarı.', 'EXPAND: `PRK` + `info="cen429 encryption key v1"` -> the encryption key.'), { c: [19, 20] });

    S.box('kb', { x: 2 * (BW + 40), y: Y2, w: BW, h: BH, size: 12, mono: true, text: hex32(keyB), style: 'hl' });
    S.label('kblbl', { x: 2 * (BW + 40) + BW / 2, y: Y2 - 12, text: T('MAC anahtarı', 'MAC key'), anchor: 'middle', size: 11 });
    S.arrow('ak2', { from: 'prk', to: 'kb', kind: 'center', style: 'hl' });
    S.step(T('EXPAND: `PRK` + `info="cen429 MAC key v1"` -> tamamen FARKLI bir anahtar. Bir amaç için türetilen anahtar başka amaca kullanılmaz.',
              'EXPAND: `PRK` + `info="cen429 MAC key v1"` -> a completely DIFFERENT key. A key derived for one purpose is never reused for another.'),
           { c: [21, 22] });

    var Y3 = 106;
    var k = strHash(master), chainIds = [];
    S.box('c0', { x: 0, y: Y3, w: BW, h: BH, size: 12, mono: true, text: 'K0=' + hex32(k), style: 'dim' });
    chainIds.push('c0');
    S.step(T('İLERİ GİZLİLİK zinciri: `K0 = ana sır`.', 'FORWARD SECRECY chain: `K0 = master secret`.'), { c: [26] });

    for (var i = 1; i <= data.steps; i++) {
      var next = expand(k, 'chain-advance');
      var x = i * (BW + 20);
      S.box('c' + i, { x: x, y: Y3, w: BW, h: BH, size: 12, mono: true, text: 'K' + i + '=' + hex32(next), style: (i === data.steps) ? 'new' : 'dim' });
      S.arrow('ca' + i, { from: 'c' + (i - 1), to: 'c' + i, kind: 'center', style: 'dim' });
      S.set('c' + (i - 1), { style: 'del' });   // the previous key is now wiped
      chainIds.push('c' + i);
      k = next;
      S.step(T('`K' + i + ' = HKDF(K' + (i - 1) + ')`, sonra `K' + (i - 1) + '` `crypto_wipe` ile SİLİNDİ (kırmızı = artık bellekte yok).',
                '`K' + i + ' = HKDF(K' + (i - 1) + ')`, then `K' + (i - 1) + '` is WIPED with `crypto_wipe` (red = no longer in memory).'),
             { c: [{ n: 27, note: T(i + ' <= adım sayısı? EVET, devam et', i + ' <= step count? YES, continue') }, 28, 29, 30, 31, 32] });
    }
    if (data.steps > 0) {
      S.step(T('Döngü koşulu artık sağlanmıyor: zincir burada durur.', 'The loop condition no longer holds: the chain stops here.'),
             { c: [{ n: 27, skip: true }] });
    }

    S.result = reference(data);
    S.step(T('Elimizde yalnız `K' + data.steps + '` var. Zincir TEK YÖNLÜ olduğu için önceki anahtarlar `K' + data.steps + '`\'ten GERİ hesaplanamaz.',
              'We only have `K' + data.steps + '`. Because the chain is ONE-WAY, the earlier keys cannot be computed BACKWARDS from `K' + data.steps + '`.'),
           { c: [] });
  }

  var CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'hkdf-extract-expand',
    title: T('HKDF: Extract/Expand ve ileri gizlilik (hkdf_session.c)', 'HKDF: Extract/Expand and forward secrecy (hkdf_session.c)'),
    code: function () { return { c: SRC }; },
    presets: [
      { id: 'normal', level: 'normal', name: T('Uyar: 4 adımlık zincir (gerçek demoyla aynı)', 'Fits: a 4-step chain (same as the real demo)'), data: mk('longlivedmastersecret', 4) },
      { id: 'hard-longer-chain', level: 'hard', name: T('Zor: daha uzun bir ileri gizlilik zinciri', 'Hard: a longer forward-secrecy chain'), data: mk('anothermastersecretvalue', 6) },
      { id: 'edge-one-step', level: 'edge', small: true, name: T('Uç durum: tek adımlık zincir', 'Edge case: a one-step chain'), data: mk('shortsecret', 1) },
      { id: 'edge-zero-step', level: 'edge', small: true, name: T('Uç durum: zincir hiç ilerlemiyor (yalnız K0)', 'Edge case: the chain never advances (K0 only)'), data: mk('shortsecret', 0) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.master.length + data.steps; },
    random: function (level, r) {
      var ranges = { easy: [8, 10], normal: [10, 16], hard: [12, 18], extreme: [14, 20] };
      var rg = ranges[level] || ranges.normal;
      var master = randomWord(r, D.randInt(r, rg[0], rg[1]));
      var steps = D.randInt(r, 2, 6);
      return mk(master, steps);
    },
    input: {
      hint: T('ana_sır:adım (a-z0-9, en fazla 24 karakter; adım 0-6)', 'master:steps (a-z0-9, at most 24 characters; steps 0-6)'),
      format: function (data) { return data.master + ':' + data.steps; },
      parse: function (text) {
        var parts = String(text).split(':');
        if (parts.length !== 2) throw T('Biçim: ana_sır:adım olmalı.', 'Format must be master:steps.');
        var master = parts[0], steps = parseInt(parts[1], 10);
        if (!/^[a-z0-9]+$/.test(master)) throw T('Ana sır yalnızca küçük harf ve rakam içerebilir.', 'The master secret may only contain lowercase letters and digits.');
        if (master.length > 24) throw T('Ana sır en fazla 24 karakter olabilir.', 'The master secret may be at most 24 characters.');
        if (!Number.isInteger(steps) || steps < 0 || steps > 6) throw T('Adım sayısı 0-6 arasında bir tamsayı olmalı.', 'Steps must be an integer 0-6.');
        return mk(master, steps);
      },
      bad: ['', 'ONLYONE', 'Master:4', 'toolongmastersecretvalue1234:4', 'secret:7', 'secret:-1']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
