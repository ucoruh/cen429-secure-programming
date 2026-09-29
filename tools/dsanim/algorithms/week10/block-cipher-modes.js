// CEN429 — Week 10 — Demo 3 (code/week-10/03-block-cipher-modes/block_modes.py)
// Four ways to turn a one-byte-at-a-time toy cipher into a message cipher: ECB (every byte on its
// own), CBC (chained through the previous ciphertext byte, seeded by an IV), CTR (XOR with a
// keystream built from a counter) and a simplified, GCM-shaped authenticated mode (CTR + a tag that
// covers the ciphertext). The toy cipher itself is a small, reversible, keyed byte substitution —
// not secure, but every MODE property shown here (ECB's repeated-block leak, CBC's controlled
// single-bit malleability, CTR's exact single-bit flip, GCM's fail-closed tag check) is a real
// property of the mode with any block cipher, including AES.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (excerpt)
  var PY = [
    'def ecb_encrypt(plaintext: bytes, key_byte: int) -> bytes:',                                // 1
    '    return bytes(toy_encrypt_block(b, key_byte) for b in plaintext)',                        // 2
    'def cbc_encrypt(plaintext: bytes, key_byte: int, iv: int) -> bytes:',                         // 3
    '    out = bytearray()',                                                                       // 4
    '    prev = iv & 0xFF',                                                                        // 5
    '    for b in plaintext:',                                                                     // 6
    '        c = toy_encrypt_block(b ^ prev, key_byte)',                                           // 7
    '        out.append(c)',                                                                       // 8
    '        prev = c',                                                                            // 9
    '    return bytes(out)',                                                                       // 10
    'def cbc_decrypt(ciphertext: bytes, key_byte: int, iv: int) -> bytes:',                        // 11
    '    out = bytearray()',                                                                       // 12
    '    prev = iv & 0xFF',                                                                        // 13
    '    for c in ciphertext:',                                                                    // 14
    '        p = toy_decrypt_block(c, key_byte) ^ prev',                                           // 15
    '        out.append(p)',                                                                       // 16
    '        prev = c',                                                                            // 17
    '    return bytes(out)',                                                                       // 18
    'def ctr_keystream(length: int, key_byte: int, nonce: int) -> bytes:',                         // 19
    '    return bytes(toy_encrypt_block((nonce + i) & 0xFF, key_byte) for i in range(length))',    // 20
    'def ctr_apply(data: bytes, key_byte: int, nonce: int) -> bytes:',                             // 21
    '    return _xor(data, ctr_keystream(len(data), key_byte, nonce))',                            // 22
    'def _tag(key_byte: int, nonce: int, ciphertext: bytes) -> int:',                              // 23
    '    acc = toy_encrypt_block(nonce & 0xFF, key_byte)',                                         // 24
    '    for c in ciphertext:',                                                                    // 25
    '        acc = toy_encrypt_block(acc ^ c, key_byte)',                                          // 26
    '    return acc',                                                                               // 27
    'def gcm_like_decrypt(ciphertext: bytes, tag: int, key_byte: int, nonce: int):',                // 28
    '    if _tag(key_byte, nonce, ciphertext) != (tag & 0xFF):',                                   // 29
    '        return None, False',                                                                  // 30
    '    return ctr_decrypt(ciphertext, key_byte, nonce), True'                                    // 31
  ];
  var L = { ecbEnc: [1, 2], cbcDef: 3, cbcInit: [4, 5], cbcFor: 6, cbcBody: [7, 8, 9], cbcRet: 10,
            cbcDecDef: 11, cbcDecInit: [12, 13], cbcDecFor: 14, cbcDecBody: [15, 16, 17], cbcDecRet: 18,
            ctrKs: [19, 20], ctrApply: [21, 22], tagDef: 23, tagInit: 24, tagFor: 25, tagBody: 26, tagRet: 27,
            gcmDef: 28, gcmIf: 29, gcmReject: 30, gcmAccept: 31 };

  var KEY = 0x5A, IV = 0x10;
  var ODD = 167, ODDINV = 23;          // 167 * 23 mod 256 == 1 (multiplication mod 256 is invertible)

  function E(b, key) { return ((b ^ key) * ODD + 41) & 0xff; }
  function Dc(c, key) { var t = (c - 41) & 0xff; return ((t * ODDINV) & 0xff) ^ key; }

  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
  function fromBytes(b) { return b.map(function (c) { return (c >= 32 && c < 127) ? String.fromCharCode(c) : '.'; }).join(''); }
  function flip(bytesArr, idx, bit) { var out = bytesArr.slice(); out[idx] = out[idx] ^ (1 << bit); return out; }

  function tagOf(ct, key, nonce) {
    var acc = E(nonce & 0xff, key);
    for (var i = 0; i < ct.length; i++) acc = E(acc ^ ct[i], key);
    return acc;
  }

  function mk(text, mode, tamper) { return { text: text, mode: mode, tamper: tamper || 'none' }; }

  /** Independent computation: rebuilds every mode from scratch with plain array reduce/map chains
   * (a different code shape than build()'s explicit step-by-step loop with drawn state), never
   * calling build() or reusing its intermediate state. */
  function reference(data) {
    var p = toBytes(data.text);
    var ct, tag = null;
    if (data.mode === 'ecb') {
      ct = p.map(function (b) { return E(b, KEY); });
    } else if (data.mode === 'cbc') {
      ct = p.reduce(function (acc, b) {
        var prev = acc.length ? acc[acc.length - 1] : IV;
        acc.push(E(b ^ prev, KEY));
        return acc;
      }, []);
    } else { // ctr or gcm: XOR with keystream E(nonce+i)
      ct = p.map(function (b, i) { return b ^ E((IV + i) & 0xff, KEY); });
      if (data.mode === 'gcm') tag = tagOf(ct, KEY, IV);
    }
    var recvCt = data.tamper === 'ciphertext' ? flip(ct, 0, 0) : ct;
    var accepted = true, pt = null;
    if (data.mode === 'ecb') {
      pt = recvCt.map(function (c) { return Dc(c, KEY); });
    } else if (data.mode === 'cbc') {
      var prev = IV;
      pt = recvCt.map(function (c) { var v = Dc(c, KEY) ^ prev; prev = c; return v; });
    } else if (data.mode === 'ctr') {
      pt = recvCt.map(function (c, i) { return c ^ E((IV + i) & 0xff, KEY); });
    } else { // gcm
      accepted = tagOf(recvCt, KEY, IV) === tag;
      pt = accepted ? recvCt.map(function (c, i) { return c ^ E((IV + i) & 0xff, KEY); }) : null;
    }
    return { ciphertext: recvCt, tag: tag, accepted: accepted, plaintext: pt };
  }

  function build(S, data) {
    var p = toBytes(data.text), n = p.length, CW = 26, GAP = 3;
    S.label('mlbl', { x: -14, y: 15, text: T('kip', 'mode'), anchor: 'end', size: 13 });
    S.label('mval', { x: 0, y: 15,
      text: { tr: data.mode.toUpperCase(), en: data.mode.toUpperCase() }, anchor: 'start', bold: true, size: 14 });
    S.label('plbl', { x: -14, y: 45, text: 'plain[] =', anchor: 'end', size: 13, mono: true });
    for (var i = 0; i < n; i++) S.box('p' + i, { x: i * (CW + GAP), y: 22, w: CW, h: 28, size: 12, text: data.text[i], style: 'normal' });
    S.step(T('Düz metin, ' + n + ' bayt: `"' + data.text + '"`, kip: **' + data.mode.toUpperCase() + '**.',
              'Plaintext, ' + n + ' bytes: `"' + data.text + '"`, mode: **' + data.mode.toUpperCase() + '**.'), { py: [] });

    var Y = 90, ct = [], prev, keyLines;
    S.label('clbl', { x: -14, y: Y + 23, text: 'ct[] =', anchor: 'end', size: 13, mono: true });

    if (data.mode === 'ecb') {
      S.step(T('`ecb_encrypt` — her bayt, ÖNCEKİLERDEN BAĞIMSIZ, aynı anahtarla şifrelenir.',
                '`ecb_encrypt` — every byte is enciphered INDEPENDENTLY of the others, with the same key.'), { py: L.ecbEnc });
      for (i = 0; i < n; i++) {
        ct.push(E(p[i], KEY));
        S.box('c' + i, { x: i * (CW + GAP), y: Y, w: CW, h: 28, size: 12, text: D.hex(ct[i], 2), style: 'new' });
        S.at(i);
        S.step(T('byte ' + i + ': `toy_encrypt_block(' + p[i] + ', key)` = ' + D.hex(ct[i], 2) + '.',
                  'byte ' + i + ': `toy_encrypt_block(' + p[i] + ', key)` = ' + D.hex(ct[i], 2) + '.'), { py: L.ecbEnc });
      }
      S.at(null);
      if (n >= 4 && p[0] === p[3]) {
        S.brace('brA', { from: 'c0', to: 'c0', text: T('aynı düz bayt →', 'same plain byte →'), side: 'top' });
        S.brace('brB', { from: 'c3', to: 'c3', text: T('← aynı şifreli bayt!', '← same cipher byte!'), side: 'top' });
        S.step(T('`plain[0] == plain[3]` olduğundan `ct[0] == ct[3]` — desen SIZAR.',
                  '`plain[0] == plain[3]`, so `ct[0] == ct[3]` — the pattern LEAKS through.'), { py: [] });
      }
    } else if (data.mode === 'cbc') {
      S.label('prevLbl', { x: n * (CW + GAP) + 30, y: Y + 18, text: T('önceki = IV = ' + D.hex(IV, 2), 'prev = IV = ' + D.hex(IV, 2)), anchor: 'start', size: 12 });
      S.step(T('`cbc_encrypt` — zincir `prev`, `IV` ile başlar.', '`cbc_encrypt` — the chain variable `prev` starts at the IV.'),
             { py: [L.cbcDef].concat(L.cbcInit) });
      prev = IV;
      for (i = 0; i < n; i++) {
        var xorv = p[i] ^ prev;
        var cv = E(xorv, KEY);
        ct.push(cv);
        S.box('c' + i, { x: i * (CW + GAP), y: Y, w: CW, h: 28, size: 12, text: D.hex(cv, 2), style: 'new' });
        S.at(i);
        var loopLines = i === 0 ? [L.cbcFor].concat(L.cbcBody) : L.cbcBody;
        var note0 = i === 0 ? { n: L.cbcFor, note: T('döngü ' + n + ' bayt üzerinde', 'loop over ' + n + ' bytes') } : null;
        S.set('prevLbl', { text: T('önceki = ' + D.hex(prev, 2), 'prev = ' + D.hex(prev, 2)) });
        S.step(T('byte ' + i + ': `' + p[i] + ' xor ' + D.hex(prev, 2) + '` sonra şifrele = ' + D.hex(cv, 2) + '.',
                  'byte ' + i + ': `' + p[i] + ' xor ' + D.hex(prev, 2) + '` then encrypt = ' + D.hex(cv, 2) + '.'),
               { py: note0 ? [note0].concat(loopLines.slice(1)) : loopLines });
        prev = cv;
      }
      S.at(null);
      S.remove('prevLbl');
    } else { // ctr or gcm
      S.label('kslbl', { x: -14, y: Y - 22, text: T('anahtar akışı =', 'keystream ='), anchor: 'end', size: 12, mono: true });
      for (i = 0; i < n; i++) {
        var ks = E((IV + i) & 0xff, KEY);
        S.box('k' + i, { x: i * (CW + GAP), y: Y - 44, w: CW, h: 24, size: 11, text: D.hex(ks, 2), style: 'dim' });
        cv = p[i] ^ ks;
        ct.push(cv);
        S.box('c' + i, { x: i * (CW + GAP), y: Y, w: CW, h: 28, size: 12, text: D.hex(cv, 2), style: 'new' });
        S.at(i);
        var noteI = i === 0 ? { n: L.ctrKs[1], note: T('sayaç = nonce+i', 'counter = nonce+i') } : null;
        S.step(T('byte ' + i + ': akış = `toy_encrypt_block(' + (IV + i) + ', key)` = ' + D.hex(ks, 2) + ', ct = plain xor akış = ' + D.hex(cv, 2) + '.',
                  'byte ' + i + ': keystream = `toy_encrypt_block(' + (IV + i) + ', key)` = ' + D.hex(ks, 2) + ', ct = plain xor keystream = ' + D.hex(cv, 2) + '.'),
               { py: i === 0 ? [L.ctrKs[0], noteI, L.ctrApply[1]] : [L.ctrApply[1]] });
      }
      S.at(null);
      if (data.mode === 'gcm') {
        var tag = tagOf(ct, KEY, IV);
        S.box('tagBox', { x: 0, y: Y + 50, w: 120, h: 28, size: 13, text: T('etiket=', 'tag=') , style: 'new' });
        S.set('tagBox', { text: (data.mode === 'gcm' ? '' : '') + 'tag=' + D.hex(tag, 2) });
        S.step(T('`_tag(...)` — etiket, ŞİFRELİ METİN üzerinden hesaplanır (düz metin üzerinden DEĞİL).',
                  '`_tag(...)` — the tag is computed over the CIPHERTEXT (never the plaintext).'),
               { py: [L.tagDef, L.tagInit, { n: L.tagFor, note: T('her ct baytı için', 'for every ct byte') }, L.tagBody, L.tagRet] });
      }
    }

    // ---- tamper + decrypt --------------------------------------------------------------------------
    var recvCt = ct.slice();
    if (data.tamper === 'ciphertext') {
      recvCt[0] = recvCt[0] ^ 0x01;
      S.set('c0', { style: 'del', text: D.hex(recvCt[0], 2) });
      S.step(T('SALDIRI: `ct[0]`\'ın bir biti çevrildi (' + D.hex(ct[0], 2) + ' → ' + D.hex(recvCt[0], 2) + ').',
                'ATTACK: one bit of `ct[0]` is flipped (' + D.hex(ct[0], 2) + ' → ' + D.hex(recvCt[0], 2) + ').'), { py: [] });
    }

    var ref = reference({ text: data.text, mode: data.mode, tamper: data.tamper });
    S.result = ref;

    if (data.mode === 'gcm') {
      var recomputed = tagOf(recvCt, KEY, IV);
      var expectedTag = tagOf(ct, KEY, IV);
      var yesno = ref.accepted ? T('EVET', 'YES') : T('HAYIR', 'NO');
      S.step(T('`gcm_like_decrypt` — yeniden hesaplanan etiket ' + D.hex(recomputed, 2) + ' vs saklanan ' + D.hex(expectedTag, 2) + '; eşit mi? ' + (ref.accepted ? 'EVET' : 'HAYIR') + '.',
                '`gcm_like_decrypt` — recomputed tag ' + D.hex(recomputed, 2) + ' vs stored ' + D.hex(expectedTag, 2) + '; equal? ' + (ref.accepted ? 'YES' : 'NO') + '.'),
             { py: ref.accepted
                 ? [L.gcmDef, { n: L.gcmIf, note: T('etiketler eşit mi? EVET', 'tags equal? YES') }, { n: L.gcmReject, skip: true }, L.gcmAccept]
                 : [L.gcmDef, { n: L.gcmIf, note: T('etiketler eşit mi? HAYIR', 'tags equal? NO') }, L.gcmReject] });
      if (ref.accepted) {
        for (i = 0; i < n; i++) S.box('r' + i, { x: i * (CW + GAP), y: Y + 90, w: CW, h: 28, size: 12, text: data.text[i], style: 'new' });
        S.label('rlbl', { x: -14, y: Y + 108, text: T('çözülen =', 'decrypted ='), anchor: 'end', size: 12, mono: true });
        S.step(T('Kabul edildi: düz metin geri verildi: `"' + fromBytes(ref.plaintext) + '"`.',
                  'Accepted: plaintext is returned: `"' + fromBytes(ref.plaintext) + '"`.'), { py: [] });
      } else {
        S.styleAll('del', 'box');
        S.step(T('REDDEDİLDİ — hiçbir düz metin üretilmedi (fail-closed).',
                  'REJECTED — no plaintext is ever produced (fail-closed).'), { py: [] });
      }
    } else if (data.mode === 'ecb') {
      var ptOut = recvCt.map(function (c) { return Dc(c, KEY); });
      for (i = 0; i < n; i++) {
        var same = ptOut[i] === p[i];
        S.box('r' + i, { x: i * (CW + GAP), y: Y + 50, w: CW, h: 28, size: 12,
          text: same ? data.text[i] : '?', style: same ? 'normal' : 'del' });
      }
      S.label('rlbl', { x: -14, y: Y + 68, text: T('çözülen =', 'decrypted ='), anchor: 'end', size: 12, mono: true });
      S.step(T('Çöz: ' + (data.tamper === 'ciphertext' ? 'SADECE bayt 0 bozuldu, GERİ KALANI doğru çözüldü — ECB kurcalamayı FARK ETMEZ.' : 'her şey doğru çözüldü.'),
                'Decrypt: ' + (data.tamper === 'ciphertext' ? 'ONLY byte 0 is garbled, everything else decrypts correctly — ECB does NOT notice tampering.' : 'everything decrypts correctly.')),
             { py: [] });
    } else if (data.mode === 'cbc') {
      var ptOut2 = []; prev = IV;
      for (i = 0; i < n; i++) { ptOut2.push(Dc(recvCt[i], KEY) ^ prev); prev = recvCt[i]; }
      for (i = 0; i < n; i++) {
        var ok = ptOut2[i] === p[i];
        S.box('r' + i, { x: i * (CW + GAP), y: Y + 50, w: CW, h: 28, size: 12, text: ok ? data.text[i] : '?', style: ok ? 'normal' : 'del' });
      }
      S.label('rlbl2', { x: -14, y: Y + 68, text: T('çözülen =', 'decrypted ='), anchor: 'end', size: 12, mono: true });
      var decForNote = { n: L.cbcDecFor, note: T('döngü ' + n + ' şifreli bayt üzerinde', 'loop over ' + n + ' ciphertext bytes') };
      if (data.tamper === 'ciphertext' && n > 1) {
        S.step(T('Çöz: `cbc_decrypt` — blok 0 ÇÖP çıkar, blok 1 aynı bitte çevrilir (denetlenebilir kırılganlık); sonrası etkilenmez.',
                  'Decrypt: `cbc_decrypt` — block 0 comes out GARBLED, block 1 flips the same bit (controlled malleability); the rest is unaffected.'),
               { py: [L.cbcDecDef].concat(L.cbcDecInit).concat([decForNote]).concat(L.cbcDecBody) });
      } else {
        S.step(T('Çöz: `cbc_decrypt` — her şey doğru çözüldü.', 'Decrypt: `cbc_decrypt` — everything decrypts correctly.'),
               { py: [L.cbcDecDef].concat(L.cbcDecInit).concat([decForNote]).concat(L.cbcDecBody) });
      }
    } else { // ctr
      var ptOut3 = recvCt.map(function (c, i2) { return c ^ E((IV + i2) & 0xff, KEY); });
      for (i = 0; i < n; i++) {
        var eq = ptOut3[i] === p[i];
        S.box('r' + i, { x: i * (CW + GAP), y: Y + 50, w: CW, h: 28, size: 12, text: eq ? data.text[i] : '?', style: eq ? 'normal' : 'del' });
      }
      S.label('rlbl3', { x: -14, y: Y + 68, text: T('çözülen =', 'decrypted ='), anchor: 'end', size: 12, mono: true });
      S.step(T('Çöz: CTR — ' + (data.tamper === 'ciphertext' ? 'YALNIZ bayt 0\'ın TAM OLARAK 1 biti çevrildi; kalanı doğru.' : 'her şey doğru çözüldü.'),
                'Decrypt: CTR — ' + (data.tamper === 'ciphertext' ? 'ONLY byte 0 has EXACTLY 1 bit flipped; the rest is correct.' : 'everything decrypts correctly.')),
             { py: [] });
    }
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'block-cipher-modes',
    title: T('Blok şifreleme kipleri: ECB / CBC / CTR / GCM (block_modes.py)', 'Block cipher modes: ECB / CBC / CTR / GCM (block_modes.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-ecb', level: 'normal', name: T('Uyar: ECB, tekrar eden desen sızar', 'Fits: ECB, a repeated pattern leaks'), data: mk('SEEDSEEDXYAB', 'ecb', 'none') },
      { id: 'hard-cbc-tamper', level: 'hard', name: T('Zor: CBC, şifreli metin kurcalandı', 'Hard: CBC, ciphertext tampered'), data: mk('LongerSecretMsg1', 'cbc', 'ciphertext') },
      { id: 'edge-ctr-tamper', level: 'edge', name: T('Uç durum: CTR, tek bit çevrildi', 'Edge case: CTR, a single bit flipped'), data: mk('CounterModeDemo', 'ctr', 'ciphertext') },
      { id: 'edge-gcm-reject', level: 'edge', name: T('Uç durum: GCM benzeri, kurcalama REDDEDİLİR', 'Edge case: GCM-like, tampering is REJECTED'), data: mk('AuthenticatedMsg', 'gcm', 'ciphertext') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.text.length; },
    random: function (level, r) {
      var modes = ['ecb', 'cbc', 'ctr', 'gcm'];
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 16], extreme: [14, 18] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var mode = modes[D.randInt(r, 0, modes.length - 1)];
      var tampers = level === 'easy' ? ['none', 'none', 'ciphertext'] : ['none', 'ciphertext', 'ciphertext'];
      var tamper = tampers[D.randInt(r, 0, tampers.length - 1)];
      return mk(randomWord(r, len), mode, tamper);
    },
    input: {
      hint: T('metin|kip|kurcalama (kip: ecb/cbc/ctr/gcm, kurcalama: none/ciphertext)', 'text|mode|tamper (mode: ecb/cbc/ctr/gcm, tamper: none/ciphertext)'),
      format: function (data) { return data.text + '|' + data.mode + '|' + data.tamper; },
      tokens: function (data) { return data.text.split(''); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 3) throw T('Biçim: metin|kip|kurcalama olmalı.', 'Format must be text|mode|tamper.');
        var s = parts[0], mode = parts[1].trim().toLowerCase(), tamper = parts[2].trim().toLowerCase();
        if (!/^[A-Za-z0-9]+$/.test(s)) throw T('Metin yalnızca harf ve rakam içerebilir.', 'The text may only contain letters and digits.');
        if (s.length > 24) throw T('En fazla 24 karakter (gösterim için).', 'At most 24 characters (for display).');
        if (['ecb', 'cbc', 'ctr', 'gcm'].indexOf(mode) < 0) throw T('Kip ecb, cbc, ctr ya da gcm olmalı.', 'Mode must be ecb, cbc, ctr, or gcm.');
        if (['none', 'ciphertext'].indexOf(tamper) < 0) throw T('Kurcalama none ya da ciphertext olmalı.', 'Tamper must be none or ciphertext.');
        return mk(s, mode, tamper);
      },
      bad: ['', 'ONLYONE', 'has space|ecb|none', 'ABC|xyz|none', 'ABC|ecb|maybe']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
