// CEN429 — Week 10 — Demo 8 (code/week-10/08-diffie-hellman/dh_toy.py)
// Diffie–Hellman (Diffie and Hellman, 1976): Alice and Bob each pick a private exponent, exchange
// g^private mod p, and both reach the SAME shared secret from the other side's public value, without
// ever transmitting their own exponent. Unauthenticated, this exchange trusts whichever public value
// arrives — an active attacker (Mallory) who substitutes her own public value toward BOTH sides ends
// up sharing a DIFFERENT key with each of them, and can read/re-encrypt everything between them.
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    'def modexp(base, exp, mod):',                       // 1
    '    result = 1',                                     // 2
    '    base %= mod',                                    // 3
    '    while exp > 0:',                                 // 4
    '        if exp & 1:',                                // 5
    '            result = (result * base) % mod',         // 6
    '        base = (base * base) % mod',                 // 7
    '        exp >>= 1',                                  // 8
    '    return result',                                  // 9
    'def public_value(private, g, p):',                   // 10
    '    return modexp(g, private, p)',                   // 11
    'def shared_secret(their_public, my_private, p):',    // 12
    '    return modexp(their_public, my_private, p)'      // 13
  ];

  function modexp(base, exp, mod) { var r = 1; base = base % mod; while (exp > 0) { if (exp & 1) r = (r * base) % mod; base = (base * base) % mod; exp = Math.floor(exp / 2); } return r; }
  /** Independent: recursive fast exponentiation (a different code shape/algorithm from build()'s
   * explicit iterative bit-trace) used only in reference(). */
  function modexpRec(base, exp, mod) {
    if (exp === 0) return 1 % mod;
    var half = modexpRec(base, Math.floor(exp / 2), mod);
    var sq = (half * half) % mod;
    return (exp % 2 === 1) ? (sq * (base % mod)) % mod : sq;
  }

  function mk(p, g, aPriv, bPriv, mitm, mPriv) { return { p: p, g: g, aPriv: aPriv, bPriv: bPriv, mitm: !!mitm, mPriv: mPriv || 0 }; }

  function reference(data) {
    var A = modexpRec(data.g, data.aPriv, data.p);
    var B = modexpRec(data.g, data.bPriv, data.p);
    if (!data.mitm) {
      var kA = modexpRec(B, data.aPriv, data.p), kB = modexpRec(A, data.bPriv, data.p);
      return { A: A, B: B, aliceKey: kA, bobKey: kB, match: kA === kB };
    }
    var M = modexpRec(data.g, data.mPriv, data.p);
    var aliceKey = modexpRec(M, data.aPriv, data.p);
    var mallToAlice = modexpRec(A, data.mPriv, data.p);
    var mallToBob = modexpRec(B, data.mPriv, data.p);
    var bobKey = modexpRec(M, data.bPriv, data.p);
    return { A: A, B: B, M: M, aliceKey: aliceKey, bobKey: bobKey,
             mallorySeesAlice: mallToAlice === aliceKey, mallorySeesBob: mallToBob === bobKey,
             match: aliceKey === bobKey };
  }

  /** Draws a full bit-by-bit trace of modexp(base, exp, mod), following the REAL loop exactly:
   * right-to-left (least-significant bit first), `exp` shrinking by one bit each iteration via
   * `exp >>= 1` — the same order dh_toy.py's own while/if loop actually executes in. One S.step per
   * remaining bit of exp, every iteration's while/if shown with its own {n, note}/{n, skip}. */
  function traceModexp(S, label, base, exp, mod, y) {
    var totalBits = Math.max(1, exp.toString(2).length);
    S.label('trLbl', { x: -14, y: y, text: label, anchor: 'end', size: 12, mono: true });
    var result = 1, b = base % mod, e = exp;
    S.box('trRes', { x: 0, y: y, w: 70, h: 26, size: 12, text: String(result), style: 'new' });
    S.box('trBase', { x: 90, y: y, w: 70, h: 26, size: 12, text: String(b), style: 'dim' });
    for (var i = 0; i < totalBits; i++) {
      S.at(i);
      var willMultiply = (e & 1) === 1;
      var newResult = willMultiply ? (result * b) % mod : result;
      var lines = [{ n: 4, note: T('kalan üs > 0 mu? EVET', 'remaining exp > 0? YES') },
                   willMultiply
                     ? { n: 5, note: T('en sağdaki bit 1 mi? EVET → çarp', 'rightmost bit is 1? YES -> multiply') }
                     : { n: 5, note: T('en sağdaki bit 1 mi? HAYIR → atla', 'rightmost bit is 1? NO -> skip') }];
      if (willMultiply) lines.push(6); else lines.push({ n: 6, skip: true });
      lines.push(7, 8);
      S.set('trRes', { text: String(newResult), style: willMultiply ? 'new' : 'dim' });
      result = newResult;
      b = (b * b) % mod;
      e = Math.floor(e / 2);
      S.set('trBase', { text: String(b) });
      S.step(T('adım ' + (i + 1) + '/' + totalBits + ': en sağdaki bit `' + (willMultiply ? 1 : 0) + '`: ' + (willMultiply ? '`result = result*base mod p`' : 'çarpma yok') + ', sonra `base=base^2 mod p`, `exp >>= 1`.',
                'step ' + (i + 1) + '/' + totalBits + ': rightmost bit `' + (willMultiply ? 1 : 0) + '`: ' + (willMultiply ? '`result = result*base mod p`' : 'no multiply') + ', then `base=base^2 mod p`, `exp >>= 1`.'),
             { py: lines });
    }
    S.at(null);
    S.step(T('döngü bitti (kalan üs = 0): `return result` = `' + result + '`.',
              'loop ends (remaining exp = 0): `return result` = `' + result + '`.'),
           { py: [{ n: 4, note: T('kalan üs > 0 mu? HAYIR', 'remaining exp > 0? NO') }, 9] });
    S.remove('trLbl', 'trRes', 'trBase');
    return result;
  }

  function build(S, data) {
    S.label('params', { x: 0, y: -20, text: 'p=' + data.p + ', g=' + data.g, anchor: 'start', bold: true, size: 14 });
    S.step(T('Ortak parametreler: `p=' + data.p + '` (mod), `g=' + data.g + '` (üreteç).',
              'Public parameters: `p=' + data.p + '` (modulus), `g=' + data.g + '` (generator).'), { py: [] });

    var lanes = data.mitm ? [T('Alice', 'Alice'), T('Mallory', 'Mallory'), T('Bob', 'Bob')] : [T('Alice', 'Alice'), T('Bob', 'Bob')];
    var xs = data.mitm ? [0, 220, 440] : [0, 300];
    S.lifelines('ll', { x: xs, labels: lanes, y0: 40, y1: 320 });

    // message() draws its text in a small FIXED-width pill -- long numbers would overflow it and
    // show the arrow line through the text, so the arrow itself only carries a short letter, and the
    // real value goes in an ordinary (auto-sized) label placed just above the arrow.
    var A = traceModexp(S, 'A = g^a mod p', data.g, data.aPriv, data.p, 380);
    S.message('mA', { x1: xs[0], x2: xs[xs.length - 1], y: 60, text: 'A', style: 'active' });
    S.label('mAval', { x: (xs[0] + xs[xs.length - 1]) / 2, y: 48, text: 'A=' + A, anchor: 'middle', size: 13, bold: true, mono: true });
    S.step(T('`public_value(a, g, p)` — Alice `A=' + A + '` değerini gönderiyor.', '`public_value(a, g, p)` — Alice sends `A=' + A + '`.'), { py: [10, 11] });

    var B = modexp(data.g, data.bPriv, data.p);
    S.message('mB', { x1: xs[xs.length - 1], x2: xs[0], y: 90, text: 'B', style: 'hl' });
    S.label('mBval', { x: (xs[0] + xs[xs.length - 1]) / 2, y: 105, text: 'B=' + B, anchor: 'middle', size: 13, bold: true, mono: true });
    S.step(T('`public_value(b, g, p)` — Bob `B=' + B + '` değerini gönderiyor.', '`public_value(b, g, p)` — Bob sends `B=' + B + '`.'), { py: [10, 11] });

    S.result = reference(data);

    if (!data.mitm) {
      var kA = modexp(B, data.aPriv, data.p), kB = modexp(A, data.bPriv, data.p);
      S.label('kA', { x: xs[0], y: 350, text: 'key=' + kA, anchor: 'middle', size: 13, bold: true });
      S.label('kB', { x: xs[1], y: 350, text: 'key=' + kB, anchor: 'middle', size: 13, bold: true });
      S.step(T('`shared_secret(...)` — Alice `B^a mod p = ' + kA + '`, Bob `A^b mod p = ' + kB + '`; eşit mi? ' + (kA === kB ? 'EVET' : 'HAYIR') + '.',
                '`shared_secret(...)` — Alice `B^a mod p = ' + kA + '`, Bob `A^b mod p = ' + kB + '`; equal? ' + (kA === kB ? 'YES' : 'NO') + '.'), { py: [12, 13] });
    } else {
      var M = modexp(data.g, data.mPriv, data.p);
      S.message('mM1', { x1: xs[1], x2: xs[0], y: 120, text: 'M', style: 'del' });
      S.label('mM1val', { x: (xs[0] + xs[1]) / 2, y: 108, text: T('M=' + M + ' (A yerine)', 'M=' + M + ' (instead of A)'), anchor: 'middle', size: 12, bold: true, mono: true });
      S.message('mM2', { x1: xs[1], x2: xs[2], y: 150, text: 'M', style: 'del' });
      S.label('mM2val', { x: (xs[1] + xs[2]) / 2, y: 165, text: T('M=' + M + ' (B yerine)', 'M=' + M + ' (instead of B)'), anchor: 'middle', size: 12, bold: true, mono: true });
      S.step(T('SALDIRI: Mallory her iki yöne de KENDİ `M=' + M + '` değerini gönderiyor — A da B de asla karşı tarafa ulaşmıyor.',
                'ATTACK: Mallory sends her OWN `M=' + M + '` in both directions — neither A nor B ever reaches the other side.'), { py: [] });

      var aliceKey = modexp(M, data.aPriv, data.p);
      var mallAlice = modexp(A, data.mPriv, data.p);
      S.label('kA2', { x: xs[0], y: 350, text: 'Alice key=' + aliceKey, anchor: 'middle', size: 12, bold: true });
      S.label('kM1', { x: xs[1], y: 350, text: 'Mallory/A key=' + mallAlice, anchor: 'middle', size: 12 });
      S.step(T('Alice `M^a mod p = ' + aliceKey + '` hesaplıyor; Mallory `A^m mod p = ' + mallAlice + '` hesaplıyor — EŞİT: ' + (aliceKey === mallAlice) + '.',
                'Alice computes `M^a mod p = ' + aliceKey + '`; Mallory computes `A^m mod p = ' + mallAlice + '` — EQUAL: ' + (aliceKey === mallAlice) + '.'), { py: [12, 13] });

      var bobKey = modexp(M, data.bPriv, data.p);
      var mallBob = modexp(B, data.mPriv, data.p);
      S.label('kB2', { x: xs[2], y: 370, text: 'Bob key=' + bobKey, anchor: 'middle', size: 12, bold: true });
      S.label('kM2', { x: xs[1], y: 370, text: 'Mallory/B key=' + mallBob, anchor: 'middle', size: 12 });
      S.step(T('Bob `M^b mod p = ' + bobKey + '` hesaplıyor; Mallory `B^m mod p = ' + mallBob + '` hesaplıyor — EŞİT: ' + (bobKey === mallBob) + '.',
                'Bob computes `M^b mod p = ' + bobKey + '`; Mallory computes `B^m mod p = ' + mallBob + '` — EQUAL: ' + (bobKey === mallBob) + '.'), { py: [12, 13] });

      S.step(T('Alice anahtarı (' + aliceKey + ') ile Bob anahtarı (' + bobKey + ') DOĞRUDAN eşit mi? ' + (aliceKey === bobKey ? 'EVET' : 'HAYIR') + ' — ikisi de aslında Mallory ile konuşuyor.',
                'Is Alice\'s key (' + aliceKey + ') DIRECTLY equal to Bob\'s key (' + bobKey + ')? ' + (aliceKey === bobKey ? 'YES' : 'NO') + ' — both are really talking to Mallory.'), { py: [] });
    }
  }

  D.define({
    id: 'diffie-hellman-mitm',
    title: T('Diffie–Hellman anahtar değişimi ve ortadaki adam (dh_toy.py)', 'Diffie–Hellman key exchange and the man-in-the-middle (dh_toy.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-classic', level: 'normal', small: true,
        name: T('Uyar: klasik örnek (p=23, g=5), saldırı yok', 'Fits: the classic example (p=23, g=5), no attack'),
        data: mk(23, 5, 6, 15, false) },
      { id: 'hard-bigger', level: 'hard',
        name: T('Zor: daha büyük oyuncak mod (p=2003), saldırı yok', 'Hard: a bigger toy modulus (p=2003), no attack'),
        data: mk(2003, 2, 731, 917, false) },
      { id: 'edge-mitm', level: 'edge',
        name: T('Uç durum: Mallory araya giriyor — iki farklı anahtar', 'Edge case: Mallory intercepts — two different keys'),
        data: mk(3001, 2, 823, 1117, true, 619) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return Math.max(1, data.aPriv.toString(2).length); },
    random: function (level, r) {
      var mods = level === 'easy' ? [[1009, 2], [1013, 3]] : level === 'normal' ? [[2003, 2], [2011, 3]] : level === 'hard' ? [[2003, 2], [3001, 2], [3011, 3]] : [[3001, 2], [3011, 3]];
      var pg = mods[D.randInt(r, 0, mods.length - 1)];
      var p = pg[0], g = pg[1];
      // a >= 512 guarantees bitLength(a) >= 10 at every level (this is the traced exponent -> size())
      var a = D.randInt(r, 512, p - 3), b = D.randInt(r, 512, p - 3);
      var mitm = level === 'extreme' ? true : (level === 'hard' ? D.randInt(r, 0, 1) === 1 : false);
      var m = mitm ? D.randInt(r, 512, p - 3) : 0;
      return mk(p, g, a, b, mitm, m);
    },
    input: {
      hint: T('p,g,a,b,mitm[,m] (mitm: 0/1)', 'p,g,a,b,mitm[,m] (mitm: 0/1)'),
      format: function (data) { return [data.p, data.g, data.aPriv, data.bPriv, data.mitm ? 1 : 0, data.mPriv].join(','); },
      tokens: function (data) { var len = Math.max(1, data.aPriv.toString(2).length), out = []; for (var i = 0; i < len; i++) out.push('bit' + i); return out; },
      parse: function (text) {
        var parts = String(text).split(',').map(function (s) { return s.trim(); });
        if (parts.length !== 6) throw T('Biçim: p,g,a,b,mitm,m olmalı (6 alan).', 'Format must be p,g,a,b,mitm,m (6 fields).');
        var p = +parts[0], g = +parts[1], a = +parts[2], b = +parts[3], mitm = parts[4] === '1', m = +parts[5];
        if (!(p > 4)) throw T('p en az 5 olmalı.', 'p must be at least 5.');
        if (!(g >= 2 && g < p)) throw T('g, [2, p) aralığında olmalı.', 'g must be in [2, p).');
        if (!(a >= 2 && a <= p - 2)) throw T('a, [2, p-2] aralığında olmalı.', 'a must be in [2, p-2].');
        if (!(b >= 2 && b <= p - 2)) throw T('b, [2, p-2] aralığında olmalı.', 'b must be in [2, p-2].');
        if (mitm && !(m >= 2 && m <= p - 2)) throw T('mitm=1 ise m, [2, p-2] aralığında olmalı.', 'if mitm=1, m must be in [2, p-2].');
        return mk(p, g, a, b, mitm, m);
      },
      bad: ['', '23,5,6,15,0', '3,5,6,15,0,0', '23,5,1,15,0,0', '23,5,6,30,0,0', '23,5,6,15,1,0']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
