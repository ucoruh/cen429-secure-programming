// CEN429 — Week 10 — Demo 6 (code/week-10/06-encrypt-then-mac/ordering.py)
// The SAME two primitives (CBC + a MAC), combined in a DIFFERENT order. Encrypt-then-MAC checks the
// MAC over the ciphertext FIRST — a tampered message is rejected without ever calling unpad() or
// cbc_decrypt(). MAC-then-encrypt must decrypt and unpad BEFORE it can even see the MAC — so a
// tamper that happens to corrupt the padding is rejected at a DIFFERENT point (padding error) than a
// tamper that does not (MAC invalid): two distinguishable failures, the shape a padding-oracle attack
// (Demo 4, Vaudenay 2002) needs.
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    'def etm_protect(plaintext, enc_key, mac_key, iv):',                                              // 1
    '    ct = cbc_encrypt(pad(plaintext), enc_key, iv)',                                               // 2
    '    tag = mac(mac_key, ct)',                                                                      // 3
    '    return ct, tag',                                                                              // 4
    'def etm_unprotect(ciphertext, tag, enc_key, mac_key, iv):',                                       // 5
    '    if not stdlib_hmac.compare_digest(mac(mac_key, ciphertext), tag):',                           // 6
    '        raise ValueError("MAC invalid")  # <-- rejected HERE; unpad() below is never reached',    // 7
    '    return unpad(cbc_decrypt(ciphertext, enc_key, iv))',                                          // 8
    'def mte_protect(plaintext, enc_key, mac_key, iv):',                                               // 9
    '    tag = mac(mac_key, plaintext)',                                                               // 10
    '    return cbc_encrypt(pad(plaintext + tag), enc_key, iv)',                                       // 11
    'def mte_unprotect(ciphertext, enc_key, mac_key, iv):',                                            // 12
    '    inner = unpad(cbc_decrypt(ciphertext, enc_key, iv))   # <-- padding is evaluated BEFORE the MAC', // 13
    '    plaintext, tag = inner[:-32], inner[-32:]',                                                    // 14
    '    if not stdlib_hmac.compare_digest(mac(mac_key, plaintext), tag):',                             // 15
    '        raise ValueError("MAC invalid")',                                                          // 16
    '    return plaintext'                                                                              // 17
  ];
  var BLOCK = 8, ENC_KEY = 0x5A, MAC_KEY = 0x33, IV = 0x11;
  var ODD = 167, ODDINV = 23;
  function E(b, key) { return ((b ^ key) * ODD + 41) & 0xff; }
  function Dc(c, key) { var t = (c - 41) & 0xff; return ((t * ODDINV) & 0xff) ^ key; }

  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
  function cbcEnc(bytesArr, key, iv) {
    var out = [], prev = iv;
    for (var i = 0; i < bytesArr.length; i++) { var c = E(bytesArr[i] ^ prev, key); out.push(c); prev = c; }
    return out;
  }
  function cbcDec(bytesArr, key, iv) {
    var out = [], prev = iv;
    for (var i = 0; i < bytesArr.length; i++) { out.push(Dc(bytesArr[i], key) ^ prev); prev = bytesArr[i]; }
    return out;
  }
  function pad(bytesArr) { var n = BLOCK - (bytesArr.length % BLOCK); return bytesArr.concat(new Array(n).fill(n)); }
  function unpadCheck(bytesArr) {
    if (!bytesArr.length || bytesArr.length % BLOCK !== 0) return { ok: false };
    var n = bytesArr[bytesArr.length - 1];
    if (n < 1 || n > BLOCK) return { ok: false };
    for (var i = 0; i < n; i++) if (bytesArr[bytesArr.length - 1 - i] !== n) return { ok: false };
    return { ok: true, data: bytesArr.slice(0, bytesArr.length - n) };
  }
  function toyMac(bytesArr, key) {
    var acc = key;
    for (var i = 0; i < bytesArr.length; i++) acc = E(acc ^ bytesArr[i], key);
    return acc;
  }
  function flipLast(arr) { var out = arr.slice(); out[out.length - 1] ^= 0x01; return out; }
  function flipFirst(arr) { var out = arr.slice(); out[0] ^= 0x01; return out; }
  function applyTamper(arr, kind) { return kind === 'corrupt-padding' ? flipLast(arr) : (kind === 'corrupt-other' ? flipFirst(arr) : arr); }

  function mk(text, tamperKind) { return { text: text, tamperKind: tamperKind || 'none' }; }

  /** Independent computation: a functional (map/reduce) re-derivation, a different code shape from
   * build()'s explicit per-step loops with drawn boxes. */
  function reference(data) {
    var p = toBytes(data.text);
    var etmCt = cbcEnc(pad(p), ENC_KEY, IV);
    var etmTag = toyMac(etmCt, MAC_KEY);
    var etmRecv = applyTamper(etmCt, data.tamperKind);
    var etmOutcome = toyMac(etmRecv, MAC_KEY) !== etmTag ? 'mac-invalid' : 'ok';

    var mteTag = toyMac(p, MAC_KEY);
    var mteCt = cbcEnc(pad(p.concat([mteTag])), ENC_KEY, IV);
    var mteRecv = applyTamper(mteCt, data.tamperKind);
    var padCheck = unpadCheck(cbcDec(mteRecv, ENC_KEY, IV));
    var mteOutcome;
    if (!padCheck.ok) mteOutcome = 'padding-error';
    else {
      var innerP = padCheck.data.slice(0, -1), innerTag = padCheck.data[padCheck.data.length - 1];
      mteOutcome = toyMac(innerP, MAC_KEY) !== innerTag ? 'mac-invalid' : 'ok';
    }
    return { etm: etmOutcome, mte: mteOutcome };
  }

  function build(S, data) {
    var p = toBytes(data.text), n = p.length, CW = 22, GAP = 2;
    S.label('title', { x: (n * (CW + GAP)) / 2, y: -20,
      text: T('mesaj: "' + data.text + '" (' + n + ' bayt)', 'message: "' + data.text + '" (' + n + ' bytes)'), anchor: 'middle', bold: true, size: 14 });
    for (var i = 0; i < n; i++) S.box('p' + i, { x: i * (CW + GAP), y: 0, w: CW, h: 26, size: 11, text: data.text[i], style: 'normal' });
    S.step(T('Aynı iki yapı taşı — CBC şifreleme ve bir MAC — FARKLI sırayla birleştiriliyor.',
              'The same two building blocks — CBC encryption and a MAC — combined in a DIFFERENT order.'), { py: [] });

    // =============================================================== Encrypt-then-MAC
    var Y = 50;
    S.label('etmTitle', { x: -14, y: Y - 8, text: T('Şifrele-sonra-MAC:', 'Encrypt-then-MAC:'), anchor: 'end', size: 13, bold: true });
    var etmCt = cbcEnc(pad(p), ENC_KEY, IV);
    for (i = 0; i < etmCt.length; i++) S.box('ec' + i, { x: i * (CW + GAP), y: Y, w: CW, h: 26, size: 11, text: D.hex(etmCt[i], 2), style: 'active' });
    var etmTag = toyMac(etmCt, MAC_KEY);
    S.box('etagBox', { x: etmCt.length * (CW + GAP) + 10, y: Y, w: 60, h: 26, size: 12, text: D.hex(etmTag, 2), style: 'new' });
    S.step(T('`etm_protect` — `ct = cbc_encrypt(pad(plaintext),...)`, `tag = mac(mac_key, ct)` (CİPHERTEXT üzerinden).',
              '`etm_protect` — `ct = cbc_encrypt(pad(plaintext),...)`, `tag = mac(mac_key, ct)` (over the CIPHERTEXT).'), { py: [1, 2, 3, 4] });

    var etmRecv = applyTamper(etmCt, data.tamperKind);
    if (data.tamperKind !== 'none') {
      var idx = data.tamperKind === 'corrupt-padding' ? etmCt.length - 1 : 0;
      S.set('ec' + idx, { style: 'del', text: D.hex(etmRecv[idx], 2) });
      S.step(T('SALDIRI: `ct[' + idx + ']`\'ın bir biti çevrildi.', 'ATTACK: one bit of `ct[' + idx + ']` is flipped.'), { py: [] });
    }
    var etmMacOk = toyMac(etmRecv, MAC_KEY) === etmTag;
    var etmLines = etmMacOk
      ? [5, { n: 6, note: T('MAC uyuşmuyor mu? HAYIR', 'MAC mismatch? NO') }, { n: 7, skip: true }, 8]
      : [5, { n: 6, note: T('MAC uyuşmuyor mu? EVET', 'MAC mismatch? YES') }, 7];
    S.step(etmMacOk
      ? T('`etm_unprotect` — MAC tutar: `unpad(cbc_decrypt(...))` ÇALIŞIR, düz metin geri verilir.',
          '`etm_unprotect` — the MAC matches: `unpad(cbc_decrypt(...))` RUNS, the plaintext is returned.')
      : T('`etm_unprotect` — MAC TUTMAZ: HEMEN reddedilir; `unpad`/`cbc_decrypt` HİÇ çağrılmaz.',
          '`etm_unprotect` — the MAC does NOT match: rejected IMMEDIATELY; `unpad`/`cbc_decrypt` is NEVER called.'),
      { py: etmLines });

    // =============================================================== MAC-then-encrypt
    var Y2 = Y + 60;
    S.label('mteTitle', { x: -14, y: Y2 - 8, text: T('MAC-sonra-şifrele:', 'MAC-then-encrypt:'), anchor: 'end', size: 13, bold: true });
    var mteTag = toyMac(p, MAC_KEY);
    var mteCt = cbcEnc(pad(p.concat([mteTag])), ENC_KEY, IV);
    for (i = 0; i < mteCt.length; i++) S.box('mc' + i, { x: i * (CW + GAP), y: Y2, w: CW, h: 26, size: 11, text: D.hex(mteCt[i], 2), style: 'hl' });
    S.step(T('`mte_protect` — `tag = mac(mac_key, plaintext)` (DÜZ METİN üzerinden), sonra `cbc_encrypt(pad(plaintext+tag),...)`.',
              '`mte_protect` — `tag = mac(mac_key, plaintext)` (over the PLAINTEXT), then `cbc_encrypt(pad(plaintext+tag),...)`.'), { py: [9, 10, 11] });

    var mteRecv = applyTamper(mteCt, data.tamperKind);
    if (data.tamperKind !== 'none') {
      var idx2 = data.tamperKind === 'corrupt-padding' ? mteCt.length - 1 : 0;
      S.set('mc' + idx2, { style: 'del', text: D.hex(mteRecv[idx2], 2) });
      S.step(T('AYNI SALDIRI: `ct[' + idx2 + ']`\'ın bir biti çevrildi.', 'THE SAME ATTACK: one bit of `ct[' + idx2 + ']` is flipped.'), { py: [] });
    }
    var padResult = unpadCheck(cbcDec(mteRecv, ENC_KEY, IV));
    S.step(T('`mte_unprotect` — `unpad(cbc_decrypt(...))` HER ZAMAN ÇALIŞIR (MAC henüz görülmedi).',
              '`mte_unprotect` — `unpad(cbc_decrypt(...))` ALWAYS RUNS (the MAC has not been seen yet).'), { py: [12, 13] });

    S.result = reference(data);
    if (!padResult.ok) {
      S.step(T('`unpad` BAŞARISIZ: dolgu geçersiz — REDDEDİLDİ. `tag`/MAC HİÇ karşılaştırılmadı.',
                '`unpad` FAILS: padding is invalid — REJECTED. The `tag`/MAC was never even compared.'), { py: [] });
    } else {
      var innerP = padResult.data.slice(0, -1), innerTag = padResult.data[padResult.data.length - 1];
      var macOk2 = toyMac(innerP, MAC_KEY) === innerTag;
      var mteLines = macOk2
        ? [14, { n: 15, note: T('MAC uyuşmuyor mu? HAYIR', 'MAC mismatch? NO') }, { n: 16, skip: true }, 17]
        : [14, { n: 15, note: T('MAC uyuşmuyor mu? EVET', 'MAC mismatch? YES') }, 16];
      S.step(macOk2
        ? T('Dolgu geçerliydi; `mac` KONTROL EDİLDİ ve tutuyor: düz metin geri verildi.',
            'Padding was valid; the `mac` IS checked and it matches: the plaintext is returned.')
        : T('Dolgu geçerliydi, ama `mac` TUTMUYOR — REDDEDİLDİ (dolgu hatasından FARKLI bir başarısızlık).',
            'Padding was valid, but the `mac` does NOT match — REJECTED (a DIFFERENT failure than a padding error).'),
        { py: mteLines });
    }
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'encrypt-then-mac-order',
    title: T('Şifrele-sonra-MAC vs MAC-sonra-şifrele (ordering.py)', 'Encrypt-then-MAC vs MAC-then-encrypt (ordering.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-ok', level: 'normal', name: T('Uyar: kurcalama yok, ikisi de kabul eder', 'Fits: no tampering, both accept'), data: mk('SecretPayload01', 'none') },
      { id: 'hard-corrupt-other', level: 'hard', name: T('Zor: dolguyu bozmayan kurcalama — ikisi de MAC ile reddeder', 'Hard: a tamper that spares the padding — both reject via the MAC'), data: mk('LongerSecretMsg1', 'corrupt-other') },
      { id: 'edge-corrupt-padding', level: 'edge', name: T('Uç durum: dolguyu bozan kurcalama — FARKLI red noktaları', 'Edge case: a tamper that corrupts the padding — DIFFERENT rejection points'), data: mk('PaddingOracleDemo', 'corrupt-padding') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.text.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 16], extreme: [14, 20] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var kinds = level === 'easy' ? ['none', 'none', 'corrupt-other'] : ['none', 'corrupt-other', 'corrupt-padding'];
      return mk(randomWord(r, len), kinds[D.randInt(r, 0, kinds.length - 1)]);
    },
    input: {
      hint: T('metin|kurcalama (kurcalama: none/corrupt-other/corrupt-padding)', 'text|tamper (tamper: none/corrupt-other/corrupt-padding)'),
      format: function (data) { return data.text + '|' + data.tamperKind; },
      tokens: function (data) { return data.text.split(''); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: metin|kurcalama olmalı.', 'Format must be text|tamper.');
        var s = parts[0], kind = parts[1].trim().toLowerCase();
        if (!/^[A-Za-z0-9]+$/.test(s)) throw T('Metin yalnızca harf ve rakam içerebilir.', 'The text may only contain letters and digits.');
        if (s.length < 9) throw T('Blok sınırlarının net görünmesi için en az 9 karakter.', 'At least 9 characters, so the block boundary is visible.');
        if (s.length > 24) throw T('En fazla 24 karakter.', 'At most 24 characters.');
        if (['none', 'corrupt-other', 'corrupt-padding'].indexOf(kind) < 0) throw T('Kurcalama none, corrupt-other ya da corrupt-padding olmalı.', 'Tamper must be none, corrupt-other, or corrupt-padding.');
        return mk(s, kind);
      },
      bad: ['', 'ONLYONE', 'has space|none', 'ABCDEFGHI|maybe', 'short|none']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
