// CEN429 — Week 10 — Demo 11 (code/week-10/11-hsm-key-use/hsm_sim.py)
// A simulated HSM/PKCS#11-style key store: `generate_keypair()` returns an opaque HANDLE, never the
// key; `sign(handle, data)` computes a signature INSIDE the object, using the private key it holds;
// there is no method that returns a private key at all. An unknown or destroyed handle is rejected;
// a signature made under one handle does not verify under a different one — the private key never
// has to leave the module for any of this to work.
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    '    def generate_keypair(self):',                                   // 1
    '        handle = self._next_handle',                                 // 2
    '        private_key = os.urandom(32)',                               // 3
    '        public_key = hashlib.sha256(private_key + b"|public").digest()', // 4
    '        self._private[handle] = private_key',                       // 5
    '        return handle',                                              // 6
    '    def sign(self, handle, data: bytes) -> bytes:',                  // 7
    '        if handle not in self._private:',                           // 8
    '            raise KeyError("no such key handle: %r" % handle)',      // 9
    '        return hmac.new(self._private[handle], data, hashlib.sha256).digest()', // 10
    '    def verify(self, handle, data: bytes, signature: bytes) -> bool:', // 11
    '        if handle not in self._private:',                           // 12
    '            raise KeyError("no such key handle: %r" % handle)',      // 13
    '        expected = hmac.new(self._private[handle], data, hashlib.sha256).digest()', // 14
    '        return hmac.compare_digest(expected, signature)'             // 15
  ];

  // Toy stand-in for the HMAC-based simulated HSM (mirrors hsm_sim.py's own approach): a "key" is
  // just a number, a "signature" a small fold-hash keyed by that number.
  function toySign(keyNum, msgBytes) { var h = keyNum; for (var i = 0; i < msgBytes.length; i++) h = ((h * 131) ^ msgBytes[i]) & 0xffffffff; return h >>> 0; }
  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }

  function mk(text, scenario) { return { text: text, scenario: scenario }; }

  function reference(data) {
    var msg = toBytes(data.text);
    var KEY1 = 0xA1B2C3, KEY2 = 0x445566;
    if (data.scenario === 'unknown-handle' || data.scenario === 'destroyed-handle') return { ok: false, threw: true };
    var sig = toySign(KEY1, msg);
    if (data.scenario === 'cross-handle') return { ok: toySign(KEY2, msg) === sig, threw: false };
    return { ok: toySign(KEY1, msg) === sig, threw: false };
  }

  function build(S, data) {
    var msg = toBytes(data.text), n = msg.length, CW = 20, GAP = 2;
    var KEY1 = 0xA1B2C3, KEY2 = 0x445566;

    S.box('hsm', { x: 0, y: 0, w: 160, h: 40, size: 12, text: T('HSM (anahtar HİÇ çıkmaz)', 'HSM (key NEVER leaves)'), style: 'active' });
    var h1valid = data.scenario !== 'unknown-handle';
    S.label('h1', { x: 180, y: 20, text: h1valid ? T('kulp #1 üretildi', 'handle #1 generated') : T('kulp #1 HİÇ üretilmedi', 'handle #1 was NEVER generated'), anchor: 'start', size: 12, style: h1valid ? 'normal' : 'del' });
    S.step(h1valid
      ? T('`generate_keypair()` — özel anahtar HSM içinde kalıyor; yalnızca kulp döndürülüyor.',
          '`generate_keypair()` — the private key stays inside the HSM; only a handle is returned.')
      : T('Bu senaryoda kulp HİÇ üretilmedi — çağıran bilinmeyen bir kulp kullanıyor.',
          'In this scenario, no handle was ever generated — the caller uses an unknown one.'),
      { py: h1valid ? [1, 2, 3, 4, 5, 6] : [] });

    if (data.scenario === 'destroyed-handle') {
      S.set('h1', { style: 'del', text: T('kulp #1 YOK EDİLDİ', 'handle #1 DESTROYED') });
      S.step(T('`destroy_keypair(1)` — kulp artık geçersiz; HSM kendisi bile onunla imzalayamaz.',
                '`destroy_keypair(1)` — the handle is no longer valid; even the HSM itself cannot sign with it any more.'), { py: [] });
    }

    for (var i = 0; i < n; i++) S.box('m' + i, { x: i * (CW + GAP), y: 60, w: CW, h: 24, size: 10, text: data.text[i], style: 'normal' });
    S.label('mlbl', { x: -14, y: 76, text: T('belge =', 'document ='), anchor: 'end', size: 12, mono: true });

    var usable = data.scenario === 'sign-verify-ok' || data.scenario === 'cross-handle';
    S.result = reference(data);

    if (!usable) {
      S.step(T('`sign(1, belge)` — kulp `_private` içinde YOK: `KeyError` fırlatılır.',
                '`sign(1, document)` — the handle is NOT in `_private`: a `KeyError` is raised.'),
             { py: [7, { n: 8, note: T('kulp `_private` içinde yok mu? EVET', 'handle not in `_private`? YES') }, 9] });
      return;
    }

    var sig = toySign(KEY1, msg);
    S.box('sigBox', { x: 0, y: 100, w: 130, h: 26, size: 12, text: T('imza=' + sig, 'sig=' + sig), style: 'new' });
    S.step(T('`sign(1, belge)` — kulp geçerli: imza HSM İÇİNDE hesaplanıyor.',
              '`sign(1, document)` — the handle is valid: the signature is computed INSIDE the HSM.'),
           { py: [7, { n: 8, note: T('kulp `_private` içinde yok mu? HAYIR', 'handle not in `_private`? NO') }, { n: 9, skip: true }, 10] });

    var verifyKey = data.scenario === 'cross-handle' ? KEY2 : KEY1;
    var ok = toySign(verifyKey, msg) === sig;
    var handleNum = data.scenario === 'cross-handle' ? '2' : '1';
    S.label('verifyLbl', { x: 0, y: 136,
      text: T('verify(' + handleNum + ', belge, sig) = ' + ok, 'verify(' + handleNum + ', document, sig) = ' + ok),
      anchor: 'start', size: 13, bold: true, style: ok ? 'new' : 'del' });
    S.step(data.scenario === 'cross-handle'
      ? T('`verify(2, belge, sig)` — imza kulp #1 ile üretildi, kulp #2 ile DOĞRULANAMAZ.',
          '`verify(2, document, sig)` — the signature was made under handle #1, it does NOT verify under handle #2.')
      : T('`verify(1, belge, sig)` — aynı kulp: imza doğrulanıyor.',
          '`verify(1, document, sig)` — the same handle: the signature verifies.'),
      { py: [11, { n: 12, note: T('kulp `_private` içinde yok mu? HAYIR', 'handle not in `_private`? NO') }, { n: 13, skip: true }, 14, 15] });
  }

  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'hsm-pkcs11-key-use',
    title: T('HSM/PKCS#11: anahtar kullanımı, anahtar hiç çıkmaz (hsm_sim.py)', 'HSM/PKCS#11: key use, the key never leaves (hsm_sim.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-ok', level: 'normal', name: T('Uyar: geçerli kulpla imzala ve doğrula', 'Fits: sign and verify with a valid handle'), data: mk('PurchaseOrder01', 'sign-verify-ok') },
      { id: 'hard-cross', level: 'hard', name: T('Zor: imza bir kulpla, doğrulama BAŞKA kulpla', 'Hard: signed with one handle, verified with ANOTHER'), data: mk('LongerDocument1', 'cross-handle') },
      { id: 'edge-unknown', level: 'edge', name: T('Uç durum: hiç üretilmemiş kulp', 'Edge case: a handle that was never generated'), data: mk('NeverGenerated1', 'unknown-handle') },
      { id: 'edge-destroyed', level: 'edge', name: T('Uç durum: yok edilmiş kulp', 'Edge case: a destroyed handle'), data: mk('DestroyedHandle1', 'destroyed-handle') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.text.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 12], normal: [10, 14], hard: [12, 16], extreme: [14, 20] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var scenarios = level === 'easy' ? ['sign-verify-ok', 'sign-verify-ok', 'unknown-handle'] : ['sign-verify-ok', 'cross-handle', 'unknown-handle', 'destroyed-handle'];
      return mk(randomWord(r, len), scenarios[D.randInt(r, 0, scenarios.length - 1)]);
    },
    input: {
      hint: T('metin|senaryo (senaryo: sign-verify-ok/cross-handle/unknown-handle/destroyed-handle)',
              'text|scenario (scenario: sign-verify-ok/cross-handle/unknown-handle/destroyed-handle)'),
      format: function (data) { return data.text + '|' + data.scenario; },
      tokens: function (data) { return data.text.split(''); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: metin|senaryo olmalı.', 'Format must be text|scenario.');
        var s = parts[0], scenario = parts[1].trim().toLowerCase();
        if (!/^[A-Za-z0-9]+$/.test(s)) throw T('Metin yalnızca harf ve rakam içerebilir.', 'The text may only contain letters and digits.');
        if (s.length > 24) throw T('En fazla 24 karakter.', 'At most 24 characters.');
        var valid = ['sign-verify-ok', 'cross-handle', 'unknown-handle', 'destroyed-handle'];
        if (valid.indexOf(scenario) < 0) throw T('Senaryo şunlardan biri olmalı: ' + valid.join(', '), 'Scenario must be one of: ' + valid.join(', '));
        return mk(s, scenario);
      },
      bad: ['', 'ONLYONE', 'has space|sign-verify-ok', 'ABC|maybe', 'ABC|']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
