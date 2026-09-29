// CEN429 — Week 6 — Demo 5 (code/week-06/05-flow-counter/flow_counter.c)
// A single "if (safe) …" check is easy to patch around. Instead, every checkpoint folds a stage LABEL into a
// running key-chain accumulator (a simplified stand-in for the real HMAC chain in flow_counter.c). The
// critical operation only produces the expected value when the chain matches the GOLDEN chain built by
// running every stage once, in order. Skipping a stage, running only some of them, or running them out of
// order all produce a different chain — a single 'jmp' patch that skips a check cannot fix this.
(function (D) {
  'use strict';
  var T = D.T;
  // D.hex(n, 8) has a known bug for values with bit 31 set (it goes through a signed 32-bit AND
  // internally and can print a leading '-'); this local helper formats a full unsigned 32-bit value
  // safely and is used instead of D.hex(..., 8) throughout this file. D.hex(..., 2) for single bytes
  // is unaffected (values 0-255 never trip the bug) and is still used as-is.
  function hex32(n) {
    var s = (n >>> 0).toString(16).toUpperCase();
    while (s.length < 8) s = '0' + s;
    return s;
  }


  var C = [
    'static void checkpoint(flow_t *f, int i, const char *name)',
    '{',
    '    char label[32];',
    '    snprintf(label, sizeof(label), "stage-%d", i);',
    '    unsigned char next[32];',
    '    crypto_hmac_sha256(f->acc, 32, label, strlen(label), next);',
    '    memcpy(f->acc, next, 32);',
    '    f->count++;',
    '    f->visited_mask |= (1u << i);',
    '}',
    '',
    '/* critical_operation(): double/overlapping counter check (K17), then opens the secret with a',
    ' * key derived from f->acc -- the correct plaintext comes out ONLY if the chain matches golden. */',
    'unsigned int expected_mask = (1u << STAGE_COUNT) - 1;',
    'if (f->count != STAGE_COUNT || f->visited_mask != expected_mask)',
    '    printf("   (warning: count=%d visited_mask=0x%X expected=%d/0x%X)\\n",',
    '           f->count, f->visited_mask, STAGE_COUNT, expected_mask);'
  ];

  function fold(acc, stage) {
    // acc' = ((acc*33 + 7) XOR stageCode) mod 2^32 — a simplified, order-sensitive fold standing in for
    // the real HMAC chain (crypto_hmac_sha256(acc, "stage-i")).
    var mixed = ((Math.imul(acc, 33) + 7) >>> 0);
    return (mixed ^ (stage * 2654435761)) >>> 0;
  }

  var SEED = 0x9e3779b9;
  var STAGE_NAMES = ['integrity', 'anti-debug', 'environment', 'hook-scan', 'root-check', 'signature',
    'privilege', 'timing', 'flow-guard', 'attest', 'watchdog', 'canary', 'checksum', 'nonce'];

  /** total: how many stages exist (>= 10). sequence: the order stages ACTUALLY run in (indices into
   * 0..total-1); may skip stages, repeat none, and may be out of order. */
  function mk(total, sequence) { return { total: total, sequence: sequence.slice() }; }

  /** Independent computation: NOT a recomputation of the hash chain (that is the exact mechanism build()
   * animates) but a direct SEMANTIC check — the chain can only match the golden one when the sequence is
   * every stage, exactly once, in the exact golden order (fold() is order- and content-sensitive by
   * construction). This is structurally different from build()'s arithmetic (a sequence comparison, not a
   * chain of multiply/XOR steps), the same way path-lookup.js's reference() uses Math.min instead of a scan. */
  function reference(data) {
    var expected = range(data.total);
    var inOrder = data.sequence.length === expected.length &&
      data.sequence.every(function (v, i) { return v === expected[i]; });
    return { match: inOrder, inOrder: inOrder };
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

  function build(S, data) {
    var total = data.total, sequence = data.sequence;
    var W = 30, GAP = 3, Y = 0;
    S.label('stagesLbl', { x: -14, y: 20, text: T('aşamalar =', 'stages ='), anchor: 'end', size: 14, mono: true });
    var ids = [];
    for (var i = 0; i < total; i++) {
      ids.push(S.box('st' + i, { x: i * (W + GAP), y: Y, w: W, h: 32, size: 11, text: 'S' + i, style: 'normal', above: STAGE_NAMES[i % STAGE_NAMES.length].slice(0, 4) }));
    }
    S.brace('allBr', { from: ids[0], to: ids[total - 1], text: T(total + ' aşamalı akış', total + '-stage flow'), side: 'bottom' });

    S.box('acc', { x: 0, y: 90, w: 150, h: 32, size: 14, text: '0x' + hex32(SEED), style: 'active' });
    S.label('accLbl', { x: -14, y: 110, text: T('zincir (acc) =', 'chain (acc) ='), anchor: 'end', size: 14, mono: true });

    S.step(T('Altın zincir: ' + total + ' aşamanın HEPSİ, tohum 0x' + hex32(SEED) + '\'dan başlayarak SIRAYLA çalıştırılır.',
              'Golden chain: ALL ' + total + ' stages run, IN ORDER, starting from seed 0x' + hex32(SEED) + '.'), { c: [4, 5, 6] });
    var golden = SEED;
    for (i = 0; i < Math.min(3, total); i++) {
      golden = fold(golden, i);
      S.step(T('aşama ' + i + ' (' + STAGE_NAMES[i % STAGE_NAMES.length] + ') katlanıyor -> acc = 0x' + hex32(golden),
                'stage ' + i + ' (' + STAGE_NAMES[i % STAGE_NAMES.length] + ') folded in -> acc = 0x' + hex32(golden)),
             { c: [4, 5, 6, 7, 8] });
    }
    for (; i < total; i++) golden = fold(golden, i);
    S.set('acc', { text: '0x' + hex32(golden), style: 'new' });
    S.step(T('Kalan aşamalar aynı şekilde katlanır. Altın zincir: 0x' + hex32(golden) + ' — bu, "doğru" anahtar.',
              'The remaining stages fold in the same way. Golden chain: 0x' + hex32(golden) + ' — this is the "correct" key.'), {});

    // ---- run the ACTUAL sequence ----
    S.styleAll('dim', 'box');
    S.set('acc', { text: '0x' + hex32(SEED) });
    var runLbl = sequence.length === 0 ? T('(hiçbir aşama çalışmadı)', '(no stage ran)') :
      T(sequence.length + ' aşama, sıra: ' + sequence.join(' -> '), sequence.length + ' stage(s), order: ' + sequence.join(' -> '));
    S.label('runLbl', { x: total * (W + GAP) / 2, y: -20, text: runLbl, anchor: 'middle', bold: true, size: 14 });
    S.step(T('Şimdi GERÇEKTE çalışan sıra: ' + (sequence.length ? sequence.join(', ') : '(hiçbiri)') + '.',
              'Now the ACTUAL run order: ' + (sequence.length ? sequence.join(', ') : '(none)') + '.'), {});
    var actual = SEED;
    S.at(0);
    for (var k = 0; k < sequence.length; k++) {
      var stage = sequence[k];
      actual = fold(actual, stage);
      S.set('st' + stage, { style: 'hl' });
      S.set('acc', { text: '0x' + hex32(actual) });
      S.at(Math.min(k, sequence.length - 1));
      S.step(T((k + 1) + '/' + sequence.length + ': aşama ' + stage + ' çalıştı -> acc = 0x' + hex32(actual),
                (k + 1) + '/' + sequence.length + ': stage ' + stage + ' ran -> acc = 0x' + hex32(actual)),
             { c: [4, 5, 6, 7, 8] });
    }
    S.at(null);
    var match = golden === actual;
    var inOrder = sequence.length === total && sequence.every(function (v, idx) { return v === idx; });
    S.set('acc', { style: match ? 'new' : 'del' });
    S.result = { match: match, inOrder: inOrder };

    // K17 double/overlapping counter: catches a WRONG COUNT or a MISSING stage, but (deliberately, like the
    // real code) not a reordering of an otherwise-complete set -- the HMAC chain (acc) is what catches that.
    var visitedMask = 0;
    sequence.forEach(function (s) { visitedMask |= (1 << s); });
    var expectedMask = total <= 31 ? (((1 << total) >>> 0) - 1) >>> 0 : 0xFFFFFFFF;
    var counterMismatch = sequence.length !== total || visitedMask !== expectedMask;
    S.step(T('Çift sayaç kontrolü: count == ' + total + ' && visited_mask == 0x' + expectedMask.toString(16) + '?',
              'Double-counter check: count == ' + total + ' && visited_mask == 0x' + expectedMask.toString(16) + '?'),
           { c: [{ n: 15, note: T('count != ' + total + ' || visited_mask != beklenen? ' + (counterMismatch ? 'evet (uyarı)' : 'hayır'),
                                    'count != ' + total + ' || visited_mask != expected? ' + (counterMismatch ? 'yes (warning)' : 'no')) },
                  counterMismatch ? 16 : { n: 16, skip: true }, counterMismatch ? 17 : { n: 17, skip: true }] });

    if (match) {
      S.step(T('0x' + hex32(golden) + ' == 0x' + hex32(actual) + ' -> SONUÇ: kritik işlem doğru sonucu üretir (ONAYLANDI).',
                '0x' + hex32(golden) + ' == 0x' + hex32(actual) + ' -> RESULT: the critical operation produces the right result (APPROVED).'), {});
    } else {
      S.step(T('0x' + hex32(golden) + ' != 0x' + hex32(actual) + ' -> SONUÇ: zincir yanlış, kritik işlem REDDEDİLDİ (decoy döner).',
                '0x' + hex32(golden) + ' != 0x' + hex32(actual) + ' -> RESULT: the chain is wrong, the critical operation is DENIED (a decoy is returned).'), {});
    }
  }

  D.define({
    id: 'flow-counter',
    title: T('Kontrol akışı sayacı: beklenen yol ve atlanan kontrol (flow_counter.c)', 'Control-flow counter: the expected path vs. a skipped check (flow_counter.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'in-order', level: 'normal', name: T('Normal: bütün aşamalar sırayla', 'Normal: every stage, in order'),
        data: mk(10, range(10)) },
      { id: 'skip-half', level: 'hard', name: T('Zor: aşamaların yarısı ATLANDI', 'Hard: half the stages are SKIPPED'),
        data: mk(12, [0, 1, 2, 3, 4, 5]) },
      { id: 'edge-none', level: 'edge', name: T('Uç durum: hiçbir aşama çalışmadı (doğrudan atlama)', 'Edge case: no stage ran at all (a direct jump)'),
        data: mk(10, []) },
      { id: 'edge-reordered', level: 'edge', name: T('Uç durum: bütün aşamalar var ama YANLIŞ SIRADA', 'Edge case: every stage present, but in the WRONG ORDER'),
        data: mk(11, range(11).slice().reverse()) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.total; },
    random: function (level, r) {
      var totals = { easy: [10, 10], normal: [10, 12], hard: [11, 13], extreme: [12, 14] };
      var rg = totals[level] || totals.normal;
      var total = D.randInt(r, rg[0], rg[1]);
      var mode = D.randInt(r, 0, 3);   // 0 in-order, 1 skip-some, 2 reordered, 3 empty
      var sequence;
      if (mode === 0) sequence = range(total);
      else if (mode === 3) sequence = [];
      else if (mode === 1) {
        var keep = D.randInt(r, 1, total - 1);
        sequence = range(total).slice(0, keep);
      } else {
        sequence = range(total).slice();
        for (var i = sequence.length - 1; i > 0; i--) { var j = D.randInt(r, 0, i); var tmp = sequence[i]; sequence[i] = sequence[j]; sequence[j] = tmp; }
      }
      return mk(total, sequence);
    },
    input: {
      hint: T('toplam; sıra (virgülle, boş olabilir)', 'total; order (comma-separated, may be empty)'),
      format: function (data) { return data.total + '; ' + data.sequence.join(','); },
      tokens: function (data) { return range(data.total).map(function (i) { return 'S' + i; }); },
      parse: function (text) {
        var parts = String(text).split(';');
        if (parts.length !== 2) throw T('Biçim: "toplam; sıra" olmalı.', 'Format must be "total; order".');
        var total = parseInt(parts[0].trim(), 10);
        if (!(total >= 1) || String(total) !== parts[0].trim()) throw T('toplam pozitif bir tamsayı olmalı.', 'total must be a positive integer.');
        var seqText = parts[1].trim();
        var sequence = seqText === '' ? [] : seqText.split(',').map(function (t) { return t.trim(); });
        var seq = [];
        for (var i = 0; i < sequence.length; i++) {
          if (!/^\d+$/.test(sequence[i])) throw T('"' + sequence[i] + '" bir aşama numarası değil.', '"' + sequence[i] + '" is not a stage number.');
          var v = parseInt(sequence[i], 10);
          if (v < 0 || v >= total) throw T('Aşama numarası 0..' + (total - 1) + ' aralığında olmalı.', 'A stage number must be in the range 0..' + (total - 1) + '.');
          seq.push(v);
        }
        return mk(total, seq);
      },
      bad: ['', '10', 'abc; 0,1,2', '5; 0,1,9', '5; 0,x,2']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
