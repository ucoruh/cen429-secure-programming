// CEN429 — Week 3 — Demo 4 (code/week-03/04-password-to-key/password_to_key.c)
// PBKDF2 does two things to turn a weak password into a key: SALT (so the same password gives a
// different key per user — rainbow tables stop working) and SLOWNESS (thousands of chained HMAC
// rounds, so every guess costs real time). This animation shows a SHORT chain of a few rounds (real
// PBKDF2 uses hundreds of thousands — see the "rounds vs time" table at the end, with the demo's own
// real measured numbers) using a small deterministic stand-in round function, so the salt/determinism
// property can be computed and checked exactly; the real crypto_pbkdf2_sha256 call is in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 4: deriving a key from a password (PBKDF2)',
    ' *',
    ' *   1) SALT: a random salt is added per user; the same password with a',
    ' *      different salt gives a different key.',
    ' *   2) SLOWNESS: the KDF deliberately runs for hundreds of thousands of',
    ' *      rounds; trying one password guess becomes expensive.',
    ' */',
    '#include "cen429_crypto.h"',
    '#define KEY_LEN 32',
    '',
    'int main(void)',
    '{',
    '    const char *password = "dog123";       /* weak example password */',
    '    unsigned char salt_a[16], salt_b[16], key[KEY_LEN];',
    '    memset(salt_a, 0xA1, sizeof(salt_a));',
    '    memset(salt_b, 0xB2, sizeof(salt_b));',
    '',
    '    crypto_pbkdf2_sha256((const unsigned char *)password, strlen(password),',
    '                         salt_a, sizeof(salt_a), 100000, key, KEY_LEN);',
    '    /* salt A -> key = ... */',
    '    crypto_pbkdf2_sha256((const unsigned char *)password, strlen(password),',
    '                         salt_a, sizeof(salt_a), 100000, key, KEY_LEN);',
    '    /* ^ Same password + the SAME salt -> the SAME key */',
    '    crypto_pbkdf2_sha256((const unsigned char *)password, strlen(password),',
    '                         salt_b, sizeof(salt_b), 100000, key, KEY_LEN);',
    '    /* ^ Same password + a DIFFERENT salt -> a DIFFERENT key */',
    '',
    '    uint32_t rounds_list[] = { 1000, 10000, 100000, 600000, 2000000 };',
    '    for (unsigned i = 0; i < 5; i++) {',
    '        crypto_pbkdf2_sha256(..., rounds_list[i], key, KEY_LEN);',
    '        /* rounds = %u  ->  %.2f ms */',
    '    }',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ toy PBKDF2 chain (illustration only)
  function mixInt(a, b) {
    var x = (a ^ b) >>> 0;
    x = Math.imul(x, 0x85ebca6b) >>> 0; x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35) >>> 0; x ^= x >>> 16;
    return x >>> 0;
  }
  function pwHash(pw) { var h = 0x9e3779b9 >>> 0; for (var i = 0; i < pw.length; i++) h = mixInt(h, pw.charCodeAt(i)); return h; }
  function saltHash(label) { return label === 'A' ? 0xA1A1A1A1 : 0xB2B2B2B2; }
  function chain(password, saltLabel, rounds) {
    var pw = pwHash(password), s = saltHash(saltLabel);
    var u = mixInt(pw, s), us = [u];
    for (var i = 2; i <= rounds; i++) { u = mixInt(pw, u); us.push(u); }
    var key = us.reduce(function (acc, v) { return (acc ^ v) >>> 0; }, 0);
    return { us: us, key: key };
  }
  function hex32(n) { return D.hex((n >>> 24) & 0xff, 2) + D.hex((n >>> 16) & 0xff, 2) + D.hex((n >>> 8) & 0xff, 2) + D.hex(n & 0xff, 2); }

  function mk(password, rounds) { return { password: password, rounds: rounds }; }

  // A SEPARATE toy round function (djb2-style hash, plain multiply-xor rounds — structurally different
  // from pwHash/saltHash/mixInt/chain above, which build() uses to draw the chain) — used ONLY by
  // reference(), so a bug in build()'s own chain (e.g. forgetting to mix the salt in at all, which would
  // silently make every salt give the same key) does not also corrupt what reference() reports.
  function pwHashRef(pw) { var h = 5381; for (var i = 0; i < pw.length; i++) h = ((h * 33) ^ pw.charCodeAt(i)) >>> 0; return h >>> 0; }
  function saltHashRef(label) { return label === 'A' ? 0xA1A1A1A1 : 0xB2B2B2B2; }
  function chainRef(password, saltLabel, rounds) {
    var pw = pwHashRef(password), s = saltHashRef(saltLabel);
    var u = (pw ^ s) >>> 0;
    for (var i = 2; i <= rounds; i++) u = (Math.imul(u, 2654435761) ^ pw) >>> 0;
    return u;
  }
  function hex32Ref(n) { return (n >>> 0).toString(16); }

  /** Independent computation: rebuilds both salt chains with the SEPARATE chainRef() above, never calling
   * build()'s own chain()/mixInt()/pwHash()/saltHash(). sameSaltSameKey is a tautology for ANY pure
   * function (f(x) called twice with the same x always agrees) — kept for shape/documentation, it is not
   * what actually guards against a bug. keysDiffer is the real check: whether a DIFFERENT salt gives a
   * DIFFERENT key is a property of the round function actually mixing the salt in, so a collision here
   * (via this independently-coded hash) is as unlikely as two unrelated hashes agreeing by chance — the
   * meaningful protection is that a bug that makes build()'s OWN chain() ignore the salt would leave
   * build()'s two keys equal while this independent check still (correctly) expects them to differ. */
  function reference(data) {
    var a1 = chainRef(data.password, 'A', data.rounds);
    var a2 = chainRef(data.password, 'A', data.rounds);
    var b = chainRef(data.password, 'B', data.rounds);
    return { sameSaltSameKey: a1 === a2, keyA: hex32Ref(a1), keyB: hex32Ref(b), keysDiffer: a1 !== b };
  }

  var REAL_TIMINGS = [
    ['1,000', '1.24 ms'], ['10,000', '12.55 ms'], ['100,000', '126.75 ms'],
    ['600,000', '824.96 ms'], ['2,000,000', '2,808.32 ms']
  ];

  function build(S, data) {
    var pw = data.password, rounds = data.rounds, BW = 70, BH = 30, GAP = 16;
    S.label('pwlbl', { x: 0, y: -14, text: T('parola = "' + pw + '"', 'password = "' + pw + '"'), anchor: 'start', size: 14, bold: true });
    S.step(T('Parola: `"' + pw + '"` — kısa ve tahmin edilebilir; doğrudan anahtar OLAMAZ.',
              'Password: `"' + pw + '"` — short and guessable; it CANNOT be a key directly.'), { c: [13] });

    function drawChain(prefix, saltLabel, y, style) {
      var res = chain(pw, saltLabel, rounds);
      S.label(prefix + 'lbl', { x: -50, y: y + 20, text: T('tuz ' + saltLabel + ':', 'salt ' + saltLabel + ':'), anchor: 'start', size: 13, mono: true });
      for (var i = 0; i < res.us.length; i++) {
        var x = i * (BW + GAP);
        S.box(prefix + i, { x: x, y: y, w: BW, h: BH, size: 11, mono: true, text: 'U' + (i + 1), style: style });
        if (i > 0) S.arrow(prefix + 'a' + i, { from: prefix + (i - 1), to: prefix + i, kind: 'center', style: style });
      }
      var kx = res.us.length * (BW + GAP);
      S.box(prefix + 'key', { x: kx, y: y, w: BW + 30, h: BH, size: 11, mono: true, text: hex32(res.key), style: 'new' });
      S.arrow(prefix + 'ak', { from: prefix + (res.us.length - 1), to: prefix + 'key', kind: 'center', style: 'new' });
      return res;
    }

    var a1 = drawChain('a1_', 'A', 10, 'active');
    S.step(T('`crypto_pbkdf2_sha256(parola, tuz_A, ' + rounds + ' tur, ...)` — her tur bir önceki turun HMAC\'ı: `U1 -> U2 -> ... -> U' + rounds + '`, sonra hepsinin XOR\'u anahtarı verir (gerçek PBKDF2 100.000+ tur kullanır; burada ' + rounds + ' tur gösteriliyor).',
              '`crypto_pbkdf2_sha256(password, salt_A, ' + rounds + ' rounds, ...)` — each round is an HMAC of the previous one: `U1 -> U2 -> ... -> U' + rounds + '`, then XORing them all gives the key (real PBKDF2 uses 100,000+ rounds; ' + rounds + ' are shown here).'),
           { c: [18, 19] });

    var a2 = drawChain('a1_', 'A', 10, 'active');   // redraw identical (determinism) — same ids, same result
    S.step(T('Aynı parola + AYNI tuz A ile yeniden hesaplandı: `key = ' + hex32(a1.key) + '` — BİREBİR AYNI (tabloya açıklık).',
              'Recomputed with the same password + the SAME salt A: `key = ' + hex32(a1.key) + '` — IDENTICAL (a table lookup would work).'),
           { c: [21, 22] });

    var b = drawChain('b1_', 'B', 50, 'hl');
    S.result = reference(data);
    S.step(T('Aynı parola + FARKLI tuz B ile: `key = ' + hex32(b.key) + '` — tamamen FARKLI bir anahtar.',
              'Same password + a DIFFERENT salt B: `key = ' + hex32(b.key) + '` — a completely DIFFERENT key.'),
           { c: [24, 25] });

    var Y3 = 128;
    S.label('rtLbl', { x: 0, y: Y3 - 34, text: T('Gerçek demodan ölçülen süreler (tur sayısı arttıkça):', 'Real measured times from the demo (as the round count grows):'), anchor: 'start', size: 13, bold: true });
    for (var i = 0; i < REAL_TIMINGS.length; i++) {
      S.box('rt' + i, { x: i * 100, y: Y3, w: 92, h: 36, size: 12, mono: true, text: REAL_TIMINGS[i][1], above: REAL_TIMINGS[i][0], style: 'dim' });
    }
    S.step(T('Gerçek program çıktısı: tur 1.000 -> 1,24 ms iken tur 2.000.000 -> 2,8 saniye. OWASP (2023): PBKDF2-HMAC-SHA256 için en az 600.000 tur; mümkünse Argon2id.',
              'Real program output: 1,000 rounds -> 1.24 ms, while 2,000,000 rounds -> 2.8 seconds. OWASP (2023): at least 600,000 rounds for PBKDF2-HMAC-SHA256; Argon2id preferred where possible.'),
           { c: [29, { n: 30, note: T('i < 5? EVET, 5 tur değeri için yineleniyor', 'i < 5? YES, iterating over 5 round values') }, 31] });
  }

  var CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'pbkdf2-stretching',
    title: T('Paroladan anahtar türetme: tuz ve tur (password_to_key.c)', 'Deriving a key from a password: salt and rounds (password_to_key.c)'),
    code: function () { return { c: SRC }; },
    presets: [
      { id: 'normal', level: 'normal', name: T('Uyar: kısa parola, 4 tur gösteriliyor', 'Fits: a short password, 4 rounds shown'), data: mk('dog123secret', 4) },
      { id: 'hard-more-rounds', level: 'hard', name: T('Zor: daha uzun parola, 6 tur gösteriliyor', 'Hard: a longer password, 6 rounds shown'), data: mk('hunter2password99', 6) },
      { id: 'edge-one-round', level: 'edge', small: true, name: T('Uç durum: tek tur (yalnız gösterim için — gerçekte hiç yeterli değil)', 'Edge case: a single round (for illustration only — far too few in reality)'), data: mk('weakpw', 1) },
      { id: 'edge-empty-like', level: 'edge', small: true, name: T('Uç durum: çok kısa bir parola', 'Edge case: a very short password'), data: mk('ab', 4) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.password.length + data.rounds; },
    random: function (level, r) {
      var pwRanges = { easy: [8, 10], normal: [8, 14], hard: [10, 16], extreme: [12, 18] };
      var rg = pwRanges[level] || pwRanges.normal;
      var pw = randomWord(r, D.randInt(r, rg[0], rg[1]));
      var rounds = D.randInt(r, 2, 6);
      return mk(pw, rounds);
    },
    input: {
      hint: T('parola:tur (parola en fazla 20 karakter a-z0-9, tur 1-6)', 'password:rounds (password at most 20 chars a-z0-9, rounds 1-6)'),
      format: function (data) { return data.password + ':' + data.rounds; },
      parse: function (text) {
        var parts = String(text).split(':');
        if (parts.length !== 2) throw T('Biçim: parola:tur olmalı.', 'Format must be password:rounds.');
        var pw = parts[0], rounds = parseInt(parts[1], 10);
        if (!/^[a-z0-9]+$/.test(pw)) throw T('Parola yalnızca küçük harf ve rakam içerebilir.', 'The password may only contain lowercase letters and digits.');
        if (pw.length > 20) throw T('Parola en fazla 20 karakter olabilir.', 'The password may be at most 20 characters.');
        if (!Number.isInteger(rounds) || rounds < 1 || rounds > 6) throw T('Tur sayısı 1-6 arasında bir tamsayı olmalı (gösterim için).', 'Rounds must be an integer 1-6 (for display).');
        return mk(pw, rounds);
      },
      bad: ['', 'ONLYONE', 'Password:4', 'toolongpasswordvalue12345:4', 'dog123:0', 'dog123:9']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
