// CEN429 — Week 10 — Demo 2 (code/week-10/02-signature-verification/demo.sh)
// A signature binds a specific PRIVATE key to a specific MESSAGE. Verification recomputes that
// binding with the PUBLIC key and checks it against the message actually received: change one byte
// of the message and the check fails (Demo 4's tampering step); sign with a DIFFERENT key and
// verifying against the real, trusted public key also fails (Demo 6's "wrong trust" step) — a
// signature only means something once the verifier already knows WHOSE public key to check against.
// This animation uses a toy RSA-style signature (mirrors rsa_toy.py's sign/verify) as a stand-in for
// the real ECDSA math the shell script actually runs.
(function (D) {
  'use strict';
  var T = D.T;

  var SH = [
    'openssl dgst -sha256 -sign signer.key -out update.sig update.bin',                                     // 1
    'if openssl dgst -sha256 -verify signer.pub -signature update.sig update.bin >/dev/null 2>&1; then',    // 2
    '  echo "  VERIFY-RESULT: VALID (install). openssl exit code = 0."',                                    // 3
    'else',                                                                                                  // 4
    '  echo "  VERIFY-RESULT: unexpected rejection of a valid signature."',                                  // 5
    'fi',                                                                                                    // 6
    'if openssl dgst -sha256 -verify signer.pub -signature update.sig tampered.bin >/dev/null 2>&1; then',  // 7
    '  echo "  VERIFY-RESULT: unexpected accept of a tampered file!"',                                       // 8
    'else',                                                                                                  // 9
    '  echo "  VERIFY-RESULT: INVALID. The tampered update is REJECTED (exit code != 0)."',                  // 10
    'fi',                                                                                                    // 11
    'if openssl dgst -sha256 -verify signer.pub -signature evil.sig evil.bin >/dev/null 2>&1; then',        // 12
    '  echo "  VERIFY-RESULT: unexpected accept of evil.bin against the real signer.pub."',                  // 13
    'else',                                                                                                  // 14
    '  echo "  VERIFY-RESULT: correctly REJECTED against the real signer.pub (the only key that should be trusted)."', // 15
    'fi'                                                                                                     // 16
  ];

  // Toy RSA (same classic keypair as rsa_toy.py's worked example) stands in for the real ECDSA math.
  var SIGNER = { e: 17, d: 2753, n: 3233 };
  var ATTACKER = { e: 7, d: 2743, n: 9797 };   // 97*101=9797, phi=96*100=9600, gcd(7,9600)=1, d=modinv(7,9600)

  function modexp(base, exp, mod) { var r = 1; base = base % mod; while (exp > 0) { if (exp & 1) r = (r * base) % mod; base = (base * base) % mod; exp = Math.floor(exp / 2); } return r; }
  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
  /** Folds a message down to a single number in [0, n) — a stand-in for SHA-256 + DER encoding. */
  function toyHash(bytesArr, mod) {
    var h = 7;
    for (var i = 0; i < bytesArr.length; i++) h = (h * 131 + bytesArr[i]) % mod;
    return h;
  }
  function sign(msgBytes, priv) { return modexp(toyHash(msgBytes, priv.n), priv.d, priv.n); }
  function verify(msgBytes, sig, pub) { return modexp(sig, pub.e, pub.n) === toyHash(msgBytes, pub.n); }

  function mk(text, scenario) { return { text: text, scenario: scenario || 'valid' }; }

  function reference(data) {
    var msg = toBytes(data.text);
    if (data.scenario === 'valid') {
      var sig = sign(msg, SIGNER);
      return { ok: verify(msg, sig, SIGNER) };
    }
    if (data.scenario === 'tampered') {
      var sig2 = sign(msg, SIGNER);
      var tampered = msg.slice(); tampered[0] = tampered[0] ^ 1;
      return { ok: verify(tampered, sig2, SIGNER) };
    }
    // wrongkey: attacker signs with their OWN key, verified against the REAL signer's public key
    var evilSig = sign(msg, ATTACKER);
    return { ok: verify(msg, evilSig, SIGNER), okUnderAttackerKey: verify(msg, evilSig, ATTACKER) };
  }

  function build(S, data) {
    var msg = toBytes(data.text), n = msg.length, CW = 22, GAP = 2;
    S.label('mlbl', { x: -14, y: 15, text: T('belge =', 'document ='), anchor: 'end', size: 12, mono: true });
    for (var i = 0; i < n; i++) S.box('m' + i, { x: i * (CW + GAP), y: 0, w: CW, h: 26, size: 11, text: data.text[i], style: 'normal' });
    S.step(T('Belge, ' + n + ' bayt: `"' + data.text + '"`.', 'Document, ' + n + ' bytes: `"' + data.text + '"`.'), { sh: [] });

    var signerKey = data.scenario === 'wrongkey' ? ATTACKER : SIGNER;
    var sig = sign(msg, signerKey);
    S.box('sigBox', { x: 0, y: 40, w: 130, h: 28, size: 13, text: T('imza=' + sig, 'sig=' + sig), style: 'new' });
    S.step(data.scenario === 'wrongkey'
      ? T('`openssl dgst -sign attacker.key ...` — SALDIRGAN kendi anahtarıyla imzalıyor, `sig=' + sig + '`.',
          '`openssl dgst -sign attacker.key ...` — the ATTACKER signs with their OWN key, `sig=' + sig + '`.')
      : T('`openssl dgst -sign signer.key ...` — yayıncı imzalıyor, `sig=' + sig + '`.',
          '`openssl dgst -sign signer.key ...` — the publisher signs, `sig=' + sig + '`.'),
      { sh: [1] });

    var checkMsg = msg, tamperedIdx = -1;
    if (data.scenario === 'tampered') {
      checkMsg = msg.slice(); checkMsg[0] = checkMsg[0] ^ 1; tamperedIdx = 0;
      S.set('m0', { style: 'del', text: '?' });
      S.step(T('SALDIRI: belgenin ilk baytı imzadan SONRA değiştirildi.', 'ATTACK: the first byte of the document is changed AFTER signing.'), { sh: [] });
    }

    S.result = reference(data);
    var ok = S.result.ok;
    var pubLabel = data.scenario === 'wrongkey' ? 'signer.pub' : 'signer.pub';
    var lines;
    if (data.scenario === 'valid') {
      lines = [{ n: 2, note: T('doğrulama başarılı mı? EVET', 'verification succeeds? YES') }, 3, { n: 4, skip: true }, { n: 5, skip: true }, 6];
    } else if (data.scenario === 'tampered') {
      lines = [{ n: 7, note: T('doğrulama başarılı mı? HAYIR (kurcalandı)', 'verification succeeds? NO (tampered)') }, { n: 8, skip: true }, 9, 10, 11];
    } else {
      lines = [{ n: 12, note: T('doğrulama başarılı mı? HAYIR (yanlış anahtar)', 'verification succeeds? NO (wrong key)') }, { n: 13, skip: true }, 14, 15, 16];
    }
    S.label('verifyLbl', { x: 0, y: 78, text: T('doğrula(' + pubLabel + ') = ' + ok, 'verify(' + pubLabel + ') = ' + ok), anchor: 'start', size: 13, bold: true, style: ok ? 'new' : 'del' });
    S.step(T('`openssl dgst -verify ' + pubLabel + ' -signature ...` — sonuç: ' + (ok ? 'GEÇERLİ' : 'GEÇERSİZ, REDDEDİLDİ') + '.',
              '`openssl dgst -verify ' + pubLabel + ' -signature ...` — result: ' + (ok ? 'VALID' : 'INVALID, REJECTED') + '.'),
           { sh: lines });
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'digital-signature-tamper',
    title: T('Dijital imza: doğrulama ve kurcalanmış mesaj (demo.sh)', 'Digital signature: verification and a tampered message (demo.sh)'),
    code: function () { return { sh: SH }; },
    presets: [
      { id: 'normal-valid', level: 'normal', name: T('Uyar: doğru imza, doğru anahtar', 'Fits: correct signature, correct key'), data: mk('UpdatePackage01', 'valid') },
      { id: 'hard-tampered', level: 'hard', name: T('Zor: belge imzadan sonra kurcalandı', 'Hard: the document is tampered after signing'), data: mk('LongerUpdatePkg1', 'tampered') },
      { id: 'edge-wrongkey', level: 'edge', name: T('Uç durum: saldırganın kendi anahtarıyla imzalanmış', 'Edge case: signed with the attackers own key'), data: mk('MaliciousPayload1', 'wrongkey') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.text.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 16], extreme: [14, 20] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var scenarios = level === 'easy' ? ['valid', 'valid', 'tampered'] : ['valid', 'tampered', 'wrongkey'];
      return mk(randomWord(r, len), scenarios[D.randInt(r, 0, scenarios.length - 1)]);
    },
    input: {
      hint: T('metin|senaryo (senaryo: valid/tampered/wrongkey)', 'text|scenario (scenario: valid/tampered/wrongkey)'),
      format: function (data) { return data.text + '|' + data.scenario; },
      tokens: function (data) { return data.text.split(''); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: metin|senaryo olmalı.', 'Format must be text|scenario.');
        var s = parts[0], scenario = parts[1].trim().toLowerCase();
        if (!/^[A-Za-z0-9]+$/.test(s)) throw T('Metin yalnızca harf ve rakam içerebilir.', 'The text may only contain letters and digits.');
        if (s.length > 24) throw T('En fazla 24 karakter.', 'At most 24 characters.');
        if (['valid', 'tampered', 'wrongkey'].indexOf(scenario) < 0) throw T('Senaryo valid, tampered ya da wrongkey olmalı.', 'Scenario must be valid, tampered, or wrongkey.');
        return mk(s, scenario);
      },
      bad: ['', 'ONLYONE', 'has space|valid', 'ABC|maybe', 'ABC|']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
