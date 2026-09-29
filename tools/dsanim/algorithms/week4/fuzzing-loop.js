// CEN429 — Week 4 — Demo 4 (code/week-04/04-fuzzing/fuzz.c, parser.c, seeds/)
// Coverage-guided fuzzing: libFuzzer mutates the input, runs parse_document() on it, and measures
// which lines/branches ran (coverage). A mutated input is only KEPT in the corpus if it reached
// SOMETHING NEW — a region of the code no earlier input had exercised — because that is the input
// most likely to lead somewhere interesting next. The loop stops the moment a mutation reaches a
// crash region (an out-of-bounds access) — that is the bug the fuzzer set out to find.
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-04/04-fuzzing/fuzz.c), byte-identical.
  var FUZZ_C = [
    '#include <stddef.h>',
    '#include <stdint.h>',
    '#include "parser.h"',
    '',
    'int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size)',
    '{',
    '    parse_document((const unsigned char *)data, size);',
    '    return 0;',
    '}'
  ];
  // parse_document's real branch shape (code/week-04/04-fuzzing/parser.c) — shown for reference next
  // to the fuzz target so the "regions" this animation talks about map onto real lines.
  var PARSER_C = [
    'int parse_document(const unsigned char *data, size_t n)',
    '{',
    '    if (n < 1)',
    '        return 0;                              /* region: empty */',
    '    unsigned char type = data[0];',
    '    if (type == 0x42) {',
    '        unsigned char length = data[1];         /* region: short-header -> CRASH if n<2 */',
    '        unsigned char dest[16];',
    '        for (unsigned i = 0; i < length; i++)',
    '            dest[i] = data[2 + i];              /* region: loop-crash if 2+length>n */',
    '        return dest[0];                          /* region: loop-safe otherwise */',
    '    }',
    '    return 0;                                    /* region: not-b */',
    '}'
  ];

  // Per-region annotated line walk through PARSER_C (the 'sh' panel), with {n, note} on every
  // executed condition line and {n, skip: true} on the representative not-taken alternative.
  // FUZZ_C ('c' panel) has no conditions of its own; it always just calls parse_document (line 7).
  function shLinesFor(region, bytes) {
    var n = bytes.length, type = n >= 1 ? bytes[0] : null, length = n >= 2 ? bytes[1] : null;
    var out = [{ n: 3, note: T('n=' + n + ' < 1? ' + (n < 1 ? 'evet' : 'hayır'), 'n=' + n + ' < 1? ' + (n < 1 ? 'yes' : 'no')) }];
    if (n < 1) { out.push(4); return out; }
    out.push({ n: 4, skip: true });
    out.push(5);
    out.push({ n: 6, note: T('type=0x' + D.hex(type, 2) + ' == 0x42? ' + (type === 0x42 ? 'evet' : 'hayır'), 'type=0x' + D.hex(type, 2) + ' == 0x42? ' + (type === 0x42 ? 'yes' : 'no')) });
    if (type !== 0x42) { out.push({ n: 7, skip: true }); out.push(13); return out; }
    out.push(7); out.push(8);
    if (n < 2) return out;   // short-header-crash: the OOB read of data[1] already happened at line 7
    var fits = (2 + length) <= n;
    out.push({ n: 9, note: T('i < ' + length + '? sınır: 2+' + length + (fits ? ' <= ' : ' > ') + n + (fits ? ' (sınır içinde)' : ' (SINIR DIŞI)'), 'i < ' + length + '? bound: 2+' + length + (fits ? ' <= ' : ' > ') + n + (fits ? ' (in bounds)' : ' (OUT OF BOUNDS)')) });
    if (length === 0) { out.push({ n: 10, skip: true }); out.push(11); return out; }
    out.push(10);
    if (fits) out.push(11);
    return out;
  }
  var REGION_NAME = {
    'empty': T('boş girdi (n<1)', 'empty input (n<1)'),
    'not-b': T('tür != 0x42', 'type != 0x42'),
    'short-header-crash': T('uzunluk baytı YOK (n<2) — ÇÖKME', 'no length byte (n<2) — CRASH'),
    'loop-crash': T('döngü sınırı aşıyor — ÇÖKME', 'loop reads past the bound — CRASH'),
    'loop-safe': T('döngü sınır içinde tamamlanıyor', 'loop finishes within bounds')
  };
  function isCrash(region) { return region === 'short-header-crash' || region === 'loop-crash'; }

  // Used only by build() for the step-by-step narration (mirrors parse_document's own if-chain).
  function classifyForBuild(bytes) {
    var n = bytes.length;
    if (n < 1) return 'empty';
    if (bytes[0] !== 0x42) return 'not-b';
    if (n < 2) return 'short-header-crash';
    var length = bytes[1];
    if (2 + length > n) return 'loop-crash';
    return 'loop-safe';
  }
  // Independent computation for reference(): a rule TABLE evaluated with Array.find (no if-chain),
  // a different shape than classifyForBuild's branch walk above.
  function classifyForReference(bytes) {
    var n = bytes.length;
    var rules = [
      { name: 'empty', ok: n < 1 },
      { name: 'not-b', ok: n >= 1 && bytes[0] !== 0x42 },
      { name: 'short-header-crash', ok: n >= 1 && bytes[0] === 0x42 && n < 2 },
      { name: 'loop-crash', ok: n >= 2 && bytes[0] === 0x42 && (2 + bytes[1]) > n },
      { name: 'loop-safe', ok: n >= 2 && bytes[0] === 0x42 && (2 + bytes[1]) <= n }
    ];
    var hit = rules.filter(function (r) { return r.ok; });
    return hit[0].name;
  }

  function mk(candidates) { return { candidates: candidates.map(function (c) { return c.slice(); }) }; }

  /** Independent: classify every candidate up to and including the first crash, then take the
   * distinct-region COUNT of that prefix via indexOf-based de-duplication (not a Set/object
   * accumulator loop, unlike build()'s incremental bookkeeping). */
  function reference(data) {
    var regions = data.candidates.map(classifyForReference);
    var crashAt = regions.findIndex(isCrash);
    var prefix = crashAt === -1 ? regions : regions.slice(0, crashAt + 1);
    var uniquePrefix = prefix.filter(function (v, i, a) { return a.indexOf(v) === i; });
    return { total: data.candidates.length, ran: prefix.length, keptCount: uniquePrefix.length, crashFoundAtIndex: crashAt };
  }

  function build(S, data) {
    S.label('title', { x: 320, y: -24, text: T('Kapsam güdümlü fuzzing: yeni bir bölge açan girdi KORUNUR, tekrar eden ATLANIR', 'Coverage-guided fuzzing: an input that opens NEW coverage is KEPT, a repeat is SKIPPED'), anchor: 'middle', bold: true, size: 13 });
    S.label('corpusLbl', { x: 0, y: 4, text: T('korpus (korunan girdiler):', 'corpus (kept inputs):'), anchor: 'start', size: 12, bold: true });
    S.label('corpus', { x: 0, y: 26, text: '[ ]', anchor: 'start', size: 12, mono: true });

    var seen = {}, kept = [], W = 340, H = 32, GAP = 6, y0 = 46;
    var crashIndex = -1;
    for (var i = 0; i < data.candidates.length; i++) {
      if (crashIndex !== -1) break;
      var bytes = data.candidates[i];
      var y = y0 + kept.length * 0 + i * (H + GAP);
      S.box('c' + i, { x: 0, y: y, w: W, h: H, size: 12, mono: true, text: '[' + bytes.join(',') + ']', style: 'normal' });
      S.at(i);
      var region = classifyForBuild(bytes);
      var isNew = !seen[region];
      var lbl;
      if (isCrash(region)) {
        S.set('c' + i, { style: 'del' });
        S.label('r' + i, { x: W + 16, y: y + H / 2 + 4, text: REGION_NAME[region], anchor: 'start', size: 12, bold: true });
        crashIndex = i;
        seen[region] = true; kept.push(i);
        S.set('corpus', { text: '[ ' + kept.map(function (k) { return '#' + (k + 1); }).join(', ') + ' ]' });
        S.step(T('Aday #' + (i + 1) + ': `[' + bytes.join(',') + ']` — bölge "' + REGION_NAME[region].tr + '". YENİ bir bölge VE bir ÇÖKME — libFuzzer burada durur, girdiyi `crash-…` olarak kaydeder.',
                  'Candidate #' + (i + 1) + ': `[' + bytes.join(',') + ']` — region "' + REGION_NAME[region].en + '". A NEW region AND a crash — libFuzzer stops here and saves the input as `crash-…`.'),
               { c: [7], sh: shLinesFor(region, bytes) });
      } else if (isNew) {
        seen[region] = true; kept.push(i);
        S.set('c' + i, { style: 'new' });
        S.set('corpus', { text: '[ ' + kept.map(function (k) { return '#' + (k + 1); }).join(', ') + ' ]' });
        S.step(T('Aday #' + (i + 1) + ': `[' + bytes.join(',') + ']` — bölge "' + REGION_NAME[region].tr + '" İLK KEZ görüldü → korpusa EKLENDİ.',
                  'Candidate #' + (i + 1) + ': `[' + bytes.join(',') + ']` — region "' + REGION_NAME[region].en + '" seen for the FIRST time → KEPT in the corpus.'),
               { c: [7], sh: shLinesFor(region, bytes) });
      } else {
        S.set('c' + i, { style: 'dim' });
        S.step(T('Aday #' + (i + 1) + ': `[' + bytes.join(',') + ']` — bölge "' + REGION_NAME[region].tr + '" zaten biliniyordu → ATILDI (kapsama yeni katkısı yok).',
                  'Candidate #' + (i + 1) + ': `[' + bytes.join(',') + ']` — region "' + REGION_NAME[region].en + '" was already known → DISCARDED (adds no new coverage).'),
               { c: [7], sh: shLinesFor(region, bytes) });
      }
    }
    var ranCount = crashIndex === -1 ? data.candidates.length : crashIndex + 1;
    for (var j = ranCount; j < data.candidates.length; j++) {
      S.box('c' + j, { x: 0, y: y0 + j * (H + GAP), w: W, h: H, size: 12, mono: true, text: '[' + data.candidates[j].join(',') + ']', style: 'empty' });
    }
    S.at(null);
    S.result = reference(data);
    if (crashIndex !== -1) {
      S.step(T(kept.length + ' bölge keşfedildi, ' + (crashIndex + 1) + '. adayda bir çökme bulundu (' + (data.candidates.length - ranCount) + ' aday hiç denenmedi — oturum durdu).',
                kept.length + ' regions were discovered; a crash was found at candidate ' + (crashIndex + 1) + ' (' + (data.candidates.length - ranCount) + ' candidate(s) were never tried — the session stopped).'),
             {});
    } else {
      S.step(T(kept.length + '/' + data.candidates.length + ' aday yeni kapsam açtı; bu oturumda çökme bulunamadı — bütün adaylar denendi.',
                kept.length + '/' + data.candidates.length + ' candidates opened new coverage; no crash was found in this session — every candidate was tried.'),
             {});
    }
  }

  D.define({
    id: 'fuzzing-loop',
    title: T('Kapsam güdümlü fuzzing döngüsü (fuzz.c)', 'Coverage-guided fuzzing loop (fuzz.c)'),
    code: { c: FUZZ_C, sh: PARSER_C },
    presets: [
      { id: 'normal-finds-short-header', level: 'normal', name: T('Normal: 10 aday, 9.\'da çökme bulunuyor', 'Normal: 10 candidates, crash found at #9'),
        data: mk([[0x10, 5, 1, 2, 3, 4, 5], [0x11, 2, 9, 9], [0x42, 3, 65, 66, 67], [0x20], [0x42, 2, 1, 2], [], [0x42, 5, 1, 2, 3, 4, 5], [0x42, 1, 9], [0x42], [0x42, 20, 1, 2, 3]]) },
      { id: 'hard-longer-session', level: 'hard', name: T('Zor: 13 aday, döngü taşmasıyla çökme', 'Hard: 13 candidates, crash via loop overrun'),
        data: mk([[0x10, 1], [0x42, 4, 1, 2, 3, 4], [], [0x11, 9, 9, 9], [0x42, 2, 5, 5], [0x30], [0x42, 3, 1, 2, 3], [0x99, 7, 1, 2, 3, 4, 5, 6, 7], [0x42, 10, 1, 2, 3], [0x42], [0x77], [0x42, 0], [0x50, 1]]) },
      { id: 'edge-immediate-crash', level: 'edge', name: T('Uç durum: ilk adayda hemen çökme', 'Edge case: the very first candidate crashes'),
        data: mk([[0x42], [0x10], [0x42, 1, 1], [], [0x42, 5, 1, 2, 3, 4, 5], [0x20, 1], [0x42, 2, 1, 2], [0x30, 2], [0x42, 8, 1], [0x99]]) },
      { id: 'edge-no-crash', level: 'edge', name: T('Uç durum: oturum boyunca çökme bulunamıyor', 'Edge case: no crash found in the whole session'),
        data: mk([[0x10], [0x42, 2, 1, 2], [], [0x11, 5], [0x42, 4, 1, 2, 3, 4], [0x20], [0x42, 1, 9], [0x30], [0x42, 6, 1, 2, 3, 4, 5, 6], [0x40]]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    minSize: 10,
    size: function (data) { return data.candidates.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [12, 14], extreme: [13, 16] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var candidates = [];
      var shapes = ['not-b', 'not-b', 'safe', 'safe', 'empty', 'crash-short', 'crash-loop'];
      for (var i = 0; i < n; i++) {
        var kind = shapes[D.randInt(r, 0, shapes.length - 1)];
        if (kind === 'empty') candidates.push([]);
        else if (kind === 'not-b') candidates.push([0x10 + D.randInt(r, 0, 40), D.randInt(r, 0, 9)]);
        else if (kind === 'crash-short') candidates.push([0x42]);
        else if (kind === 'crash-loop') candidates.push([0x42, 10 + D.randInt(r, 0, 5), 1, 2, 3]);
        else { var len = D.randInt(r, 0, 6); var rec = [0x42, len]; for (var k = 0; k < len; k++) rec.push(D.randInt(r, 0, 255)); candidates.push(rec); }
      }
      return mk(candidates);
    },
    input: {
      hint: T('bayt-dizisi1 | bayt-dizisi2 | … (≥10, ör. 0x42,3,65,66,67 | 0x10,5)', 'byte-array1 | byte-array2 | … (>=10, e.g. 0x42,3,65,66,67 | 0x10,5)'),
      format: function (data) { return data.candidates.map(function (c) { return c.join(','); }).join(' | '); },
      tokens: function (data) { return data.candidates.map(function (c) { return '[' + c.join(',') + ']'; }); },
      parse: function (text) {
        var parts = String(text).split('|').map(function (t) { return t.trim(); });
        if (parts.length < 10) throw T('En az 10 aday girin (| ile ayırın).', 'Enter at least 10 candidates (separate with |).');
        var candidates = parts.map(function (p) {
          if (!p) return [];
          var toks = p.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
          return toks.map(function (t) {
            var v = /^0x/i.test(t) ? parseInt(t, 16) : parseInt(t, 10);
            if (!/^(0x[0-9a-fA-F]+|\d+)$/.test(t) || isNaN(v) || v < 0 || v > 255) throw T('"' + t + '" 0-255 arası bir bayt değil.', '"' + t + '" is not a byte in 0-255.');
            return v;
          });
        });
        return mk(candidates);
      },
      bad: ['', '1,2,3', '0x42,300 | 0x10', 'x,y,z | 1,2,3 | 1,2,3 | 1,2,3 | 1,2,3 | 1,2,3 | 1,2,3 | 1,2,3 | 1,2,3']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
