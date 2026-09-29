// CEN429 — Week 10 — Demo 9 (code/week-10/09-ecdh-toy/ecdh_toy.py)
// The SAME Diffie–Hellman idea (Demo 8), with elliptic-curve POINT ADDITION instead of modular
// exponentiation: each side picks a private scalar k, sends k*G (G a fixed base point on a small
// curve), and both sides reach a*(b*G) == b*(a*G) — the same point — without ever sending a or b.
// Independently proposed by Neal Koblitz (1987) and Victor Miller (1985).
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    'def point_add(p1, p2, a=A, p=P):',                                  // 1
    '    if p1 is None:',                                                 // 2
    '        return p2',                                                 // 3
    '    if p2 is None:',                                                 // 4
    '        return p1',                                                 // 5
    '    x1, y1 = p1',                                                    // 6
    '    x2, y2 = p2',                                                    // 7
    '    if p1 == p2:',                                                   // 8
    '        m = (3 * x1 * x1 + a) * modinv(2 * y1, p) % p',              // 9
    '    else:',                                                          // 10
    '        m = (y2 - y1) * modinv((x2 - x1) % p, p) % p',               // 11
    '    x3 = (m * m - x1 - x2) % p',                                     // 12
    '    y3 = (m * (x1 - x3) - y1) % p',                                  // 13
    '    return (x3, y3)',                                                // 14
    'def scalar_mult(k, point, a=A, p=P):',                               // 15
    '    result = None',                                                  // 16
    '    addend = point',                                                 // 17
    '    while k > 0:',                                                   // 18
    '        if k & 1:',                                                  // 19
    '            result = point_add(result, addend, a, p)',               // 20
    '        addend = point_add(addend, addend, a, p)',                   // 21
    '        k >>= 1',                                                    // 22
    '    return result'                                                   // 23
  ];
  var A_ = 2, B_ = 2, P_ = 17;   // y^2 = x^3 + 2x + 2 (mod 17) — same curve as ecdh_toy.py

  function modinv(x, p) { var r = 1, b = ((x % p) + p) % p, e = p - 2; while (e > 0) { if (e & 1) r = (r * b) % p; b = (b * b) % p; e = Math.floor(e / 2); } return r; }
  function pointAdd(p1, p2) {
    if (p1 === null) return p2;
    if (p2 === null) return p1;
    var x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1], m;
    if (p1[0] === p2[0] && p1[1] === p2[1]) m = (3 * x1 * x1 + A_) * modinv(2 * y1, P_) % P_;
    else m = (((y2 - y1) % P_ + P_) % P_) * modinv(((x2 - x1) % P_ + P_) % P_, P_) % P_;
    var x3 = (((m * m - x1 - x2) % P_) + P_) % P_;
    var y3 = (((m * (x1 - x3) - y1) % P_) + P_) % P_;
    return [x3, y3];
  }
  function findGenerator() {
    for (var x = 0; x < P_; x++) {
      var rhs = (((x * x * x + A_ * x + B_) % P_) + P_) % P_;
      for (var y = 0; y < P_; y++) if ((y * y) % P_ === rhs) return [x, y];
    }
    throw new Error('no point found');
  }
  var G = findGenerator();

  /** Independent: repeated one-at-a-time addition (NOT double-and-add) — a different algorithm,
   * used only in reference(). */
  function repeatedAdd(k, point) { var result = null; for (var i = 0; i < k; i++) result = pointAdd(result, point); return result; }

  function fmt(pt) { return pt === null ? T('sonsuzluk noktası', 'point at infinity') : ('(' + pt[0] + ',' + pt[1] + ')'); }

  function mk(aPriv, bPriv, mitm, mPriv) { return { aPriv: aPriv, bPriv: bPriv, mitm: !!mitm, mPriv: mPriv || 0 }; }

  function reference(data) {
    var Apt = repeatedAdd(data.aPriv, G), Bpt = repeatedAdd(data.bPriv, G);
    if (!data.mitm) {
      var kA = repeatedAdd(data.aPriv, Bpt), kB = repeatedAdd(data.bPriv, Apt);
      return { A: Apt, B: Bpt, aliceKey: kA, bobKey: kB, match: fmt(kA) === fmt(kB) };
    }
    var Mpt = repeatedAdd(data.mPriv, G);
    var aliceKey = repeatedAdd(data.aPriv, Mpt), mallAlice = repeatedAdd(data.mPriv, Apt);
    var bobKey = repeatedAdd(data.bPriv, Mpt), mallBob = repeatedAdd(data.mPriv, Bpt);
    return { A: Apt, B: Bpt, M: Mpt, aliceKey: aliceKey, bobKey: bobKey,
             mallorySeesAlice: fmt(mallAlice) === fmt(aliceKey), mallorySeesBob: fmt(mallBob) === fmt(bobKey),
             match: fmt(aliceKey) === fmt(bobKey) };
  }

  /** Draws scalar_mult(k, point) exactly as the real right-to-left double-and-add loop runs: one
   * S.step per remaining bit of k, each iteration's while/if shown with its own {n, note}/{n, skip}. */
  function traceScalarMult(S, label, k, point, y) {
    var totalBits = Math.max(1, k.toString(2).length);
    S.label('trLbl', { x: -14, y: y, text: label, anchor: 'end', size: 12, mono: true });
    var result = null, addend = point, e = k;
    S.box('trRes', { x: 0, y: y, w: 80, h: 26, size: 11, text: fmt(result), style: 'new' });
    S.box('trAdd', { x: 100, y: y, w: 80, h: 26, size: 11, text: fmt(addend), style: 'dim' });
    for (var i = 0; i < totalBits; i++) {
      S.at(i);
      var willAdd = (e & 1) === 1;
      var newResult = willAdd ? pointAdd(result, addend) : result;
      var lines = [{ n: 18, note: T('kalan k > 0 mu? EVET', 'remaining k > 0? YES') },
                   willAdd
                     ? { n: 19, note: T('en sağdaki bit 1 mi? EVET → topla', 'rightmost bit is 1? YES -> add') }
                     : { n: 19, note: T('en sağdaki bit 1 mi? HAYIR → atla', 'rightmost bit is 1? NO -> skip') }];
      if (willAdd) lines.push(20); else lines.push({ n: 20, skip: true });
      lines.push(21, 22);
      S.set('trRes', { text: fmt(newResult), style: willAdd ? 'new' : 'dim' });
      result = newResult;
      addend = pointAdd(addend, addend);
      e = Math.floor(e / 2);
      S.set('trAdd', { text: fmt(addend) });
      S.step(T('adım ' + (i + 1) + '/' + totalBits + ': en sağdaki bit `' + (willAdd ? 1 : 0) + '`: ' + (willAdd ? '`result = point_add(result, addend)`' : 'toplama yok') + ', sonra `addend = point_add(addend, addend)` (ikiye katlama), `k >>= 1`.',
                'step ' + (i + 1) + '/' + totalBits + ': rightmost bit `' + (willAdd ? 1 : 0) + '`: ' + (willAdd ? '`result = point_add(result, addend)`' : 'no add') + ', then `addend = point_add(addend, addend)` (doubling), `k >>= 1`.'),
             { py: lines });
    }
    S.at(null);
    S.step(T('döngü bitti (kalan k = 0): `return result` = `' + fmt(result) + '`.',
              'loop ends (remaining k = 0): `return result` = `' + fmt(result) + '`.'),
           { py: [{ n: 18, note: T('kalan k > 0 mu? HAYIR', 'remaining k > 0? NO') }, 23] });
    S.remove('trLbl', 'trRes', 'trAdd');
    return result;
  }

  function build(S, data) {
    S.label('curve', { x: 0, y: -20, text: 'y^2 = x^3 + 2x + 2 (mod 17), G=' + fmt(G), anchor: 'start', bold: true, size: 13 });
    S.step(T('Sabit eğri: `y^2 = x^3 + 2x + 2 (mod 17)`; taban nokta `G=' + fmt(G) + '` (eğri üzerinde bulundu).',
              'Fixed curve: `y^2 = x^3 + 2x + 2 (mod 17)`; base point `G=' + fmt(G) + '` (found on the curve).'), { py: [] });

    var lanes = data.mitm ? [T('Alice', 'Alice'), T('Mallory', 'Mallory'), T('Bob', 'Bob')] : [T('Alice', 'Alice'), T('Bob', 'Bob')];
    var xs = data.mitm ? [0, 220, 440] : [0, 300];
    S.lifelines('ll', { x: xs, labels: lanes, y0: 30, y1: 260 });

    // message() draws its text in a small FIXED-width pill -- a point like "(11,3)" would overflow
    // it and show the arrow line through the text, so the arrow only carries a short letter, and the
    // real point goes in an ordinary (auto-sized) label placed just above the arrow.
    var Apt = traceScalarMult(S, 'A = a*G', data.aPriv, G, 300);
    S.message('mA', { x1: xs[0], x2: xs[xs.length - 1], y: 50, text: 'A', style: 'active' });
    S.label('mAval', { x: (xs[0] + xs[xs.length - 1]) / 2, y: 38, text: 'A=' + fmt(Apt), anchor: 'middle', size: 12, bold: true, mono: true });
    S.step(T('`scalar_mult(a, G)` — Alice `A=' + fmt(Apt) + '` noktasını gönderiyor.', '`scalar_mult(a, G)` — Alice sends the point `A=' + fmt(Apt) + '`.'), { py: [15, 16, 17] });

    var Bpt = repeatedAddNaive(data.bPriv);
    S.message('mB', { x1: xs[xs.length - 1], x2: xs[0], y: 80, text: 'B', style: 'hl' });
    S.label('mBval', { x: (xs[0] + xs[xs.length - 1]) / 2, y: 95, text: 'B=' + fmt(Bpt), anchor: 'middle', size: 12, bold: true, mono: true });
    S.step(T('`scalar_mult(b, G)` — Bob `B=' + fmt(Bpt) + '` noktasını gönderiyor.', '`scalar_mult(b, G)` — Bob sends the point `B=' + fmt(Bpt) + '`.'), { py: [15, 16, 17] });

    S.result = reference(data);

    if (!data.mitm) {
      var kA = repeatedAddNaive2(data.aPriv, Bpt), kB = repeatedAddNaive2(data.bPriv, Apt);
      S.label('kA', { x: xs[0], y: 330, text: 'key=' + fmt(kA), anchor: 'middle', size: 12, bold: true });
      S.label('kB', { x: xs[1], y: 330, text: 'key=' + fmt(kB), anchor: 'middle', size: 12, bold: true });
      S.step(T('Alice `a*B=' + fmt(kA) + '`, Bob `b*A=' + fmt(kB) + '` hesaplıyor; aynı nokta mı? ' + (fmt(kA) === fmt(kB) ? 'EVET' : 'HAYIR') + '.',
                'Alice computes `a*B=' + fmt(kA) + '`, Bob computes `b*A=' + fmt(kB) + '`; the same point? ' + (fmt(kA) === fmt(kB) ? 'YES' : 'NO') + '.'), { py: [15, 16, 17] });
    } else {
      var Mpt = repeatedAddNaive(data.mPriv);
      S.message('mM1', { x1: xs[1], x2: xs[0], y: 110, text: 'M', style: 'del' });
      S.label('mM1val', { x: (xs[0] + xs[1]) / 2, y: 98, text: T('M=' + fmt(Mpt) + ' (A yerine)', 'M=' + fmt(Mpt) + ' (instead of A)'), anchor: 'middle', size: 11, bold: true, mono: true });
      S.message('mM2', { x1: xs[1], x2: xs[2], y: 140, text: 'M', style: 'del' });
      S.label('mM2val', { x: (xs[1] + xs[2]) / 2, y: 155, text: T('M=' + fmt(Mpt) + ' (B yerine)', 'M=' + fmt(Mpt) + ' (instead of B)'), anchor: 'middle', size: 11, bold: true, mono: true });
      S.step(T('SALDIRI: Mallory her iki yöne de KENDİ `M=' + fmt(Mpt) + '` noktasını gönderiyor.',
                'ATTACK: Mallory sends her OWN point `M=' + fmt(Mpt) + '` in both directions.'), { py: [] });
      var aliceKey = repeatedAddNaive2(data.aPriv, Mpt), mallAlice = repeatedAddNaive2(data.mPriv, Apt);
      var bobKey = repeatedAddNaive2(data.bPriv, Mpt), mallBob = repeatedAddNaive2(data.mPriv, Bpt);
      S.label('kA2', { x: xs[0], y: 330, text: 'Alice key=' + fmt(aliceKey), anchor: 'middle', size: 11, bold: true });
      S.label('kM', { x: xs[1], y: 330, text: 'Mallory/A=' + fmt(mallAlice) + ', /B=' + fmt(mallBob), anchor: 'middle', size: 10 });
      S.label('kB2', { x: xs[2], y: 330, text: 'Bob key=' + fmt(bobKey), anchor: 'middle', size: 11, bold: true });
      S.step(T('Alice `a*M=' + fmt(aliceKey) + '` (Mallory `m*A=' + fmt(mallAlice) + '` ile EŞİT: ' + (fmt(aliceKey) === fmt(mallAlice)) + '); Bob `b*M=' + fmt(bobKey) + '` (Mallory `m*B=' + fmt(mallBob) + '` ile EŞİT: ' + (fmt(bobKey) === fmt(mallBob)) + ').',
                'Alice computes `a*M=' + fmt(aliceKey) + '` (EQUAL to Mallory\'s `m*A=' + fmt(mallAlice) + '`: ' + (fmt(aliceKey) === fmt(mallAlice)) + '); Bob computes `b*M=' + fmt(bobKey) + '` (EQUAL to Mallory\'s `m*B=' + fmt(mallBob) + '`: ' + (fmt(bobKey) === fmt(mallBob)) + ').'), { py: [15, 16, 17] });
      S.step(T('Alice anahtarı (' + fmt(aliceKey) + ') ile Bob anahtarı (' + fmt(bobKey) + ') DOĞRUDAN eşit mi? ' + (fmt(aliceKey) === fmt(bobKey) ? 'EVET' : 'HAYIR') + ' — ikisi de Mallory ile konuşuyor.',
                'Is Alice\'s key (' + fmt(aliceKey) + ') DIRECTLY equal to Bob\'s (' + fmt(bobKey) + ')? ' + (fmt(aliceKey) === fmt(bobKey) ? 'YES' : 'NO') + ' — both are really talking to Mallory.'), { py: [] });
    }
  }

  function repeatedAddNaive(k) { var r = null; for (var i = 0; i < k; i++) r = pointAdd(r, G); return r; }
  function repeatedAddNaive2(k, point) { var r = null; for (var i = 0; i < k; i++) r = pointAdd(r, point); return r; }

  D.define({
    id: 'ecdh-toy',
    title: T('ECDH: küçük bir eğri üzerinde nokta toplama (ecdh_toy.py)', 'ECDH: point addition on a tiny curve (ecdh_toy.py)'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'normal-small', level: 'normal', small: true,
        name: T('Uyar: küçük özel değerler, saldırı yok', 'Fits: small private values, no attack'),
        data: mk(3, 5, false) },
      { id: 'hard-bigger', level: 'hard',
        name: T('Zor: büyük özel değerler (çok daha fazla adım)', 'Hard: large private values (many more steps)'),
        data: mk(731, 917, false) },
      { id: 'edge-mitm', level: 'edge',
        name: T('Uç durum: Mallory araya giriyor — iki farklı anahtar', 'Edge case: Mallory intercepts — two different keys'),
        data: mk(823, 1117, true, 619) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return Math.max(1, data.aPriv.toString(2).length); },
    random: function (level, r) {
      var a = level === 'easy' || level === 'normal' ? D.randInt(r, 512, 1023) : D.randInt(r, 1024, 4095);
      var b = level === 'easy' || level === 'normal' ? D.randInt(r, 512, 1023) : D.randInt(r, 1024, 4095);
      var mitm = level === 'extreme' ? true : (level === 'hard' ? D.randInt(r, 0, 1) === 1 : false);
      var m = mitm ? D.randInt(r, 512, 4095) : 0;
      return mk(a, b, mitm, m);
    },
    input: {
      hint: T('a,b,mitm[,m] (mitm: 0/1)', 'a,b,mitm[,m] (mitm: 0/1)'),
      format: function (data) { return [data.aPriv, data.bPriv, data.mitm ? 1 : 0, data.mPriv].join(','); },
      tokens: function (data) { var len = Math.max(1, data.aPriv.toString(2).length), out = []; for (var i = 0; i < len; i++) out.push('bit' + i); return out; },
      parse: function (text) {
        var parts = String(text).split(',').map(function (s) { return s.trim(); });
        if (parts.length !== 4) throw T('Biçim: a,b,mitm,m olmalı (4 alan).', 'Format must be a,b,mitm,m (4 fields).');
        var a = +parts[0], b = +parts[1], mitm = parts[2] === '1', m = +parts[3];
        if (!(a >= 1 && a < 100000)) throw T('a, [1, 100000) aralığında olmalı.', 'a must be in [1, 100000).');
        if (!(b >= 1 && b < 100000)) throw T('b, [1, 100000) aralığında olmalı.', 'b must be in [1, 100000).');
        if (mitm && !(m >= 1 && m < 100000)) throw T('mitm=1 ise m, [1, 100000) aralığında olmalı.', 'if mitm=1, m must be in [1, 100000).');
        return mk(a, b, mitm, m);
      },
      bad: ['', '3,5,0', '0,5,0,0', '3,-1,0,0', '3,5,1,0', 'x,5,0,0']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
