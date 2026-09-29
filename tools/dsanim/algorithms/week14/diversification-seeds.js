// CEN429 — Week 14 — Demo 1 (code/week-14/01-source-to-source/fallback_transform.py)
// Same source, different SEEDS -> different bytes, SAME behavior. Every seed derives its own XOR
// mask for the encoded token; the mask changes every byte fallback_transform.py writes, even though
// grant_access() still answers every token exactly the same way (see pipeline_check.py's semantic-
// equivalence check, which is the automated version of what this animation shows by hand).
(function (D) {
  'use strict';
  var T = D.T;

  // Real lines from fallback_transform.py's transform() — the exact formula that makes two seeds
  // produce different bytes.
  var PY = [
    'mask = (seed * 2654435761) >> 24 & 0xFF',
    'q = (seed * 40503) & 0x3F',
    'token_bytes = [ord(c) ^ mask for c in "CEN429-OK"]'
  ];
  var TOKEN = 'CEN429-OK';

  function deriveMask(seed) { return (seed * 2654435761) >>> 24 & 0xFF; }
  function deriveQ(seed) { return (seed * 40503) & 0x3F; }
  function encode(seed) {
    var mask = deriveMask(seed), out = [];
    for (var i = 0; i < TOKEN.length; i++) out.push(TOKEN.charCodeAt(i) ^ mask);
    return out;
  }

  function mk(seeds) { return { seeds: seeds.slice() }; }

  function reference(data) {
    var seeds = data.seeds, pairs = [];
    for (var i = 0; i < seeds.length; i++)
      for (var j = i + 1; j < seeds.length; j++) {
        var ei = encode(seeds[i]), ej = encode(seeds[j]);
        var diff = 0;
        for (var k = 0; k < ei.length; k++) if (ei[k] !== ej[k]) diff++;
        pairs.push({ i: i, j: j, diffBytes: diff, identical: diff === 0 });
      }
    return { pairs: pairs, anyIdentical: pairs.some(function (p) { return p.identical; }) };
  }

  function build(S, data) {
    var seeds = data.seeds, n = seeds.length;
    var ROW_Y = 70;
    S.label('lbl', { x: 0, y: -18, text: T('Aynı kaynak, farklı tohumlar', 'Same source, different seeds'), anchor: 'start', bold: true, size: 15 });
    S.step(T('`fallback_transform.py`, tohumdan bir XOR maskesi türetir (Tigress\'te `--Seed` aynı işi görür).',
              "`fallback_transform.py` derives an XOR mask from the seed (Tigress's `--Seed` does the same job)."),
      { py: [1] });

    var encoded = [];
    for (var s = 0; s < n; s++) {
      var seed = seeds[s], mask = deriveMask(seed), q = deriveQ(seed), bytes = encode(seed);
      encoded.push(bytes);
      S.label('seedLbl' + s, { x: 0, y: ROW_Y + s * 90 - 22, text: T('tohum ' + seed + ':', 'seed ' + seed + ':'), anchor: 'start', bold: true, size: 13 });
      S.box('maskBox' + s, { x: 0, y: ROW_Y + s * 90, w: 110, h: 28, size: 12, text: 'mask=0x' + mask.toString(16), style: 'active' });
      S.box('qBox' + s, { x: 120, y: ROW_Y + s * 90, w: 90, h: 28, size: 12, text: 'q=' + q, style: 'active' });
      var memBytes = bytes.map(function (v) { return { value: v }; });
      S.memRow('m' + s, memBytes, { x: 230, y: ROW_Y + s * 90, w: 26, h: 28, size: 11, addrs: false });
      if (s < 3)
        S.step(T('tohum ' + seed + ': mask=0x' + mask.toString(16) + ', q=' + q + ' -> ' + bytes.length + ' kodlanmış bayt.',
                  'seed ' + seed + ': mask=0x' + mask.toString(16) + ', q=' + q + ' -> ' + bytes.length + ' encoded byte(s).'),
          { py: [2, { n: 3, note: T('bu tohum için kaç bayt? ' + bytes.length, 'how many bytes for this seed? ' + bytes.length) }] });
    }

    // Pairwise comparison, first pair in detail.
    var ref = reference(data);
    for (var p = 0; p < ref.pairs.length; p++) {
      var pr = ref.pairs[p];
      for (var k = 0; k < TOKEN.length; k++) {
        var same = encoded[pr.i][k] === encoded[pr.j][k];
        S.set('m' + pr.i + k, { style: same ? 'dim' : 'del' });
        S.set('m' + pr.j + k, { style: same ? 'dim' : 'del' });
      }
      if (p === 0)
        S.step(T('tohum ' + seeds[pr.i] + ' ile tohum ' + seeds[pr.j] + ' karşılaştırılıyor: ' + pr.diffBytes + '/' + TOKEN.length + ' bayt farklı.',
                  'Comparing seed ' + seeds[pr.i] + ' with seed ' + seeds[pr.j] + ': ' + pr.diffBytes + '/' + TOKEN.length + ' byte(s) differ.'), {});
    }

    if (ref.anyIdentical)
      S.step(T('UYARI: en az bir tohum çifti AYNI baytları üretti — tohum yanlışlıkla değiştirilmemiş olabilir (bölüm 9\'daki sürüm-başı-tohum kuralını hatırlayın).',
                'WARNING: at least one seed pair produced IDENTICAL bytes — the seed may not have been changed by mistake (recall §9\'s one-seed-per-release rule).'), {});
    else
      S.step(T('Her tohum çifti farklı bayt üretti; davranış (GRANTED/DENIED) hepsinde aynı kalır — yalnız kodlama değişir.',
                'Every seed pair produced different bytes; behavior (GRANTED/DENIED) stays the same in all of them — only the encoding changes.'), {});

    S.result = ref;
  }

  D.define({
    id: 'diversification-seeds',
    title: T('Tohumla çeşitlendirme: aynı kaynak, farklı bayt, aynı davranış',
              'Diversification with seeds: same source, different bytes, same behavior'),
    code: function () { return { py: PY }; },
    presets: [
      { id: 'three-seeds', level: 'normal', name: T('Normal: üç tohum (1001, 2002, 3003), üçü de farklı', 'Normal: three seeds (1001, 2002, 3003), all different'),
        data: mk([1001, 2002, 3003]) },
      { id: 'small-seeds', level: 'hard', name: T('Zor: küçük, birbirine yakın tohumlar (1, 2, 3) — yine de farklı', 'Hard: small, close-together seeds (1, 2, 3) — still different'),
        data: mk([1, 2, 3]) },
      { id: 'edge-same-seed-twice', level: 'edge', name: T('Uç durum: aynı tohum iki kez kullanılmış (unutma hatası)', 'Edge case: the same seed reused twice (a forgotten-bump mistake)'),
        data: mk([1001, 1001]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.seeds.length * TOKEN.length; },
    random: function (level, r) {
      var n = { easy: 2, normal: 3, hard: 3, extreme: 4 }[level] || 2;
      // capped well under 2^53/2654435761 so seed*2654435761 stays exact in JS float arithmetic
      // (fallback_transform.py itself uses Python's arbitrary-precision ints, so it has no such cap)
      var hi = { easy: 50, normal: 9999, hard: 999999, extreme: 1500000 }[level] || 9999;
      var seeds = [];
      for (var i = 0; i < n; i++) seeds.push(D.randInt(r, 0, hi));
      // rarely (1 in 8), force a repeat -- exercises the "forgot to bump the seed" edge deliberately
      if (D.randInt(r, 0, 7) === 0 && seeds.length > 1) seeds[1] = seeds[0];
      return mk(seeds);
    },
    input: {
      hint: T('seeds=1001,2002,3003', 'seeds=1001,2002,3003'),
      format: function (data) { return 'seeds=' + data.seeds.join(','); },
      parse: function (text) {
        var m = String(text).trim().match(/^seeds=(\d+(,\d+)*)$/);
        if (!m) throw T('Biçim: "seeds=1001,2002,…" olmalı (en az 2 tohum).', 'Format must be "seeds=1001,2002,…" (at least 2 seeds).');
        var seeds = m[1].split(',').map(function (t) { return parseInt(t, 10); });
        if (seeds.length < 2) throw T('En az 2 tohum gerekir (karşılaştırma için).', 'At least 2 seeds are required (to compare).');
        return mk(seeds);
      },
      bad: ['', 'seeds=', 'seeds=1001', 'seeds=1001,abc', 'seeds=-1,2']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
