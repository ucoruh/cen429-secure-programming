// CEN429 — Week 14 — Demo 1 (code/week-14/01-source-to-source/demo.sh, STEP 4/5)
// Measuring obfuscation and diversification: size, instruction/branch count and byte-similarity,
// for the original program and two diversified variants. Cost (instructions, jumps) is roughly
// SEED-INDEPENDENT (the same transforms ran); size and similarity are SEED-DEPENDENT (the encoded
// bytes differ per seed) — the two-part lesson of docs/week-14 §7. "Seed 0" stands in for the
// original, unobfuscated program: fallback_transform.py's own mask formula gives mask=0 at seed=0,
// so its "encoded" bytes are just the plain token, unchanged — no special case needed.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'echo "  original  : $(cost "$B/source")"',
    'echo "  seed 1001 : $(cost variant_1001)"',
    'echo "  seed 2002 : $(cost variant_2002)"',
    'if cmp -s variant_1001 variant_2002; then',
    '  echo "  -> Binaries are identical (unexpected)."',
    'else',
    '  diffcount=$(cmp -l variant_1001 variant_2002 2>/dev/null | wc -l)',
    '  echo "  -> Binaries are DIFFERENT: ~$diffcount bytes apart, same behavior. A patch written into one copy does not work on the other."',
    'fi'
  ];
  var TOKEN = 'CEN429-OK';
  var METRICS = ['instructions', 'jumps/calls', 'size (bytes, example)', 'similarity to original'];

  function deriveMask(seed) { return (seed * 2654435761) >>> 24 & 0xFF; }
  function encode(seed) {
    var mask = deriveMask(seed), out = [];
    for (var i = 0; i < TOKEN.length; i++) out.push(TOKEN.charCodeAt(i) ^ mask);
    return out;
  }
  function similarityPct(seed) {
    var a = encode(0), b = encode(seed), matches = 0;
    for (var i = 0; i < a.length; i++) if (a[i] === b[i]) matches++;
    return Math.round(100 * matches / a.length);
  }

  function mk(seedA, seedB) { return { seeds: [seedA, seedB] }; }

  /** table[metric][variant]; variant 0 = original (seed 0), 1/2 = the two diversified seeds. */
  function table(data) {
    var all = [0].concat(data.seeds);
    var instr = all.map(function (s) { return s === 0 ? 28 : 51; });          // example numbers, README.md's own
    var jumps = all.map(function (s) { return s === 0 ? 3 : 6; });
    var size = all.map(function (s) { return 9000 + (s === 0 ? 0 : 1500) + deriveMask(s); });
    var sim = all.map(function (s) { return similarityPct(s); });
    return { variants: all, instr: instr, jumps: jumps, size: size, sim: sim };
  }

  function reference(data) {
    var t = table(data);
    return { instr: t.instr, jumps: t.jumps, size: t.size, sim: t.sim };
  }

  function build(S, data) {
    var t = table(data), variants = t.variants, nv = variants.length;
    var COLW = 150, ROWH = 34, X0 = 130, Y0 = 0;
    var names = variants.map(function (s, i) { return i === 0 ? T('orijinal (tohum 0)', 'original (seed 0)') : T('tohum ' + s, 'seed ' + s); });
    for (var c = 0; c < nv; c++)
      S.box('hdr' + c, { x: X0 + c * COLW, y: Y0, w: COLW - 6, h: 28, size: 11, text: names[c], style: 'dim' });
    for (var r = 0; r < METRICS.length; r++)
      S.label('row' + r, { x: X0 - 10, y: Y0 + 28 + (r + 1) * ROWH + 18, text: METRICS[r], anchor: 'end', size: 12 });
    S.step(T('Tablo: 4 ölçüt x ' + nv + ' sürüm.', 'Table: 4 metrics x ' + nv + ' variant(s).'), { sh: [1, 2, 3] });

    var rows = [t.instr, t.jumps, t.size, t.sim];
    var fmt = [function (v) { return String(v); }, function (v) { return String(v); },
      function (v) { return v + ' B'; }, function (v) { return v + '%'; }];
    var shown = 0;
    for (r = 0; r < rows.length; r++) {
      for (c = 0; c < nv; c++) {
        var val = rows[r][c];
        var style = (r < 2) ? (c === 0 ? 'empty' : (r === 0 || r === 1 ? 'active' : 'normal')) : 'normal';
        if (r === 3) style = (c === 0) ? 'new' : (val >= 50 ? 'del' : 'new'); // low similarity to original = GOOD (well hidden)
        S.box('cell' + r + '_' + c, { x: X0 + c * COLW, y: Y0 + 28 + (r + 1) * ROWH, w: COLW - 6, h: 28, size: 12, text: fmt[r](val), style: style });
      }
      if (shown < 3) {
        S.step(T(METRICS[r] + ': ' + variants.map(function (s, i) { return fmt[r](rows[r][i]); }).join(' / ') + '.',
                  METRICS[r] + ': ' + variants.map(function (s, i) { return fmt[r](rows[r][i]); }).join(' / ') + '.'),
          r === 3 ? { sh: [{ n: 4, note: T('iki değişken aynı mı?', 'are the two variants identical?') }, { n: 5, skip: true }, 6, 7, 8, 9] } : {});
        shown++;
      }
    }

    var costSame = t.instr[1] === t.instr[2] && t.jumps[1] === t.jumps[2];
    var bytesDiffer = t.size[1] !== t.size[2] || t.sim[1] !== t.sim[2];
    S.step(T('Sonuç: maliyet (komut/dal) tohumdan ' + (costSame ? 'bağımsız' : 'BAĞIMSIZ DEĞİL (beklenmez)') +
              '; boyut ve benzerlik tohuma ' + (bytesDiffer ? 'bağlı' : 'BAĞLI DEĞİL (beklenmez)') + '.',
              'Result: cost (instructions/jumps) is ' + (costSame ? 'seed-independent' : 'NOT seed-independent (unexpected)') +
              '; size and similarity are ' + (bytesDiffer ? 'seed-dependent' : 'NOT seed-dependent (unexpected)') + '.'), {});
    S.result = reference(data);
  }

  D.define({
    id: 'obfuscation-measurement',
    title: T('Gizlemeyi ve çeşitlendirmeyi ölçmek: boyut, süre, komut sayısı, benzerlik',
              'Measuring obfuscation and diversification: size, time, instruction count, similarity'),
    code: function () { return { sh: C }; },
    presets: [
      { id: 'two-different-seeds', level: 'normal', name: T('Normal: iki farklı tohum (1001, 2002)', 'Normal: two different seeds (1001, 2002)'),
        data: mk(1001, 2002) },
      { id: 'large-seeds', level: 'hard', name: T('Zor: büyük tohumlar (123456, 987654)', 'Hard: large seeds (123456, 987654)'),
        data: mk(123456, 987654) },
      { id: 'edge-both-zero', level: 'edge', name: T('Uç durum: iki "tohum" de 0 (ikisi de aslında orijinal)', 'Edge case: both "seeds" are 0 (both are really the original)'),
        data: mk(0, 0) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return METRICS.length * 3; },
    random: function (level, r) {
      var hi = { easy: 50, normal: 9999, hard: 999999, extreme: 1500000 }[level] || 9999;
      return mk(D.randInt(r, 0, hi), D.randInt(r, 0, hi));
    },
    input: {
      hint: T('seedA=1001 seedB=2002', 'seedA=1001 seedB=2002'),
      format: function (data) { return 'seedA=' + data.seeds[0] + ' seedB=' + data.seeds[1]; },
      parse: function (text) {
        var m = String(text).trim().match(/^seedA=(\d+)\s+seedB=(\d+)$/);
        if (!m) throw T('Biçim: "seedA=<sayı> seedB=<sayı>" olmalı.', 'Format must be "seedA=<number> seedB=<number>".');
        return mk(parseInt(m[1], 10), parseInt(m[2], 10));
      },
      bad: ['', 'seedA=1001', 'seedA=x seedB=2002', 'seedA=1001 seedB=-1', 'seedB=2002']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
