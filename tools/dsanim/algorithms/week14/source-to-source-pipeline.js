// CEN429 — Week 14 — Demo 1 (code/week-14/01-source-to-source/source.c)
// The source-to-source PIPELINE, stage by stage: SOURCE -> TRANSFORM -> SOURCE' -> COMPILE -> BINARY,
// then behavior is checked against every token in the test list. Tigress (or the documented local
// fallback, fallback_transform.py, when Tigress is not installed) only ever produces another .c file;
// the ordinary compiler still does the compiling. See pipeline_check.py for the real, automated version
// of this same check.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    '/*',
    ' * CEN429 - Week 14 - Demo 1: source-to-source obfuscation input.',
    ' * This is the function a source-to-source tool (Tigress) reads and transforms: a small,',
    ' * sensitive check, kept exactly as readable as any other function in the course.',
    ' * SAFETY: entirely synthetic; no file/network/system operation.',
    ' *',
    ' * Same interface as week-09/01-manual-obfuscation\'s grant_access()/token/VALID_TOKEN: there',
    ' * the same idea was applied BY HAND (see clean.c/obfuscated.c); here a real source-to-source',
    ' * TOOL applies it automatically, from this one unmodified file, with diversification driven',
    ' * by a --Seed value instead of a hand-picked one. Compare the two demos side by side.',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '',
    '/* Function to obfuscate: 1 for the valid synthetic token, 0 otherwise.',
    '   noinline: stays its own symbol so its cost can be measured separately from main(). */',
    '#if defined(__GNUC__) || defined(__clang__)',
    '__attribute__((noinline))',
    '#endif',
    'int grant_access(const char *token)',
    '{',
    '    static const char VALID_TOKEN[] = "CEN429-OK";',
    '    if (strlen(token) != strlen(VALID_TOKEN)) return 0;',
    '    unsigned diff = 0;',
    '    for (unsigned i = 0; i < sizeof VALID_TOKEN - 1; i++)',
    '        diff |= (unsigned)((unsigned char)token[i] ^ (unsigned char)VALID_TOKEN[i]);',
    '    return diff == 0;',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    const char *token = (argc > 1) ? argv[1] : "CEN429-OK";',
    '    printf("grant_access(\\"%s\\") = %s\\n", token, grant_access(token) ? "GRANTED" : "DENIED");',
    '    return 0;',
    '}'
  ];

  var STAGES = ['SOURCE', 'TRANSFORM', "SOURCE'", 'COMPILE', 'BINARY'];
  // A bigger pool than any one preset uses (test_source.c's own real cases); random() samples from it.
  var SUPERSET = ['CEN429-OK', 'wrong-token', '', 'short', 'CEN429-OKX', '123456789', 'XEN429-OK',
    'CEN429-OX', 'cen429-ok', ' CEN429-OK', 'CEN429-OK ', 'CEN429-0K', 'CEN4Z9-OK', 'CEN429-Ok',
    'CEN429-O', 'CEN429-OK-TOO-LONG-BY-A-LOT'];
  var ALL_TRANSFORMS = ['EncodeLiterals', 'Flatten', 'AddOpaque'];

  function mk(tokens, seed, transforms, corruptedIndex) {
    return { tokens: tokens.slice(), seed: seed, transforms: transforms.slice(),
      corruptedIndex: corruptedIndex === undefined ? -1 : corruptedIndex };
  }

  /** expected: GRANTED (1) only for the exact valid token, DENIED (0) otherwise — decided independently
   * of grant_access() itself, exactly like tests/test_source.c's hand-computed expectations. */
  function expectedFor(token) { return token === 'CEN429-OK' ? 1 : 0; }

  function reference(data) {
    var results = data.tokens.map(function (tok, i) {
      var orig = expectedFor(tok);
      var variant = (i === data.corruptedIndex) ? (1 - orig) : orig;
      return { orig: orig, variant: variant, match: orig === variant };
    });
    return { results: results, allMatch: results.every(function (r) { return r.match; }) };
  }

  function build(S, data) {
    var tokens = data.tokens, n = tokens.length;
    // --- pipeline stage row -------------------------------------------------------------------
    var SX = 0, SY = 0, SW = 118, SH = 40, GAP = 18;
    for (var i = 0; i < STAGES.length; i++) {
      S.box('stage' + i, { x: SX + i * (SW + GAP), y: SY, w: SW, h: SH, size: 13, text: STAGES[i], style: 'dim' });
      if (i > 0) S.arrow('sa' + i, { from: 'stage' + (i - 1), to: 'stage' + i, kind: 'center' });
    }
    S.label('pipeLbl', { x: SX, y: SY - 20, text: T('Kaynaktan kaynağa hat', 'Source-to-source pipeline'), anchor: 'start', bold: true, size: 16 });

    S.set('stage0', { style: 'hl' });
    S.step(T('SOURCE: source.c, değiştirilmemiş, okunur girdi.', 'SOURCE: source.c, unmodified, readable input.'),
      { c: [20, 21, 22] });

    S.set('stage0', { style: 'new' }); S.set('stage1', { style: 'hl' });
    var tLabelY = SY + SH + 30;
    for (i = 0; i < data.transforms.length; i++)
      S.box('tf' + i, { x: SX + SW + GAP, y: tLabelY + i * 26, w: SW, h: 22, size: 11, text: data.transforms[i], style: 'active' });
    S.step(T('TRANSFORM: `--Functions=grant_access` ile işaretlenen satırlar hedeflenir.',
              'TRANSFORM: the lines marked by `--Functions=grant_access` are the targets.'),
      { c: [{ n: 22, note: T('EncodeLiterals hedefi: sabit dize', 'EncodeLiterals target: the string literal') },
            { n: 27, note: T('AddOpaque hedefi: son dönüş', 'AddOpaque target: the final return') }] });

    S.set('stage1', { style: 'new' }); S.set('stage2', { style: 'hl' });
    S.box('genFile', { x: SX + 2 * (SW + GAP), y: tLabelY, w: SW, h: 26, size: 11,
      text: T('değişken_' + data.seed + '.c', 'variant_' + data.seed + '.c'), style: 'new' });
    S.step(T('SOURCE\': davranışça özdeş, yine C olan yeni bir dosya üretildi (tohum ' + data.seed + ').',
              "SOURCE': a new file, still C, behaviorally identical, was generated (seed " + data.seed + ').'), {});

    S.set('stage2', { style: 'new' }); S.set('stage3', { style: 'hl' });
    S.step(T('COMPILE: değişken_' + data.seed + '.c, sıradan C derleyicinizle derlenir; özel bir araç gerekmez.',
              'COMPILE: variant_' + data.seed + '.c compiles with your ordinary C compiler; no special tool needed.'), {});

    S.set('stage3', { style: 'new' }); S.set('stage4', { style: 'hl' });
    S.step(T('BINARY: değişken_' + data.seed + ' var; orijinalden büyük (gizlemenin görünür maliyeti).',
              'BINARY: variant_' + data.seed + ' exists; larger than the original (the visible cost of hiding it).'), {});
    S.set('stage4', { style: 'new' });

    // --- behavior check across the token list --------------------------------------------------
    S.label('chkLbl', { x: SX, y: tLabelY + 70, text: T('Davranış denetimi: her jeton için orijinal mi = değişken mi?', 'Behavior check: original vs. variant, for every token'), anchor: 'start', bold: true, size: 14 });
    var RY = tLabelY + 100, RW = 150, RH = 30;
    S.box('rowOrigLbl', { x: SX - 10, y: RY, w: 0, h: 0, style: 'empty', text: '' });
    S.label('rowOrig', { x: SX, y: RY + 20, text: T('orijinal =', 'original ='), anchor: 'end', size: 13 });
    S.label('rowVar', { x: SX, y: RY + 20 + RH, text: T('değişken =', 'variant ='), anchor: 'end', size: 13 });

    for (i = 0; i < n; i++) {
      var tok = tokens[i];
      var origVal = expectedFor(tok);
      var isCorrupted = i === data.corruptedIndex;
      var varVal = isCorrupted ? (1 - origVal) : origVal;
      var x = SX + i * (RW + 6);
      S.box('o' + i, { x: x, y: RY, w: RW, h: RH, size: 11, above: String(i), text: T('"' + tok + '"', '"' + tok + '"'), style: 'empty' });
      S.box('v' + i, { x: x, y: RY + RH, w: RW, h: RH, size: 12, text: origVal ? 'GRANTED' : 'DENIED', style: 'empty' });
      S.box('w' + i, { x: x, y: RY + 2 * RH, w: RW, h: RH, size: 12, text: varVal ? 'GRANTED' : 'DENIED', style: 'empty' });
    }
    S.label('rowVar2', { x: SX, y: RY + 20 + 2 * RH, text: T('sonuç =', 'result ='), anchor: 'end', size: 13 });

    var detailCount = Math.min(4, n);
    for (i = 0; i < n; i++) {
      S.at(i);
      var tok2 = tokens[i], origVal2 = expectedFor(tok2), isCorrupted2 = i === data.corruptedIndex;
      var varVal2 = isCorrupted2 ? (1 - origVal2) : origVal2;
      S.set('o' + i, { style: 'hl' });
      S.set('v' + i, { style: 'new', text: origVal2 ? 'GRANTED' : 'DENIED' });
      S.set('w' + i, { style: (varVal2 === origVal2) ? 'new' : 'del', text: varVal2 ? 'GRANTED' : 'DENIED' });
      var matched = varVal2 === origVal2;
      if (i < detailCount) {
        S.step(T('`grant_access("' + tok2 + '")`: orijinal ' + (origVal2 ? 'GRANTED' : 'DENIED') + ', değişken ' +
                  (varVal2 ? 'GRANTED' : 'DENIED') + (matched ? ' — aynı.' : ' — FARKLI!'),
                  '`grant_access("' + tok2 + '")`: original ' + (origVal2 ? 'GRANTED' : 'DENIED') + ', variant ' +
                  (varVal2 ? 'GRANTED' : 'DENIED') + (matched ? ' — same.' : ' — MISMATCH!')),
          { c: [{ n: 23, note: T('strlen eşleşiyor mu? ' + (origVal2 || tok2.length === 9 ? 'evet' : 'hayır'),
                                  'strlen matches? ' + (origVal2 || tok2.length === 9 ? 'yes' : 'no')) },
                { n: 27, note: T('diff == 0? ' + (origVal2 ? 'evet -> GRANTED' : 'hayır -> DENIED'),
                                  'diff == 0? ' + (origVal2 ? 'yes -> GRANTED' : 'no -> DENIED')) }] });
      }
      S.set('o' + i, { style: matched ? 'new' : 'del' });
    }
    S.at(null);

    var ref = reference(data);
    S.result = ref;
    if (ref.allMatch)
      S.step(T(n + '/' + n + ' jeton eşleşti: davranış korundu.', n + '/' + n + ' tokens matched: behavior preserved.'), {});
    else
      S.step(T('UYARI: en az bir jeton farklı sonuç verdi — bu değişken KABUL EDİLMEMELİ (pipeline_check.py böyle bir durumda FAIL verir).',
                'WARNING: at least one token disagreed — this variant must NOT be accepted (pipeline_check.py fails on exactly this).'), {});
  }

  D.define({
    id: 'source-to-source-pipeline',
    title: T('Kaynaktan kaynağa hat: source.c -> dönüşüm -> source.c -> derleyici -> ikili',
              'Source-to-source pipeline: source.c -> transform -> source.c -> compiler -> binary'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'normal', level: 'normal', name: T('Normal: Tigress, iki dönüşüm, tüm jetonlar eşleşiyor', 'Normal: Tigress, two transforms, every token matches'),
        data: mk(['CEN429-OK', 'wrong-token', '', 'short', 'CEN429-OKX', '123456789', 'XEN429-OK', 'CEN429-OX', 'cen429-ok', ' CEN429-OK', 'CEN429-OK ', 'CEN429-0K'], 1001, ['EncodeLiterals', 'AddOpaque']) },
      { id: 'fallback-three', level: 'hard', name: T('Zor: yerel yedek, üç dönüşüm zinciri', 'Hard: local fallback, three chained transforms'),
        data: mk(['CEN429-OK', 'wrong-token', '', 'short', 'CEN429-OKX', '123456789', 'XEN429-OK', 'CEN429-OX', 'cen429-ok', ' CEN429-OK', 'CEN429-OK ', 'CEN4Z9-OK', 'CEN429-Ok'], 2002, ALL_TRANSFORMS) },
      { id: 'edge-corrupted-variant', level: 'edge', name: T('Uç durum: elle bozulmuş bir değişken, bir jetonda davranış farklı', 'Edge case: a hand-corrupted variant, one token disagrees'),
        data: mk(['CEN429-OK', 'wrong-token', '', 'short', 'CEN429-OKX', '123456789', 'XEN429-OK', 'CEN429-OX', 'cen429-ok', ' CEN429-OK'], 1001, ['EncodeLiterals', 'AddOpaque'], 3) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.tokens.length; },
    random: function (level, r) {
      var n = { easy: 10, normal: 11, hard: 13, extreme: SUPERSET.length }[level] || 10;
      var idxs = [0]; // always include the one valid token, like test_source.c always does
      var pool = []; for (var i = 1; i < SUPERSET.length; i++) pool.push(i);
      while (idxs.length < n && pool.length) idxs.push(pool.splice(D.randInt(r, 0, pool.length - 1), 1)[0]);
      idxs.sort(function (a, b) { return a - b; });
      var tokens = idxs.map(function (i) { return SUPERSET[i]; });
      var seed = D.randInt(r, 1000, 9999);
      var tCount = { easy: 2, normal: 2, hard: 3, extreme: 3 }[level] || 2;
      var transforms = ALL_TRANSFORMS.slice(0, tCount);
      var corrupted = D.randInt(r, 0, 4) === 0 ? D.randInt(r, 0, tokens.length - 1) : -1; // rare, like rasp-pipeline
      return mk(tokens, seed, transforms, corrupted);
    },
    input: {
      // '|' (not whitespace) separates the four fields, so a token that itself contains a leading or
      // trailing space (real cases from tests/test_source.c) round-trips exactly, at any position.
      hint: T('tokens=a,b,c|seed=1001|transforms=EncodeLiterals+AddOpaque|corrupted=none|<indeks>',
              'tokens=a,b,c|seed=1001|transforms=EncodeLiterals+AddOpaque|corrupted=none|<index>'),
      format: function (data) {
        return 'tokens=' + data.tokens.map(function (t) { return t === '' ? '(empty)' : t; }).join(',') +
          '|seed=' + data.seed + '|transforms=' + data.transforms.join('+') +
          '|corrupted=' + (data.corruptedIndex < 0 ? 'none' : data.corruptedIndex);
      },
      tokens: function (data) { return data.tokens.map(function (t) { return t === '' ? '(empty)' : t; }); },
      parse: function (text) {
        var m = String(text).match(/^tokens=(.*)\|seed=(\d+)\|transforms=([A-Za-z+]+)\|corrupted=(none|\d+)$/);
        if (!m) throw T('Biçim: "tokens=a,b,c|seed=<sayı>|transforms=Ad1+Ad2|corrupted=none|<indeks>" olmalı.',
                          'Format must be "tokens=a,b,c|seed=<number>|transforms=Name1+Name2|corrupted=none|<index>".');
        var tokens = m[1].split(',').map(function (t) { return t === '(empty)' ? '' : t; });
        if (tokens.length < 1) throw T('En az bir jeton gerekir.', 'At least one token is required.');
        var seed = parseInt(m[2], 10);
        var transforms = m[3].split('+');
        for (var i = 0; i < transforms.length; i++)
          if (ALL_TRANSFORMS.indexOf(transforms[i]) < 0)
            throw T('Bilinmeyen dönüşüm: "' + transforms[i] + '".', 'Unknown transform: "' + transforms[i] + '".');
        var corrupted = m[4] === 'none' ? -1 : parseInt(m[4], 10);
        if (corrupted >= tokens.length) throw T('corrupted indeksi jeton listesinin dışında.', 'corrupted index is outside the token list.');
        return mk(tokens, seed, transforms, corrupted);
      },
      bad: ['', 'tokens=a,b|seed=x|transforms=EncodeLiterals|corrupted=none',
            'tokens=a,b|seed=1|transforms=NotARealTransform|corrupted=none',
            'tokens=a,b|seed=1|transforms=EncodeLiterals|corrupted=99',
            'seed=1|transforms=EncodeLiterals|corrupted=none']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
