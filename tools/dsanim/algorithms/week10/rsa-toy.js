// CEN429 — Week 10 — Demo 7 (code/week-10/07-rsa-toy/rsa_toy.py)
// Textbook RSA (Rivest, Shamir and Adleman, 1977) with tiny primes: n = p*q, phi = (p-1)(q-1), a
// public exponent e coprime with phi, a private exponent d = e^-1 mod phi. Encrypt/decrypt and
// sign/verify are mirror images of the SAME modular exponentiation, just with e and d swapped. NO
// padding is used (real RSA needs OAEP/PSS — see PKCS#1 and the Bleichenbacher attack, 1998) — this
// is for the arithmetic only, never for real messages.
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    'def keygen(p, q, e=None):',                                   // 1
    '    if not is_prime(p) or not is_prime(q):',                  // 2
    '        raise ValueError("p and q must both be prime")',      // 3
    '    if p == q:',                                              // 4
    '        raise ValueError("p and q must be distinct")',        // 5
    '    n = p * q',                                                // 6
    '    phi = (p - 1) * (q - 1)',                                  // 7
    '    d = modinv(e, phi)',                                       // 8
    '    return (e, n), (d, n)',                                    // 9
    'def encrypt(m, pub):',                                         // 10
    '    e, n = pub',                                                // 11
    '    if not (0 <= m < n):',                                     // 12
    '        raise ValueError("message %d out of range [0, %d)" % (m, n))', // 13
    '    return pow(m, e, n)',                                       // 14
    'def decrypt(c, priv):',                                         // 15
    '    d, n = priv',                                                // 16
    '    return pow(c, d, n)',                                        // 17
    'def sign(m, priv):',                                             // 18
    '    d, n = priv',                                                // 19
    '    return pow(m, d, n)',                                        // 20
    'def verify(m, signature, pub):',                                 // 21
    '    e, n = pub',                                                 // 22
    '    return pow(signature, e, n) == m'                            // 23
  ];

  function isPrime(n) {
    if (n < 2) return false;
    for (var d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  }
  function egcd(a, b) { if (b === 0) return [a, 1, 0]; var r = egcd(b, a % b); return [r[0], r[2], r[1] - Math.floor(a / b) * r[2]]; }
  function modinv(a, m) { var r = egcd(((a % m) + m) % m, m); return ((r[1] % m) + m) % m; }
  /** Square-and-multiply — the real algorithm behind Python's built-in pow(base, exp, mod). */
  function modexp(base, exp, mod) {
    var result = 1; base = base % mod;
    while (exp > 0) { if (exp & 1) result = (result * base) % mod; base = (base * base) % mod; exp = Math.floor(exp / 2); }
    return result;
  }
  /** A DIFFERENT algorithm, used only in reference(): naive repeated multiplication, O(exp) — slow,
   * but a genuinely independent re-derivation of the same modular exponentiation. */
  function naiveModExp(base, exp, mod) {
    var result = 1;
    for (var i = 0; i < exp; i++) result = (result * (base % mod)) % mod;
    return result;
  }

  function mk(p, q, e, m, tamper) { return { p: p, q: q, e: e, m: m, tamper: tamper || 'none' }; }

  function reference(data) {
    var n = data.p * data.q, phi = (data.p - 1) * (data.q - 1);
    var d = modinv(data.e, phi);
    var c = naiveModExp(data.m, data.e, n);
    var decrypted = naiveModExp(c, d, n);
    var sig = naiveModExp(data.m, d, n);
    var recheckSig = sig;
    var pubE = data.e, pubN = n;
    if (data.tamper === 'flipsig') recheckSig = (sig + 1) % n;
    if (data.tamper === 'wrongkey') { var n2 = 97 * 101; pubN = n2; pubE = 7; }
    var verified = naiveModExp(recheckSig, pubE, pubN) === data.m;
    return { n: n, d: d, ciphertext: c, decrypted: decrypted, signature: sig, verified: verified };
  }

  function build(S, data) {
    var n = data.p * data.q, phi = (data.p - 1) * (data.q - 1);
    S.label('p', { x: 0, y: 0, text: 'p = ' + data.p, anchor: 'start', size: 14, mono: true });
    S.label('q', { x: 140, y: 0, text: 'q = ' + data.q, anchor: 'start', size: 14, mono: true });
    S.step(T('Anahtar üretimi: iki küçük asal, `p=' + data.p + '`, `q=' + data.q + '`.',
              'Key generation: two small primes, `p=' + data.p + '`, `q=' + data.q + '`.'), { py: [1] });

    var bothPrime = isPrime(data.p) && isPrime(data.q);
    S.step(T('`is_prime(p)` ve `is_prime(q)` — ikisi de asal mı? EVET (koşul YANLIŞ, hata fırlatılmaz).',
              '`is_prime(p)` and `is_prime(q)` — are both prime? YES (the condition is FALSE, no error).'),
           { py: [{ n: 2, note: T('ikisi de asal mı? EVET → NOT(...) YANLIŞ', 'both prime? YES → NOT(...) is FALSE') }, { n: 3, skip: true }] });
    S.step(T('`p == q`? HAYIR — iki farklı asal.', '`p == q`? NO — two distinct primes.'),
           { py: [{ n: 4, note: T('p == q mu? HAYIR', 'p == q? NO') }, { n: 5, skip: true }] });

    var d = modinv(data.e, phi);
    S.label('n', { x: 0, y: 30, text: 'n = p*q = ' + n, anchor: 'start', size: 14, mono: true });
    S.label('phi', { x: 0, y: 54, text: T('phi = (p-1)(q-1) = ' + phi, 'phi = (p-1)(q-1) = ' + phi), anchor: 'start', size: 14, mono: true });
    S.step(T('`n = p*q = ' + n + '`, `phi = (p-1)(q-1) = ' + phi + '`.', '`n = p*q = ' + n + '`, `phi = (p-1)(q-1) = ' + phi + '`.'), { py: [6, 7] });

    S.label('e', { x: 0, y: 78, text: 'e = ' + data.e, anchor: 'start', size: 14, mono: true, style: 'active' });
    S.label('d', { x: 140, y: 78, text: 'd = ' + d, anchor: 'start', size: 14, mono: true, style: 'active' });
    S.step(T('`d = modinv(e, phi) = ' + d + '` — açık anahtar `(e=' + data.e + ', n=' + n + ')`, gizli anahtar `(d=' + d + ', n=' + n + ')`.',
              '`d = modinv(e, phi) = ' + d + '` — public key `(e=' + data.e + ', n=' + n + ')`, private key `(d=' + d + ', n=' + n + ')`.'),
           { py: [8, 9] });

    var Y = 120;
    S.label('m', { x: 0, y: Y, text: 'm = ' + data.m, anchor: 'start', size: 14, mono: true, style: 'normal' });
    var inRange = data.m >= 0 && data.m < n;
    var c = modexp(data.m, data.e, n);
    S.label('c', { x: 140, y: Y, text: 'c = ' + c, anchor: 'start', size: 14, mono: true, style: 'new' });
    S.step(T('`encrypt(m, pub)`: `0 <= m < n`? EVET (aralık dışı değil). `c = m^e mod n = ' + data.m + '^' + data.e + ' mod ' + n + ' = ' + c + '`.',
              '`encrypt(m, pub)`: `0 <= m < n`? YES (not out of range). `c = m^e mod n = ' + data.m + '^' + data.e + ' mod ' + n + ' = ' + c + '`.'),
           { py: [10, 11, { n: 12, note: T('aralık dışı mı (NOT)? HAYIR', 'out of range (NOT)? NO') }, { n: 13, skip: true }, 14] });

    var back = modexp(c, d, n);
    S.label('back', { x: 280, y: Y, text: 'decrypt(c) = ' + back, anchor: 'start', size: 14, mono: true, style: back === data.m ? 'new' : 'del' });
    S.step(T('`decrypt(c, priv)`: `c^d mod n = ' + c + '^' + d + ' mod ' + n + ' = ' + back + '` (== `m`: ' + (back === data.m) + ').',
              '`decrypt(c, priv)`: `c^d mod n = ' + c + '^' + d + ' mod ' + n + ' = ' + back + '` (== `m`: ' + (back === data.m) + ').'),
           { py: [15, 16, 17] });

    var Y2 = Y + 40;
    var sig = modexp(data.m, d, n);
    S.label('sig', { x: 0, y: Y2, text: 'sign(m) = ' + sig, anchor: 'start', size: 14, mono: true, style: 'new' });
    S.step(T('`sign(m, priv)`: `m^d mod n = ' + data.m + '^' + d + ' mod ' + n + ' = ' + sig + '` (decrypt ile AYNI işlem, üsler sadece d).',
              '`sign(m, priv)`: `m^d mod n = ' + data.m + '^' + d + ' mod ' + n + ' = ' + sig + '` (the SAME operation as decrypt, just the exponent is d).'),
           { py: [18, 19, 20] });

    var recheckSig = sig, pubE = data.e, pubN = n, keyNote;
    if (data.tamper === 'flipsig') { recheckSig = (sig + 1) % n; keyNote = T('imza 1 artırıldı (kurcalandı)', 'the signature is incremented by 1 (tampered)'); }
    else if (data.tamper === 'wrongkey') { pubN = 97 * 101; pubE = 7; keyNote = T('YANLIŞ açık anahtarla doğrulanıyor', 'verifying with the WRONG public key'); }
    if (data.tamper !== 'none') {
      S.label('tamperNote', { x: 140, y: Y2, text: keyNote, anchor: 'start', size: 12, style: 'del' });
      S.step(T('SALDIRI: ' + keyNote.tr, 'ATTACK: ' + keyNote.en), { py: [] });
    }
    var recomputed = modexp(recheckSig, pubE, pubN);
    var ok = recomputed === data.m;
    S.result = reference(data);
    S.label('verify', { x: 0, y: Y2 + 24, text: 'verify = ' + ok, anchor: 'start', size: 14, bold: true, style: ok ? 'new' : 'del' });
    S.step(T('`verify(m, sig, pub)`: `sig^e mod n = ' + recomputed + '`; `== m (' + data.m + ')`? ' + (ok ? 'EVET → GEÇERLİ' : 'HAYIR → GEÇERSİZ') + '.',
              '`verify(m, sig, pub)`: `sig^e mod n = ' + recomputed + '`; `== m (' + data.m + ')`? ' + (ok ? 'YES → VALID' : 'NO → INVALID') + '.'),
           { py: [21, 22, 23] });
  }

  /** "Input size" = how many bits the private exponent d has — the real number of square-and-multiply
   * steps `pow(x, d, n)` performs, the largest computation this animation shows. */
  function bitLength(x) { return x <= 0 ? 1 : Math.floor(Math.log2(x)) + 1; }
  function sizeOf(data) {
    var phi = (data.p - 1) * (data.q - 1);
    return bitLength(modinv(data.e, phi));
  }

  D.define({
    id: 'rsa-toy',
    title: T('Oyuncak RSA: üretim, şifreleme, imzalama, doğrulama (rsa_toy.py)', 'Toy RSA: keygen, encrypt, sign, verify (rsa_toy.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-classic', level: 'normal',
        name: T('Uyar: klasik örnek (p=61, q=53, e=17)', 'Fits: the classic example (p=61, q=53, e=17)'),
        data: mk(61, 53, 17, 65, 'none') },
      { id: 'hard-bigger', level: 'hard',
        name: T('Zor: daha büyük oyuncak asallar (p=101, q=113)', 'Hard: bigger toy primes (p=101, q=113)'),
        data: mk(101, 113, 3, 1234, 'none') },
      { id: 'edge-flipsig', level: 'edge',
        name: T('Uç durum: imza kurcalandı — doğrulama BAŞARISIZ', 'Edge case: signature tampered — verification FAILS'),
        data: mk(61, 53, 17, 65, 'flipsig') },
      { id: 'edge-wrongkey', level: 'edge',
        name: T('Uç durum: yanlış açık anahtarla doğrulama BAŞARISIZ', 'Edge case: verifying with the wrong public key FAILS'),
        data: mk(61, 53, 17, 65, 'wrongkey') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: sizeOf,
    random: function (level, r) {
      var pairs = [[61, 53], [101, 113], [131, 137], [149, 151], [163, 167], [173, 179], [191, 193], [197, 199]];
      var pair = pairs[D.randInt(r, 0, pairs.length - 1)];
      var es = [3, 5, 7, 11, 13, 17];
      var e = es[D.randInt(r, 0, es.length - 1)];
      var phi = (pair[0] - 1) * (pair[1] - 1);
      while (gcdInt(e, phi) !== 1) e += 2;
      var n = pair[0] * pair[1];
      var m = D.randInt(r, 2, n - 2);
      var tampers = level === 'easy' || level === 'normal' ? ['none', 'none', 'flipsig'] : ['none', 'flipsig', 'wrongkey'];
      var tamper = tampers[D.randInt(r, 0, tampers.length - 1)];
      return mk(pair[0], pair[1], e, m, tamper);
    },
    input: {
      hint: T('p,q,e,m,kurcalama (kurcalama: none/flipsig/wrongkey)', 'p,q,e,m,tamper (tamper: none/flipsig/wrongkey)'),
      format: function (data) { return [data.p, data.q, data.e, data.m, data.tamper].join(','); },
      parse: function (text) {
        var parts = String(text).split(',').map(function (s) { return s.trim(); });
        if (parts.length !== 5) throw T('Biçim: p,q,e,m,kurcalama olmalı (5 alan).', 'Format must be p,q,e,m,tamper (5 fields).');
        var p = +parts[0], q = +parts[1], e = +parts[2], m = +parts[3], tamper = parts[4].toLowerCase();
        if (!isPrime(p) || !isPrime(q)) throw T('p ve q asal olmalı.', 'p and q must be prime.');
        if (p === q) throw T('p ve q farklı olmalı.', 'p and q must be distinct.');
        var phi = (p - 1) * (q - 1);
        if (e < 3 || e >= phi || gcdInt(e, phi) !== 1) throw T('e, phi ile aralarında asal olmalı.', 'e must be coprime with phi.');
        if (m < 0 || m >= p * q) throw T('m, [0, n) aralığında olmalı.', 'm must be in [0, n).');
        if (['none', 'flipsig', 'wrongkey'].indexOf(tamper) < 0) throw T('kurcalama none, flipsig ya da wrongkey olmalı.', 'tamper must be none, flipsig, or wrongkey.');
        return mk(p, q, e, m, tamper);
      },
      bad: ['', '61,53,17,65', '60,53,17,65,none', '61,61,17,65,none', '61,53,4,65,none', '61,53,17,65,maybe']
    },
    reference: reference,
    build: build
  });

  function gcdInt(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
