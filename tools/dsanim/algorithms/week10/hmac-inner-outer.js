// CEN429 — Week 10 — Demo 5 (code/week-10/05-hmac-construction/hmac_construction.py)
// HMAC(K, m) = H( (K' xor opad) || H( (K' xor ipad) || m ) ) — two nested hash calls, not one
// H(key||message). The key is first normalized to exactly BLOCK_SIZE bytes (padded with zeros if
// short, hashed down if long), then mixed in TWICE with two different constants (ipad=0x36,
// opad=0x5C): once around the message (the inner hash), once around that inner digest (the outer
// hash). This animation uses a small toy hash (NOT SHA-256) and a small toy block size (8, not the
// real 64) so every byte fits on screen — the code panel shows the real construction and constants.
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    "BLOCK_SIZE = 64   # SHA-256's internal block size, in bytes",   // 1
    'IPAD = 0x36',                                                    // 2
    'OPAD = 0x5C',                                                    // 3
    'def hmac_sha256(key: bytes, message: bytes) -> bytes:',          // 4
    '    key = _normalize_key(key)',                                 // 5
    '    ipad_key = bytes(b ^ IPAD for b in key)',                    // 6
    '    opad_key = bytes(b ^ OPAD for b in key)',                    // 7
    '    inner = hashlib.sha256(ipad_key + message).digest()',        // 8
    '    outer = hashlib.sha256(opad_key + inner).digest()',          // 9
    '    return outer',                                               // 10
    'def _normalize_key(key: bytes) -> bytes:',                       // 11
    '    if len(key) > BLOCK_SIZE:',                                  // 12
    '        key = hashlib.sha256(key).digest()',                     // 13
    '    return key + b"\\x00" * (BLOCK_SIZE - len(key))'             // 14
  ];
  var TOY_BLOCK = 8;   // stands in for the real BLOCK_SIZE (64) so every byte fits on screen
  var IPAD = 0x36, OPAD = 0x5C;

  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }

  /** A small, deterministic toy hash (NOT SHA-256): folds every input byte into a 4-byte state. Used
   * only so the inner/outer digest can be drawn as a short box; the real algorithm is SHA-256. */
  function toyHash(bytesArr) {
    var h = [0x6a, 0x09, 0xe6, 0x67];
    for (var i = 0; i < bytesArr.length; i++) {
      var j = i & 3;
      h[j] = ((h[j] ^ bytesArr[i]) * 41 + j * 17 + 3) & 0xff;
      h[(j + 1) & 3] = (h[(j + 1) & 3] ^ h[j]) & 0xff;
    }
    return h;
  }
  function hex4(h) { return h.map(function (b) { return D.hex(b, 2); }).join(''); }

  function normalizeKey(keyBytes) {
    var k = keyBytes.slice();
    if (k.length > TOY_BLOCK) k = toyHash(k).concat(toyHash(k.slice().reverse())); // 8 toy bytes from a "hash"
    while (k.length < TOY_BLOCK) k.push(0);
    return k.slice(0, TOY_BLOCK);
  }

  /** Independent computation: builds ipad_key/opad_key/inner/outer with plain array maps, a
   * different code shape than build()'s explicit per-byte loop with drawn boxes. */
  function reference(data) {
    var key = normalizeKey(toBytes(data.key));
    var msg = toBytes(data.message);
    var ipadKey = key.map(function (b) { return b ^ IPAD; });
    var opadKey = key.map(function (b) { return b ^ OPAD; });
    var inner = toyHash(ipadKey.concat(msg));
    var outer = toyHash(opadKey.concat(inner));
    return { tag: hex4(outer) };
  }

  function mk(key, message) { return { key: key, message: message }; }

  function build(S, data) {
    var keyBytesRaw = toBytes(data.key);
    var hashedDown = keyBytesRaw.length > TOY_BLOCK;
    var key = normalizeKey(keyBytesRaw);
    var CW = 26, GAP = 3, Y0 = 0;

    S.label('klbl', { x: -14, y: Y0 + 20, text: T('anahtar =', 'key ='), anchor: 'end', size: 13, mono: true });
    for (var i = 0; i < keyBytesRaw.length && i < TOY_BLOCK; i++) S.box('kraw' + i, { x: i * (CW + GAP), y: Y0, w: CW, h: 28, size: 12, text: data.key[i] || '', style: 'normal' });
    S.step(T('Anahtar, ' + keyBytesRaw.length + ' bayt: `"' + data.key + '"`. Blok boyu (oyuncak) = ' + TOY_BLOCK + '.',
              'Key, ' + keyBytesRaw.length + ' bytes: `"' + data.key + '"`. (Toy) block size = ' + TOY_BLOCK + '.'), { py: [] });

    var normLines = hashedDown
      ? [11, { n: 12, note: T('anahtar uzunluğu > blok boyu mu? EVET', 'key length > block size? YES') }, 13, 14]
      : [11, { n: 12, note: T('anahtar uzunluğu > blok boyu mu? HAYIR', 'key length > block size? NO') }, { n: 13, skip: true }, 14];
    S.step(hashedDown
      ? T('`_normalize_key` — anahtar bloktan UZUN: önce hashlenir, sonra ' + TOY_BLOCK + ' bayta tamamlanır.',
          '`_normalize_key` — the key is LONGER than one block: it is hashed first, then padded to ' + TOY_BLOCK + ' bytes.')
      : T('`_normalize_key` — anahtar bloktan kısa/eşit: doğrudan sıfırla ' + TOY_BLOCK + ' bayta tamamlanır.',
          '`_normalize_key` — the key is shorter than or equal to one block: it is zero-padded straight to ' + TOY_BLOCK + ' bytes.'),
      { py: normLines });
    for (i = 0; i < TOY_BLOCK; i++) S.box('kn' + i, { x: i * (CW + GAP), y: Y0 + 46, w: CW, h: 26, size: 11, text: D.hex(key[i], 2), style: 'dim' });
    S.label('knlbl', { x: -14, y: Y0 + 64, text: T("K' =", "K' ="), anchor: 'end', size: 12, mono: true });

    var ipadKey = key.map(function (b) { return b ^ IPAD; });
    var opadKey = key.map(function (b) { return b ^ OPAD; });
    var Y1 = Y0 + 90;
    for (i = 0; i < TOY_BLOCK; i++) S.box('ip' + i, { x: i * (CW + GAP), y: Y1, w: CW, h: 26, size: 11, text: D.hex(ipadKey[i], 2), style: 'active' });
    S.label('iplbl', { x: -14, y: Y1 + 18, text: T("K' xor ipad =", "K' xor ipad ="), anchor: 'end', size: 12, mono: true });
    S.step(T("`ipad_key = bytes(b xor 0x36 for b in K)` — anahtar 0x36 ile karıştırıldı.",
              "`ipad_key = bytes(b xor 0x36 for b in K)` — the key is mixed with 0x36."), { py: [6] });

    var Y2 = Y1 + 40;
    for (i = 0; i < TOY_BLOCK; i++) S.box('op' + i, { x: i * (CW + GAP), y: Y2, w: CW, h: 26, size: 11, text: D.hex(opadKey[i], 2), style: 'hl' });
    S.label('oplbl', { x: -14, y: Y2 + 18, text: T("K' xor opad =", "K' xor opad ="), anchor: 'end', size: 12, mono: true });
    S.step(T("`opad_key = bytes(b xor 0x5C for b in K)` — anahtar 0x5C ile karıştırıldı (FARKLI sabit).",
              "`opad_key = bytes(b xor 0x5C for b in K)` — the key is mixed with 0x5C (a DIFFERENT constant)."), { py: [7] });

    var msg = toBytes(data.message);
    var Y3 = Y2 + 46;
    S.label('mlbl', { x: -14, y: Y3 + 14, text: T('mesaj =', 'message ='), anchor: 'end', size: 12, mono: true });
    for (i = 0; i < msg.length; i++) S.box('m' + i, { x: i * (CW + GAP), y: Y3, w: CW, h: 26, size: 11, text: data.message[i], style: 'normal' });
    S.at(0);
    var inner = toyHash(ipadKey.concat(msg));
    S.box('innerBox', { x: 0, y: Y3 + 44, w: 130, h: 30, size: 13, text: hex4(inner), style: 'new' });
    S.label('innerLbl', { x: -14, y: Y3 + 63, text: T('iç =', 'inner ='), anchor: 'end', size: 12, mono: true });
    S.step(T("`inner = SHA256(K'xor_ipad || message)` — İÇ özet: anahtar-karışımlı ön ek + mesaj.",
              "`inner = SHA256(K'xor_ipad || message)` — the INNER digest: the key-mixed prefix plus the message."), { py: [8] });
    S.at(null);

    var outer = toyHash(opadKey.concat(inner));
    S.box('outerBox', { x: 0, y: Y3 + 84, w: 130, h: 30, size: 13, text: hex4(outer), style: 'new' });
    S.label('outerLbl', { x: -14, y: Y3 + 103, text: T('dış (HMAC) =', 'outer (HMAC) ='), anchor: 'end', size: 12, mono: true });
    S.result = reference(data);
    S.step(T("`outer = SHA256(K'xor_opad || inner)` — DIŞ özet: bu, HMAC etiketinin kendisi.",
              "`outer = SHA256(K'xor_opad || inner)` — the OUTER digest: this IS the HMAC tag."), { py: [9, 10] });
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'hmac-inner-outer',
    title: T('HMAC: iç/dış özet yapısı (hmac_construction.py)', 'HMAC: the inner/outer hash construction (hmac_construction.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-shortkey', level: 'normal', name: T('Uyar: kısa anahtar, sıfırla tamamlanır', 'Fits: short key, zero-padded'), data: mk('key1', 'transfer100toaccount') },
      { id: 'hard-longkey', level: 'hard', name: T('Zor: uzun anahtar, önce hashlenir', 'Hard: long key, hashed down first'), data: mk('averyveryverylongsharedsecretkey', 'authenticatethismessage') },
      { id: 'edge-exactblock', level: 'edge', name: T('Uç durum: anahtar tam blok boyunda', 'Edge case: key exactly one block long'), data: mk('01234567', 'exactlyoneblockkey') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.message.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 18], extreme: [14, 20] };
      var rg = ranges[level] || ranges.normal;
      var msgLen = D.randInt(r, rg[0], rg[1]);
      var keyLen = level === 'hard' || level === 'extreme' ? D.randInt(r, 9, 16) : D.randInt(r, 1, 8);
      return mk(randomWord(r, keyLen), randomWord(r, msgLen));
    },
    input: {
      hint: T('anahtar|mesaj', 'key|message'),
      format: function (data) { return data.key + '|' + data.message; },
      tokens: function (data) { return data.message.split(''); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: anahtar|mesaj olmalı.', 'Format must be key|message.');
        var key = parts[0], msg = parts[1];
        if (!key || !/^[A-Za-z0-9]+$/.test(key)) throw T('Anahtar yalnızca harf/rakam ve en az 1 karakter olmalı.', 'The key must be letters/digits, at least 1 character.');
        if (!msg || !/^[A-Za-z0-9]+$/.test(msg)) throw T('Mesaj yalnızca harf/rakam ve en az 1 karakter olmalı.', 'The message must be letters/digits, at least 1 character.');
        if (key.length > 40) throw T('Anahtar en fazla 40 karakter.', 'The key is at most 40 characters.');
        if (msg.length > 24) throw T('Mesaj en fazla 24 karakter (gösterim için).', 'The message is at most 24 characters (for display).');
        return mk(key, msg);
      },
      bad: ['', 'ONLYONE', 'has space|msg', '|emptykey', 'key|']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
